"""
Cold Case — Create Relationships in Neo4j
==========================================

"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from neo4j import GraphDatabase
from config import settings


# ---------------------------------------------------------------------------
# KNOWS edges — Character → Fact
# Properties: known_since, certainty, will_reveal, reveal_trigger,
#             required_evidence_id
# ---------------------------------------------------------------------------
KNOWS_EDGES = [

    # ── VICTOR ──────────────────────────────────────────────────────────────
    {"character_id": "victor", "fact_id": "fact_victor_truth_lounge",
     "known_since": "2024-01-15T00:05:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "stress_threshold",
     "required_evidence_id": None},

    {"character_id": "victor", "fact_id": "fact_victor_lie_lounge",
     "known_since": "2024-01-15T00:05:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "victor", "fact_id": "fact_victor_truth_swap",
     "known_since": "2024-01-15T00:05:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "direct_confrontation",
     "required_evidence_id": None},

    {"character_id": "victor", "fact_id": "fact_victor_lie_drink",
     "known_since": "2024-01-15T00:05:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "victor", "fact_id": "fact_victor_truth_text",
     "known_since": "2024-01-15T00:06:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "direct_confrontation",
     "required_evidence_id": None},

    {"character_id": "victor", "fact_id": "fact_victor_lie_text",
     "known_since": "2024-01-15T00:10:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "victor", "fact_id": "fact_victor_lie_hardware",
     "known_since": "2024-01-15T00:05:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "victor", "fact_id": "fact_victor_lie_knowledge",
     "known_since": "2024-01-15T00:10:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "victor", "fact_id": "fact_victor_truth_humiliated",
     "known_since": "2024-01-14T21:45:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "victor", "fact_id": "fact_victor_truth_motive",
     "known_since": "2024-01-14T21:45:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "victor", "fact_id": "fact_victor_truth_dramatic",
     "known_since": "2024-01-14T21:45:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "victor", "fact_id": "fact_victor_truth_competitive",
     "known_since": "2024-01-15T00:05:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "stress_threshold",
     "required_evidence_id": None},

    {"character_id": "victor", "fact_id": "fact_victor_truth_alone",
     "known_since": "2024-01-15T00:05:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "stress_threshold",
     "required_evidence_id": None},

    {"character_id": "victor", "fact_id": "fact_victor_truth_quick",
     "known_since": "2024-01-15T00:05:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "stress_threshold",
     "required_evidence_id": None},

    {"character_id": "victor", "fact_id": "fact_victor_truth_lounge_empty",
     "known_since": "2024-01-15T00:05:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "stress_threshold",
     "required_evidence_id": None},

    {"character_id": "victor", "fact_id": "fact_victor_truth_julian_drink",
     "known_since": "2024-01-15T00:06:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "stress_threshold",
     "required_evidence_id": None},

    {"character_id": "victor", "fact_id": "fact_victor_truth_scoring",
     "known_since": "2024-01-14T21:45:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "victor", "fact_id": "fact_victor_suspect_others",
     "known_since": "2024-01-14T21:45:00", "certainty": "suspected",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "victor", "fact_id": "fact_victor_truth_competition",
     "known_since": "2024-01-14T21:45:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    # ── MARTHA ───────────────────────────────────────────────────────────────
    {"character_id": "martha", "fact_id": "fact_martha_truth_inhaler",
     "known_since": "2024-01-14T23:18:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "stress_threshold",
     "required_evidence_id": None},

    {"character_id": "martha", "fact_id": "fact_martha_lie_touched",
     "known_since": "2024-01-14T23:18:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "martha", "fact_id": "fact_martha_truth_reel",
     "known_since": "2024-01-14T23:18:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "martha", "fact_id": "fact_martha_lie_reel_harmless",
     "known_since": "2024-01-14T23:18:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "martha", "fact_id": "fact_martha_truth_pill_case",
     "known_since": "2024-01-14T23:18:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "stress_threshold",
     "required_evidence_id": None},

    {"character_id": "martha", "fact_id": "fact_martha_truth_trophy_moved",
     "known_since": "2024-01-14T23:18:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "stress_threshold",
     "required_evidence_id": None},

    {"character_id": "martha", "fact_id": "fact_martha_lie_witnessed_clearly",
     "known_since": "2024-01-14T23:18:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "martha", "fact_id": "fact_martha_truth_distracted",
     "known_since": "2024-01-14T23:18:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "stress_threshold",
     "required_evidence_id": None},

    {"character_id": "martha", "fact_id": "fact_martha_lie_lounge_empty",
     "known_since": "2024-01-14T23:18:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "martha", "fact_id": "fact_martha_lie_inhaler_location",
     "known_since": "2024-01-14T23:18:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "martha", "fact_id": "fact_martha_truth_julian_theatrical",
     "known_since": "2024-01-15T01:35:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "martha", "fact_id": "fact_martha_truth_content_goal",
     "known_since": "2024-01-14T23:18:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "martha", "fact_id": "fact_martha_truth_alone",
     "known_since": "2024-01-14T23:18:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "martha", "fact_id": "fact_martha_truth_quick",
     "known_since": "2024-01-14T23:18:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "martha", "fact_id": "fact_martha_truth_julian_attitude",
     "known_since": "2024-01-14T23:00:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "martha", "fact_id": "fact_martha_truth_inhaler_small",
     "known_since": "2024-01-14T23:18:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "stress_threshold",
     "required_evidence_id": None},

    {"character_id": "martha", "fact_id": "fact_martha_suspect_staging",
     "known_since": "2024-01-15T01:35:00", "certainty": "suspected",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "martha", "fact_id": "fact_martha_truth_reel_timestamps",
     "known_since": "2024-01-14T23:18:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "direct_confrontation",
     "required_evidence_id": None},

    # ── HAYES ────────────────────────────────────────────────────────────────
    {"character_id": "hayes", "fact_id": "fact_hayes_scene_tampered",
     "known_since": "2024-01-15T02:07:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "hayes", "fact_id": "fact_hayes_multiple_lying",
     "known_since": "2024-01-15T02:07:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "stress_threshold",
     "required_evidence_id": None},

    {"character_id": "hayes", "fact_id": "fact_hayes_not_clean_murder",
     "known_since": "2024-01-15T02:07:00", "certainty": "suspected",
     "will_reveal": False, "reveal_trigger": "evidence_required",
     "required_evidence_id": "evidence_julian_message"},

    {"character_id": "hayes", "fact_id": "fact_hayes_assumption_poison",
     "known_since": "2024-01-15T02:07:00", "certainty": "suspected",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "hayes", "fact_id": "fact_hayes_assumption_threat",
     "known_since": "2024-01-15T02:07:00", "certainty": "suspected",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "hayes", "fact_id": "fact_hayes_camera_confirms_victor",
     "known_since": "2024-01-15T02:07:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "evidence_required",
     "required_evidence_id": "evidence_camera_timestamp"},

    {"character_id": "hayes", "fact_id": "fact_hayes_text_proves_swap",
     "known_since": "2024-01-15T02:07:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "evidence_required",
     "required_evidence_id": "evidence_victor_text"},

    {"character_id": "hayes", "fact_id": "fact_hayes_reel_shows_rearranging",
     "known_since": "2024-01-15T02:07:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "evidence_required",
     "required_evidence_id": "evidence_martha_reel"},

    {"character_id": "hayes", "fact_id": "fact_hayes_timestamps_show_distracted",
     "known_since": "2024-01-15T02:07:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "evidence_required",
     "required_evidence_id": "evidence_martha_reel"},

    {"character_id": "hayes", "fact_id": "fact_hayes_checklist_shows_swap",
     "known_since": "2024-01-15T02:07:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "evidence_required",
     "required_evidence_id": "evidence_vip_kit_checklist"},

    {"character_id": "hayes", "fact_id": "fact_hayes_note_not_a_threat",
     "known_since": "2024-01-15T02:07:00", "certainty": "suspected",
     "will_reveal": False, "reveal_trigger": "evidence_required",
     "required_evidence_id": "evidence_sticky_note"},

    {"character_id": "hayes", "fact_id": "fact_hayes_julian_planned_stunt",
     "known_since": "2024-01-15T02:07:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "evidence_required",
     "required_evidence_id": "evidence_julian_message"},

    {"character_id": "hayes", "fact_id": "fact_hayes_julian_wrote_note_himself",
     "known_since": "2024-01-15T02:07:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "evidence_required",
     "required_evidence_id": "evidence_julian_message"},

    {"character_id": "hayes", "fact_id": "fact_hayes_energy_drink_found",
     "known_since": "2024-01-15T02:07:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "hayes", "fact_id": "fact_hayes_inhaler_displaced",
     "known_since": "2024-01-15T02:07:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "hayes", "fact_id": "fact_hayes_multiple_grievances",
     "known_since": "2024-01-15T02:07:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "hayes", "fact_id": "fact_hayes_no_forced_entry",
     "known_since": "2024-01-15T02:07:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "hayes", "fact_id": "fact_hayes_collapse_time",
     "known_since": "2024-01-15T02:07:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "hayes", "fact_id": "fact_hayes_keycap_found",
     "known_since": "2024-01-15T02:07:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "evidence_required",
     "required_evidence_id": "evidence_keycap_trophy"},

    {"character_id": "hayes", "fact_id": "fact_hayes_independent_actions",
     "known_since": "2024-01-15T02:07:00", "certainty": "suspected",
     "will_reveal": False, "reveal_trigger": "stress_threshold",
     "required_evidence_id": None},

    {"character_id": "hayes", "fact_id": "fact_hayes_victor_motive",
     "known_since": "2024-01-15T02:07:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "hayes", "fact_id": "fact_hayes_rose_motive",
     "known_since": "2024-01-15T02:07:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    # ── DR. COLLINS ──────────────────────────────────────────────────────────
    {"character_id": "dr_collins", "fact_id": "fact_collins_warning",
     "known_since": "2024-01-15T00:20:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "dr_collins", "fact_id": "fact_collins_overstimulated",
     "known_since": "2024-01-15T00:20:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "dr_collins", "fact_id": "fact_collins_airway",
     "known_since": "2024-01-15T02:07:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "evidence_required",
     "required_evidence_id": "evidence_keycap_trophy"},

    {"character_id": "dr_collins", "fact_id": "fact_collins_not_poison",
     "known_since": "2024-01-15T02:07:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "direct_confrontation",
     "required_evidence_id": None},

    {"character_id": "dr_collins", "fact_id": "fact_collins_real_cause_chain",
     "known_since": "2024-01-15T02:07:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "evidence_required",
     "required_evidence_id": "evidence_keycap_trophy"},

    {"character_id": "dr_collins", "fact_id": "fact_collins_caffeine_confirmed",
     "known_since": "2024-01-15T02:07:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "evidence_required",
     "required_evidence_id": "evidence_energy_drink_can"},

    {"character_id": "dr_collins", "fact_id": "fact_collins_inhaler_displaced",
     "known_since": "2024-01-15T02:07:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "evidence_required",
     "required_evidence_id": "evidence_missing_inhaler"},

    {"character_id": "dr_collins", "fact_id": "fact_collins_keycap_obstruction",
     "known_since": "2024-01-15T02:07:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "evidence_required",
     "required_evidence_id": "evidence_keycap_trophy"},

    {"character_id": "dr_collins", "fact_id": "fact_collins_warning_ignored",
     "known_since": "2024-01-15T00:20:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "dr_collins", "fact_id": "fact_collins_no_struggle",
     "known_since": "2024-01-15T02:07:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "dr_collins", "fact_id": "fact_collins_caffeine_stress",
     "known_since": "2024-01-15T02:07:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "stress_threshold",
     "required_evidence_id": None},

    {"character_id": "dr_collins", "fact_id": "fact_collins_theatrical",
     "known_since": "2024-01-15T02:07:00", "certainty": "suspected",
     "will_reveal": False, "reveal_trigger": "stress_threshold",
     "required_evidence_id": None},

    {"character_id": "dr_collins", "fact_id": "fact_collins_unintentional",
     "known_since": "2024-01-15T02:07:00", "certainty": "suspected",
     "will_reveal": False, "reveal_trigger": "stress_threshold",
     "required_evidence_id": None},

    {"character_id": "dr_collins", "fact_id": "fact_collins_caffeine",
     "known_since": "2024-01-15T02:07:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "evidence_required",
     "required_evidence_id": "evidence_energy_drink_can"},

    {"character_id": "dr_collins", "fact_id": "fact_collins_arrived_after",
     "known_since": "2024-01-15T02:07:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    # ── ROSE ─────────────────────────────────────────────────────────────────
    {"character_id": "rose", "fact_id": "fact_rose_truth_kitswap",
     "known_since": "2024-01-14T22:20:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "stress_threshold",
     "required_evidence_id": None},

    {"character_id": "rose", "fact_id": "fact_rose_lie_logistics",
     "known_since": "2024-01-14T22:20:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "rose", "fact_id": "fact_rose_truth_dramatic",
     "known_since": "2024-01-14T22:05:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "rose", "fact_id": "fact_rose_truth_attitude",
     "known_since": "2024-01-14T22:05:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "rose", "fact_id": "fact_rose_lie_no_motive",
     "known_since": "2024-01-14T22:20:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "rose", "fact_id": "fact_rose_lie_kit_untouched",
     "known_since": "2024-01-14T22:20:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "rose", "fact_id": "fact_rose_lie_checklist",
     "known_since": "2024-01-14T22:20:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "rose", "fact_id": "fact_rose_truth_petty",
     "known_since": "2024-01-14T22:20:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "stress_threshold",
     "required_evidence_id": None},

    {"character_id": "rose", "fact_id": "fact_rose_truth_medication",
     "known_since": "2024-01-14T22:20:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "stress_threshold",
     "required_evidence_id": None},

    {"character_id": "rose", "fact_id": "fact_rose_truth_complains",
     "known_since": "2024-01-14T22:05:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "rose", "fact_id": "fact_rose_truth_stressed",
     "known_since": "2024-01-14T22:05:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "rose", "fact_id": "fact_rose_truth_others_frustrated",
     "known_since": "2024-01-14T22:05:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "rose", "fact_id": "fact_rose_truth_quick_swap",
     "known_since": "2024-01-14T22:20:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "stress_threshold",
     "required_evidence_id": None},

    {"character_id": "rose", "fact_id": "fact_rose_truth_no_collapse_plan",
     "known_since": "2024-01-14T22:20:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},

    {"character_id": "rose", "fact_id": "fact_rose_truth_unaware_chain",
     "known_since": "2024-01-14T22:20:00", "certainty": "certain",
     "will_reveal": False, "reveal_trigger": "stress_threshold",
     "required_evidence_id": None},

    {"character_id": "rose", "fact_id": "fact_rose_truth_early_cutoff",
     "known_since": "2024-01-14T22:20:00", "certainty": "certain",
     "will_reveal": True, "reveal_trigger": None,
     "required_evidence_id": None},
]


# ---------------------------------------------------------------------------
# WITNESSED edges — Character → Event
# Properties: perspective, witnessed_at
# ---------------------------------------------------------------------------
WITNESSED_EDGES = [
    {"character_id": "victor",     "event_id": "event_victor_swap",
     "perspective": "participant", "witnessed_at": "2024-01-15T00:05:00"},

    {"character_id": "victor",     "event_id": "event_julian_humiliates_victor",
     "perspective": "participant", "witnessed_at": "2024-01-14T21:45:00"},

    {"character_id": "martha",     "event_id": "event_martha_rearrange",
     "perspective": "participant", "witnessed_at": "2024-01-14T23:18:00"},

    {"character_id": "martha",     "event_id": "event_julian_agitated",
     "perspective": "observer",    "witnessed_at": "2024-01-15T01:35:00"},

    {"character_id": "rose",       "event_id": "event_rose_kit_swap",
     "perspective": "participant", "witnessed_at": "2024-01-14T22:20:00"},

    {"character_id": "rose",       "event_id": "event_julian_complains_to_rose",
     "perspective": "participant", "witnessed_at": "2024-01-14T22:05:00"},

    {"character_id": "dr_collins", "event_id": "event_collins_warning",
     "perspective": "participant", "witnessed_at": "2024-01-15T00:20:00"},

    {"character_id": "dr_collins", "event_id": "event_julian_collapse",
     "perspective": "arrived_after", "witnessed_at": "2024-01-15T02:07:00"},

    {"character_id": "hayes",      "event_id": "event_julian_collapse",
     "perspective": "arrived_after", "witnessed_at": "2024-01-15T02:07:00"},
]


# ---------------------------------------------------------------------------
# TOUCHED edges — Character → Object
# Properties: touched_at, action, admitted
# ---------------------------------------------------------------------------
TOUCHED_EDGES = [
    {"character_id": "victor",  "object_id": "object_cold_brew",
     "touched_at": "2024-01-15T00:05:00", "action": "swapped",  "admitted": False},

    {"character_id": "victor",  "object_id": "object_energy_drink",
     "touched_at": "2024-01-15T00:05:00", "action": "placed",   "admitted": False},

    {"character_id": "martha",  "object_id": "object_inhaler",
     "touched_at": "2024-01-14T23:18:00", "action": "moved",    "admitted": False},

    {"character_id": "martha",  "object_id": "object_pill_case",
     "touched_at": "2024-01-14T23:18:00", "action": "moved",    "admitted": False},

    {"character_id": "martha",  "object_id": "object_keycap_trophy",
     "touched_at": "2024-01-14T23:18:00", "action": "moved",    "admitted": False},

    {"character_id": "rose",    "object_id": "object_vip_kit",
     "touched_at": "2024-01-14T22:20:00", "action": "swapped",  "admitted": False},

    {"character_id": "julian",  "object_id": "object_keycap_trophy",
     "touched_at": "2024-01-15T00:50:00", "action": "loosened", "admitted": True},

    {"character_id": "julian",  "object_id": "object_sticky_note",
     "touched_at": "2024-01-14T21:00:00", "action": "wrote",    "admitted": True},
]


# ---------------------------------------------------------------------------
# CONTRADICTS edges — Fact → Fact
# Properties: contradiction_id, severity
# Direction: always lie/assumption → truth/counter-evidence
# ---------------------------------------------------------------------------
CONTRADICTS_EDGES = [
    {"from_fact_id": "fact_victor_lie_lounge",
     "to_fact_id":   "fact_hayes_camera_confirms_victor",
     "contradiction_id": "C1", "severity": "direct"},

    {"from_fact_id": "fact_victor_lie_drink",
     "to_fact_id":   "fact_hayes_text_proves_swap",
     "contradiction_id": "C2", "severity": "direct"},

    {"from_fact_id": "fact_martha_lie_touched",
     "to_fact_id":   "fact_hayes_reel_shows_rearranging",
     "contradiction_id": "C3", "severity": "direct"},

    {"from_fact_id": "fact_martha_lie_witnessed_clearly",
     "to_fact_id":   "fact_hayes_timestamps_show_distracted",
     "contradiction_id": "C4", "severity": "indirect"},

    {"from_fact_id": "fact_rose_lie_logistics",
     "to_fact_id":   "fact_hayes_checklist_shows_swap",
     "contradiction_id": "C5", "severity": "direct"},

    {"from_fact_id": "fact_hayes_assumption_poison",
     "to_fact_id":   "fact_collins_real_cause_chain",
     "contradiction_id": "C6", "severity": "indirect"},

    {"from_fact_id": "fact_hayes_assumption_threat",
     "to_fact_id":   "fact_hayes_julian_wrote_note_himself",
     "contradiction_id": "C7", "severity": "indirect"},
]


# ---------------------------------------------------------------------------
# CONNECTED_TO edges — Evidence → Fact
# Properties: reveals_to (list), creates_new_fact (bool)
# ---------------------------------------------------------------------------
CONNECTED_TO_EDGES = [
    {"evidence_id": "evidence_camera_timestamp",
     "fact_id":     "fact_hayes_camera_confirms_victor",
     "reveals_to":  ["hayes", "dr_collins"], "creates_new_fact": True},

    {"evidence_id": "evidence_camera_timestamp",
     "fact_id":     "fact_victor_truth_lounge",
     "reveals_to":  ["victor"], "creates_new_fact": False},

    {"evidence_id": "evidence_victor_text",
     "fact_id":     "fact_hayes_text_proves_swap",
     "reveals_to":  ["hayes"], "creates_new_fact": True},

    {"evidence_id": "evidence_martha_reel",
     "fact_id":     "fact_hayes_reel_shows_rearranging",
     "reveals_to":  ["hayes", "dr_collins"], "creates_new_fact": True},

    {"evidence_id": "evidence_martha_reel",
     "fact_id":     "fact_hayes_timestamps_show_distracted",
     "reveals_to":  ["hayes"], "creates_new_fact": True},

    {"evidence_id": "evidence_keycap_trophy",
     "fact_id":     "fact_collins_real_cause_chain",
     "reveals_to":  ["dr_collins", "hayes"], "creates_new_fact": True},

    {"evidence_id": "evidence_energy_drink_can",
     "fact_id":     "fact_collins_caffeine_confirmed",
     "reveals_to":  ["dr_collins", "hayes"], "creates_new_fact": True},

    {"evidence_id": "evidence_vip_kit_checklist",
     "fact_id":     "fact_hayes_checklist_shows_swap",
     "reveals_to":  ["hayes"], "creates_new_fact": True},

    {"evidence_id": "evidence_julian_message",
     "fact_id":     "fact_hayes_julian_planned_stunt",
     "reveals_to":  ["hayes", "dr_collins", "rose"], "creates_new_fact": True},

    {"evidence_id": "evidence_julian_message",
     "fact_id":     "fact_hayes_julian_wrote_note_himself",
     "reveals_to":  ["hayes"], "creates_new_fact": True},

    {"evidence_id": "evidence_sticky_note",
     "fact_id":     "fact_hayes_note_not_a_threat",
     "reveals_to":  ["hayes"], "creates_new_fact": True},

    {"evidence_id": "evidence_missing_inhaler",
     "fact_id":     "fact_collins_inhaler_displaced",
     "reveals_to":  ["dr_collins", "hayes"], "creates_new_fact": True},
]


# ---------------------------------------------------------------------------
# Cypher queries
# ---------------------------------------------------------------------------
MERGE_KNOWS = """
MATCH (c:Character {id: $character_id})
MATCH (f:Fact {id: $fact_id})
MERGE (c)-[r:KNOWS]->(f)
SET
  r.known_since          = $known_since,
  r.certainty            = $certainty,
  r.will_reveal          = $will_reveal,
  r.reveal_trigger       = $reveal_trigger,
  r.required_evidence_id = $required_evidence_id
