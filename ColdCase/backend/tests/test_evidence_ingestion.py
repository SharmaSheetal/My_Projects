"""
Cold Case — Evidence Ingestion Queries (Step 20)
================================================
Defines the Cypher queries that fire when a player submits evidence.
Each query links existing consequence facts (or creates them, though they 
mostly already exist) to the affected characters (primarily Hayes and Collins) 
and updates their known_since timestamp to the current time so they become 
searchable by the agent.

Usage:
    python -m backend.tests.test_evidence_ingestion
"""

import sys
import os
import logging
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from neo4j import GraphDatabase
from backend.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# Dictionary mapping evidence_id to the Cypher query that processes it.
# These queries update the known_since timestamp on the target Fact node
# and MERGE a new KNOWS relationship so the character can access it.
EVIDENCE_QUERIES = {
    "evidence_sticky_note": """
        // Sticky Note - already known, but unlocks interpretation
        // Connects to: fact_hayes_julian_wrote_note_himself
        MATCH (c:Character {id: "hayes"})
        MATCH (f:Fact {id: "fact_hayes_julian_wrote_note_himself"})
        SET f.known_since = $submission_timestamp
        MERGE (c)-[:KNOWS {known_since: $submission_timestamp, certainty: "certain", will_reveal: true}]->(f)
        RETURN count(f) AS updated
    """,
    "evidence_camera_timestamp": """
        // Lounge Camera Timestamp
        MATCH (c:Character {id: "hayes"})
        MATCH (f:Fact {id: "fact_hayes_camera_confirms_victor"})
        SET f.known_since = $submission_timestamp
        MERGE (c)-[:KNOWS {known_since: $submission_timestamp, certainty: "certain", will_reveal: true}]->(f)
        RETURN count(f) AS updated
    """,
    "evidence_energy_drink_can": """
        // Sponsor Energy Drink Can
        // Connects to Collins fact about caffeine and Hayes fact about high caffeine
        MATCH (h:Character {id: "hayes"}), (d:Character {id: "dr_collins"})
        OPTIONAL MATCH (f1:Fact {id: "fact_hayes_high_caffeine_drink"})
        SET f1.known_since = $submission_timestamp
        MERGE (h)-[:KNOWS {known_since: $submission_timestamp, certainty: "certain", will_reveal: true}]->(f1)
        
        WITH d, h
        OPTIONAL MATCH (f2:Fact {id: "fact_collins_caffeine_trigger"})
        SET f2.known_since = $submission_timestamp
        MERGE (d)-[:KNOWS {known_since: $submission_timestamp, certainty: "certain", will_reveal: true}]->(f2)
        RETURN 1 AS updated
    """,
    "evidence_martha_reel": """
        // Martha's Reel
        MATCH (c:Character {id: "hayes"})
        MATCH (f1:Fact {id: "fact_hayes_reel_shows_rearranging"})
        MATCH (f2:Fact {id: "fact_hayes_timestamps_show_distracted"})
        SET f1.known_since = $submission_timestamp, f2.known_since = $submission_timestamp
        MERGE (c)-[:KNOWS {known_since: $submission_timestamp, certainty: "certain", will_reveal: true}]->(f1)
        MERGE (c)-[:KNOWS {known_since: $submission_timestamp, certainty: "certain", will_reveal: true}]->(f2)
        RETURN count(f1) + count(f2) AS updated
    """,
    "evidence_missing_inhaler": """
        // Missing Inhaler
        MATCH (h:Character {id: "hayes"}), (d:Character {id: "dr_collins"})
        MATCH (f1:Fact {id: "fact_hayes_inhaler_displaced"})
        MATCH (f2:Fact {id: "fact_collins_inhaler_missing_trigger"})
        SET f1.known_since = $submission_timestamp, f2.known_since = $submission_timestamp
        MERGE (h)-[:KNOWS {known_since: $submission_timestamp, certainty: "certain", will_reveal: true}]->(f1)
        MERGE (d)-[:KNOWS {known_since: $submission_timestamp, certainty: "certain", will_reveal: true}]->(f2)
        RETURN count(f1) + count(f2) AS updated
    """,
    "evidence_victor_text": """
        // Victor's Text Message
        MATCH (c:Character {id: "hayes"})
        MATCH (f:Fact {id: "fact_hayes_text_proves_swap"})
        SET f.known_since = $submission_timestamp
        MERGE (c)-[:KNOWS {known_since: $submission_timestamp, certainty: "certain", will_reveal: true}]->(f)
        RETURN count(f) AS updated
    """,
    "evidence_keycap_trophy": """
        // Keycap Trophy
        MATCH (h:Character {id: "hayes"}), (d:Character {id: "dr_collins"})
        MATCH (f1:Fact {id: "fact_hayes_keycap_missing"})
        MATCH (f2:Fact {id: "fact_collins_real_cause_chain"})
        SET f1.known_since = $submission_timestamp, f2.known_since = $submission_timestamp
        MERGE (h)-[:KNOWS {known_since: $submission_timestamp, certainty: "certain", will_reveal: true}]->(f1)
        MERGE (d)-[:KNOWS {known_since: $submission_timestamp, certainty: "certain", will_reveal: true}]->(f2)
        RETURN count(f1) + count(f2) AS updated
    """,
    "evidence_vip_kit_checklist": """
        // Organizer Checklist
        MATCH (c:Character {id: "hayes"})
        MATCH (f:Fact {id: "fact_hayes_checklist_shows_swap"})
        SET f.known_since = $submission_timestamp
        MERGE (c)-[:KNOWS {known_since: $submission_timestamp, certainty: "certain", will_reveal: true}]->(f)
        RETURN count(f) AS updated
    """,
    "evidence_scoring_sheet": """
        // Judge Scoring Sheet
        MATCH (c:Character {id: "hayes"})
        MATCH (f:Fact {id: "fact_hayes_julian_hostility"})
        SET f.known_since = $submission_timestamp
        MERGE (c)-[:KNOWS {known_since: $submission_timestamp, certainty: "certain", will_reveal: true}]->(f)
        RETURN count(f) AS updated
    """,
    "evidence_julian_message": """
        // Julian's Message
        MATCH (c:Character {id: "hayes"})
        MATCH (f:Fact {id: "fact_hayes_julian_message_stunt"})
        SET f.known_since = $submission_timestamp
        MERGE (c)-[:KNOWS {known_since: $submission_timestamp, certainty: "certain", will_reveal: true}]->(f)
        RETURN count(f) AS updated
    """
}

