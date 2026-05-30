"""
Orchestrator Facade
===================
Exposes the core routing, state management, and rules engine logic 
from the refactored orchestration sub-modules.
"""

from backend.agents.orchestration.state import get_or_create_session, get_game_state
from backend.agents.orchestration.evidence import unlock_evidence, submit_evidence
from backend.agents.orchestration.phase import advance_phase
from backend.agents.orchestration.contradiction import check_contradiction
from backend.agents.orchestration.router import route_to_persona
from backend.agents.orchestration.hints import get_active_hint

__all__ = [
    "get_or_create_session",
    "get_game_state",
    "unlock_evidence",
    "submit_evidence",
    "advance_phase",
    "check_contradiction",
    "route_to_persona",
    "get_active_hint"
]
