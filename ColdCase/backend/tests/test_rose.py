import logging
from backend.agents.agent_registry import agents

def run_rose_test():
    logging.basicConfig(level=logging.ERROR)
    print("=== Testing Rose ===\n")
    rose = agents["rose"]
    
    questions = [
        "Why did you change Julian's VIP setup?",
        "Did Julian know you downgraded his snacks?",
        "What did Julian tell you about his plans for the night?"
    ]
    
    for q in questions:
        print(f"Player: {q}")
        response = rose.respond(q, session_id="test_rose")
        print(f"Rose: {response}\n")

if __name__ == "__main__":
    run_rose_test()
