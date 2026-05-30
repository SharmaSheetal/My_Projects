import logging
import uuid
from typing import Dict, Any
from fastapi import APIRouter, HTTPException

from backend.agents.orchestrator import (
    route_to_persona,
    submit_evidence,
    get_active_hint,
    get_game_state,
    advance_phase
)
from backend.agents.progress import calculate_progress_score, should_show_meter, get_flavor_text
from backend.agents.orchestration.hints import wrong_direction_detector, get_passive_hint
from backend.agents.orchestration.state import get_or_create_session

from backend.api.models import (
    AccusationRequest,
    AccusationResponse,
    ContradictionEvent,
    EvidenceSubmitRequest,
    GameStateResponse,
    HintRequest,
    HintResponse,
    InterviewRequest,
    InterviewResponse,
    ProgressData,
    SessionStartResponse
)

log = logging.getLogger(__name__)

router = APIRouter()

@router.post("/interview", response_model=InterviewResponse)
def interview_character(payload: InterviewRequest):
    log.info(f"Incoming interview request for character '{payload.character_id}' in session '{payload.session_id}'")
    try:
        # 1. Base Routing
        base_result = route_to_persona(payload.character_id, payload.player_message, payload.session_id)
        if "error" in base_result:
            raise HTTPException(status_code=400, detail=base_result["error"])
            
        session_state = get_or_create_session(payload.session_id)
        
        # 2. Progress Calculation
        raw_score = calculate_progress_score(session_state)
        session_state["progress_score"] = raw_score 
        
        # 3. Meter Display Logic
        show_meter = should_show_meter(session_state)
        meter_flavor_text = ""
        if show_meter:
            import time
            meter_flavor_text = get_flavor_text(raw_score, session_state)
            session_state["last_meter_shown_timestamp"] = time.time()
            session_state["last_meter_score"] = raw_score
            
        progress_data = ProgressData(
            show=show_meter,
            score=raw_score,
            label=meter_flavor_text if meter_flavor_text else "",
            flavor_text=meter_flavor_text if meter_flavor_text else ""
        )
            
        # 4. Wrong Direction & Passive Hints
        session_history = session_state.get("session_history", [])
        struggle_score = wrong_direction_detector(session_state, session_history)
        
        response_text = base_result["response"]
        passive_hint_text = None
        hint_injected = False
        
        if struggle_score >= 2:
            phase = session_state.get("current_phase", 1)
            found_contradictions = len(session_state.get("found_contradictions", []))
            early_acc = any(inter.get("action") == "ACCUSATION" for inter in session_history)
            
            if early_acc and phase in [1, 2]:
                trigger_type = "too_early_accusation"
            elif phase == 1 and len(session_history) > 15 and found_contradictions == 0:
                trigger_type = "phase_stalled"
            elif len(session_state.get("questioned_characters", set())) <= 2 and len(session_history) > 8:
                trigger_type = "not_spreading"
            else:
                trigger_type = "stuck_on_suspect"
                
            passive_hint_text = get_passive_hint(payload.character_id, trigger_type, session_state)
            
            if passive_hint_text:
                response_text = f"{response_text}\n\n{passive_hint_text}"
                hint_injected = True
                
            session_state["session_history"] = []
            
        # 5. Advancement Checks
        advanced = advance_phase(payload.session_id)

        # 6. Found Contradiction (latest one if multiple from this turn)
        found_contradictions_data = session_state.get("found_contradictions", [])
        latest_ce = None
        if found_contradictions_data:
            latest = found_contradictions_data[-1]
            latest_ce = ContradictionEvent(**latest)

        return InterviewResponse(
            response_text=response_text,
            active_fact_ids=[], # No orchestrator implementation yet
            stress_level=base_result.get("stress", 0.0),
            contradiction_event=latest_ce,
            progress=progress_data,
            hint_injected=hint_injected
        )

    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Interview error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/submit-evidence", response_model=GameStateResponse)
def handle_submit_evidence(payload: EvidenceSubmitRequest):
    log.info(f"Incoming evidence submission for ID '{payload.evidence_id}' in session '{payload.session_id}'")
    try:
        result = submit_evidence(payload.session_id, payload.evidence_id)
        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result["message"])
        
        session_state = get_or_create_session(payload.session_id)
        
        return GameStateResponse(
            phase=session_state.get("current_phase", 1),
            questioned_characters=list(session_state.get("questioned_characters", set())),
            found_contradictions=[ContradictionEvent(**item) for item in session_state.get("found_contradictions", [])],
            unlocked_evidence=list(session_state.get("unlocked_evidence", set())),
            available_endings=session_state.get("available_endings", []),
            hints_used=session_state.get("hints_used", 0),
            progress_score=session_state.get("progress_score", 0)
        )

    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Evidence error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/hint", response_model=HintResponse)
