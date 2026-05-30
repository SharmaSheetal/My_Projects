import time
from backend.agents.orchestration.hints import get_active_hint
from backend.agents.orchestration.state import sessions

def test_active_hint_logic():
    print("=== Testing Active Hint Cooldown Logic ===")
    
    session_id = "test_active_hints"
    sessions[session_id] = {
        "current_phase": 1,
        "found_contradictions": [],
        "questioned_characters": {"victor"},
        "unlocked_evidence": set(),
        "available_endings": [],
        "hints_used": 0,
        "progress_score": 0,
        "pivot_moments_triggered": [],
        "last_hint_timestamp": 0.0,
        "shown_active_hints": []
    }
    
    # 1. First hint request
    print("\n--- Request 1: Should succeed ---")
    res1 = get_active_hint(session_id)
    print(f"Status: {res1['status']}")
    print(f"Hint: {res1['hint']}")
    print(f"Cooldown Remaining: {res1['cooldown_remaining']}")
    
    assert res1["status"] == "success"
    
    # 2. Second hint request immediately after
    print("\n--- Request 2: Should hit cooldown ---")
    res2 = get_active_hint(session_id)
    print(f"Status: {res2['status']}")
    print(f"Hint: {res2['hint']}")
    print(f"Cooldown Remaining: {res2['cooldown_remaining']}")
    
    assert res2["status"] == "cooldown"
    assert res2["cooldown_remaining"] > 88
    
    # 3. Simulate passing of time
    print("\n--- Fast Forward 91 Seconds ---")
    sessions[session_id]["last_hint_timestamp"] = time.time() - 91
    
    # 4. Third hint request
    print("\n--- Request 3: Should succeed ---")
    res3 = get_active_hint(session_id)
    print(f"Status: {res3['status']}")
    print(f"Hint: {res3['hint']}")
    print(f"Cooldown Remaining: {res3['cooldown_remaining']}")
    
    assert res3["status"] == "success"

if __name__ == "__main__":
    test_active_hint_logic()
