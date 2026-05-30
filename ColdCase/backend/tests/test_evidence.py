import logging
from backend.agents.orchestrator import unlock_evidence, get_or_create_session

def test_evidence():
    logging.basicConfig(level=logging.ERROR)
    print("=== Testing Evidence Extraction ===\n")
    
    session_id = "test_evidence_123"
    session_state = get_or_create_session(session_id)
    
    # Phase 1
    session_state["current_phase"] = 1
    unlocked = unlock_evidence(session_id)
    print(f"Phase 1 Unlocked ({len(unlocked)} items):")
    for item in unlocked:
        print(f" - {item['name']}")
        
    print("\n")
    
    # Phase 2
    session_state["current_phase"] = 2
    unlocked = unlock_evidence(session_id)
    print(f"Phase 2 Unlocked ({len(unlocked)} items):")
    for item in unlocked:
        print(f" - {item['name']}")

if __name__ == "__main__":
    test_evidence()
