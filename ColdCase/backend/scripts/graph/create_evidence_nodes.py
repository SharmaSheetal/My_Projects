"""
Cold Case — Create Evidence Nodes in Neo4j
===========================================

"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from neo4j import GraphDatabase
from config import settings


# ---------------------------------------------------------------------------
# Evidence data — 10 nodes, all static.
# contradiction_ids stored as a comma-separated string for Neo4j compatibility.
# affects_characters stored as a list of character IDs.
# ---------------------------------------------------------------------------
EVIDENCE = [
    {
        "id":                  "evidence_sticky_note",
        "name":                "Sticky Note — THIS DEMO WILL KILL",
        "description":         "A handwritten sticky note found near Julian's body. The message reads THIS DEMO WILL KILL in large letters.",
        "unlocks_at_phase":    1,
        "affects_characters":  ["hayes"],
        "contradiction_ids":   "C7",
        "what_it_proves":      "Julian wrote this himself about his own dramatic stunt — not a murder threat. Central to flipping the C7 assumption.",
    },
    {
        "id":                  "evidence_camera_timestamp",
        "name":                "Lounge Camera Timestamp Log",
        "description":         "A security camera log showing timestamped entries and exits from the judges lounge throughout the night.",
        "unlocks_at_phase":    1,
        "affects_characters":  ["hayes", "victor", "dr_collins"],
        "contradiction_ids":   "C1",
        "what_it_proves":      "Proves Victor entered the judges lounge at 12:05 AM, directly contradicting his alibi claim.",
    },
    {
        "id":                  "evidence_scoring_sheet",
        "name":                "Judge Scoring Sheet with Angry Notes",
        "description":         "Julian's scoring sheet covered in aggressive margin notes criticising multiple teams, including Victor's.",
        "unlocks_at_phase":    1,
        "affects_characters":  ["hayes"],
        "contradiction_ids":   "",
        "what_it_proves":      "Establishes Julian's hostile attitude and gives multiple people motive. Does not directly trigger a contradiction.",
    },
    {
        "id":                  "evidence_energy_drink_can",
        "name":                "Sponsor Energy Drink Can",
        "description":         "An unopened sponsor energy drink can found near Julian's usual spot. The caffeine content is printed on the label — 400mg per can.",
        "unlocks_at_phase":    2,
        "affects_characters":  ["hayes", "dr_collins"],
        "contradiction_ids":   "C2,C6",
        "what_it_proves":      "Confirms the caffeine source that contributed to Julian's overstimulation. Supports C2 drink swap and C6 cause of death chain.",
    },
    {
        "id":                  "evidence_martha_reel",
        "name":                "Martha's Behind-the-Scenes Reel",
        "description":         "Raw footage from Martha's social media reel filmed in the judges lounge. Timestamps embedded in the footage.",
        "unlocks_at_phase":    2,
        "affects_characters":  ["hayes", "dr_collins"],
        "contradiction_ids":   "C3,C4",
        "what_it_proves":      "Shows Martha rearranging objects in the lounge including the inhaler, directly contradicting her claim that she never touched anything.",
    },
    {
        "id":                  "evidence_missing_inhaler",
        "name":                "Julian's Inhaler Found Displaced",
        "description":         "Julian's inhaler found in the wrong location — across the room from where Julian kept it, behind a stack of folders.",
        "unlocks_at_phase":    2,
        "affects_characters":  ["hayes", "dr_collins"],
        "contradiction_ids":   "C6",
        "what_it_proves":      "The inhaler being displaced explains why Julian could not find it during the emergency. Contributes to the C6 cause of death chain.",
    },
    {
        "id":                  "evidence_victor_text",
        "name":                "Victor's Text Message",
        "description":         "A text message sent from Victor's phone at 12:06 AM reading: let him survive finals on 400mg caffeine.",
        "unlocks_at_phase":    2,
        "affects_characters":  ["hayes"],
        "contradiction_ids":   "C2",
        "what_it_proves":      "Proves Victor knew about and deliberately arranged the drink swap, directly contradicting his denial.",
    },
    {
        "id":                  "evidence_keycap_trophy",
        "name":                "Novelty Trophy with Missing Keycap",
        "description":         "The Most Disruptive Hack novelty keyboard trophy found near Julian's body. One keycap is missing and found lodged in Julian's airway.",
        "unlocks_at_phase":    3,
        "affects_characters":  ["dr_collins", "hayes"],
        "contradiction_ids":   "C6",
        "what_it_proves":      "The missing keycap is the direct cause of airway obstruction. Collapses the poison assumption and reveals the real cause of death chain.",
    },
    {
        "id":                  "evidence_vip_kit_checklist",
        "name":                "Organizer Checklist Showing VIP Kit Swap",
        "description":         "An internal organizer checklist with a handwritten note showing the VIP judge kit was swapped for a standard participant bag.",
        "unlocks_at_phase":    3,
        "affects_characters":  ["hayes"],
        "contradiction_ids":   "C5",
        "what_it_proves":      "Proves Rose swapped Julian's VIP kit, directly contradicting her claim that she only handled logistics.",
    },
    {
        "id":                  "evidence_julian_message",
        "name":                "Julian's Message — Tonight's Reveal Will Be Unforgettable",
        "description":         "A message sent from Julian's phone at 10:50 PM to an unknown contact. Reads: Tonight's reveal will be absolutely unforgettable. They won't see it coming.",
        "unlocks_at_phase":    3,
        "affects_characters":  ["hayes", "dr_collins", "rose"],
        "contradiction_ids":   "C7",
        "what_it_proves":      "Proves Julian had planned a dramatic stunt all along — the sticky note was part of his act, not a murder threat. Flips C7 completely.",
    },
]


# ---------------------------------------------------------------------------
# Cypher
# ---------------------------------------------------------------------------
CREATE_CONSTRAINT = """
CREATE CONSTRAINT evidence_id_unique IF NOT EXISTS
  FOR (e:Evidence) REQUIRE e.id IS UNIQUE
