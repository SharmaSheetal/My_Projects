import os
import json
import logging
from typing import Dict, Any, List

from backend.agents.orchestration.state import get_or_create_session

log = logging.getLogger(__name__)

def unlock_evidence(session_id: str) -> List[Dict[str, Any]]:
    """
    Resolves which evidence items the player currently has access to.
    Called every time the system checks state or the phase advances.
    """
    session_state = get_or_create_session(session_id)
    current_phase = session_state.get("current_phase", 1)
    
    # Load the static evidence definition file
    evidence_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 
        "data", "evidence", "evidence.json"
    )
    
    unlocked = []
    try:
        with open(evidence_path, "r") as f:
            data = json.load(f)
            for item in data.get("evidence", []):
                if item["unlocks_at_phase"] <= current_phase:
                    unlocked.append({
                        "id": item["id"],
                        "name": item["name"],
                        "description": item["description"]
                    })
                    # Track it in the session
                    session_state["unlocked_evidence"].add(item["id"])
    except Exception as e:
        log.error(f"Failed to load evidence.json: {e}")
        
    return unlocked

def submit_evidence(session_id: str, evidence_id: str) -> Dict[str, Any]:
    """
    Handles the player submitting a piece of evidence during Phase 5.
    Verifies that the evidence is currently unlocked in the session state.
    """
    session_state = get_or_create_session(session_id)
    unlocked = session_state.get("unlocked_evidence", set())
    
    if evidence_id not in unlocked:
        return {
            "status": "error",
            "message": f"Evidence '{evidence_id}' is not available or locked."
        }
        
    # Later this will be hooked into the Accusation Engine
    log.info(f"[Session {session_id}] Player presented evidence: {evidence_id}")
    
    return {
        "status": "success",
        "message": f"Evidence '{evidence_id}' was presented successfully.",
        "presented_evidence_id": evidence_id
    }
