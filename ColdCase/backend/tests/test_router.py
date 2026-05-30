import logging
from backend.agents.orchestrator import route_to_persona, get_or_create_session

def test_routing():
    logging.basicConfig(level=logging.ERROR)
    print("=== Testing Orchestrator Routing ===\n")
    
    session_id = "test_orch_123"
    
    # Send a message to Victor
    print("Player -> Victor: Why did you swap the drink?")
    response = route_to_persona(
        character_id="victor", 
        player_message="Why did you swap the drink?", 
        session_id=session_id
    )
    print(f"Orchestrator returned Payload: {response}\n")

    # Send a message to Rose
    print("Player -> Rose: What was in the VIP kit?")
    response = route_to_persona(
        character_id="rose", 
        player_message="What was in the VIP kit?", 
        session_id=session_id
    )
    print(f"Orchestrator returned Payload: {response}\n")

    # Send a fake character check
    print("Player -> Fake Character: Hello?")
    response = route_to_persona(
        character_id="gandalf", 
        player_message="Hello?", 
        session_id=session_id
    )
    print(f"Orchestrator returned Payload: {response}\n")

if __name__ == "__main__":
    test_routing()
