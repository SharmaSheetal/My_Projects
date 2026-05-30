"""
Cold Case — Contradiction Verification (Step 16)
================================================
Verifies that all 7 contradictions from Section 11 of the story doc
are present, detectable, and correctly linked in the Neo4j graph.


"""

import sys
import os
import logging

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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
# The 7 Expected Contradictions
# ---------------------------------------------------------------------------
EXPECTED_CONTRADICTIONS = {
    "C1": {
        "description": "Victor says he didn't enter the lounge vs camera proves he did.",
        "from_fact_id": "fact_victor_lie_lounge",
        "to_fact_id": "fact_hayes_camera_confirms_victor"
    },
    "C2": {
        "description": "Victor says he didn't touch the drink vs evidence proves swap and intent.",
        "from_fact_id": "fact_victor_lie_drink",
        "to_fact_id": "fact_hayes_text_proves_swap"
    },
    "C3": {
        "description": "Martha says she didn't touch anything vs reel shows she rearranged items.",
        "from_fact_id": "fact_martha_lie_touched",
        "to_fact_id": "fact_hayes_reel_shows_rearranging"
    },
    "C4": {
        "description": "Martha says she saw whole collapse clearly vs reel shows she was distracted.",
        "from_fact_id": "fact_martha_lie_witnessed_clearly",
        "to_fact_id": "fact_hayes_timestamps_show_distracted"
    },
    "C5": {
        "description": "Rose says she only handled logistics vs checklist shows VIP kit swap.",
        "from_fact_id": "fact_rose_lie_logistics",
        "to_fact_id": "fact_hayes_checklist_shows_swap"
    },
    "C6": {
        "description": "Everyone assumes Julian was poisoned vs Collins says airway/caffeine.",
        "from_fact_id": "fact_hayes_assumption_poison",
        "to_fact_id": "fact_collins_real_cause_chain"
    },
    "C7": {
        "description": "Sticky note is a killer threat vs later evidence shows Julian wrote it.",
        "from_fact_id": "fact_hayes_assumption_threat",
        "to_fact_id": "fact_hayes_julian_wrote_note_himself"
    }
}

CHECK_CONTRADICTION_QUERY = """
MATCH (f1:Fact {id: $from_id})-[r:CONTRADICTS {contradiction_id: $cid}]->(f2:Fact {id: $to_id})
RETURN f1.id AS from_fact, r.contradiction_id AS contradiction_id, f2.id AS to_fact
"""

CHECK_FACT_QUERY = """
MATCH (f:Fact {id: $fact_id})
RETURN f.id AS fact_id
"""

def verify_contradictions(driver):
    log.info("Verifying all 7 contradictions from Section 11 of the story doc...")
    log.info("=" * 70)
    
    passed_count = 0
    total_count = len(EXPECTED_CONTRADICTIONS)
    
    with driver.session() as session:
        for cid, details in EXPECTED_CONTRADICTIONS.items():
            log.info(f"Checking {cid}: {details['description']}")
            
            from_id = details["from_fact_id"]
            to_id = details["to_fact_id"]
            
            # 1. Check if both facts exist
            from_exists = session.run(CHECK_FACT_QUERY, fact_id=from_id).single() is not None
            to_exists = session.run(CHECK_FACT_QUERY, fact_id=to_id).single() is not None
            
            if not from_exists:
                log.error(f"  ✗ MATCH FAILED: from_fact '{from_id}' does not exist.")
            if not to_exists:
                log.error(f"  ✗ MATCH FAILED: to_fact '{to_id}' does not exist.")
                
            if from_exists and to_exists:
                log.info(f"  ✓ Both fact nodes exist ({from_id}, {to_id})")
                
                # 2. Check if the CONTRADICTS relationship exists between them
                result = session.run(
                    CHECK_CONTRADICTION_QUERY, 
                    from_id=from_id, 
                    to_id=to_id, 
                    cid=cid
                ).single()
                
                if result:
                    log.info(f"  ✓ CONTRADICTS relationship '{cid}' correctly links them.")
                    passed_count += 1
                else:
                    log.error(f"  ✗ RELATIONSHIP FAILED: '{cid}' not found between {from_id} and {to_id}.")
            
            log.info("-" * 70)
            
    log.info("")
    log.info(f"Verification Summary: {passed_count}/{total_count} Contradictions Detectable.")
    if passed_count == total_count:
        log.info("✓ PASS: All 7 contradictions are fully detectable in the graph!")
        return True
    else:
        log.error("✗ FAIL: One or more contradictions are missing or misconfigured.")
        return False


def main():
    log.info("Cold Case — Test Step 16 (Contradictions)")
    log.info("=" * 70)
    log.info(f"Environment : {settings.app_env}")
    log.info(f"Neo4j URI   : {settings.neo4j_uri}")
    log.info(f"Neo4j User  : {settings.neo4j_user}")

    driver = GraphDatabase.driver(settings.neo4j_uri, auth=settings.neo4j_auth)

    try:
        driver.verify_connectivity()
        log.info("✓ Connected to Neo4j\n")
        success = verify_contradictions(driver)
        if not success:
            sys.exit(1)
    except Exception as e:
        log.error(f"\n✗ Error: {e}")
        sys.exit(1)
    finally:
        driver.close()

if __name__ == "__main__":
    main()
