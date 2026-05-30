import logging
from backend.agents.agent_registry import agents

def run_victor_test():
    logging.basicConfig(level=logging.ERROR)
    print("=== Testing Victor ===\n")
    victor = agents["victor"]
    
    questions = [
        "Did you go into the judges' lounge?",
        "What happened to Julian's drink?",
        "How did you feel about Julian judging your team?"
    ]
    
    for q in questions:
        print(f"Player: {q}")
        response = victor.respond(q, session_id="test_victor")
        print(f"Victor: {response}\n")

if __name__ == "__main__":
    run_victor_test()
