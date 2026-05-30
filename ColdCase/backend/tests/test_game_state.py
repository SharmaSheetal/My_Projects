import logging
import json
from backend.agents.orchestrator import get_game_state, get_or_create_session

def test_game_state():
    logging.basicConfig(level=logging.ERROR)
    print("=== Testing Game State Endpoint ===\n")
    
    session_id = "test_state_123"
    
    # 1. Fetch initial state
    print("--- Initial State ---")
    state = get_game_state(session_id)
    print(json.dumps(state, indent=2))
    
    # 2. Mutate state manually to simulate gameplay
    print("\n--- Mutated State ---")
    session_state = get_or_create_session(session_id)
    session_state["current_phase"] = 2
    session_state["questioned_characters"].add("victor")
    session_state["questioned_characters"].add("hayes")
    session_state["found_contradictions"].append({"id": "C1"})
    session_state["unlocked_evidence"].add("evidence_sticky_note")
    session_state["progress_score"] = 50
    session_state["pivot_moments_triggered"].append("pivot_victor_alibi")
    
    # 3. Fetch again
    state = get_game_state(session_id)
    print(json.dumps(state, indent=2))

if __name__ == "__main__":
    test_game_state()
