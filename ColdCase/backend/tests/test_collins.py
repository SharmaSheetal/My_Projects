import logging
from backend.agents.agent_registry import agents

def run_collins_test():
    logging.basicConfig(level=logging.ERROR)
    print("=== Testing Dr. Collins ===\n")
    collins = agents["dr_collins"]
    
    questions = [
        "What was Julian's condition when you found him?",
        "Did someone poison him with caffeine?",
        "What physical evidence do you need to finalize your theory?"
    ]
    
    for q in questions:
        print(f"Player: {q}")
        response = collins.respond(q, session_id="test_collins")
        print(f"Dr. Collins: {response}\n")

if __name__ == "__main__":
    run_collins_test()
