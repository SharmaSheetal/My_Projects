import logging
from typing import Dict, Any

log = logging.getLogger(__name__)

# Basic memory structure for session state management
sessions: Dict[str, Dict[str, Any]] = {}

def get_or_create_session(session_id: str) -> Dict[str, Any]:
    if session_id not in sessions:
        sessions[session_id] = {
            "current_phase": 1,
            "questioned_characters": set(),
            "found_contradictions": [],
            "unlocked_evidence": set(),
            "available_endings": [],
            "hints_used": 0,
            "progress_score": 0,
            "pivot_moments_triggered": [],
            "last_meter_shown_timestamp": 0.0,
            "last_meter_score": -1,
            "suppress_progress_meter": False,
            "shown_flavor_texts": [],
            "session_history": [],
            "last_hint_timestamp": 0.0
        }
    return sessions[session_id]

from backend.agents.progress import calculate_progress_score, should_show_meter, get_flavor_text
import time

def get_game_state(session_id: str) -> Dict[str, Any]:
    """
    Single source of truth for the frontend's game state.
    """
    state_ref = get_or_create_session(session_id)
    
    # Compute dynamic progress score
    state_ref["progress_score"] = calculate_progress_score(state_ref)
    
    # Determine if meter should pop up on the UI
    show_meter = should_show_meter(state_ref)
    flavor_text = None
    
    if show_meter:
        flavor_text = get_flavor_text(state_ref["progress_score"], state_ref)
        state_ref["last_meter_score"] = state_ref["progress_score"]
        state_ref["last_meter_shown_timestamp"] = time.time()
    
    # Add execution of evidence check to ensure whatever Phase we are in is populated
    from backend.agents.orchestration.evidence import unlock_evidence
    unlock_evidence(session_id)
    
    # Serialize the Sets to Lists for JSON transmission to the frontend
    return {
        "phase": state_ref["current_phase"],
        "questioned_characters": list(state_ref["questioned_characters"]),
        "found_contradictions": state_ref["found_contradictions"],
        "unlocked_evidence": list(state_ref["unlocked_evidence"]),
        "available_endings": state_ref["available_endings"],
        "hints_used": state_ref["hints_used"],
        "progress_score": state_ref["progress_score"],
        "pivot_moments_triggered": state_ref["pivot_moments_triggered"],
        "show_meter": show_meter,
        "meter_flavor_text": flavor_text
    }