RETURN c.id AS character, f.id AS fact
"""

MERGE_WITNESSED = """
MATCH (c:Character {id: $character_id})
MATCH (e:Event {id: $event_id})
MERGE (c)-[r:WITNESSED]->(e)
SET
  r.perspective  = $perspective,
  r.witnessed_at = $witnessed_at
RETURN c.id AS character, e.id AS event
"""

MERGE_TOUCHED = """
MATCH (c:Character {id: $character_id})
MATCH (o:Object {id: $object_id})
MERGE (c)-[r:TOUCHED]->(o)
SET
  r.touched_at = $touched_at,
  r.action     = $action,
  r.admitted   = $admitted
RETURN c.id AS character, o.id AS object
"""

MERGE_CONTRADICTS = """
MATCH (f1:Fact {id: $from_fact_id})
MATCH (f2:Fact {id: $to_fact_id})
MERGE (f1)-[r:CONTRADICTS]->(f2)
SET
  r.contradiction_id = $contradiction_id,
  r.severity         = $severity
RETURN f1.id AS from_fact, f2.id AS to_fact, r.contradiction_id AS cid
"""

MERGE_CONNECTED_TO = """
MATCH (e:Evidence {id: $evidence_id})
MATCH (f:Fact {id: $fact_id})
MERGE (e)-[r:CONNECTED_TO]->(f)
SET
  r.reveals_to      = $reveals_to,
  r.creates_new_fact = $creates_new_fact
