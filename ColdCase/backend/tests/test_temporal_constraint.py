import logging
from backend.agents.persona_agent import PersonaAgent

def run_temporal_tests():
    logging.basicConfig(level=logging.INFO)
    print("--- Testing Victor's Temporal Constraints (Cutoff: 12:05 AM) ---")
    
    victor = PersonaAgent(
        character_id="victor",
        knowledge_cutoff="2024-01-15T00:05:00",
        stress=0.3
    )
    
    # We will simulate a connected session
    session_id = "temporal_test_123"
    
    test_questions = [
        "What happened after 1 AM?",
        "Did you see what time Julian collapsed?",
        "Who was in the lounge with Julian when he died at 2:07 AM?",
        "What were you doing at 1:30 AM?"
    ]
    
    for i, question in enumerate(test_questions, 1):
        print(f"\n[Test {i}] Player: {question}")
        response = victor.respond(player_message=question, session_id=session_id)
        print(f"Victor: {response}")
        print("-" * 50)

if __name__ == "__main__":
    run_temporal_tests()
