import time
from backend.agents.progress import should_show_meter, get_flavor_text

def test_meter():
    print("=== Testing Progress Meter Logic ===")
    
    # Mock a mid-game state where the meter hasn't been shown yet
    mock_state = {
        "found_contradictions": ["C1", "C2"],
        "questioned_characters": {"victor", "martha", "hayes"},
        "unlocked_evidence": {"e1", "e2", "e3"},
        "current_phase": 2,
        "pivot_moments_triggered": [],
        "last_meter_score": -1,
        "last_meter_shown_timestamp": 0.0,
        "suppress_progress_meter": False,
        "shown_flavor_texts": [],
        "available_endings": [],
        "hints_used": 0
    }
    
    from backend.agents.orchestration.state import get_game_state, sessions
    sessions["meter_test_session"] = mock_state
    
    # Run the state compiler 5 times quickly. 
    # Because of the 30-second cooldown, it should only show True on the FIRST request.
    for i in range(5):
        state_payload = get_game_state("meter_test_session")
        print(f"Request {i+1}:")
        print(f"  Score: {state_payload['progress_score']}%")
        print(f"  Show Meter: {state_payload['show_meter']}")
        if state_payload["show_meter"]:
            print(f"  Flavor Text: {state_payload['meter_flavor_text']}")
            
        print("-------------")
        time.sleep(1) # Wait a second between requests
        
if __name__ == "__main__":
    test_meter()
