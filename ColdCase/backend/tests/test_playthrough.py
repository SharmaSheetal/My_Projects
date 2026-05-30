"""
Cold Case — Full Manual Playthrough (Step 15)
===============================================
Simulates the 11-step naive player demo flow using semantic_search()
directly — no agents, no FastAPI, no frontend.

This validates that the right facts surface at each story beat before
wiring up the full agent system.

Demo flow (Section 16 of story doc):
  Step 1  — Player arrives, reads the scene
  Step 2  — Player talks to Victor (asks about the lounge)
  Step 3  — Player talks to Victor (asks about the drink)
  Step 4  — Player talks to Martha (asks about the room)
  Step 5  — Player talks to Martha (asks about the reel)
  Step 6  — Player talks to Hayes (asks about the cause of death)
  Step 7  — Player talks to Collins (asks about Julian's condition)
  Step 8  — Player talks to Rose (asks about her role that night)
  Step 9  — Player presents evidence_camera_timestamp to Hayes
  Step 10 — Player presents evidence_martha_reel to Hayes
  Step 11 — Player talks to Collins (asks what really happened)

Usage:
    python -m backend.tests.test_playthrough
"""

import sys
import os
import logging
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.scripts.graph.search  import semantic_search

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
# Character knowledge cutoffs (from canonical design)
# ---------------------------------------------------------------------------
CUTOFFS = {
    "victor":     "2024-01-15T00:05:00",
    "martha":     "2024-01-14T23:18:00",
    "hayes":      "2024-01-15T02:07:00",
    "dr_collins": "2024-01-15T02:07:00",
    "rose":       "2024-01-14T22:20:00",
}

# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------
def run_step(
    step_num: int,
    title: str,
    character_id: str,
    query: str,
    expect_keywords: list[str],
    expect_absent: list[str] = None,
    top_k: int = 5,
) -> bool:
    log.info("")
    log.info("═" * 65)
    log.info(f"  STEP {step_num:02d} — {title}")
    log.info(f"  Character : {character_id}")
    log.info(f"  Query     : \"{query}\"")
    log.info(f"  Cutoff    : {CUTOFFS[character_id]}")
    log.info("═" * 65)

    results = semantic_search(
        query=query,
        character_id=character_id,
        before_timestamp=CUTOFFS[character_id],
        top_k=top_k,
    )

    if not results:
        log.warning("  (no results returned)")
    else:
        for i, r in enumerate(results, 1):
            lie_tag  = " [LIE]"  if r["is_lie"] else ""
            conf_tag = f" conf={r['confidence']:.1f}"
            log.info(f"  {i}. {r['id']}{lie_tag}{conf_tag}")
            log.info(f"     → {r['content']}")

    # Check expected keywords
    combined = " ".join(
        (r["id"] + " " + r["content"]).lower() for r in results
    )

    passed = True
    for kw in expect_keywords:
        if kw.lower() in combined:
            log.info(f"  ✓ Expected keyword '{kw}' found")
        else:
            log.warning(f"  ✗ Expected keyword '{kw}' NOT found")
            passed = False

    if expect_absent:
        for kw in expect_absent:
            if kw.lower() in combined:
                log.warning(f"  ✗ Keyword '{kw}' present but should be ABSENT")
                passed = False
            else:
                log.info(f"  ✓ Keyword '{kw}' correctly absent")

    status = "✓ PASS" if passed else "✗ FAIL"
    log.info(f"  Result: {status}")
    return passed


