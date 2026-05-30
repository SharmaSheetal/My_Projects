"""
Cold Case — Create Character Nodes in Neo4j
============================================
Run this script FIRST before any other graph population scripts.
All other node types and relationships reference Character nodes by ID.

Requirements:
    pip install neo4j pydantic-settings

Usage:
    cp .env.example .env        # fill in your credentials
    python create_character_nodes.py
"""

import sys
from neo4j import GraphDatabase
from backend.config import settings


# ---------------------------------------------------------------------------
# Character data — locked to the graph design document.
# DO NOT change IDs, cutoffs, or stress starting values without updating
# the design doc first. These values are the source of truth for the
# entire RAG temporal filtering system.
#
# Fields:
#   id               — used as the primary key and in all relationship creation
#   name             — short display name shown in the frontend UI
#   full_name        — full character name
#   role             — their role at the hackathon
#   knowledge_cutoff — ISO 8601 string. Facts after this timestamp are
#                      invisible to this character during RAG retrieval.
#                      None for julian since he has no agent.
#   stress           — float 0.0–1.0. Runtime-mutable. NLP engineer updates
#                      this as contradictions are detected against the character.
#                      Exceeding 0.7 triggers the flustered prompt injection.
#   is_interviewable — True for the 5 playable characters.
#                      False for julian (graph anchor only, never queried).
# ---------------------------------------------------------------------------
CHARACTERS = [
    {
        "id":               "victor",
        "name":             "Victor",
        "full_name":        "Victor Chen",
        "role":             "Finalist Team Captain",
        "knowledge_cutoff": "2024-01-15T00:05:00",
        "stress":           0.3,
        "is_interviewable": True,
    },
    {
        "id":               "martha",
        "name":             "Martha",
        "full_name":        "Martha Reyes",
        "role":             "Volunteer and Social Media Lead",
        "knowledge_cutoff": "2024-01-14T23:18:00",
        "stress":           0.3,
        "is_interviewable": True,
    },
    {
        "id":               "hayes",
        "name":             "Detective Hayes",
        "full_name":        "Officer Raymond Hayes",
        "role":             "Campus Security Officer",
        "knowledge_cutoff": "2024-01-15T02:07:00",
        "stress":           0.2,
        "is_interviewable": True,
    },
    {
        "id":               "dr_collins",
        "name":             "Dr. Collins",
        "full_name":        "Dr. Samuel Collins",
        "role":             "Medical Judge and On-Call Doctor",
        "knowledge_cutoff": "2024-01-15T02:07:00",
        "stress":           0.2,
        "is_interviewable": True,
    },
    {
        "id":               "rose",
        "name":             "Rose",
        "full_name":        "Rose Nakamura",
        "role":             "Lead Hackathon Organizer",
        "knowledge_cutoff": "2024-01-14T22:20:00",
        "stress":           0.3,
        "is_interviewable": True,
    },
    {
        "id":               "julian",
        "name":             "Julian Byte",
        "full_name":        "Professor Julian Byte",
        "role":             "Hackathon Judge (Victim)",
        "knowledge_cutoff": None,   # Not queryable — no RAG, no agent
        "stress":           0.0,    # No stress system applies
        "is_interviewable": False,  # Frontend must never show Julian as selectable
    },
]


# ---------------------------------------------------------------------------
# Cypher — uses MERGE so the script is safe to re-run without creating
# duplicate nodes. SET overwrites all properties on each run, which means
# you can correct a value and re-run to fix it in place.
# ---------------------------------------------------------------------------
CREATE_CONSTRAINT = """
CREATE CONSTRAINT character_id_unique IF NOT EXISTS
  FOR (c:Character) REQUIRE c.id IS UNIQUE
"""

MERGE_CHARACTER = """
MERGE (c:Character { id: $id })
SET
  c.name             = $name,
  c.full_name        = $full_name,
  c.role             = $role,
  c.knowledge_cutoff = $knowledge_cutoff,
  c.stress           = $stress,
  c.is_interviewable = $is_interviewable
RETURN c.id AS id, c.name AS name, c.is_interviewable AS is_interviewable
"""

VERIFY_QUERY = """
MATCH (c:Character)
RETURN c.id AS id, c.name AS name, c.stress AS stress,
       c.is_interviewable AS is_interviewable,
       c.knowledge_cutoff AS knowledge_cutoff
ORDER BY c.is_interviewable DESC, c.id ASC
"""


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def create_characters(driver):
    with driver.session() as session:

        # Step 1 — enforce uniqueness constraint
        session.run(CREATE_CONSTRAINT)
        print("✓ Constraint: character_id_unique ensured")

        # Step 2 — create or update each character node
        print("\nCreating character nodes...")
        for char in CHARACTERS:
            result = session.run(MERGE_CHARACTER, **char)
            record = result.single()
            interviewable_label = "interviewable" if record["is_interviewable"] else "anchor only"
            print(f"  ✓ {record['id']:12s}  {record['name']:20s}  [{interviewable_label}]")

        # Step 3 — verify
        print("\nVerification — all Character nodes in database:")
        print(f"  {'id':<14} {'name':<22} {'stress':<8} {'interviewable':<15} {'knowledge_cutoff'}")
        print(f"  {'-'*14} {'-'*22} {'-'*8} {'-'*15} {'-'*20}")
        results = session.run(VERIFY_QUERY)
        count = 0
        for row in results:
            cutoff = row["knowledge_cutoff"] or "null (anchor)"
            print(
                f"  {row['id']:<14} {row['name']:<22} "
                f"{row['stress']:<8} {str(row['is_interviewable']):<15} {cutoff}"
            )
            count += 1

        print(f"\n  Total: {count} character node(s) in database")
        if count == 6:
            print("   All 6 character nodes present — ready for next step")
        else:
            print(f"   Expected 6 nodes, found {count} — check for errors above")


def main():
    print("Cold Case — Character Node Creation")
    print("=" * 40)
    print(f"Environment : {settings.app_env}")
    print(f"Neo4j URI   : {settings.neo4j_uri}")
    print(f"Neo4j User  : {settings.neo4j_user}")

    driver = GraphDatabase.driver(settings.neo4j_uri, auth=settings.neo4j_auth)

    try:
        driver.verify_connectivity()
        print(" Connected to Neo4j\n")
        create_characters(driver)
    except Exception as e:
        print(f"\n Error: {e}")
        sys.exit(1)
    finally:
        driver.close()

    print("\nDone")


if __name__ == "__main__":
    main()