import logging
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_api():
    logging.basicConfig(level=logging.ERROR)
    print("=== Testing FastAPI Application ===")
    
    session_id = "test_api_session_999"
    
    # 1. Test Health
    response = client.get("/health")
    assert response.status_code == 200
    print("[Health Check] Passed:", response.json())
    
    # 2. Test Hint
    hint_req = {"session_id": session_id}
    response = client.post("/hint", json=hint_req)
    assert response.status_code == 200
    print(f"[Hint / POST] Passed: {response.json()}")

    # 3. Test Evidence (Failure case - locked evidence)
    evidence_req = {"session_id": session_id, "evidence_id": "evidence_sticky_note"}
    response = client.post("/evidence", json=evidence_req)
    # The API throws a 400 Bad Request if the orchestrator returns an error status dict for evidence
    assert response.status_code == 400
    print(f"[Evidence / POST (Expected Reject)] Passed: HTTP {response.status_code} - {response.json()}")
    
    # 4. Test State Fetching
    response = client.get(f"/state/{session_id}")
    assert response.status_code == 200
    state = response.json()
    print(f"[State / GET] Passed: Session Phase {state['phase']} | Score {state['progress_score']} | Hints {state['hints_used']}")
    
    # 5. Test Interview Routing
    interview_req = {
        "session_id": session_id,
        "character_id": "victor",
        "message": "Did you touch the energy drink?"
    }
    print("Attempting to dynamically route an interview message through the API. This takes a few seconds for Gemini to respond...")
    response = client.post("/interview", json=interview_req)
    assert response.status_code == 200
    result = response.json()
    print(f"[Interview / POST] Passed: {result['character_id']} responded with stress level {result['stress']}.")
    
    # Print the actual text
    print(f"   Agent Text => {result['response']}")

if __name__ == "__main__":
    test_api()