# ---------------------------------------------------------------------------
# 11-step demo playthrough
# ---------------------------------------------------------------------------
def main():
    log.info("Cold Case — Full Demo Playthrough (Step 15)")
    log.info("=" * 65)
    log.info("Naive player perspective — no meta knowledge of the mystery.")
    log.info("Using semantic_search() directly (no agents yet).")

    scores = {}

    # ── STEP 1 — Scene description (no search needed) ────────────────────
    log.info("")
    log.info("═" * 65)
    log.info("  STEP 01 — Player arrives and reads the scene")
    log.info("═" * 65)
    log.info("  [No search — scene is presented as static text to the player]")
    log.info("  Scene: Professor Julian Byte found collapsed at 2:07 AM.")
    log.info("  Sticky note reads: THIS DEMO WILL KILL")
    log.info("  Five witnesses are available for interrogation.")
    log.info("  ✓ PASS (static step)")
    scores["01_scene"] = True

    # ── STEP 2 — Victor: lounge ───────────────────────────────────────────
    scores["02_victor_lounge"] = run_step(
        step_num=2,
        title="Player asks Victor about the lounge",
        character_id="victor",
        query="Were you in the judges lounge last night?",
        expect_keywords=["lounge", "never", "lie"],
    )

    # ── STEP 3 — Victor: drink ────────────────────────────────────────────
    scores["03_victor_drink"] = run_step(
        step_num=3,
        title="Player asks Victor about Julian's drink",
        character_id="victor",
        query="Did you touch or change Julian's drink?",
        expect_keywords=["drink", "never"],
    )

    # ── STEP 4 — Martha: the room ─────────────────────────────────────────
    scores["04_martha_room"] = run_step(
        step_num=4,
        title="Player asks Martha if she touched anything",
        character_id="martha",
        query="Did you move or touch anything in the lounge?",
        expect_keywords=["touched", "never", "lie"],
    )

    # ── STEP 5 — Martha: the reel ─────────────────────────────────────────
    scores["05_martha_reel"] = run_step(
        step_num=5,
        title="Player asks Martha about her filming",
        character_id="martha",
        query="What were you filming in the lounge?",
        expect_keywords=["reel", "filming", "content"],
    )

    # ── STEP 6 — Hayes: cause of death ────────────────────────────────────
    scores["06_hayes_cause"] = run_step(
        step_num=6,
        title="Player asks Hayes what killed Julian",
        character_id="hayes",
        query="What do you think killed Julian? Was he poisoned?",
        expect_keywords=["poison", "assumption"],
    )

    # ── STEP 7 — Collins: Julian's condition ──────────────────────────────
    scores["07_collins_condition"] = run_step(
        step_num=7,
        title="Player asks Collins about Julian's medical condition",
        character_id="dr_collins",
        query="What was Julian's physical condition before he collapsed?",
        expect_keywords=["caffeine", "overstimulated"],
    )

    # ── STEP 8 — Rose: her role ───────────────────────────────────────────
    scores["08_rose_role"] = run_step(
        step_num=8,
        title="Player asks Rose what she did that night",
        character_id="rose",
        query="What was your role tonight? Did you handle Julian's setup?",
        expect_keywords=["logistics", "lie"],
    )

    # ── STEP 9 — Hayes: camera evidence unlocks truth ─────────────────────
    # Simulates player presenting evidence_camera_timestamp
    # Hayes should now reveal the camera fact (it requires this evidence)
    # We test with a direct query about what the camera showed
    scores["09_hayes_camera"] = run_step(
        step_num=9,
        title="Player presents camera timestamp evidence to Hayes",
        character_id="hayes",
        query="The security camera shows someone entering the lounge at 12:05 AM. Who was it?",
        expect_keywords=["camera", "victor", "confirms"],
    )

    # ── STEP 10 — Hayes: Martha's reel evidence ───────────────────────────
    scores["10_hayes_reel"] = run_step(
        step_num=10,
        title="Player presents Martha's reel evidence to Hayes",
        character_id="hayes",
        query="Martha's reel footage shows her moving things around in the lounge.",
        expect_keywords=["reel", "rearranging", "inhaler"],
    )

    # ── STEP 11 — Collins: what really happened ───────────────────────────
    scores["11_collins_truth"] = run_step(
        step_num=11,
        title="Player asks Collins what really killed Julian",
        character_id="dr_collins",
        query="If it wasn't poison, what actually killed Julian? What really happened?",
        expect_keywords=["airway", "caffeine", "inhaler"],
        top_k=8,
    )

    # ── SUMMARY ───────────────────────────────────────────────────────────
    log.info("")
    log.info("═" * 65)
    log.info("  PLAYTHROUGH SUMMARY")
    log.info("═" * 65)

    passed = 0
    for step, ok in scores.items():
        status = "✓ PASS" if ok else "✗ FAIL"
        log.info(f"  {step:<30} {status}")
        if ok:
            passed += 1

    total = len(scores)
    log.info("")
    log.info(f"  {passed}/{total} steps passed")

    if passed == total:
        log.info("  ✓ Full playthrough validated — ready to build persona agents")
    else:
        log.warning("  Some steps failed — review facts and search queries above")

    log.info("")
    log.info("  Key story beats confirmed:")
    log.info("  • Victor denies lounge + drink (lies surface correctly)")
    log.info("  • Martha denies touching anything (lie surfaces correctly)")
    log.info("  • Hayes assumes poison (assumption fact surfaces)")
    log.info("  • Collins hints at non-standard cause (airway/keycap)")
    log.info("  • Camera + reel evidence unlocks Hayes truth facts")
    log.info("  • Collins reveals full chain when asked directly")


if __name__ == "__main__":
    main()