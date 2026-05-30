"""
Cold Case — Create Event Nodes in Neo4j
========================================

"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from neo4j import GraphDatabase
from config import settings


# ---------------------------------------------------------------------------
# Event data — 12 nodes, all static, never change during gameplay.
# Ordered chronologically. sequence_order is used for sorting in queries.
# ---------------------------------------------------------------------------
EVENTS = [
    {
        "id":             "event_julian_insults_teams",
        "description":    "Julian publicly insults several teams during practice demos",
        "timestamp":      "2024-01-14T21:20:00",
        "actor":          "julian",
        "location_id":    "location_main_hall",
        "sequence_order": 1,
    },
    {
        "id":             "event_julian_humiliates_victor",
        "description":    "Julian humiliates Victor's team and implies they may not deserve to be in the finals",
        "timestamp":      "2024-01-14T21:45:00",
        "actor":          "julian",
        "location_id":    "location_main_hall",
        "sequence_order": 2,
    },
    {
        "id":             "event_julian_complains_to_rose",
        "description":    "Julian complains to Rose about VIP treatment, food quality, and the judging setup",
        "timestamp":      "2024-01-14T22:05:00",
        "actor":          "julian",
        "location_id":    "location_judges_lounge",
        "sequence_order": 3,
    },
    {
        "id":             "event_rose_kit_swap",
        "description":    "Rose swaps Julian's VIP judge snack kit with a regular participant bag",
        "timestamp":      "2024-01-14T22:20:00",
        "actor":          "rose",
        "location_id":    "location_judges_lounge",
        "sequence_order": 4,
    },
    {
        "id":             "event_julian_reveals_message",
        "description":    "Julian messages someone saying tonight's reveal will be unforgettable",
        "timestamp":      "2024-01-14T22:50:00",
        "actor":          "julian",
        "location_id":    "location_judges_lounge",
        "sequence_order": 5,
    },
    {
        "id":             "event_martha_rearrange",
        "description":    "Martha enters the lounge, films her behind-the-scenes reel, and rearranges objects including the inhaler",
        "timestamp":      "2024-01-14T23:18:00",
        "actor":          "martha",
        "location_id":    "location_judges_lounge",
        "sequence_order": 6,
    },
    {
        "id":             "event_julian_rehearses",
        "description":    "Julian rehearses a dramatic reveal speech alone in the lounge",
        "timestamp":      "2024-01-14T23:40:00",
        "actor":          "julian",
        "location_id":    "location_judges_lounge",
        "sequence_order": 7,
    },
    {
        "id":             "event_victor_swap",
        "description":    "Victor enters the lounge and swaps Julian's cold brew with an ultra-caffeinated sponsor energy drink",
        "timestamp":      "2024-01-15T00:05:00",
        "actor":          "victor",
        "location_id":    "location_judges_lounge",
        "sequence_order": 8,
    },
    {
        "id":             "event_collins_warning",
        "description":    "Dr. Collins notices Julian seems overstimulated and warns him to slow down",
        "timestamp":      "2024-01-15T00:20:00",
        "actor":          "dr_collins",
        "location_id":    "location_main_hall",
        "sequence_order": 9,
    },
    {
        "id":             "event_julian_keycap",
        "description":    "Julian handles the novelty keyboard trophy and loosens a detachable keycap while rehearsing his trophy-smashing stunt",
        "timestamp":      "2024-01-15T00:50:00",
        "actor":          "julian",
        "location_id":    "location_judges_lounge",
        "sequence_order": 10,
    },
    {
        "id":             "event_julian_agitated",
        "description":    "Julian becomes more theatrical and agitated as the final demos continue",
        "timestamp":      "2024-01-15T01:35:00",
        "actor":          "julian",
        "location_id":    "location_main_hall",
        "sequence_order": 11,
    },
    {
        "id":             "event_julian_collapse",
        "description":    "Julian begins his fake collapse speech, starts coughing for real, chokes on the loose keycap, and collapses",
        "timestamp":      "2024-01-15T02:07:00",
        "actor":          "julian",
        "location_id":    "location_judges_lounge",
        "sequence_order": 12,
    },
]


# ---------------------------------------------------------------------------
# Cypher
# ---------------------------------------------------------------------------
CREATE_CONSTRAINT = """
CREATE CONSTRAINT event_id_unique IF NOT EXISTS
  FOR (e:Event) REQUIRE e.id IS UNIQUE
"""

MERGE_EVENT = """
MERGE (e:Event { id: $id })
SET
  e.description    = $description,
  e.timestamp      = $timestamp,
  e.actor          = $actor,
  e.location_id    = $location_id,
  e.sequence_order = $sequence_order
RETURN e.id AS id, e.timestamp AS timestamp, e.actor AS actor
"""

VERIFY_QUERY = """
MATCH (e:Event)
RETURN e.id AS id, e.timestamp AS timestamp, e.actor AS actor, e.sequence_order AS seq
ORDER BY e.sequence_order ASC
"""

CHECK_PREREQUISITES = """
MATCH (c:Character) WITH count(c) AS char_count
MATCH (l:Location)  WITH char_count, count(l) AS loc_count
MATCH (o:Object)    WITH char_count, loc_count, count(o) AS obj_count
RETURN char_count, loc_count, obj_count
"""


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def create_events(driver):
    with driver.session() as session:

        # Prerequisite check
        result = session.run(CHECK_PREREQUISITES)
        row = result.single()
        ok = True

        checks = [
            (row["char_count"], 6, "Character", "create_character_nodes.py"),
            (row["loc_count"],  4, "Location",  "create_location_nodes.py"),
            (row["obj_count"],  7, "Object",    "create_object_nodes.py"),
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
        print("✓ Constraint: event_id_unique ensured")

        # Step 2 — create nodes
        print("\nCreating Event nodes...")
        for event in EVENTS:
            result = session.run(MERGE_EVENT, **event)
            record = result.single()
            print(f"  ✓ [{record['timestamp']}]  {record['id']:<35}  actor: {record['actor']}")

        # Step 3 — verify
        print("\nVerification — all Event nodes in chronological order:")
        print(f"  {'seq':<5} {'timestamp':<22} {'actor':<14} {'id'}")
        print(f"  {'-'*5} {'-'*22} {'-'*14} {'-'*38}")
        results = session.run(VERIFY_QUERY)
        event_count = 0
        for row in results:
            print(f"  {row['seq']:<5} {row['timestamp']:<22} {row['actor']:<14} {row['id']}")
            event_count += 1

        print(f"\n  Total: {event_count} event node(s) in database")
        if event_count == 12:
            print("  ✓ All 12 event nodes present — ready for Evidence nodes")
        else:
            print(f"  ✗ Expected 12 nodes, found {event_count} — check for errors above")


def main():
    print("Cold Case — Event Node Creation")
    print("=" * 40)
    print(f"Environment : {settings.app_env}")
    print(f"Neo4j URI   : {settings.neo4j_uri}")
    print(f"Neo4j User  : {settings.neo4j_user}")

    driver = GraphDatabase.driver(settings.neo4j_uri, auth=settings.neo4j_auth)

    try:
        driver.verify_connectivity()
        print("✓ Connected to Neo4j\n")
        create_events(driver)
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)
    finally:
        driver.close()

    print("\nDone. Next step: run create_evidence_nodes.py")


if __name__ == "__main__":
    main()