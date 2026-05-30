import logging
import json
from backend.agents.orchestrator import get_or_create_session, advance_phase

def test_phase_advancement():
    logging.basicConfig(level=logging.INFO)
    print("=== Testing Phase Advancement ===\n")
    
    session_id = "test_phase_123"
    state = get_or_create_session(session_id)
    
    print(f"Initial Phase: {state['current_phase']}")
    
    # 1. Test Phase 1 -> 2 (Requires Hayes + Victor/Martha)
    print("\n--- Trying to advance to Phase 2 ---")
    state["questioned_characters"].add("victor")
    advanced = advance_phase(session_id)
    print(f"Talked to Victor only. Advanced? {advanced} (Phase: {state['current_phase']})")
    
    state["questioned_characters"].add("hayes")
    advanced = advance_phase(session_id)
    print(f"Talked to Hayes too. Advanced? {advanced} (Phase: {state['current_phase']})")
    
    # 2. Test Phase 2 -> 3 (Requires 2 Contradictions)
    print("\n--- Trying to advance to Phase 3 ---")
    state["found_contradictions"].append({"id": "C1"})
    advanced = advance_phase(session_id)
    print(f"Found 1 contradiction. Advanced? {advanced} (Phase: {state['current_phase']})")
    
    state["found_contradictions"].append({"id": "C2"})
    advanced = advance_phase(session_id)
    print(f"Found 2 contradictions. Advanced? {advanced} (Phase: {state['current_phase']})")
    
    # 3. Test Phase 3 -> 4 (Requires Rose and Dr. Collins)
    print("\n--- Trying to advance to Phase 4 ---")
    state["questioned_characters"].add("rose")
    advanced = advance_phase(session_id)
    print(f"Talked to Rose. Advanced? {advanced} (Phase: {state['current_phase']})")
    
    state["questioned_characters"].add("dr_collins")
    advanced = advance_phase(session_id)
    print(f"Talked to Dr. Collins. Advanced? {advanced} (Phase: {state['current_phase']})")

if __name__ == "__main__":
    test_phase_advancement()
