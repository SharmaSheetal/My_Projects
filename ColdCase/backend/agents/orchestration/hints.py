import os
import json
import logging
from typing import Dict, Any

from backend.agents.orchestration.state import get_or_create_session

log = logging.getLogger(__name__)

import time

def get_active_hint(session_id: str) -> Dict[str, Any]:
    """
    Step 24: Handles player active hint requests with a 90-second cooldown timer.
    Randomly selects from the phase's available hint strings, avoiding repetition.
    """
    session_state = get_or_create_session(session_id)
    current_time = time.time()
    last_time = session_state.get("last_hint_timestamp", 0.0)
    
    # Check 90 second cooldown
    elapsed = current_time - last_time
    if elapsed < 90:
        return {
            "status": "cooldown",
            "hint": None,
            "cooldown_remaining": int(90 - elapsed),
            "hints_used": session_state.get("hints_used", 0)
        }
        
    current_phase = session_state.get("current_phase", 1)
    
    # Load hints files
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "data", "hints")
    active_path = os.path.join(data_dir, "active_hints.json")
    
    hint_text = "Keep talking to the suspects. You'll find a contradiction soon." # Default fallback
    
    try:
        import random
        with open(active_path, "r") as f:
            data = json.load(f)
            
            # Fetch the array for the current phase (e.g., "phase_1")
            phase_key = f"phase_{current_phase}"
            candidates = data.get(phase_key, [])
            
            if candidates:
                # Filter out previously shown active hints
                shown_hints = session_state.get("shown_active_hints", [])
                available = [h for h in candidates if h not in shown_hints]
                
                # If exhausted, recycle bucket
                if not available:
                    available = candidates
                    
                hint_text = random.choice(available)
                session_state.setdefault("shown_active_hints", []).append(hint_text)
            else:
                log.info(f"No explicit active hints found for {phase_key}.")
                
    except Exception as e:
        log.error(f"Failed to load active_hints.json: {e}")
        
    # Update state post-payout
    session_state["hints_used"] += 1
    session_state["last_hint_timestamp"] = current_time
        
    return {
        "status": "success",
        "hint": hint_text,
        "cooldown_remaining": 0,
        "hints_used": session_state["hints_used"]
    }

def wrong_direction_detector(game_state: Dict[str, Any], session_history: list[Dict[str, str]]) -> int:
    """
    Step 22: Analyzes player behavior to see if they are stuck.
    Returns a wrong_direction_score. If >= 2, a passive hint should immediately trigger.
    """
    score = 0
    phase = game_state.get("current_phase", 1)
    found_contradictions = len(game_state.get("found_contradictions", []))
    
    # Condition 1: Add 1 if the player's last 5 questions were all directed at the same character
    # without finding a contradiction.
    if len(session_history) >= 5 and found_contradictions == 0:
        last_five_targets = [interaction.get("target_id") for interaction in session_history[-5:]]
        if all(target == last_five_targets[0] for target in last_five_targets) and last_five_targets[0] is not None:
            score += 1
            log.debug("Wrong Direction +1: Tunnel vision on a single character.")
            
    # Condition 2: Add 1 if the player has asked more than 8 total questions
    # but has only questioned 1 or 2 different characters.
    if len(session_history) > 8:
        unique_targets = len(game_state.get("questioned_characters", set()))
        if unique_targets <= 2:
            score += 1
            log.debug("Wrong Direction +1: Insufficient exploration of cast.")

    # Condition 3: Add 1 if the player attempted to submit an accusation while in Phase 1 or Phase 2.
    # Note: the UI usually gates this, but if the orchestrator logged an early accusation string...
    early_accusations = [inter for inter in session_history if inter.get("action") == "ACCUSATION"]
    if early_accusations and phase in [1, 2]:
        score += 1
        log.debug("Wrong Direction +1: Unwarranted early accusation attempt.")
        
    # Condition 4: Add 1 if the player has been in Phase 1 for more than 15 questions total
    # without finding any contradiction.
    if phase == 1 and len(session_history) > 15 and found_contradictions == 0:
        score += 1
        log.debug("Wrong Direction +1: Stagnating endlessly in Phase 1.")
        
    return score

def get_passive_hint(character_id: str, trigger_type: str, session_state: Dict[str, Any]) -> str:
    """
    Step 23: Retrieves a character-specific passive hint string for a given trigger condition.
    Prevents duplicate hints in the same session and suppresses the progress meter.
    """
    import os
    import json
    import random
    
    # Supress the progress meter for this action
    session_state["suppress_progress_meter"] = True
    
    # Load hints list
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "data", "hints")
    passive_path = os.path.join(data_dir, "passive_hints.json")
    
    try:
        with open(passive_path, "r") as f:
            data = json.load(f)
    except Exception as e:
        log.error(f"Failed to load passive hints: {e}")
        return ""
        
    char_hints = data.get(character_id.lower(), {})
    trigger_strings = char_hints.get(trigger_type, [])
    
    if not trigger_strings:
        log.warning(f"No passive hint strings found for {character_id} / {trigger_type}")
        return ""
        
    # Prevent duplicate hint strings
    shown_hints = session_state.get("shown_passive_hints", [])
    available_strings = [h for h in trigger_strings if h not in shown_hints]
    
    if not available_strings:
        # If exhausted, recycle the entire bucket
        available_strings = trigger_strings
        
    selected_hint = random.choice(available_strings)
    
    # Store history
    session_state.setdefault("shown_passive_hints", []).append(selected_hint)
    
    return selected_hint
