"""
Cold Case — Test semantic_search()
====================================
Tests backend/graph/search.py with real queries against the live
Neo4j + FAISS index.

Test cases:
  T1 — "did you enter the lounge" → Victor at his cutoff
       Expect: alibi-related facts (lie_lounge, truth_lounge, etc.)

  T2 — "did you enter the lounge" → Victor BEFORE his lounge visit
       Expect: lounge facts excluded (known_since is after cutoff)

  T3 — "inhaler medication breathing" → Martha at her cutoff
       Expect: inhaler-related facts surface

  T4 — "what caused Julian to die" → Dr Collins at his cutoff
       Expect: real_cause_chain, airway, keycap facts surface

  T5 — "drink swap caffeine energy" → Hayes at his cutoff
       Expect: text_proves_swap, energy_drink_found surface

Usage:
    python -m backend.tests.test_search
"""

import sys
import os
import logging
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.scripts.graph.search import semantic_search

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
# Helpers
# ---------------------------------------------------------------------------
PASS = "✓ PASS"
FAIL = "✗ FAIL"

def print_results(results: list[dict]):
    if not results:
        log.info("    (no results returned)")
        return
    for i, r in enumerate(results, 1):
        lie_tag  = " [LIE]"      if r["is_lie"]     else ""
        conf_tag = f" conf={r['confidence']:.1f}" if r.get("confidence") else ""
        log.info(f"    {i}. [{r['id']}]{lie_tag}{conf_tag}")
        log.info(f"       {r['content']}")


def assert_any_contains(results: list[dict], keywords: list[str], label: str):
    """Pass if at least one result's fact ID or content contains any keyword."""
    combined = " ".join(
        (r["id"] + " " + r["content"]).lower() for r in results
    )
    for kw in keywords:
        if kw.lower() in combined:
            log.info(f"    {PASS} — '{kw}' found in results  [{label}]")
            return True
    log.warning(f"    {FAIL} — none of {keywords} found in results  [{label}]")
    return False


def assert_none_contains(results: list[dict], keywords: list[str], label: str):
    """Pass if NO result's fact ID or content contains any keyword."""
    combined = " ".join(
        (r["id"] + " " + r["content"]).lower() for r in results
    )
    for kw in keywords:
        if kw.lower() in combined:
            log.warning(f"    {FAIL} — '{kw}' unexpectedly found in results  [{label}]")
            return False
    log.info(f"    {PASS} — none of {keywords} present (correctly excluded)  [{label}]")
    return True


# ---------------------------------------------------------------------------
# Test cases
# ---------------------------------------------------------------------------
def test_t1_victor_lounge_at_cutoff():
    log.info("\n" + "─" * 60)
    log.info("T1 — Victor: 'did you enter the lounge' at his cutoff")
    log.info("     Expect: lounge / alibi / drink facts surface")

    results = semantic_search(
        query="did you enter the lounge last night",
        character_id="victor",
        before_timestamp="2024-01-15T00:05:00",  # exactly his cutoff
        top_k=5,
    )
    print_results(results)
    ok = assert_any_contains(
        results,
        ["lounge", "drink", "lie_lounge", "truth_lounge", "truth_swap"],
        "lounge/alibi facts present"
    )
    return ok


def test_t2_victor_before_lounge_visit():
    log.info("\n" + "─" * 60)
    log.info("T2 — Victor: same query but cutoff BEFORE his lounge visit")
    log.info("     Expect: lounge facts excluded (known_since after cutoff)")

    results = semantic_search(
        query="did you enter the lounge last night",
        character_id="victor",
        before_timestamp="2024-01-14T21:00:00",  # before 00:05 lounge visit
        top_k=5,
    )
    print_results(results)
    ok = assert_none_contains(
        results,
        ["lie_lounge", "truth_lounge", "truth_swap", "lie_drink"],
        "lounge facts excluded before cutoff"
    )
    return ok


def test_t3_martha_inhaler():
    log.info("\n" + "─" * 60)
    log.info("T3 — Martha: 'inhaler medication breathing' at her cutoff")
    log.info("     Expect: inhaler-related facts surface")

    results = semantic_search(
        query="inhaler medication breathing",
        character_id="martha",
        before_timestamp="2024-01-14T23:18:00",
        top_k=5,
    )
    print_results(results)
    ok = assert_any_contains(
        results,
        ["inhaler", "medical", "pill"],
        "inhaler facts present"
    )
    return ok


def test_t4_collins_cause_of_death():
    log.info("\n" + "─" * 60)
    log.info("T4 — Collins: 'what caused Julian to die' at his cutoff")
    log.info("     Expect: real_cause_chain, airway, keycap facts surface")

    results = semantic_search(
        query="what caused Julian to die",
        character_id="dr_collins",
        before_timestamp="2024-01-15T02:07:00",
        top_k=5,
    )
    print_results(results)
    ok = assert_any_contains(
        results,
        ["airway", "keycap", "cause", "chain", "obstruction"],
        "cause of death facts present"
    )
    return ok


def test_t5_hayes_drink_swap():
    log.info("\n" + "─" * 60)
    log.info("T5 — Hayes: 'drink swap caffeine energy' at his cutoff")
    log.info("     Expect: text_proves_swap, energy_drink facts surface")

    results = semantic_search(
        query="drink swap caffeine energy",
        character_id="hayes",
        before_timestamp="2024-01-15T02:07:00",
        top_k=5,
    )
    print_results(results)
    ok = assert_any_contains(
        results,
        ["drink", "caffeine", "swap", "text", "energy"],
        "drink/caffeine facts present"
    )
    return ok


# ---------------------------------------------------------------------------
# Run all tests
# ---------------------------------------------------------------------------
def main():
    log.info("Cold Case — semantic_search() Test Suite")
    log.info("=" * 60)

    results = {
        "T1": test_t1_victor_lounge_at_cutoff(),
        "T2": test_t2_victor_before_lounge_visit(),
        "T3": test_t3_martha_inhaler(),
        "T4": test_t4_collins_cause_of_death(),
        "T5": test_t5_hayes_drink_swap(),
    }

    log.info("\n" + "=" * 60)
    log.info("SUMMARY")
    log.info("=" * 60)
    passed = 0
    for name, ok in results.items():
        status = PASS if ok else FAIL
        log.info(f"  {name}  {status}")
        if ok:
            passed += 1

    log.info(f"\n  {passed}/{len(results)} tests passed")

    if passed == len(results):
        log.info("  ✓ All tests passed")
    else:
        log.warning("  Some tests failed — check results above")


if __name__ == "__main__":
    main()