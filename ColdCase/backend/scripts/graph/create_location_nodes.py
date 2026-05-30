"""
Cold Case — Create Location Nodes in Neo4j
===========================================
Run this script THIRD, after create_character_nodes.py.
Location nodes are referenced by Event nodes via location_id.
They must exist before Event nodes are created.

Requirements:
    pip install neo4j pydantic-settings

Usage:
    python -m backend.scripts.create_location_nodes
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from neo4j import GraphDatabase
from config import settings


# ---------------------------------------------------------------------------
# Location data — 4 nodes, all static, never change during gameplay.
# ---------------------------------------------------------------------------
LOCATIONS = [
    {
        "id":            "location_judges_lounge",
        "name":          "Judges Lounge",
        "description":   "The private room where judges rested and Julian was found collapsed",
        "is_crime_scene": True,
    },
    {
        "id":            "location_main_hall",
        "name":          "Main Hackathon Hall",
        "description":   "The primary demo floor where teams presented their projects",
        "is_crime_scene": False,
    },
    {
        "id":            "location_drink_station",
        "name":          "Drink Station",
        "description":   "The beverage table near the lounge entrance where Victor made the swap",
        "is_crime_scene": False,
    },
    {
        "id":            "location_hardware_area",
        "name":          "Hardware Hacking Station",
        "description":   "The area Victor claims he was at all night — his alibi location",
        "is_crime_scene": False,
    },
]


# ---------------------------------------------------------------------------
# Cypher
# ---------------------------------------------------------------------------
CREATE_CONSTRAINT = """
CREATE CONSTRAINT location_id_unique IF NOT EXISTS
  FOR (l:Location) REQUIRE l.id IS UNIQUE
"""

MERGE_LOCATION = """
MERGE (l:Location { id: $id })
SET
  l.name           = $name,
  l.description    = $description,
  l.is_crime_scene = $is_crime_scene
RETURN l.id AS id, l.name AS name, l.is_crime_scene AS is_crime_scene
"""

VERIFY_QUERY = """
MATCH (l:Location)
RETURN l.id AS id, l.name AS name, l.is_crime_scene AS is_crime_scene
ORDER BY l.is_crime_scene DESC, l.id ASC
"""

CHECK_CHARACTERS = """
MATCH (c:Character)
RETURN count(c) AS character_count
"""


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def create_locations(driver):
    with driver.session() as session:

        # Prerequisite check
        result = session.run(CHECK_CHARACTERS)
        count = result.single()["character_count"]
        if count < 6:
            print(f" Only {count} Character node(s) found — expected 6.")
            print("  Run create_character_nodes.py first.")
            sys.exit(1)
        print(f" Prerequisite check: {count} Character nodes present")

        # Step 1 — constraint
        session.run(CREATE_CONSTRAINT)
        print(" Constraint: location_id_unique ensured")

        # Step 2 — create nodes
        print("\nCreating Location nodes...")
        for loc in LOCATIONS:
            result = session.run(MERGE_LOCATION, **loc)
            record = result.single()
            tag = "crime scene" if record["is_crime_scene"] else "venue"
            print(f"   {record['id']:<30}  {record['name']:<28}  [{tag}]")

        # Step 3 — verify
        print("\nVerification — all Location nodes in database:")
        print(f"  {'id':<30} {'name':<28} {'crime_scene'}")
        print(f"  {'-'*30} {'-'*28} {'-'*11}")
        results = session.run(VERIFY_QUERY)
        loc_count = 0
        for row in results:
            print(
                f"  {row['id']:<30} {row['name']:<28} {row['is_crime_scene']}"
            )
            loc_count += 1

        print(f"\n  Total: {loc_count} location node(s) in database")
        if loc_count == 4:
            print("   All 4 location nodes present — ready for Object and Event nodes")
        else:
            print(f"   Expected 4 nodes, found {loc_count} — check for errors above")


def main():
    print("Cold Case — Location Node Creation")
    print("=" * 40)
    print(f"Environment : {settings.app_env}")
    print(f"Neo4j URI   : {settings.neo4j_uri}")
    print(f"Neo4j User  : {settings.neo4j_user}")

    driver = GraphDatabase.driver(settings.neo4j_uri, auth=settings.neo4j_auth)

    try:
        driver.verify_connectivity()
        print("✓ Connected to Neo4j\n")
        create_locations(driver)
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)
    finally:
        driver.close()

    print("\nDone.")


if __name__ == "__main__":
    main()