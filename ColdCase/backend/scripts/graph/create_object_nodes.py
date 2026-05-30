"""
Cold Case — Create Object Nodes in Neo4j
=========================================

"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from neo4j import GraphDatabase
from config import settings


# ---------------------------------------------------------------------------
# Object data — 7 nodes, all static, never change during gameplay.
# ---------------------------------------------------------------------------
OBJECTS = [
    {
        "id":                  "object_cold_brew",
        "name":                "Julian's Premium Cold Brew",
        "location_at_start":   "Drink station near the judges lounge entrance",
        "location_at_collapse": "Replaced and gone — Victor removed it",
        "significance":        "Victor swapped this out. Its absence is suspicious and points to deliberate interference with Julian's drink.",
    },
    {
        "id":                  "object_energy_drink",
        "name":                "Sponsor Energy Drink Can",
        "location_at_start":   "Drink station near the judges lounge entrance",
        "location_at_collapse": "Found near the body",
        "significance":        "Victor placed this in place of Julian's cold brew. Ultra-caffeinated. Confirmed caffeine source for C6.",
    },
    {
        "id":                  "object_inhaler",
        "name":                "Julian's Inhaler",
        "location_at_start":   "Julian's usual spot near his chair in the judges lounge",
        "location_at_collapse": "Moved by Martha to wrong location — not where Julian expected it",
        "significance":        "Missing from where Julian expected it during the emergency. Martha moved it while filming her reel.",
    },
    {
        "id":                  "object_pill_case",
        "name":                "Julian's Pill Case",
        "location_at_start":   "Julian's usual spot near his chair in the judges lounge",
        "location_at_collapse": "Moved by Martha alongside the inhaler",
        "significance":        "Displaced along with the inhaler. Rose's VIP kit swap also removed Julian's preferred medication from easy reach.",
    },
    {
        "id":                  "object_keycap_trophy",
        "name":                "Most Disruptive Hack Trophy",
        "location_at_start":   "Judging table in the judges lounge",
        "location_at_collapse": "Near the body — missing keycap",
        "significance":        "Julian loosened a detachable keycap while rehearsing his trophy-smashing stunt. The keycap caused the airway obstruction that killed him. Central to C6.",
    },
    {
        "id":                  "object_sticky_note",
        "name":                "Sticky Note — THIS DEMO WILL KILL",
        "location_at_start":   "Written by Julian and placed near his personal notes",
        "location_at_collapse": "Found beside the body",
        "significance":        "Julian wrote this about his own dramatic stunt — not as a murder threat. Central to C7. Players initially assume it is a threat.",
    },
    {
        "id":                  "object_vip_kit",
        "name":                "VIP Judge Snack Kit",
        "location_at_start":   "Judges lounge prep table",
        "location_at_collapse": "Replaced with a regular participant bag by Rose",
        "significance":        "Rose swapped Julian's VIP kit with a regular bag, removing his preferred medication from easy reach. Central to C5.",
    },
]


# ---------------------------------------------------------------------------
# Cypher
# ---------------------------------------------------------------------------
CREATE_CONSTRAINT = """
CREATE CONSTRAINT object_id_unique IF NOT EXISTS
  FOR (o:Object) REQUIRE o.id IS UNIQUE
"""

MERGE_OBJECT = """
MERGE (o:Object { id: $id })
SET
  o.name                = $name,
  o.location_at_start   = $location_at_start,
  o.location_at_collapse = $location_at_collapse,
  o.significance        = $significance
RETURN o.id AS id, o.name AS name
"""

VERIFY_QUERY = """
MATCH (o:Object)
RETURN o.id AS id, o.name AS name
ORDER BY o.id ASC
"""

CHECK_PREREQUISITES = """
MATCH (c:Character) WITH count(c) AS char_count
MATCH (l:Location)  WITH char_count, count(l) AS loc_count
RETURN char_count, loc_count
"""


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def create_objects(driver):
    with driver.session() as session:

        # Prerequisite check
        result = session.run(CHECK_PREREQUISITES)
        row = result.single()
        char_count = row["char_count"]
        loc_count  = row["loc_count"]
        ok = True

        if char_count < 6:
            print(f" Only {char_count} Character node(s) found — expected 6. Run create_character_nodes.py first.")
            ok = False
        else:
            print(f" Prerequisite check: {char_count} Character nodes present")

        if loc_count < 4:
            print(f" Only {loc_count} Location node(s) found — expected 4. Run create_location_nodes.py first.")
            ok = False
        else:
            print(f" Prerequisite check: {loc_count} Location nodes present")

        if not ok:
            sys.exit(1)

        # Step 1 — constraint
        session.run(CREATE_CONSTRAINT)
        print(" Constraint: object_id_unique ensured")

        # Step 2 — create nodes
        print("\nCreating Object nodes...")
        for obj in OBJECTS:
            result = session.run(MERGE_OBJECT, **obj)
            record = result.single()
            print(f"   {record['id']:<28}  {record['name']}")

        # Step 3 — verify
        print("\nVerification — all Object nodes in database:")
        print(f"  {'id':<28} {'name'}")
        print(f"  {'-'*28} {'-'*35}")
        results = session.run(VERIFY_QUERY)
        obj_count = 0
        for row in results:
            print(f"  {row['id']:<28} {row['name']}")
            obj_count += 1

        print(f"\n  Total: {obj_count} object node(s) in database")
        if obj_count == 7:
            print("   All 7 object nodes present — ready for Event nodes")
        else:
            print(f"   Expected 7 nodes, found {obj_count} — check for errors above")


def main():
    print("Cold Case — Object Node Creation")
    print("=" * 40)
    print(f"Environment : {settings.app_env}")
    print(f"Neo4j URI   : {settings.neo4j_uri}")
    print(f"Neo4j User  : {settings.neo4j_user}")

    driver = GraphDatabase.driver(settings.neo4j_uri, auth=settings.neo4j_auth)

    try:
        driver.verify_connectivity()
        print(" Connected to Neo4j\n")
        create_objects(driver)
    except Exception as e:
        print(f"\n Error: {e}")
        sys.exit(1)
    finally:
        driver.close()

    print("\nDone.")


if __name__ == "__main__":
    main()