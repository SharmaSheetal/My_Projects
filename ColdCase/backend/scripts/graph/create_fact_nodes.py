"""
Cold Case — Create Fact Nodes in Neo4j
========================================

"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from neo4j import GraphDatabase
from config import settings


# ---------------------------------------------------------------------------
# Fact data — grouped by character.
# Properties: id, content, known_since, source, confidence, is_lie, character_id
# embedding is always null at creation — populated later by embedding script.
#
# Content writing rules:
#   - Lie facts: first person ("I never entered...")
#   - Truth facts: third person ("Victor entered...")
#   - Be specific enough for semantic search to distinguish facts
#   - Never reveal info the character doesn't have
# ---------------------------------------------------------------------------

# ── VICTOR (19 facts, 5 lies) ────────────────────────────────────────────────
VICTOR_FACTS = [
    {
        "id":           "fact_victor_truth_lounge",
        "content":      "Victor entered the judges lounge at 12:05 AM",
        "known_since":  "2024-01-15T00:05:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "victor",
    },
    {
        "id":           "fact_victor_lie_lounge",
        "content":      "I never entered the judges lounge at any point last night",
        "known_since":  "2024-01-15T00:05:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       True,
        "character_id": "victor",
    },
    {
        "id":           "fact_victor_truth_swap",
        "content":      "Victor swapped Julian's cold brew with an ultra-caffeinated sponsor energy drink at 12:05 AM",
        "known_since":  "2024-01-15T00:05:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "victor",
    },
    {
        "id":           "fact_victor_lie_drink",
        "content":      "I never touched Julian's drink or anything near the drink station",
        "known_since":  "2024-01-15T00:05:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       True,
        "character_id": "victor",
    },
    {
        "id":           "fact_victor_truth_text",
        "content":      "Victor sent a text message at 12:06 AM reading: let him survive finals on 400mg caffeine",
        "known_since":  "2024-01-15T00:06:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "victor",
    },
    {
        "id":           "fact_victor_lie_text",
        "content":      "I never sent any message about Julian or about any drinks last night",
        "known_since":  "2024-01-15T00:10:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       True,
        "character_id": "victor",
    },
    {
        "id":           "fact_victor_lie_hardware",
        "content":      "I was at the hardware hacking station all night and never left",
        "known_since":  "2024-01-15T00:05:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       True,
        "character_id": "victor",
    },
    {
        "id":           "fact_victor_lie_knowledge",
        "content":      "I have no idea how Julian ended up with that energy drink",
        "known_since":  "2024-01-15T00:10:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       True,
        "character_id": "victor",
    },
    {
        "id":           "fact_victor_truth_humiliated",
        "content":      "Julian publicly humiliated Victor's team during practice demos at 9:45 PM",
        "known_since":  "2024-01-14T21:45:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "victor",
    },
    {
        "id":           "fact_victor_truth_motive",
        "content":      "Julian implied Victor's team might not deserve to be in the finals",
        "known_since":  "2024-01-14T21:45:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "victor",
    },
    {
        "id":           "fact_victor_truth_dramatic",
        "content":      "Julian was already acting theatrical and dramatic well before the collapse",
        "known_since":  "2024-01-14T21:45:00",
        "source":       "observation",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "victor",
    },
    {
        "id":           "fact_victor_truth_competitive",
        "content":      "Victor believed swapping the drink was a form of competitive correction, not sabotage",
        "known_since":  "2024-01-15T00:05:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "victor",
    },
    {
        "id":           "fact_victor_truth_alone",
        "content":      "Victor was alone in the lounge when he made the drink swap",
        "known_since":  "2024-01-15T00:05:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "victor",
    },
    {
        "id":           "fact_victor_truth_quick",
        "content":      "Victor was in the judges lounge for less than five minutes",
        "known_since":  "2024-01-15T00:05:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "victor",
    },
    {
        "id":           "fact_victor_truth_lounge_empty",
        "content":      "The judges lounge was quiet and empty when Victor entered at 12:05 AM",
        "known_since":  "2024-01-15T00:05:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "victor",
    },
    {
        "id":           "fact_victor_truth_julian_drink",
        "content":      "Julian had been drinking the sponsor energy drink when Victor last saw him",
        "known_since":  "2024-01-15T00:06:00",
        "source":       "observation",
        "confidence":   0.9,
        "is_lie":       False,
        "character_id": "victor",
    },
    {
        "id":           "fact_victor_truth_scoring",
        "content":      "Julian's scoring showed active bias against certain teams including Victor's",
        "known_since":  "2024-01-14T21:45:00",
        "source":       "direct_experience",
        "confidence":   0.8,
        "is_lie":       False,
        "character_id": "victor",
    },
    {
        "id":           "fact_victor_suspect_others",
        "content":      "Victor suspects other people also had grievances against Julian that night",
        "known_since":  "2024-01-14T21:45:00",
        "source":       "observation",
        "confidence":   0.6,
        "is_lie":       False,
        "character_id": "victor",
    },
    {
        "id":           "fact_victor_truth_competition",
        "content":      "Victor has strong competitive feelings about the judging process and Julian's role in it",
        "known_since":  "2024-01-14T21:45:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "victor",
    },
]

# ── MARTHA (18 facts, 6 lies) ────────────────────────────────────────────────
MARTHA_FACTS = [
    {
        "id":           "fact_martha_truth_inhaler",
        "content":      "Martha moved Julian's inhaler to a different location while rearranging the lounge for her reel",
        "known_since":  "2024-01-14T23:18:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "martha",
    },
    {
        "id":           "fact_martha_lie_touched",
        "content":      "I never touched a single thing in that lounge — I was purely observing and filming",
        "known_since":  "2024-01-14T23:18:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       True,
        "character_id": "martha",
    },
    {
        "id":           "fact_martha_truth_reel",
        "content":      "Martha filmed a behind-the-scenes reel inside the judges lounge at 11:18 PM",
        "known_since":  "2024-01-14T23:18:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "martha",
    },
    {
        "id":           "fact_martha_lie_reel_harmless",
        "content":      "My reel was completely harmless — I just filmed the atmosphere and did not move anything",
        "known_since":  "2024-01-14T23:18:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       True,
        "character_id": "martha",
    },
    {
        "id":           "fact_martha_truth_pill_case",
        "content":      "Martha also moved Julian's pill case while rearranging for her reel",
        "known_since":  "2024-01-14T23:18:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "martha",
    },
    {
        "id":           "fact_martha_truth_trophy_moved",
        "content":      "Martha moved the novelty keyboard trophy to get a better shot for her reel",
        "known_since":  "2024-01-14T23:18:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "martha",
    },
    {
        "id":           "fact_martha_lie_witnessed_clearly",
        "content":      "I had a clear unobstructed view of everything in the lounge the entire time I was filming",
        "known_since":  "2024-01-14T23:18:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       True,
        "character_id": "martha",
    },
    {
        "id":           "fact_martha_truth_distracted",
        "content":      "Martha was preoccupied with camera angles and framing throughout her time in the lounge",
        "known_since":  "2024-01-14T23:18:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "martha",
    },
    {
        "id":           "fact_martha_lie_lounge_empty",
        "content":      "The lounge was completely undisturbed when I arrived — nothing was out of place",
        "known_since":  "2024-01-14T23:18:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       True,
        "character_id": "martha",
    },
    {
        "id":           "fact_martha_lie_inhaler_location",
        "content":      "I never touched Julian's medical items — I would never move something like that",
        "known_since":  "2024-01-14T23:18:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       True,
        "character_id": "martha",
    },
    {
        "id":           "fact_martha_truth_julian_theatrical",
        "content":      "Julian was being very theatrical and dramatic during the event — performing for the room",
        "known_since":  "2024-01-15T01:35:00",
        "source":       "observation",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "martha",
    },
    {
        "id":           "fact_martha_truth_content_goal",
        "content":      "Martha was in the lounge to get exclusive behind-the-scenes content for her social media",
        "known_since":  "2024-01-14T23:18:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "martha",
    },
    {
        "id":           "fact_martha_truth_alone",
        "content":      "Martha was alone in the lounge when she filmed her reel — no one else was present",
        "known_since":  "2024-01-14T23:18:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "martha",
    },
    {
        "id":           "fact_martha_truth_quick",
        "content":      "Martha was in the lounge for approximately fifteen minutes before leaving",
        "known_since":  "2024-01-14T23:18:00",
        "source":       "direct_experience",
        "confidence":   0.8,
        "is_lie":       False,
        "character_id": "martha",
    },
    {
        "id":           "fact_martha_truth_julian_attitude",
        "content":      "Julian had a dismissive attitude toward volunteers like Martha throughout the event",
        "known_since":  "2024-01-14T23:00:00",
        "source":       "direct_experience",
        "confidence":   0.9,
        "is_lie":       False,
        "character_id": "martha",
    },
    {
        "id":           "fact_martha_truth_inhaler_small",
        "content":      "Martha did not realise the object she moved was a medical inhaler at the time",
        "known_since":  "2024-01-14T23:18:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "martha",
    },
    {
        "id":           "fact_martha_suspect_staging",
        "content":      "Martha suspects Julian was staging something dramatic but does not know what",
        "known_since":  "2024-01-15T01:35:00",
        "source":       "observation",
        "confidence":   0.5,
        "is_lie":       False,
        "character_id": "martha",
    },
    {
        "id":           "fact_martha_truth_reel_timestamps",
        "content":      "Martha's reel footage has embedded timestamps showing exactly when each shot was filmed in the lounge",
        "known_since":  "2024-01-14T23:18:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "martha",
    },
]

# ── HAYES (22 facts, 0 lies, includes 2 group assumption facts) ──────────────
HAYES_FACTS = [
    {
        "id":           "fact_hayes_scene_tampered",
        "content":      "The judges lounge scene shows clear signs of tampering before Hayes arrived",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "investigation",
        "confidence":   0.9,
        "is_lie":       False,
        "character_id": "hayes",
    },
    {
        "id":           "fact_hayes_multiple_lying",
        "content":      "Multiple witnesses are giving inconsistent accounts of their whereabouts that night",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "investigation",
        "confidence":   0.9,
        "is_lie":       False,
        "character_id": "hayes",
    },
    {
        "id":           "fact_hayes_not_clean_murder",
        "content":      "The scene does not fit a clean premeditated murder — too many independent variables",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "investigation",
        "confidence":   0.7,
        "is_lie":       False,
        "character_id": "hayes",
    },
    {
        "id":           "fact_hayes_assumption_poison",
        "content":      "The initial working assumption is that Julian was deliberately poisoned",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "investigation",
        "confidence":   0.5,
        "is_lie":       False,
        "character_id": "hayes",
    },
    {
        "id":           "fact_hayes_assumption_threat",
        "content":      "The sticky note THIS DEMO WILL KILL appears to be a threat left by the killer",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "investigation",
        "confidence":   0.5,
        "is_lie":       False,
        "character_id": "hayes",
    },
    {
        "id":           "fact_hayes_camera_confirms_victor",
        "content":      "Camera timestamp confirms Victor entered the judges lounge at 12:05 AM",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "investigation",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "hayes",
    },
    {
        "id":           "fact_hayes_text_proves_swap",
        "content":      "Victor's text message at 12:06 AM proves he knowingly swapped Julian's drink",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "investigation",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "hayes",
    },
    {
        "id":           "fact_hayes_reel_shows_rearranging",
        "content":      "Martha's reel footage shows her rearranging multiple objects in the lounge including the inhaler",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "investigation",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "hayes",
    },
    {
        "id":           "fact_hayes_timestamps_show_distracted",
        "content":      "Timestamps in Martha's reel show she was preoccupied with camera angles and not watching the room",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "investigation",
        "confidence":   0.9,
        "is_lie":       False,
        "character_id": "hayes",
    },
    {
        "id":           "fact_hayes_checklist_shows_swap",
        "content":      "The organizer checklist confirms Rose swapped Julian's VIP kit with a regular participant bag",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "investigation",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "hayes",
    },
    {
        "id":           "fact_hayes_note_not_a_threat",
        "content":      "The sticky note THIS DEMO WILL KILL is consistent with self-written performance notes rather than an external threat",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "investigation",
        "confidence":   0.7,
        "is_lie":       False,
        "character_id": "hayes",
    },
    {
        "id":           "fact_hayes_julian_planned_stunt",
        "content":      "Julian's message at 10:50 PM indicates he had a dramatic reveal planned for that night",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "investigation",
        "confidence":   0.9,
        "is_lie":       False,
        "character_id": "hayes",
    },
    {
        "id":           "fact_hayes_julian_wrote_note_himself",
        "content":      "Julian wrote the sticky note himself as part of his planned dramatic stunt",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "investigation",
        "confidence":   0.8,
        "is_lie":       False,
        "character_id": "hayes",
    },
    {
        "id":           "fact_hayes_energy_drink_found",
        "content":      "A sponsor energy drink can with 400mg caffeine was found near Julian's body",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "investigation",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "hayes",
    },
    {
        "id":           "fact_hayes_inhaler_displaced",
        "content":      "Julian's inhaler was found displaced far from where he normally kept it",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "investigation",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "hayes",
    },
    {
        "id":           "fact_hayes_multiple_grievances",
        "content":      "Multiple people at the hackathon had grievances against Julian based on his behaviour that night",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "investigation",
        "confidence":   0.9,
        "is_lie":       False,
        "character_id": "hayes",
    },
    {
        "id":           "fact_hayes_no_forced_entry",
        "content":      "There are no signs of forced entry or struggle in the judges lounge",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "investigation",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "hayes",
    },
    {
        "id":           "fact_hayes_collapse_time",
        "content":      "Julian collapsed at 2:07 AM according to witness accounts and Hayes' arrival time",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "investigation",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "hayes",
    },
    {
        "id":           "fact_hayes_keycap_found",
        "content":      "A detachable keycap from the novelty trophy was found lodged in Julian's airway",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "investigation",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "hayes",
    },
    {
        "id":           "fact_hayes_independent_actions",
        "content":      "The evidence suggests multiple people acted independently rather than as part of a coordinated plan",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "investigation",
        "confidence":   0.7,
        "is_lie":       False,
        "character_id": "hayes",
    },
    {
        "id":           "fact_hayes_victor_motive",
        "content":      "Victor had a clear motive — Julian publicly humiliated his team earlier that evening",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "investigation",
        "confidence":   0.9,
        "is_lie":       False,
        "character_id": "hayes",
    },
    {
        "id":           "fact_hayes_rose_motive",
        "content":      "Rose had motive — Julian had been making excessive demands and complaints to her all evening",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "investigation",
        "confidence":   0.8,
        "is_lie":       False,
        "character_id": "hayes",
    },
]

# ── DR. COLLINS (15 facts, 0 lies) ───────────────────────────────────────────
COLLINS_FACTS = [
    {
        "id":           "fact_collins_warning",
        "content":      "Dr. Collins noticed Julian seemed overstimulated at 12:20 AM and warned him to slow down",
        "known_since":  "2024-01-15T00:20:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "dr_collins",
    },
    {
        "id":           "fact_collins_overstimulated",
        "content":      "Julian's symptoms at 12:20 AM — elevated heart rate, agitation, sweating — were consistent with caffeine overconsumption",
        "known_since":  "2024-01-15T00:20:00",
        "source":       "medical_assessment",
        "confidence":   0.9,
        "is_lie":       False,
        "character_id": "dr_collins",
    },
    {
        "id":           "fact_collins_airway",
        "content":      "Julian's cause of death involved airway obstruction — not poisoning",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "medical_assessment",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "dr_collins",
    },
    {
        "id":           "fact_collins_not_poison",
        "content":      "The physical evidence does not support deliberate poisoning as the cause of death",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "medical_assessment",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "dr_collins",
    },
    {
        "id":           "fact_collins_real_cause_chain",
        "content":      "Julian's death resulted from a chain: caffeine overconsumption caused coughing, coughing caused inhalation of the loose keycap, the displaced inhaler meant he could not recover",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "medical_assessment",
        "confidence":   0.9,
        "is_lie":       False,
        "character_id": "dr_collins",
    },
    {
        "id":           "fact_collins_caffeine_confirmed",
        "content":      "The energy drink can confirms the caffeine source — 400mg is a dangerously high dose for someone already stressed",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "medical_assessment",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "dr_collins",
    },
    {
        "id":           "fact_collins_inhaler_displaced",
        "content":      "Julian's inhaler being displaced meant he could not find it during the emergency — this was critical to his death",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "medical_assessment",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "dr_collins",
    },
    {
        "id":           "fact_collins_keycap_obstruction",
        "content":      "The keycap from the novelty trophy caused the airway obstruction that Julian could not clear",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "medical_assessment",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "dr_collins",
    },
    {
        "id":           "fact_collins_warning_ignored",
        "content":      "Julian dismissed Dr. Collins' warning at 12:20 AM and continued drinking",
        "known_since":  "2024-01-15T00:20:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "dr_collins",
    },
    {
        "id":           "fact_collins_no_struggle",
        "content":      "There are no signs of physical struggle or external violence on Julian's body",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "medical_assessment",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "dr_collins",
    },
    {
        "id":           "fact_collins_caffeine_stress",
        "content":      "High caffeine intake combined with existing stress and respiratory sensitivity created a dangerous combination",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "medical_assessment",
        "confidence":   0.9,
        "is_lie":       False,
        "character_id": "dr_collins",
    },
    {
        "id":           "fact_collins_theatrical",
        "content":      "Julian's behaviour leading up to the collapse was consistent with someone performing rather than genuinely collapsing",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "medical_assessment",
        "confidence":   0.7,
        "is_lie":       False,
        "character_id": "dr_collins",
    },
    {
        "id":           "fact_collins_unintentional",
        "content":      "The chain of events leading to death appears to be unintentional — no single action was designed to kill",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "medical_assessment",
        "confidence":   0.7,
        "is_lie":       False,
        "character_id": "dr_collins",
    },
    {
        "id":           "fact_collins_caffeine",
        "content":      "Julian's blood caffeine level at time of collapse was consistent with consuming a high-caffeine energy drink",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "medical_assessment",
        "confidence":   0.9,
        "is_lie":       False,
        "character_id": "dr_collins",
    },
    {
        "id":           "fact_collins_arrived_after",
        "content":      "Dr. Collins arrived at the scene after Julian had already collapsed — he did not witness the collapse itself",
        "known_since":  "2024-01-15T02:07:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "dr_collins",
    },
]

# ── ROSE (16 facts, 4 lies) ───────────────────────────────────────────────────
ROSE_FACTS = [
    {
        "id":           "fact_rose_truth_kitswap",
        "content":      "Rose swapped Julian's VIP judge snack kit with a regular participant bag at 10:20 PM",
        "known_since":  "2024-01-14T22:20:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "rose",
    },
    {
        "id":           "fact_rose_lie_logistics",
        "content":      "I only handled standard logistics that night — I did not make any changes to Julian's personal setup",
        "known_since":  "2024-01-14T22:20:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       True,
        "character_id": "rose",
    },
    {
        "id":           "fact_rose_truth_dramatic",
        "content":      "Julian was building toward some kind of dramatic announcement or reveal during the event",
        "known_since":  "2024-01-14T22:05:00",
        "source":       "direct_experience",
        "confidence":   0.8,
        "is_lie":       False,
        "character_id": "rose",
    },
    {
        "id":           "fact_rose_truth_attitude",
        "content":      "Julian had been making excessive demands and complaints to Rose throughout the entire evening",
        "known_since":  "2024-01-14T22:05:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "rose",
    },
    {
        "id":           "fact_rose_lie_no_motive",
        "content":      "I had no issues with Julian — we had a perfectly professional relationship",
        "known_since":  "2024-01-14T22:20:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       True,
        "character_id": "rose",
    },
    {
        "id":           "fact_rose_lie_kit_untouched",
        "content":      "Julian's VIP kit was prepared and left exactly as specified — I never altered it",
        "known_since":  "2024-01-14T22:20:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       True,
        "character_id": "rose",
    },
    {
        "id":           "fact_rose_lie_checklist",
        "content":      "The organizer checklist reflects standard preparations — nothing unusual was recorded",
        "known_since":  "2024-01-14T22:20:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       True,
        "character_id": "rose",
    },
    {
        "id":           "fact_rose_truth_petty",
        "content":      "Rose swapped the kit out of frustration with Julian's behaviour — she did not intend to harm him",
        "known_since":  "2024-01-14T22:20:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "rose",
    },
    {
        "id":           "fact_rose_truth_medication",
        "content":      "The VIP kit contained Julian's preferred snacks and some medication — Rose knew this when she swapped it",
        "known_since":  "2024-01-14T22:20:00",
        "source":       "direct_experience",
        "confidence":   0.8,
        "is_lie":       False,
        "character_id": "rose",
    },
    {
        "id":           "fact_rose_truth_complains",
        "content":      "Julian complained to Rose about his VIP treatment, food quality, and judging setup at 10:05 PM",
        "known_since":  "2024-01-14T22:05:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "rose",
    },
    {
        "id":           "fact_rose_truth_stressed",
        "content":      "Rose was under significant stress managing the event and found Julian's demands unreasonable",
        "known_since":  "2024-01-14T22:05:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "rose",
    },
    {
        "id":           "fact_rose_truth_others_frustrated",
        "content":      "Rose observed other people at the event were also frustrated with Julian's behaviour",
        "known_since":  "2024-01-14T22:05:00",
        "source":       "observation",
        "confidence":   0.8,
        "is_lie":       False,
        "character_id": "rose",
    },
    {
        "id":           "fact_rose_truth_quick_swap",
        "content":      "The kit swap took less than two minutes — Rose did it quickly and quietly",
        "known_since":  "2024-01-14T22:20:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "rose",
    },
    {
        "id":           "fact_rose_truth_no_collapse_plan",
        "content":      "Rose had no knowledge of or involvement in Julian's planned dramatic stunt",
        "known_since":  "2024-01-14T22:20:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "rose",
    },
    {
        "id":           "fact_rose_truth_unaware_chain",
        "content":      "Rose was unaware that her kit swap would contribute to Julian being unable to access his medication in an emergency",
        "known_since":  "2024-01-14T22:20:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "rose",
    },
    {
        "id":           "fact_rose_truth_early_cutoff",
        "content":      "Rose left the judges lounge area before 10:30 PM and was not present for later events",
        "known_since":  "2024-01-14T22:20:00",
        "source":       "direct_experience",
        "confidence":   1.0,
        "is_lie":       False,
        "character_id": "rose",
    },
]

# Combine all facts
ALL_FACTS = VICTOR_FACTS + MARTHA_FACTS + HAYES_FACTS + COLLINS_FACTS + ROSE_FACTS


# ---------------------------------------------------------------------------
# Cypher
# ---------------------------------------------------------------------------
CREATE_CONSTRAINT = """
CREATE CONSTRAINT fact_id_unique IF NOT EXISTS
  FOR (f:Fact) REQUIRE f.id IS UNIQUE
