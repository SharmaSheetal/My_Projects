import logging
from backend.agents.orchestrator import check_contradiction
from backend.agents.tools import claims_store
from backend.agents.agent_registry import agents

def test_contradiction():
    logging.basicConfig(level=logging.INFO)
    print("=== Testing Contradiction Engine ===\n")
    
    session_id = "test_contradiction_123"
    
    # Pre-populate claims store for Victor
    claims_store[session_id] = {
        "victor": [
            {"claim": "I have absolutely no idea what you're talking about with a drink swap. It wasn't me.", "question": "Did you swap the drink?"}
        ]
    }
    
    print("Victor's Stored Claim:")
    print("-> I have absolutely no idea what you're talking about with a drink swap. It wasn't me.\n")
    
    # 1. Test an UNRELATED claim (should fail cosine similarity)
    print("Testing Unrelated Claim (Rose)...")
    unrelated_claim = "The VIP kit was supposed to have artisanal snacks."
    print(f"-> {unrelated_claim}")
    result_1 = check_contradiction(
        new_claim=unrelated_claim,
        character_id="rose",
        session_id=session_id
    )
    print(f"Result 1: {result_1['contradictions_found']}\n")
    
    # 2. Test a RELATED but NON-CONTRADICTORY claim (should pass cosine, fail LLM judgment)
    print("Testing Related / Non-Contradictory Claim (Martha)...")
    related_agree_claim = "I didn't see Victor touch the drink, honestly."
    print(f"-> {related_agree_claim}")
    result_2 = check_contradiction(
        new_claim=related_agree_claim,
        character_id="martha",
        session_id=session_id
    )
    print(f"Result 2: {result_2['contradictions_found']}\n")
    
    # 3. Test a STRICT CONTRADICTION (should pass both)
    print("Testing Strict Contradiction (Hayes)...")
    direct_conflict_claim = "We have camera footage that clearly shows Victor tampering with the sponsor energy drink."
    print(f"-> {direct_conflict_claim}")
    result_3 = check_contradiction(
        new_claim=direct_conflict_claim,
        character_id="hayes",
        session_id=session_id
    )
    print(f"Result 3: Found {len(result_3['contradictions_found'])} contradictions.")
    if result_3['contradictions_found']:
        print(f"Conflict Event: {result_3['contradictions_found'][0]}")
        
    print(f"\nVictor's New Stress: {agents['victor'].stress}")

if __name__ == "__main__":
    test_contradiction()
