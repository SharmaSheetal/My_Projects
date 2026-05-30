import logging
from typing import Dict, Any

from backend.agents.agent_registry import agents
from backend.agents.tools import log_claim

from backend.agents.orchestration.state import get_or_create_session
from backend.agents.orchestration.phase import advance_phase
from backend.agents.orchestration.evidence import unlock_evidence
from backend.agents.orchestration.contradiction import check_contradiction

log = logging.getLogger(__name__)

def route_to_persona(character_id: str, player_message: str, session_id: str) -> Dict[str, Any]:
    """
    Core function for the Orchestrator to route player dialogue to a specific PersonaAgent.
    Handles the agent interaction, logs their response as a claim, and updates session state.
    """
    character_id = character_id.lower()
    
    if character_id not in agents:
        return {
            "error": f"Character '{character_id}' not found in registry.",
            "response": None
        }

    # 1. Fetch the target agent
    target_agent = agents[character_id]
    
    # 2. Get the session state
    session_state = get_or_create_session(session_id)
    
    # 3. Update session if this is the first time the player has talked to them
    if character_id not in session_state["questioned_characters"]:
        session_state["questioned_characters"].add(character_id)
        log.info(f"[Session {session_id}] New character questioned: {character_id}")

    # 4. Have the PersonaAgent process the message (this handles Neo4j tool calls internally)
    response_text = target_agent.respond(player_message, session_id)
    
    # 5. Automatically log the agent's full response as a core claim for the contradiction engine
    log_claim(
        session_id=session_id, 
        character_id=character_id, 
        claim_text=response_text, 
        question_asked=player_message
    )
    
    # Check for contradictions with this new claim
    check_contradiction(
        new_claim=response_text,
        character_id=character_id,
        session_id=session_id
    )
    
    # Append current interaction to session history natively so the router can evaluate it
    import time
    session_history = session_state.get("session_history", [])
    session_history.append({
        "action": "INTERVIEW",
        "target_id": character_id,
        "timestamp": time.time()
    })
    
    return {
        "character_id": character_id,
        "response": response_text,
        "stress": target_agent.stress,
        "questioned_characters": list(session_state["questioned_characters"]),
        "phase": session_state["current_phase"]
    }
