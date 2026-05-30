import logging
from backend.agents.persona_agent import PersonaAgent

def run_character_tests():
    logging.basicConfig(level=logging.ERROR) # Only show character output for clarity
    print("--- Testing New Character Prompts ---")
    
    # Test Martha
    martha = PersonaAgent(character_id="martha", knowledge_cutoff="2024-01-14T23:18:00")
    print("\n[Martha] Player: Did you move anything on Julian's desk?")
    print(f"Martha: {martha.respond('Did you move anything on Julian\'s desk?', 'test_1')}")
    
    # Test Hayes
    hayes = PersonaAgent(character_id="hayes", knowledge_cutoff="2024-01-15T02:07:00")
    print("\n[Hayes] Player: So what happened here Detective?")
    print(f"Hayes: {hayes.respond('So what happened here Detective?', 'test_2')}")
    
    # Test Dr. Collins
    collins = PersonaAgent(character_id="dr_collins", knowledge_cutoff="2024-01-15T02:07:00")
    print("\n[Dr. Collins] Player: Was he poisoned?")
    print(f"Dr. Collins: {collins.respond('Was he poisoned?', 'test_3')}")
    
    # Test Rose
    rose = PersonaAgent(character_id="rose", knowledge_cutoff="2024-01-14T22:20:00")
    print("\n[Rose] Player: Why did you mess with his VIP kit?")
    print(f"Rose: {rose.respond('Why did you mess with his VIP kit?', 'test_4')}")

if __name__ == "__main__":
    run_character_tests()