def test_queries(driver):
    log.info("Testing all 10 Evidence Ingestion Queries...")
    log.info("=" * 70)
    
    passed = 0
    test_timestamp = datetime.utcnow().isoformat()
    
    with driver.session() as session:
        for ev_id, query in EVIDENCE_QUERIES.items():
            try:
                # We will just verify syntax for now. If it runs without syntax error, it's good.
                # Since we don't want to actually unlock them in the master graph permanently unless
                # testing, we'll wrap in a transaction and rollback, or just run them and assume 
                # we don't care about setting known_since in the dev DB for now.
                # Actually, running EXPLAIN verifies syntax without executing!
                explain_query = "EXPLAIN " + query
                session.run(explain_query, submission_timestamp=test_timestamp)
                log.info(f"  ✓ {ev_id} query syntax is valid.")
                passed += 1
            except Exception as e:
                log.error(f"  ✗ {ev_id} query failed validation: {e}")
                
    log.info("-" * 70)
    log.info(f"Result: {passed}/10 queries validated.")
    return passed == 10

def main():
    log.info("Cold Case — Test Evidence Ingestion Queries (Step 20)")
    log.info("=" * 70)
    
    driver = GraphDatabase.driver(settings.neo4j_uri, auth=settings.neo4j_auth)
    try:
        driver.verify_connectivity()
        log.info("✓ Connected to Neo4j\n")
        success = test_queries(driver)
        if not success:
            sys.exit(1)
    except Exception as e:
        log.error(f"\n✗ Error: {e}")
        sys.exit(1)
    finally:
        driver.close()

if __name__ == "__main__":
    main()
