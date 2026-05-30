"""
Cold Case — Semantic Search
============================
Core RAG retrieval function used by all persona agents.

semantic_search(query, character_id, before_timestamp, top_k=5)

Pipeline:
  1. Embed the query string via Google Embedding API
  2. Search FAISS index for top 20 nearest neighbors (across all characters)
  3. Filter to facts this character KNOWS with known_since <= before_timestamp
  4. Return top_k results as structured dicts

The FAISS index and ID mapping are loaded once at module import and
kept in memory for the lifetime of the process — never reloaded per request.

Requirements:
    pip install faiss-cpu numpy google-genai neo4j pydantic-settings

Usage:
    from backend.graph.search import semantic_search
    results = semantic_search(
        query="did you enter the lounge",
        character_id="victor",
        before_timestamp="2024-01-15T00:05:00",
    )
"""

import os
import json
import logging
import numpy as np
from datetime import datetime
from typing import Optional

import faiss
from google import genai
from neo4j import GraphDatabase

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
EMBEDDING_MODEL  = "models/gemini-embedding-001"
EMBEDDING_DIM    = 3072
FAISS_CANDIDATES = 20   # fetch this many from FAISS before filtering

DATA_DIR     = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
INDEX_PATH   = os.path.join(DATA_DIR, "faiss_index.bin")
MAPPING_PATH = os.path.join(DATA_DIR, "id_mapping.json")

log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Module-level singletons — loaded once at import time
# ---------------------------------------------------------------------------
_faiss_index: Optional[faiss.Index] = None
_id_mapping:  Optional[list[str]]   = None
_genai_client = None
_neo4j_driver = None


def _get_faiss():
    global _faiss_index, _id_mapping
    if _faiss_index is None:
        if not os.path.exists(INDEX_PATH):
            raise FileNotFoundError(
                f"FAISS index not found at {INDEX_PATH}. "
                "Run backend/graph/faiss_index.py first."
            )
        _faiss_index = faiss.read_index(INDEX_PATH)
        with open(MAPPING_PATH) as f:
            _id_mapping = json.load(f)
        log.info(f"FAISS index loaded: {_faiss_index.ntotal} vectors")
    return _faiss_index, _id_mapping


def _get_genai_client():
    global _genai_client
    if _genai_client is None:
        # Import settings here to avoid circular import at module level
        from config import settings
        _genai_client = genai.Client(api_key=settings.gemini_api_key)
        log.info("Google GenAI client initialised")
    return _genai_client


def _get_neo4j_driver():
    global _neo4j_driver
    if _neo4j_driver is None:
        from config import settings
        _neo4j_driver = GraphDatabase.driver(
            settings.neo4j_uri, auth=settings.neo4j_auth
        )
        log.info("Neo4j driver initialised")
    return _neo4j_driver


# ---------------------------------------------------------------------------
# Cypher — fetch full fact details for a list of fact IDs
# ---------------------------------------------------------------------------
FETCH_FACTS_BY_IDS = """
UNWIND $fact_ids AS fid
MATCH (c:Character {id: $character_id})-[k:KNOWS]->(f:Fact {id: fid})
WHERE f.character_id = $character_id
  AND k.known_since <= $before_timestamp
RETURN
  f.id           AS id,
  f.content      AS content,
  f.is_lie       AS is_lie,
  f.confidence   AS confidence,
  f.source       AS source,
  k.known_since  AS known_since,
  k.certainty    AS certainty,
  k.will_reveal  AS will_reveal
"""


# ---------------------------------------------------------------------------
# Core function
# ---------------------------------------------------------------------------
def semantic_search(
    query: str,
    character_id: str,
    before_timestamp: str,
    top_k: int = 5,
) -> list[dict]:
    """
    Retrieve the most semantically relevant facts a character knows
    about a given query, filtered by their knowledge cutoff.

    Args:
        query:            Player's question or topic string
        character_id:     One of: victor, martha, hayes, dr_collins, rose
        before_timestamp: ISO 8601 string — only facts known at or before
                          this time are returned (character's knowledge cutoff)
        top_k:            Number of results to return (default 5)

    Returns:
        List of dicts with keys:
            id, content, is_lie, confidence, source,
            known_since, certainty, will_reveal
        Ordered by semantic relevance (closest FAISS distance first).
    """
    index, id_mapping = _get_faiss()
    client            = _get_genai_client()
    driver            = _get_neo4j_driver()

    # ── Step 1: Embed the query ───────────────────────────────────────────
    log.info(f"[GRAPH SEARCH] Calling Gemini ({EMBEDDING_MODEL}) to embed query: '{query}'")
    result = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=query,
    )
    query_vector = np.array(
        result.embeddings[0].values, dtype=np.float32
    ).reshape(1, -1)

    # ── Step 2: FAISS search — top FAISS_CANDIDATES across all characters ─
    k_search = min(FAISS_CANDIDATES, index.ntotal)
    distances, indices = index.search(query_vector, k=k_search)

    candidate_ids = [
        id_mapping[i]
        for i in indices[0]
        if i != -1  # FAISS returns -1 for empty slots
    ]
    log.debug(f"FAISS returned {len(candidate_ids)} candidates: {candidate_ids}")

    # ── Step 3 & 4: Filter by character + cutoff in Neo4j, return top_k ──
    log.info(f"[GRAPH SEARCH] Querying Neo4j to filter {len(candidate_ids)} candidates for character '{character_id}' known before {before_timestamp}")
    with driver.session() as session:
        records = session.run(
            FETCH_FACTS_BY_IDS,
            fact_ids=candidate_ids,
            character_id=character_id,
            before_timestamp=before_timestamp,
        ).data()
    log.info(f"[GRAPH SEARCH] Neo4j returned {len(records)} verified facts.")

    # Re-rank by FAISS distance order (candidate_ids is already distance-sorted)
    id_to_record = {r["id"]: r for r in records}
    ranked = [
        id_to_record[fid]
        for fid in candidate_ids
        if fid in id_to_record
    ]

    results = ranked[:top_k]
    log.debug(
        f"semantic_search({character_id!r}, cutoff={before_timestamp}) "
        f"→ {len(results)} result(s)"
    )
    return results