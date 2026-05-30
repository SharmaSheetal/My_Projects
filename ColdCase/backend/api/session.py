from uuid import uuid4
from typing import Optional


sessions = {}


def build_new_session_state(session_id: str) -> dict:
    return {
        "session_id": session_id,
        "phase": 1,
        "questioned_characters": [],
        "found_contradictions": [],
        "unlocked_evidence": ["evidence_sticky_note", "evidence_camera_timestamp", "evidence_scoring_sheet"],
        "hints_used": 0,
        "last_hint_timestamp": None,
        "last_meter_shown_timestamp": None,
        "last_meter_score": 0,
        "suppress_progress_meter": False,
        "shown_flavor_texts": [],
        "shown_passive_hints": [],
        "triggered_pivots": [],
        "submitted_evidence": [],
        "session_history": [],
    }


def get_or_create_session(session_id: Optional[str] = None) -> dict:
    if not session_id:
        session_id = str(uuid4())

    if session_id not in sessions:
        sessions[session_id] = build_new_session_state(session_id)

    return sessions[session_id]