RETURN e.id AS evidence, f.id AS fact
"""

VERIFY_QUERY = """
MATCH ()-[r]->()
RETURN type(r) AS relationship_type, count(r) AS count
ORDER BY count DESC
"""

CHECK_PREREQUISITES = """
MATCH (c:Character) WITH count(c)  AS char_count
MATCH (f:Fact)      WITH char_count, count(f)  AS fact_count
MATCH (e:Evidence)  WITH char_count, fact_count, count(e) AS evid_count
MATCH (ev:Event)    WITH char_count, fact_count, evid_count, count(ev) AS event_count
RETURN char_count, fact_count, evid_count, event_count
"""


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def create_relationships(driver):
    with driver.session() as session:

        # Prerequisite check
        result = session.run(CHECK_PREREQUISITES)
        row = result.single()
        ok = True

        checks = [
            (row["char_count"],  6,  "Character", "create_character_nodes.py"),
            (row["fact_count"],  85, "Fact",      "create_fact_nodes.py"),
            (row["evid_count"],  10, "Evidence",  "create_evidence_nodes.py"),
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

        # ── KNOWS ────────────────────────────────────────────────────────────
        print(f"\nCreating KNOWS edges ({len(KNOWS_EDGES)})...")
        knows_count = 0
        for edge in KNOWS_EDGES:
            result = session.run(MERGE_KNOWS, **edge)
            record = result.single()
            if record:
                knows_count += 1
            else:
                print(f"  ✗ FAILED: {edge['character_id']} → {edge['fact_id']}")
        print(f"  ✓ {knows_count} KNOWS edges created")

        # ── WITNESSED ────────────────────────────────────────────────────────
        print(f"\nCreating WITNESSED edges ({len(WITNESSED_EDGES)})...")
        witnessed_count = 0
        for edge in WITNESSED_EDGES:
            result = session.run(MERGE_WITNESSED, **edge)
            record = result.single()
            if record:
                witnessed_count += 1
            else:
                print(f"  ✗ FAILED: {edge['character_id']} → {edge['event_id']}")
        print(f"  ✓ {witnessed_count} WITNESSED edges created")

        # ── TOUCHED ──────────────────────────────────────────────────────────
        print(f"\nCreating TOUCHED edges ({len(TOUCHED_EDGES)})...")
        touched_count = 0
        for edge in TOUCHED_EDGES:
            result = session.run(MERGE_TOUCHED, **edge)
            record = result.single()
            if record:
                touched_count += 1
            else:
                print(f"  ✗ FAILED: {edge['character_id']} → {edge['object_id']}")
        print(f"  ✓ {touched_count} TOUCHED edges created")

        # ── CONTRADICTS ──────────────────────────────────────────────────────
        print(f"\nCreating CONTRADICTS edges ({len(CONTRADICTS_EDGES)})...")
        contradicts_count = 0
        for edge in CONTRADICTS_EDGES:
            result = session.run(MERGE_CONTRADICTS, **edge)
            record = result.single()
            if record:
                contradicts_count += 1
                print(f"  ✓ {record['cid']}  {record['from_fact']} → {record['to_fact']}")
            else:
                print(f"  ✗ FAILED: {edge['from_fact_id']} → {edge['to_fact_id']}")
        print(f"  ✓ {contradicts_count} CONTRADICTS edges created")

        # ── CONNECTED_TO ─────────────────────────────────────────────────────
        print(f"\nCreating CONNECTED_TO edges ({len(CONNECTED_TO_EDGES)})...")
        connected_count = 0
        for edge in CONNECTED_TO_EDGES:
            result = session.run(MERGE_CONNECTED_TO, **edge)
            record = result.single()
            if record:
                connected_count += 1
            else:
                print(f"  ✗ FAILED: {edge['evidence_id']} → {edge['fact_id']}")
        print(f"  ✓ {connected_count} CONNECTED_TO edges created")

        # ── VERIFY ───────────────────────────────────────────────────────────
        print("\nVerification — all relationship counts in database:")
        print(f"  {'relationship':<16} {'count'}")
        print(f"  {'-'*16} {'-'*6}")
        results = session.run(VERIFY_QUERY)
        for row in results:
            print(f"  {row['relationship_type']:<16} {row['count']}")

        print(f"\n  Summary:")
        print(f"    KNOWS        : {knows_count}")
        print(f"    WITNESSED    : {witnessed_count}")
        print(f"    TOUCHED      : {touched_count}")
        print(f"    CONTRADICTS  : {contradicts_count}  (expected 7)")
        print(f"    CONNECTED_TO : {connected_count}  (expected 12)")

        if contradicts_count == 7 and connected_count == 12:
            print("\n  ✓ All critical relationships present — graph population complete")
        else:
            print("\n  ✗ Some relationships missing — check errors above")


def main():
    print("Cold Case — Relationship Creation")
    print("=" * 40)
    print(f"Environment : {settings.app_env}")
    print(f"Neo4j URI   : {settings.neo4j_uri}")
    print(f"Neo4j User  : {settings.neo4j_user}")

    driver = GraphDatabase.driver(settings.neo4j_uri, auth=settings.neo4j_auth)

    try:
        driver.verify_connectivity()
        print("✓ Connected to Neo4j\n")
        create_relationships(driver)
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)
    finally:
        driver.close()

    print("\nDone. Graph population complete.")
    print("Next step: run the embedding script to populate fact embeddings.")


if __name__ == "__main__":
    main()