"""

MERGE_FACT = """
MERGE (f:Fact { id: $id })
SET
  f.content      = $content,
  f.known_since  = $known_since,
  f.source       = $source,
  f.confidence   = $confidence,
  f.is_lie       = $is_lie,
  f.character_id = $character_id,
  f.embedding    = null
RETURN f.id AS id, f.character_id AS character_id, f.is_lie AS is_lie
"""

VERIFY_QUERY = """
MATCH (f:Fact)
RETURN f.character_id AS character_id, count(f) AS fact_count,
       sum(CASE WHEN f.is_lie THEN 1 ELSE 0 END) AS lie_count
ORDER BY f.character_id ASC
"""

CHECK_PREREQUISITES = """
MATCH (c:Character)  WITH count(c)  AS char_count
MATCH (l:Location)   WITH char_count, count(l)  AS loc_count
MATCH (o:Object)     WITH char_count, loc_count, count(o)  AS obj_count
MATCH (ev:Event)     WITH char_count, loc_count, obj_count, count(ev) AS event_count
MATCH (e:Evidence)   WITH char_count, loc_count, obj_count, event_count, count(e) AS evid_count
RETURN char_count, loc_count, obj_count, event_count, evid_count
"""


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def create_facts(driver):
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
            (row["evid_count"],  10, "Evidence",  "create_evidence_nodes.py"),
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
        print("✓ Constraint: fact_id_unique ensured")

        # Step 2 — create nodes grouped by character
        print(f"\nCreating Fact nodes ({len(ALL_FACTS)} total)...")
        counts = {}
        for fact in ALL_FACTS:
            result = session.run(MERGE_FACT, **fact)
            record = result.single()
            char = record["character_id"]
            counts[char] = counts.get(char, 0) + 1
            lie_tag = " [LIE]" if record["is_lie"] else ""
            print(f"  ✓ {char:<12} {record['id']}{lie_tag}")

        print(f"\n  Facts created per character:")
        for char, count in sorted(counts.items()):
            print(f"    {char:<14} {count} facts")

        # Step 3 — verify
        print("\nVerification — Fact node counts by character:")
        print(f"  {'character':<14} {'total':<8} {'lies'}")
        print(f"  {'-'*14} {'-'*8} {'-'*6}")
        results = session.run(VERIFY_QUERY)
        total_facts = 0
        total_lies = 0
        for row in results:
            print(f"  {row['character_id']:<14} {row['fact_count']:<8} {row['lie_count']}")
            total_facts += row["fact_count"]
            total_lies  += row["lie_count"]

        print(f"\n  Total: {total_facts} fact node(s), {total_lies} lie fact(s)")
        if total_facts >= 85:
            print("  ✓ Fact nodes present — ready for Relationship creation")
        else:
            print(f"  ✗ Expected ~90 facts, found {total_facts} — check for errors above")


def main():
    print("Cold Case — Fact Node Creation")
    print("=" * 40)
    print(f"Environment : {settings.app_env}")
    print(f"Neo4j URI   : {settings.neo4j_uri}")
    print(f"Neo4j User  : {settings.neo4j_user}")

    driver = GraphDatabase.driver(settings.neo4j_uri, auth=settings.neo4j_auth)

    try:
        driver.verify_connectivity()
        print("✓ Connected to Neo4j\n")
        create_facts(driver)
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)
    finally:
        driver.close()

    print("\nDone.")


if __name__ == "__main__":
    main()