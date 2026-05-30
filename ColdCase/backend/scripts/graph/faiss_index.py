"""
Cold Case — Build FAISS Index
==============================
Loads all Fact node embeddings from Neo4j, builds a FAISS IndexFlatL2
index, and saves both the index and a parallel ID mapping to disk.

The ID mapping is a JSON list where position i contains the Neo4j Fact
node ID that corresponds to FAISS vector at position i. Without this,
FAISS returns vector positions with no way to know which facts they are.

Run this after embed_facts.py has successfully embedded all 90 facts.
Re-run any time facts are added or embeddings are updated.

Output files (saved to backend/graph/data/):
    faiss_index.bin     — the FAISS index (binary)
    id_mapping.json     — list of fact IDs, position = FAISS index

Requirements:
    pip install neo4j pydantic-settings faiss-cpu numpy

Usage:
    python -m backend.graph.faiss_index
"""

import sys
import os
import json
import logging
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import faiss
from neo4j import GraphDatabase
from backend.config import settings

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
EMBEDDING_DIM  = 3072  # gemini-embedding-001 output dimension
OUTPUT_DIR     = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
INDEX_PATH     = os.path.join(OUTPUT_DIR, "faiss_index.bin")
MAPPING_PATH   = os.path.join(OUTPUT_DIR, "id_mapping.json")

# ---------------------------------------------------------------------------
# Cypher
# ---------------------------------------------------------------------------
FETCH_EMBEDDINGS = """
MATCH (f:Fact)
WHERE f.embedding IS NOT NULL
RETURN f.id AS id, f.character_id AS character_id, f.embedding AS embedding
ORDER BY f.character_id ASC, f.id ASC
"""

COUNT_NULL = """
MATCH (f:Fact)
WHERE f.embedding IS NULL
RETURN count(f) AS missing
"""


# ---------------------------------------------------------------------------
# Build index
# ---------------------------------------------------------------------------
def build_index(driver):
    with driver.session() as session:

        # Warn if any facts are missing embeddings
        missing = session.run(COUNT_NULL).single()["missing"]
        if missing > 0:
            log.warning(
                f"{missing} fact(s) have no embedding — they will be excluded "
                "from the index. Run embed_facts.py first to fix this."
            )

        # Fetch all embedded facts
        log.info("Fetching embeddings from Neo4j...")
        records = session.run(FETCH_EMBEDDINGS).data()

        if not records:
            log.error("No embedded facts found. Run embed_facts.py first.")
            sys.exit(1)

        log.info(f"Fetched {len(records)} embedded fact(s)")

        # Build parallel structures
        id_mapping   = []   # position i → fact_id string
        vectors      = []   # position i → 768-dim float list

        for record in records:
            fact_id   = record["id"]
            character = record["character_id"]
            embedding = record["embedding"]

            if not embedding or len(embedding) != EMBEDDING_DIM:
                log.warning(
                    f"Skipping {fact_id} — unexpected embedding length "
                    f"({len(embedding) if embedding else 0}, expected {EMBEDDING_DIM})"
                )
                continue

            id_mapping.append(fact_id)
            vectors.append(embedding)
            log.info(f"  loaded [{character:<12}] {fact_id}")

        if not vectors:
            log.error("No valid vectors to index.")
            sys.exit(1)

        # Convert to float32 numpy array — FAISS requires float32
        matrix = np.array(vectors, dtype=np.float32)
        log.info(f"\nMatrix shape: {matrix.shape}  (facts × dimensions)")

        # Build FAISS index
        log.info("Building FAISS IndexFlatL2...")
        index = faiss.IndexFlatL2(EMBEDDING_DIM)
        index.add(matrix)
        log.info(f"Index contains {index.ntotal} vector(s)")

        # Sanity check — mapping length must match index size
        assert len(id_mapping) == index.ntotal, (
            f"Mapping length {len(id_mapping)} != index size {index.ntotal}"
        )

        # Save to disk
        os.makedirs(OUTPUT_DIR, exist_ok=True)

        faiss.write_index(index, INDEX_PATH)
        log.info(f"FAISS index saved  → {INDEX_PATH}")

        with open(MAPPING_PATH, "w") as f:
            json.dump(id_mapping, f, indent=2)
        log.info(f"ID mapping saved   → {MAPPING_PATH}")

        # Summary
        log.info("─" * 50)
        log.info(f"Index built successfully")
        log.info(f"  Vectors indexed : {index.ntotal}")
        log.info(f"  Dimensions      : {EMBEDDING_DIM}")
        log.info(f"  Index type      : IndexFlatL2 (exact L2 distance)")
        log.info(f"  Index file      : {INDEX_PATH}")
        log.info(f"  Mapping file    : {MAPPING_PATH}")

        return index, id_mapping


# ---------------------------------------------------------------------------
# Verify — quick self-test to confirm load + search works
# ---------------------------------------------------------------------------
def verify_index():
    log.info("\nVerifying saved index...")

    index = faiss.read_index(INDEX_PATH)
    with open(MAPPING_PATH) as f:
        id_mapping = json.load(f)

    assert index.ntotal == len(id_mapping), "Index/mapping size mismatch after reload"

    # Run a dummy search with a zero vector — just confirms search doesn't crash
    dummy = np.zeros((1, EMBEDDING_DIM), dtype=np.float32)
    distances, indices = index.search(dummy, k=3)

    log.info(f"  Index reloaded   : {index.ntotal} vectors")
    log.info(f"  Mapping reloaded : {len(id_mapping)} entries")
    log.info(f"  Test search top-3 indices  : {indices[0].tolist()}")
    log.info(f"  Test search top-3 fact IDs : {[id_mapping[i] for i in indices[0]]}")
    log.info("  ✓ Index verified — load and search working correctly")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    log.info("Cold Case — FAISS Index Builder")
    log.info("=" * 40)
    log.info(f"Environment  : {settings.app_env}")
    log.info(f"Neo4j URI    : {settings.neo4j_uri}")
    log.info(f"Output dir   : {OUTPUT_DIR}")
    log.info(f"Embedding dim: {EMBEDDING_DIM}")

    driver = GraphDatabase.driver(settings.neo4j_uri, auth=settings.neo4j_auth)

    try:
        driver.verify_connectivity()
        log.info("Connected to Neo4j\n")
        build_index(driver)
    except Exception as e:
        log.error(f"Fatal error: {e}")
        sys.exit(1)
    finally:
        driver.close()

    verify_index()
    log.info("\nDone. Next step: build backend/graph/rag.py to query this index.")


if __name__ == "__main__":
    main()