import time
from backend.agents.orchestration.router import route_to_persona
from backend.agents.orchestration.state import sessions

def test_passive_hint_injection():
    print("=== Testing Passive Hint Dialogue Injection ===")
    
    # 1. Setup a mocked Phase 1 session that is struggling (Condition 4)
    session_id = "test_passive_injection"
    sessions[session_id] = {
        "current_phase": 1,
        "found_contradictions": [],
        "questioned_characters": {"victor", "martha"},
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
        "shown_passive_hints": []
    }
    
    # Pre-fill history to immediately trigger the Stagnation penalty (15+ questions in Phase 1)
    sessions[session_id]["session_history"] = [{"target_id": "victor", "action": "INTERVIEW"}] * 16
    
    # 2. Fire a generic request at Victor.
    # We expect his normal response, PLUS the string appended at the bottom.
    print("\nSending 16th generic question to Victor...")
    result = route_to_persona("victor", "Did you see anything weird?", session_id)
    
    print("\n[ROUTER PAYLOAD RESULT]")
    print(f"Character: {result['character_id']}")
    print(f"Response:\n---\n{result['response']}\n---")
    
    # Verify the suppression flag is set inside the state
    assert sessions[session_id]["suppress_progress_meter"] is True, "Suppression flag was not set by the hint system."
    print("\nSUCCESS: Suppression flag was set. Passive hint successfully injected.")

if __name__ == "__main__":
    test_passive_hint_injection()