"""

MERGE_EVIDENCE = """
MERGE (e:Evidence { id: $id })
SET
  e.name               = $name,
  e.description        = $description,
  e.unlocks_at_phase   = $unlocks_at_phase,
  e.affects_characters = $affects_characters,
  e.contradiction_ids  = $contradiction_ids,
  e.what_it_proves     = $what_it_proves
RETURN e.id AS id, e.name AS name, e.unlocks_at_phase AS phase
"""

VERIFY_QUERY = """
MATCH (e:Evidence)
RETURN e.id AS id, e.name AS name, e.unlocks_at_phase AS phase, e.contradiction_ids AS contradictions
ORDER BY e.unlocks_at_phase ASC, e.id ASC
"""

CHECK_PREREQUISITES = """
MATCH (c:Character) WITH count(c) AS char_count
MATCH (l:Location)  WITH char_count, count(l) AS loc_count
MATCH (o:Object)    WITH char_count, loc_count, count(o) AS obj_count
MATCH (ev:Event)    WITH char_count, loc_count, obj_count, count(ev) AS event_count
RETURN char_count, loc_count, obj_count, event_count
"""


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def create_evidence(driver):
    with driver.session() as session:

        # Prerequisite check
        result = session.run(CHECK_PREREQUISITES)
        row = result.single()
        ok = True

        checks = [
            (row["char_count"],  6,  "Character", "create_character_nodes.py"),
            (row["loc_count"],   4,  "Location",  "create_location_nodes.py"),
            (row["obj_count"],   7,  "Object",    "create_object_nodes.py"),
            (row["event_count"], 12, "Event",     "create_event_nodes.py"),
        ]
        for actual, expected, label, script in checks:
            if actual < expected:
                print(f"✗ Only {actual} {label} node(s) found — expected {expected}. Run {script} first.")
                ok = False
            else:
                print(f"✓ Prerequisite check: {actual} {label} nodes present")

        if not ok:
            sys.exit(1)

        # Step 1 — constraint
        session.run(CREATE_CONSTRAINT)
        print("✓ Constraint: evidence_id_unique ensured")

        # Step 2 — create nodes
        print("\nCreating Evidence nodes...")
        for ev in EVIDENCE:
            result = session.run(MERGE_EVIDENCE, **ev)
            record = result.single()
            print(f"  ✓ phase {record['phase']}  {record['id']:<35}  {record['name']}")

        # Step 3 — verify
        print("\nVerification — all Evidence nodes by phase:")
        print(f"  {'phase':<7} {'id':<35} {'contradictions':<12} {'name'}")
        print(f"  {'-'*7} {'-'*35} {'-'*12} {'-'*40}")
        results = session.run(VERIFY_QUERY)
        ev_count = 0
        for row in results:
            contradictions = row["contradictions"] or "none"
            print(f"  {row['phase']:<7} {row['id']:<35} {contradictions:<12} {row['name']}")
            ev_count += 1

        print(f"\n  Total: {ev_count} evidence node(s) in database")
        if ev_count == 10:
            print("  ✓ All 10 evidence nodes present — ready for Fact nodes")
        else:
            print(f"  ✗ Expected 10 nodes, found {ev_count} — check for errors above")


def main():
    print("Cold Case — Evidence Node Creation")
    print("=" * 40)
    print(f"Environment : {settings.app_env}")
    print(f"Neo4j URI   : {settings.neo4j_uri}")
    print(f"Neo4j User  : {settings.neo4j_user}")

    driver = GraphDatabase.driver(settings.neo4j_uri, auth=settings.neo4j_auth)

    try:
        driver.verify_connectivity()
        print("✓ Connected to Neo4j\n")
        create_evidence(driver)
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)
    finally:
        driver.close()

    print("\nDone. Next step: run create_fact_nodes.py")


if __name__ == "__main__":
    main()