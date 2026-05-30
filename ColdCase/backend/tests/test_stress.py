import logging
from backend.agents.persona_agent import PersonaAgent

def test_stress():
    logging.basicConfig(level=logging.ERROR)
    print("=== Testing Stress Modulation ===\n")
    
    # Instantiate Victor normally (0.3 stress)
    victor = PersonaAgent(
        character_id="victor",
        knowledge_cutoff="2024-01-15T00:05:00",
        stress=0.3
    )
    
    print("--- Low Stress (0.3) ---")
    res1 = victor.respond("Why should I believe you?", "test_stress_123")
    print(res1)
    
    print("\n--- High Stress (0.8) ---")
    victor.update_stress(0.5) # Bumps to 0.8
    res2 = victor.respond("I KNOW you touched that drink! We found it on camera!", "test_stress_123")
    print(res2)

if __name__ == "__main__":
    test_stress()
