"""
Cold Case — Plot Hole Verification (Step 18)
============================================
Checks every character's graph for facts they should not know logically.

- Victor must NOT know about the missing inhaler.
- Martha must NOT know about the drink swap.
- Rose must NOT know the specific cause of death.
- No character (besides Collins/Hayes eventually) should know about the keycap.

If any logical violations are found, the script will output them so we can 
fix their known_since timestamp or delete the nodes.

Usage:
    python -m backend.tests.test_plot_holes
"""

import sys
import os
import logging

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from neo4j import GraphDatabase
from backend.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# Define the logical constraints
# Format: character_id -> list of banned keywords in their facts
BANNED_KNOWLEDGE = {
    "victor": ["inhaler", "pill case", "stunt", "fake collapse", "sticky note", "rose", "vip kit"],
    "martha": ["drink swap", "energy drink", "caffeine", "stunt", "fake collapse"],
    "rose": ["keycap", "inhaler", "drink swap", "poisoning", "cause of death"],
}

CHECK_FACTS_QUERY = """
MATCH (f:Fact {character_id: $character_id})
RETURN f.id AS fact_id, f.content AS content, f.known_since AS known_since
"""

def verify_plot_holes(driver) -> bool:
    log.info("Verifying Logical Knowledge Boundaries (Step 18)...")
    log.info("=" * 70)
    
    passed = True
    
    with driver.session() as session:
        for char_id, banned_words in BANNED_KNOWLEDGE.items():
            log.info(f"Checking {char_id.capitalize()} (banned words: {', '.join(banned_words)})")
            
            result = session.run(CHECK_FACTS_QUERY, character_id=char_id)
            facts = [record for record in result]
            
            violations = []
            for fact in facts:
                content = fact["content"].lower()
                for word in banned_words:
                    if word.lower() in content:
                        violations.append({
                            "fact_id": fact["fact_id"],
                            "word": word,
                            "content": fact["content"],
                            "known_since": fact["known_since"]
                        })
            
            if not violations:
                log.info(f"  ✓ No plot holes found for {char_id.capitalize()}.")
            else:
                passed = False
                log.error(f"  ✗ Found {len(violations)} plot hole(s) for {char_id.capitalize()}:")
                for v in violations:
                    log.error(f"    - Fact: {v['fact_id']}")
                    log.error(f"      Contains banned word: '{v['word']}'")
                    log.error(f"      Content: {v['content']}")
            
            log.info("-" * 70)
            
    if passed:
        log.info("✓ PASS: All characters respect their logical knowledge boundaries.")
    else:
        log.error("✗ FAIL: Plot holes detected. You must adjust 'known_since' timestamps or delete invalid facts.")
        
    return passed

def main():
    log.info("Cold Case — Plot Hole Test (Step 18)")
    log.info("=" * 70)
    log.info(f"Environment : {settings.app_env}")
    log.info(f"Neo4j URI   : {settings.neo4j_uri}")

    driver = GraphDatabase.driver(settings.neo4j_uri, auth=settings.neo4j_auth)

    try:
        driver.verify_connectivity()
        log.info("✓ Connected to Neo4j\n")
        success = verify_plot_holes(driver)
        if not success:
            sys.exit(1)
    except Exception as e:
        log.error(f"\n✗ Error: {e}")
        sys.exit(1)
    finally:
        driver.close()

if __name__ == "__main__":
    main()
