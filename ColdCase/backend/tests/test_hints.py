from backend.agents.orchestration.hints import wrong_direction_detector

def test_direction_detector():
    print("=== Testing Wrong Direction Detector ===")
    
    # Base dummy state
    game_state = {
        "current_phase": 1,
        "found_contradictions": [],
        "questioned_characters": {"victor"}
    }
    
    # 1. Test Tunnel Vision (Ask same person 5 times)
    history_tunnel = [{"target_id": "victor"}] * 5
    score1 = wrong_direction_detector(game_state, history_tunnel)
    print(f"Tunnel Vision Score (Expected >=1): {score1}")
    
    # 2. Test Insufficient Exploration (Ask 9 questions but only 1 person)
    history_unexplored = [{"target_id": "victor"}] * 9
    score2 = wrong_direction_detector(game_state, history_unexplored)
    print(f"Unexplored Score (Expected >=2): {score2}")
    
    # 3. Test Early Accusation
    history_early = [{"action": "ACCUSATION"}]
    score3 = wrong_direction_detector(game_state, history_early)
    print(f"Early Accusation Score (Expected >=1): {score3}")
    
    # 4. Test Phase 1 Stagnation
    history_stagnant = [{"target_id": "victor"}, {"target_id": "martha"}] * 8 # 16 questions
    game_state_stagnant = {
        "current_phase": 1,
        "found_contradictions": [],
        "questioned_characters": {"victor", "martha"}
    }
    score4 = wrong_direction_detector(game_state_stagnant, history_stagnant)
    print(f"Phase 1 Stagnation Score (Expected >=2): {score4}")
    
    # 5. Success State (No struggling)
    game_state_success = {
        "current_phase": 2,
        "found_contradictions": ["C1"],
        "questioned_characters": {"victor", "martha"}
    }
    history_success = [{"target_id": "victor"}, {"target_id": "martha"}]
    score5 = wrong_direction_detector(game_state_success, history_success)
    print(f"Successful Progress Score (Expected 0): {score5}")

if __name__ == "__main__":
    test_direction_detector()