def request_hint_endpoint(payload: HintRequest):
    log.info(f"Incoming hint request for session '{payload.session_id}'")
    try:
        result = get_active_hint(payload.session_id)
        return HintResponse(
            hint_text=result.get("hint"),
            cooldown_remaining=result.get("cooldown_remaining", 0),
            hints_used=result.get("hints_used", 0)
        )
    except Exception as e:
        log.error(f"Hint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/game-state/{session_id}", response_model=GameStateResponse)
def fetch_state(session_id: str):
    log.info(f"Fetching game state for session '{session_id}'")
    try:
        session_state = get_game_state(session_id)
        
        return GameStateResponse(
            phase=session_state.get("current_phase", 1),
            questioned_characters=list(session_state.get("questioned_characters", set())),
            found_contradictions=[ContradictionEvent(**item) for item in session_state.get("found_contradictions", [])],
            unlocked_evidence=list(session_state.get("unlocked_evidence", set())),
            available_endings=session_state.get("available_endings", []),
            hints_used=session_state.get("hints_used", 0),
            progress_score=session_state.get("progress_score", 0)
        )
    except Exception as e:
        log.error(f"State retrieval error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/session/start", response_model=SessionStartResponse)
def start_session():
    new_id = str(uuid.uuid4())
    log.info(f"Starting new session with ID: '{new_id}'")
    session = get_or_create_session(new_id)
    return {
        "session_id": new_id,
        "message": "New session created",
    }


@router.post("/accuse", response_model=AccusationResponse)
def accuse(payload: AccusationRequest):
    log.info(f"Incoming accusation for session '{payload.session_id}' with choice {payload.ending_choice}")
    session = get_or_create_session(payload.session_id)
    session_history = session.get("session_history", [])
    session_history.append(
        {
            "action": "ACCUSATION",
            "ending_choice": payload.ending_choice,
        }
    )

    name_map = {
        "victor": "Victor Vale",
        "martha": "Martha Keen",
        "rose": "Rose Voss",
        "dr_collins": "Dr. Arthur Collins"
    }
    accused_name = name_map.get(payload.suspect_id, payload.suspect_id)

    ending_map = {
        1: f"You formally accuse {accused_name} of orchestrating the incident.",
        2: "You argue the collapse was a chain reaction caused by sabotage and panic, without a single mastermind.",
        3: "You present the full hidden truth behind Julian's final stunt.",
    }

    return AccusationResponse(
        ending_text=ending_map.get(payload.ending_choice, ending_map[1]),
        score=78,
        hints_used_note=f"Hints used in this session: {session.get('hints_used', 0)}",
        full_truth_reveal=(
            "Julian orchestrated the demo chaos himself, but the situation spiraled "
            "through multiple small actions and misjudgments by others."
        ),
    )


@router.get("/contradictions/{session_id}")
def get_contradictions(session_id: str):
    log.info(f"Fetching contradictions for session '{session_id}'")
    session = get_or_create_session(session_id)
    return {"contradictions": session.get("found_contradictions", [])}


@router.get("/facts/{character_id}")
def get_character_facts(character_id: str):
    log.info(f"Fetching facts for character '{character_id}'")
    # Mock data returned to frontend
    data = {
        "victor": [
            {"id": "fact_victor_timeline", "label": "Victor timeline", "x": 80, "y": 80},
            {"id": "fact_backstage_sighting", "label": "Backstage sighting", "x": 320, "y": 180},
            {"id": "fact_drink_access", "label": "Drink access", "x": 120, "y": 280},
        ]
    }
    return {"facts": data.get(character_id, [])}

@router.post("/reset/{session_id}")
def reset_session(session_id: str):
    log.info(f"Resetting session '{session_id}'")
    from backend.agents.orchestration.state import sessions
    if session_id in sessions:
        del sessions[session_id]
        return {"status": "success", "message": "Session reset"}
    return {"status": "error", "message": "Session not found"}

@router.get("/health")
def health_check():
    log.debug("Health check hit")
    return {"status": "ok", "service": "cold-case-api"}
