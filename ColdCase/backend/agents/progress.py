from typing import Dict, Any
import logging

log = logging.getLogger(__name__)

def calculate_progress_score(game_state: Dict[str, Any]) -> int:
    """
    Step 19: Calculates the player's overall investigation progress (0-100)
    using a weighted formula based on their current session state.
    """
    try:
        # Extract metrics safely from state
        found_contradictions = game_state.get("found_contradictions", [])
        questioned_characters = game_state.get("questioned_characters", set())
        submitted_evidence = game_state.get("unlocked_evidence", set()) # Unlocked acts as submitted pool for now
        phase = game_state.get("current_phase", 1)
        triggered_pivots = game_state.get("pivot_moments_triggered", [])

        # Weights based on Section 10 rules
        contradictions_score = len(found_contradictions) * 8        # max 56 (7 items * 8)
        characters_score = len(questioned_characters) * 4           # max 20 (5 chars * 4)
        evidence_score = len(submitted_evidence) * 2                # max 20 (10 items * 2)
        
        phase_bonuses = {1: 0, 2: 5, 3: 10, 4: 15, 5: 20}
        phase_bonus = phase_bonuses.get(phase, 0)                   # max 20
        
        pivot_bonus = len(triggered_pivots) * 10                    # max 40 (assuming ~4 pivots)

        # Total Calculation
        raw_score = contradictions_score + characters_score + evidence_score + phase_bonus + pivot_bonus
        
        # Max theoretical score is 156 (56+20+20+20+40), but we normalize heavily against 121
        normalized = min(100, int((raw_score / 121) * 100))
        
        log.debug(f"Progress Score Calculated: {normalized}% (Raw: {raw_score})")
        return normalized
        
    except Exception as e:
        log.error(f"Error calculating progress score: {e}")
        return 0

def should_show_meter(session_state: Dict[str, Any]) -> bool:
    """
    Step 20: Determines if the frontend should display the progress meter overlay.
    Rules:
      1. Random roll > 0.65
      2. At least 30 seconds since last appearance
      3. Score has changed since last appearance
      4. Not suppressed by active/passive hints
      Or overrides:
      - 1st contradiction found
      - Phase 3 begins
      - Final accusation phase
    """
    import random
    import time
    
    current_time = time.time()
    current_score = calculate_progress_score(session_state)
    
    # Overrides (always show)
    if len(session_state.get("found_contradictions", [])) == 1 and session_state.get("last_meter_score", -1) == -1:
        return True
    if session_state.get("current_phase", 1) == 3 and session_state.get("last_meter_score", -1) < 50:
        return True # Approximation for "phase 3 begins for first time"
    if session_state.get("current_phase", 1) == 5:
        return True
        
    # Standard conditions
    roll = random.random()
    time_passed = (current_time - session_state.get("last_meter_shown_timestamp", 0.0)) > 30.0
    score_changed = current_score != session_state.get("last_meter_score", -1)
    
    # Check suppression flag and reset it after checking
    not_suppressed = not session_state.get("suppress_progress_meter", False)
    if not not_suppressed:
        session_state["suppress_progress_meter"] = False
    
    return (roll > 0.65) and time_passed and score_changed and not_suppressed

def get_progress_label(score: int) -> str:
    """Step 21A: Maps progress score integer to narrative buckets."""
    if score <= 25:
        return "Cold Trail"
    elif score <= 50:
        return "Something's Off"
    elif score <= 75:
        return "You're Onto Something"
    elif score <= 90:
        return "Getting Dangerous"
    else:
        return "You Know the Truth"

def get_flavor_text(score: int, session_state: Dict[str, Any]) -> str:
    """
    Step 21B: Fetches random flavor text for the current score bucket,
    guaranteed to prevent duplicates in the same session.
    """
    import json
    import os
    import random
    
    label = get_progress_label(score)
    data_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../data/progress_flavor_text.json")
    
    try:
        with open(data_path, "r") as f:
            flavor_data = json.load(f)
    except FileNotFoundError:
        log.error(f"progress_flavor_text.json missing at {data_path}")
        return "The investigation continues."

    root = flavor_data.get("flavor_text", {})
    bucket_texts = []
    
    for key, data in root.items():
        if data.get("label") == label:
            bucket_texts = data.get("strings", [])
            break
            
    if not bucket_texts:
        return "The investigation continues."
        
    previously_shown = session_state.get("shown_flavor_texts", [])
    
    # Filter out texts we've already shown
    available_texts = [text for text in bucket_texts if text not in previously_shown]
    
    # If we somehow exhausted the entire bucket, reset just this bucket's tracking for the session
    if not available_texts:
        available_texts = bucket_texts
        log.warning(f"Exhausted flavor text bucket for {label}, recycling.")
        
    chosen_text = random.choice(available_texts)
    
    # Update tracking
    session_state.setdefault("shown_flavor_texts", []).append(chosen_text)
    
    return chosen_text
