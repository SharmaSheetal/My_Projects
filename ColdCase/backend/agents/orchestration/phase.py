import logging
from backend.agents.orchestration.state import get_or_create_session

log = logging.getLogger(__name__)

def advance_phase(session_id: str) -> bool:
    """
    Checks phase advancement conditions sequentially. 
    Returns True if a phase advancement occurred.
    """
    state_ref = get_or_create_session(session_id)
    phase = state_ref["current_phase"]
    chars = state_ref["questioned_characters"]
    contradictions = state_ref["found_contradictions"]
    
    advanced = False
    
    if phase == 1:
        if "hayes" in chars and ("victor" in chars or "martha" in chars):
            state_ref["current_phase"] = 2
            log.info(f"[Session {session_id}] Advanced to Phase 2!")
            advanced = True
            
    elif phase == 2:
        if len(contradictions) >= 2:
            state_ref["current_phase"] = 3
            log.info(f"[Session {session_id}] Advanced to Phase 3!")
            advanced = True
            
    elif phase == 3:
        if "rose" in chars and "dr_collins" in chars:
            state_ref["current_phase"] = 4
            log.info(f"[Session {session_id}] Advanced to Phase 4!")
            advanced = True
            
    # Phase 4 to Phase 5 is triggered manually via API endpoint on frontend
    
    return advanced
