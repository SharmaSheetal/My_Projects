import logging
from backend.agents.agent_registry import agents

def run_martha_test():
    logging.basicConfig(level=logging.ERROR)
    print("=== Testing Martha ===\n")
    martha = agents["martha"]
    
    questions = [
        "What were you doing in the lounge?",
        "Did you capture anything interesting on your reel?",
        "Did you see anyone else near the desk?"
    ]
    
    for q in questions:
        print(f"Player: {q}")
        response = martha.respond(q, session_id="test_martha")
        print(f"Martha: {response}\n")

if __name__ == "__main__":
    run_martha_test()
