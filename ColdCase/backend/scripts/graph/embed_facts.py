"""
Cold Case — Embed Fact Nodes
=============================

"""

import sys
import os
import time
import logging
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from neo4j import GraphDatabase
from google import genai
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
EMBEDDING_MODEL = "models/gemini-embedding-001"
BATCH_SIZE      = 10
BATCH_DELAY     = 1.0   # seconds between batches — avoids rate limiting

# ---------------------------------------------------------------------------
# Cypher
# ---------------------------------------------------------------------------
FETCH_NULL_FACTS = """
MATCH (f:Fact)
WHERE f.embedding IS NULL
RETURN f.id AS id, f.content AS content, f.character_id AS character_id
ORDER BY f.character_id ASC, f.id ASC
"""

SET_EMBEDDING = """
MATCH (f:Fact {id: $fact_id})
SET f.embedding = $embedding
RETURN f.id AS id
"""

COUNT_REMAINING = """
MATCH (f:Fact)
WHERE f.embedding IS NULL
RETURN count(f) AS remaining
"""

COUNT_TOTAL = """
MATCH (f:Fact)
RETURN count(f) AS total,
       sum(CASE WHEN f.embedding IS NOT NULL THEN 1 ELSE 0 END) AS embedded
"""


# ---------------------------------------------------------------------------
# Embedding helper
# ---------------------------------------------------------------------------
def embed_text(client, text: str) -> list[float]:
    """Send a single string to the Google Embedding API and return the vector."""
    result = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
    )
    return result.embeddings[0].values


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def run_embedding(driver, client):
    with driver.session() as session:

        # Check total facts
        row = session.run(COUNT_TOTAL).single()
        total    = row["total"]
        embedded = row["embedded"]
        remaining = total - embedded

        log.info(f"Fact nodes total    : {total}")
        log.info(f"Already embedded    : {embedded}")
        log.info(f"Needs embedding     : {remaining}")

        if remaining == 0:
            log.info("All facts already embedded — nothing to do.")
            return

        # Fetch all facts with null embeddings
        facts = session.run(FETCH_NULL_FACTS).data()
        log.info(f"Fetched {len(facts)} fact(s) to embed")

        # Process in batches
        success_count = 0
        error_count   = 0
        total_batches = (len(facts) + BATCH_SIZE - 1) // BATCH_SIZE

        for batch_num in range(total_batches):
            batch_start = batch_num * BATCH_SIZE
            batch_end   = batch_start + BATCH_SIZE
            batch       = facts[batch_start:batch_end]

            log.info(
                f"Batch {batch_num + 1}/{total_batches} "
                f"— processing {len(batch)} fact(s) "
                f"[{batch_start + 1}–{min(batch_end, len(facts))} of {len(facts)}]"
            )

            for fact in batch:
                fact_id    = fact["id"]
                content    = fact["content"]
                character  = fact["character_id"]

                try:
                    vector = embed_text(client, content)

                    # Write vector back to Neo4j
                    session.run(SET_EMBEDDING, fact_id=fact_id, embedding=vector)
                    success_count += 1
                    log.info(f"  ✓ [{character:<12}] {fact_id}")

                except Exception as e:
                    error_count += 1
                    log.error(f"  ✗ [{character:<12}] {fact_id} — {e}")

            # Delay between batches to avoid rate limiting
            if batch_num < total_batches - 1:
                log.info(f"  Waiting {BATCH_DELAY}s before next batch...")
                time.sleep(BATCH_DELAY)

        # Final summary
        log.info("─" * 50)
        log.info(f"Embedding complete")
        log.info(f"  Succeeded : {success_count}")
        log.info(f"  Failed    : {error_count}")

        # Verify
        row = session.run(COUNT_TOTAL).single()
        log.info(f"  Embedded in DB : {row['embedded']} / {row['total']}")

        if error_count > 0:
            log.warning(
                f"{error_count} fact(s) failed — re-run the script to retry. "
                "Only null embeddings are processed so successful ones won't be re-sent."
            )


def main():
    log.info("Cold Case — Fact Embedding Script")
    log.info("=" * 40)
    log.info(f"Environment    : {settings.app_env}")
    log.info(f"Neo4j URI      : {settings.neo4j_uri}")
    log.info(f"Embedding model: {EMBEDDING_MODEL}")
    log.info(f"Batch size     : {BATCH_SIZE}")

    # Configure Google Generative AI
    client = genai.Client(api_key=settings.gemini_api_key)
    log.info("Google Generative AI configured")

    driver = GraphDatabase.driver(settings.neo4j_uri, auth=settings.neo4j_auth)

    try:
        driver.verify_connectivity()
        log.info("Connected to Neo4j\n")
        run_embedding(driver, client)
    except Exception as e:
        log.error(f"Fatal error: {e}")
        sys.exit(1)
    finally:
        driver.close()

    log.info("Done.")


if __name__ == "__main__":
    main()