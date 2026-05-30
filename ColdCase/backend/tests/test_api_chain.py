import sys
from fastapi.testclient import TestClient
from backend.main import app
from backend.agents.orchestration.state import sessions

client = TestClient(app)

def test_interview_endpoint_chain():
    print("=== Testing FastAPI /interview Orchestration Chain ===")
    
    session_id = "test_api_chain"
    sessions[session_id] = {
        "current_phase": 1,
        "found_contradictions": [],
        "questioned_characters": set(),
        "unlocked_evidence": set(),
        "available_endings": [],
        "hints_used": 0,
        "progress_score": 0,
        "pivot_moments_triggered": [],
        "suppress_progress_meter": False,
        "shown_flavor_texts": [],
        "session_history": [],
        "last_hint_timestamp": 0.0,
        "last_meter_shown_timestamp": 0.0,
        "last_meter_score": -1
    }
    
    # Fire Request
    print("\nSending POST /interview to Martha...")
    response = client.post(
        "/interview",
        json={
            "session_id": session_id,
            "character_id": "martha",
            "message": "Did you see Julian?"
        }
    )
    
    # Assert HTTP Success
    if response.status_code != 200:
        print(f"✗ ERROR: HTTP {response.status_code}")
        print(response.json())
        sys.exit(1)
        
    data = response.json()
    
    # Assert specific sequential chain keys exist in the response payload
    print("\n[Validating Response Payload]")
    
    # 1. Base route
    assert "response" in data, "Missing character response"
    assert data["character_id"] == "martha"
    assert "stress" in data
    print("✓ Route & Persona Data Attached")
    
    # 2. Phase
    assert "phase" in data
    assert "phase_advanced" in data
    print("✓ Phase Data Attached")
    
    # 3. Progress Score / Meter
    assert "progress_score" in data
    assert "show_meter" in data
    assert "meter_flavor_text" in data
    print("✓ Progress Data Attached")
    
    print("\nSUCCESS: All orchestration links fired successfully through the FastAPI Endpoint.")

if __name__ == "__main__":
    test_interview_endpoint_chain()
