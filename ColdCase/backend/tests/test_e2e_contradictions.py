import logging
import json
import time
from backend.agents.orchestrator import route_to_persona, get_game_state

def test_full_contradiction_pipeline():
    logging.basicConfig(level=logging.ERROR)
    print("=== Testing End-to-End Contradictions (C1-C7) ===\n")
    
    session_id = f"test_e2e_{int(time.time())}"
    
    scenarios = [
        {
            "id": "C1",
            "desc": "Victor's alibi vs Camera Timestamp",
            "c1_id": "victor",
            "c1_q": "Did you enter the judges' lounge at any point last night?",
            "c1_expected": "Denial",
            "c2_id": "hayes",
            "c2_q": "Did anyone besides Julian enter the lounge last night?",
            "c2_expected": "Confirmation of Victor entering at 12:05 AM"
        },
        {
            "id": "C2",
            "desc": "Martha's claim of not touching things vs Lounge rearrangement",
            "c1_id": "martha",
            "c1_q": "Did you move anything around in the lounge?",
            "c1_expected": "Denial",
            "c2_id": "victor",
            "c2_q": "Was the lounge messy when you went in?",
            "c2_expected": "Claiming things were moved/arranged weirdly"
        },
        {
            "id": "C3",
            "desc": "Victor's claim of Julian being fine vs Missing Inhaler",
            "c1_id": "victor",
            "c1_q": "How did Julian look when you saw him?",
            "c1_expected": "Claiming he looked fine",
            "c2_id": "dr_collins",
            "c2_q": "What did you notice about Julian's medical state?",
            "c2_expected": "Mentioning he didn't have his inhaler when he usually does"
        },
        {
            "id": "C4",
            "desc": "Rose's alibi vs Victor's text message",
            "c1_id": "rose",
            "c1_q": "What time did you leave the venue?",
            "c1_expected": "Saying she left early",
            "c2_id": "victor",
            "c2_q": "Did you text Rose last night?",
            "c2_expected": "Confirmation of late night text"
        },
        {
             "id": "C5",
             "desc": "Dr. Collins's theory vs Energy drink contents",
             "c1_id": "dr_collins",
             "c1_q": "Do you think Julian had an allergic reaction?",
             "c1_expected": "Denying allergic reaction, suggesting asthma attack",
             "c2_id": "hayes",
             "c2_q": "What was in the sponsor energy drink?",
             "c2_expected": "Confirmation it contained an allergen"
        },
        {
             "id": "C6",
             "desc": "Martha's filming timeline vs Julian's death timeline",
             "c1_id": "martha",
             "c1_q": "When were you filming in the lounge?",
             "c1_expected": "Late claiming",
             "c2_id": "dr_collins",
             "c2_q": "When do you think Julian died?",
             "c2_expected": "Estimating death occurred during Martha's filming window"
        },
        {
             "id": "C7",
             "desc": "Victor's motive vs Judge Scoring Sheet",
             "c1_id": "victor",
             "c1_q": "Were you worried about losing to Julian?",
             "c1_expected": "Denial",
             "c2_id": "rose",
             "c2_q": "Who was winning the competition?",
             "c2_expected": "Confirming Julian was winning based on the abandoned score sheet"
        }
    ]

    for scenario in scenarios:
        print(f"\n--- Testing {scenario['id']}: {scenario['desc']} ---")
        
        # Part 1
        print(f"> Querying {scenario['c1_id']}: '{scenario['c1_q']}'")
        res1 = route_to_persona(scenario['c1_id'], scenario['c1_q'], session_id)
        print(f"  Response: {res1['response']}")
        time.sleep(2) # Prevent rate limiting
        
        # Part 2
        print(f"> Querying {scenario['c2_id']}: '{scenario['c2_q']}'")
        res2 = route_to_persona(scenario['c2_id'], scenario['c2_q'], session_id)
        print(f"  Response: {res2['response']}")
        time.sleep(2)
        
        # Check State
        state = get_game_state(session_id)
        found = state['found_contradictions']
        print(f"  Contradictions logged in session: {len(found)}")
        
        if len(found) > 0:
            print(f"  LATEST: {found[-1]}")
        else:
            print("  FAILED TO DETECT CONTRADICTION.")

if __name__ == "__main__":
    test_full_contradiction_pipeline()
