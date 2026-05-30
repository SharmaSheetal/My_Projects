from typing import List, Optional

from pydantic import BaseModel, Field


class InterviewRequest(BaseModel):
    character_id: str
    player_message: str
    session_id: str


class ContradictionEvent(BaseModel):
    contradiction_id: str
    characters: List[str]
    claim_a: str
    claim_b: str


class ProgressData(BaseModel):
    show: bool
    score: int
    label: str
    flavor_text: str


class InterviewResponse(BaseModel):
    response_text: str
    active_fact_ids: List[str]
    stress_level: float
    contradiction_event: Optional[ContradictionEvent] = None
    progress: ProgressData
    hint_injected: bool


class EvidenceSubmitRequest(BaseModel):
    evidence_id: str
    session_id: str


class GameStateResponse(BaseModel):
    phase: int
    questioned_characters: List[str]
    found_contradictions: List[ContradictionEvent]
    unlocked_evidence: List[str]
    available_endings: List[str]
    hints_used: int
    progress_score: int


class HintRequest(BaseModel):
    session_id: str


class HintResponse(BaseModel):
    hint_text: Optional[str] = None
    cooldown_remaining: int
    hints_used: int


class AccusationRequest(BaseModel):
    session_id: str
    ending_choice: int = Field(..., ge=1, le=3)
    suspect_id: Optional[str] = None
    reason: Optional[str] = None


class AccusationResponse(BaseModel):
    ending_text: str
    score: int
    hints_used_note: str
    full_truth_reveal: str

class SessionStartResponse(BaseModel):
    session_id: str
    message: str