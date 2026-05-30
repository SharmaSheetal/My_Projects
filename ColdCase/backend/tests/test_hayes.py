import logging
from backend.agents.agent_registry import agents

def run_hayes_test():
    logging.basicConfig(level=logging.ERROR)
    print("=== Testing Hayes ===\n")
    hayes = agents["hayes"]
    
    questions = [
        "What is the official cause of death?",
        "What do you think that sticky note means?",
        "Is anyone lying to you?"
    ]
    
    for q in questions:
        print(f"Player: {q}")
        response = hayes.respond(q, session_id="test_hayes")
        print(f"Hayes: {response}\n")

if __name__ == "__main__":
    run_hayes_test()
