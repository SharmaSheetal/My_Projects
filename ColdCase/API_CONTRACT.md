# API_CONTRACT.md
# Cold Case — API Contract
# Version: 1.0 | Locked before Hour 2 kickoff
# DO NOT CHANGE FIELD NAMES OR TYPES AFTER DEVELOPMENT BEGINS

---

## Ground Rules

- All requests and responses are JSON
- All endpoints are prefixed with `/api/v1`
- Every request that requires a session must include `session_id`
- If `session_id` is not found on the server, the server returns `404` with `{"error": "session_not_found"}`
- All timestamps are ISO 8601 strings: `"2024-01-15T00:05:00"`
- All score values are integers between `0` and `100`
- All stress values are floats between `0.0` and `1.0`
- Contradiction IDs are always one of: `"C1"`, `"C2"`, `"C3"`, `"C4"`, `"C5"`, `"C6"`, `"C7"`
- Character IDs are always one of: `"victor"`, `"martha"`, `"hayes"`, `"dr_collins"`, `"rose"`
- Evidence IDs are always one of the 10 IDs defined in `data/evidence/evidence.json`
- Ending choices are always integers: `1`, `2`, or `3`

---

## Session Initialization

Before any other endpoint is called, the frontend must obtain a session ID.

On the very first request to `POST /interview` or `POST /evidence`, if no `session_id` is provided, the server creates a new session automatically and returns the new `session_id` in the response. The frontend stores this in React Context and includes it in every subsequent request.

If `session_id` is provided but not found on the server (e.g. server restarted), the server returns `404` and the frontend resets to a fresh session.

---

## Endpoint 1 — POST /api/v1/interview

**Purpose:** Send a player message to a character and receive the character's response.

**Who calls it:** React `InterviewRoom` screen on every player message submit.

**Who handles it:** FastAPI → Orchestrator → PersonaAgent → Neo4j → Gemini → Response assembly.

---

### Request

```json
{
  "character_id": "victor",
  "player_message": "Did you enter the judges lounge last night?",
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `character_id` | string | Yes | One of the 5 valid character IDs |
| `player_message` | string | Yes | The player's question or statement, max 500 characters |
| `session_id` | string | No | Omit only on the very first call to auto-create session |

---

### Response

```json
{
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "response_text": "Look, I was nowhere near the judges lounge. I was at the hardware hacking station all night. Objectively speaking, you are wasting both our time with this line of questioning.",
  "active_fact_ids": ["fact_victor_003", "fact_victor_007"],
  "stress_level": 0.3,
  "contradiction_event": null,
  "progress": {
    "show": false,
    "score": 12,
    "label": "Cold Trail",
    "flavor_text": ""
  },
  "hint_injected": false,
  "game_state": {
    "phase": 1,
    "questioned_characters": ["victor"],
    "found_contradictions": [],
    "unlocked_evidence": [
      "evidence_sticky_note",
      "evidence_camera_timestamp",
      "evidence_scoring_sheet"
    ],
    "available_endings": [],
    "hints_used": 0
  }
}
```

| Field | Type | Nullable | Description |
|---|---|---|---|
| `session_id` | string | No | Returned on every response so frontend can store it |
| `response_text` | string | No | The character's full response. Render with typewriter effect. |
| `active_fact_ids` | array of strings | No | IDs of fact nodes accessed during RAG retrieval. Use to highlight nodes in React Flow graph. Can be empty array. |
| `stress_level` | float | No | Current stress of this character, 0.0–1.0. Use to update stress bar in UI. |
| `contradiction_event` | object or null | Yes | Populated only when a new contradiction fires on this response. See ContradictionEvent schema below. |
| `progress.show` | boolean | No | If true, frontend renders the ProgressMeter component. If false, ignore all other progress fields. |
| `progress.score` | integer | No | Current progress score 0–100. Only meaningful when show is true. |
| `progress.label` | string | No | One of: Cold Trail, Something's Off, You're Onto Something, Getting Dangerous, You Know the Truth |
| `progress.flavor_text` | string | No | Single flavor text string. Empty string when show is false. |
| `hint_injected` | boolean | No | If true, the last line of response_text is a passive hint. Frontend renders it in italic with a subtle color difference. |
| `game_state` | object | No | Full current game state. Frontend uses this to sync React Context after every interview. |

---

### ContradictionEvent Schema

Used inside `contradiction_event` field above and inside `found_contradictions` arrays.

```json
{
  "contradiction_id": "C1",
  "characters": ["victor", "hayes"],
  "claim_a": {
    "character_id": "victor",
    "text": "I was nowhere near the judges lounge last night."
  },
  "claim_b": {
    "character_id": "hayes",
    "text": "Camera timestamp confirms Victor entered the judges lounge at 12:05 AM."
  },
  "detected_at": "2024-01-15T02:14:33"
}
```

| Field | Type | Description |
|---|---|---|
| `contradiction_id` | string | One of C1–C7 as defined in the canonical ground truth document |
| `characters` | array of 2 strings | The two character IDs whose claims conflict |
| `claim_a` | object | The earlier claim — character ID and the claim text |
| `claim_b` | object | The newer claim that contradicts claim_a |
| `detected_at` | string | ISO 8601 timestamp when the contradiction was detected |

---

### Error Responses

| Status | Body | When |
|---|---|---|
| `400` | `{"error": "invalid_character_id", "message": "character_id must be one of: victor, martha, hayes, dr_collins, rose"}` | Unknown character ID sent |
| `400` | `{"error": "message_too_long", "message": "player_message must be 500 characters or fewer"}` | Message exceeds limit |
| `404` | `{"error": "session_not_found"}` | session_id provided but not found |
| `500` | `{"error": "agent_error", "message": "..."}` | Gemini API or Neo4j failure |

---

---

## Endpoint 2 — POST /api/v1/evidence

**Purpose:** Submit a piece of evidence the player has found. Updates relevant character knowledge graphs and returns new game state.

**Who calls it:** React `EvidenceBoard` screen when player clicks Submit Evidence on an unlocked evidence card.

**Who handles it:** FastAPI → Orchestrator → Evidence ingestion pipeline → Neo4j update → Contradiction check → Progress update → Response assembly.

---

### Request

```json
{
  "evidence_id": "evidence_camera_timestamp",
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `evidence_id` | string | Yes | One of the 10 valid evidence IDs from evidence.json |
| `session_id` | string | Yes | Current session ID |

---

### Response

```json
{
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "evidence_id": "evidence_camera_timestamp",
  "new_contradictions": [
    {
      "contradiction_id": "C1",
      "characters": ["victor", "hayes"],
      "claim_a": {
        "character_id": "victor",
        "text": "I was nowhere near the judges lounge last night."
      },
      "claim_b": {
        "character_id": "hayes",
        "text": "Camera timestamp confirms Victor entered the judges lounge at 12:05 AM."
      },
      "detected_at": "2024-01-15T02:14:33"
    }
  ],
  "progress": {
    "show": true,
    "score": 28,
    "label": "Something's Off",
    "flavor_text": "At least one person in this room is pretending their memory is worse than it is."
  },
  "game_state": {
    "phase": 1,
    "questioned_characters": ["victor", "hayes"],
    "found_contradictions": ["C1"],
    "unlocked_evidence": [
      "evidence_sticky_note",
      "evidence_camera_timestamp",
      "evidence_scoring_sheet"
    ],
    "submitted_evidence": ["evidence_camera_timestamp"],
    "available_endings": [],
    "hints_used": 0
  }
}
```

| Field | Type | Nullable | Description |
|---|---|---|---|
| `evidence_id` | string | No | Echoed back so frontend knows which card to animate |
| `new_contradictions` | array | No | List of ContradictionEvent objects triggered by this evidence. Can be empty array. |
| `progress` | object | No | Same schema as in /interview. If show is true, render ProgressMeter. |
| `game_state` | object | No | Full updated game state. Frontend syncs React Context from this. |

---

### Error Responses

| Status | Body | When |
|---|---|---|
| `400` | `{"error": "invalid_evidence_id"}` | Unknown evidence ID sent |
| `400` | `{"error": "evidence_not_unlocked", "message": "This evidence is not available in the current phase"}` | Player submits evidence not yet unlocked |
| `400` | `{"error": "evidence_already_submitted"}` | Player submits the same evidence twice |
| `404` | `{"error": "session_not_found"}` | Session ID not found |

---

---

## Endpoint 3 — GET /api/v1/game-state/{session_id}

**Purpose:** Fetch the full current game state for a session. Called on page load, navigation between screens, and to initialize the opening scene.

**Who calls it:** React app on mount, on screen navigation, and by the Corkboard polling loop as a fallback.

**Who handles it:** FastAPI → Session store lookup → Response.

---

### Request

No request body. Session ID is in the URL path.

```
GET /api/v1/game-state/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

### Response

```json
{
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "phase": 2,
  "questioned_characters": ["victor", "martha", "hayes"],
  "found_contradictions": [
    {
      "contradiction_id": "C1",
      "characters": ["victor", "hayes"],
      "claim_a": {
        "character_id": "victor",
        "text": "I was nowhere near the judges lounge last night."
      },
      "claim_b": {
        "character_id": "hayes",
        "text": "Camera timestamp confirms Victor entered the judges lounge at 12:05 AM."
      },
      "detected_at": "2024-01-15T02:14:33"
    }
  ],
  "unlocked_evidence": [
    "evidence_sticky_note",
    "evidence_camera_timestamp",
    "evidence_scoring_sheet",
    "evidence_energy_drink_can",
    "evidence_martha_reel",
    "evidence_missing_inhaler",
    "evidence_victor_text"
  ],
  "submitted_evidence": [
    "evidence_camera_timestamp"
  ],
  "available_endings": [],
  "hints_used": 1,
  "progress_score": 44,
  "progress_label": "Something's Off"
}
```

| Field | Type | Description |
|---|---|---|
| `phase` | integer | Current game phase, 1–5 |
| `questioned_characters` | array of strings | Character IDs the player has spoken to at least once |
| `found_contradictions` | array of ContradictionEvent | Full contradiction event objects for all contradictions found so far |
| `unlocked_evidence` | array of strings | Evidence IDs the player currently has access to (can see on Evidence Board) |
| `submitted_evidence` | array of strings | Evidence IDs the player has already submitted (subset of unlocked_evidence) |
| `available_endings` | array of integers | Which ending choices (1, 2, 3) are currently reachable based on game state. Empty until phase 4. |
| `hints_used` | integer | Total number of active hints the player has requested this session |
| `progress_score` | integer | Current progress score 0–100 |
| `progress_label` | string | Current progress label text |

---

### Error Responses

| Status | Body | When |
|---|---|---|
| `404` | `{"error": "session_not_found"}` | Session ID not found |

---

---

## Endpoint 4 — GET /api/v1/contradictions/{session_id}

**Purpose:** Fetch all contradiction events found so far in this session. Called by the Corkboard polling loop every 3 seconds to animate corkboard strings.

**Who calls it:** React `Corkboard` screen polling loop via `setInterval`.

**Who handles it:** FastAPI → Session store lookup → Return found_contradictions list.

---

### Request

No request body. Session ID is in the URL path.

```
GET /api/v1/contradictions/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

### Response

```json
{
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "found_contradictions": [
    {
      "contradiction_id": "C1",
      "characters": ["victor", "hayes"],
      "claim_a": {
        "character_id": "victor",
        "text": "I was nowhere near the judges lounge last night."
      },
      "claim_b": {
        "character_id": "hayes",
        "text": "Camera timestamp confirms Victor entered the judges lounge at 12:05 AM."
      },
      "detected_at": "2024-01-15T02:14:33"
    },
    {
      "contradiction_id": "C3",
      "characters": ["martha", "hayes"],
      "claim_a": {
        "character_id": "martha",
        "text": "I never touched a single thing in that lounge. I was just observing."
      },
      "claim_b": {
        "character_id": "hayes",
        "text": "Martha's own reel footage shows her moving multiple objects including the inhaler."
      },
      "detected_at": "2024-01-15T02:19:07"
    }
  ],
  "total_count": 2
}
```

| Field | Type | Description |
|---|---|---|
| `found_contradictions` | array of ContradictionEvent | All contradiction events found so far. Can be empty array. |
| `total_count` | integer | Length of found_contradictions. Frontend uses this to detect new arrivals between polls. |

**Frontend polling logic:** Store `total_count` from the previous poll in a `useRef`. On each new poll, compare new `total_count` to stored value. If it increased, the new contradictions are the ones at the end of the array. Animate those corkboard strings and fire ContradictionAlert toasts.

---

### Error Responses

| Status | Body | When |
|---|---|---|
| `404` | `{"error": "session_not_found"}` | Session ID not found |

---

---

## Endpoint 5 — POST /api/v1/hint

**Purpose:** Player explicitly requests a hint. Returns a phase-appropriate hint or a cooldown indicator.

**Who calls it:** React `HintButton` component on click, available on Corkboard and InterviewRoom screens.

**Who handles it:** FastAPI → Session cooldown check → Phase-aware hint selection → Hint counter increment → Response.

---

### Request

```json
{
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `session_id` | string | Yes | Current session ID |

---

### Response — Hint Available

```json
{
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "hint_available": true,
  "hint_text": "Someone entered the lounge after 11 PM. The building's camera system knows who.",
  "cooldown_remaining": 0,
  "hints_used": 1
}
```

### Response — On Cooldown

```json
{
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "hint_available": false,
  "hint_text": null,
  "cooldown_remaining": 67,
  "hints_used": 1
}
```

| Field | Type | Nullable | Description |
|---|---|---|---|
| `hint_available` | boolean | No | If false, frontend shows cooldown ring on HintButton. If true, render HintCard. |
| `hint_text` | string | Yes | The hint string to display in HintCard. Null when on cooldown. |
| `cooldown_remaining` | integer | No | Seconds remaining on cooldown. 0 when hint is available. Frontend uses this to animate the countdown ring. |
| `hints_used` | integer | No | Updated total hint count. Frontend updates React Context with this value. |

---

### Error Responses

| Status | Body | When |
|---|---|---|
| `404` | `{"error": "session_not_found"}` | Session ID not found |

---

---

## Endpoint 6 — POST /api/v1/accusation

**Purpose:** Player submits their final accusation. Returns the appropriate ending text, score, and full truth reveal.

**Who calls it:** React `Accusation` screen when player clicks Choose This Ending.

**Who handles it:** FastAPI → Game state validation → Ending determination → Score calculation → Full truth assembly → Response.

---

### Request

```json
{
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "ending_choice": 3
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `session_id` | string | Yes | Current session ID |
| `ending_choice` | integer | Yes | 1, 2, or 3 matching the three endings in the ground truth document |

---

### Response

```json
{
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "ending_choice": 3,
  "ending_unlocked": true,
  "ending_title": "The Full Truth",
  "ending_text": "You have pieced together what actually happened on the night of the hackathon. Julian Byte did not die because someone wanted to kill him. He died because he tried to make himself the center of attention, and a chain of small, petty, independent decisions by people who simply found him insufferable accidentally made his theatrical stunt real.",
  "score": 91,
  "score_breakdown": {
    "contradictions_found": 5,
    "characters_questioned": 5,
    "evidence_submitted": 7,
    "phase_reached": 4,
    "pivot_moments_triggered": 3,
    "hints_penalty": 0
  },
  "hints_used_note": "Case solved without assistance — Master Detective.",
  "full_truth_reveal": "Julian planned to fake a dramatic collapse during demo night. Victor swapped his cold brew with an ultra-caffeinated sponsor drink out of petty revenge. Rose replaced his VIP kit with a standard participant bag because she was tired of his demands. Martha moved his inhaler while filming her social media reel without knowing what it was. Julian handled the novelty trophy and loosened a keycap. When he began his fake collapse speech he started coughing from genuine caffeine overload, panicked, inhaled sharply, and choked on the loose keycap. Without his inhaler nearby he could not recover. Nobody intended to kill him. Everyone just made one small, stupid, petty decision.",
  "ending_condition_met": true,
  "ending_condition_message": ""
}
```

### Response — Ending Condition Not Met

```json
{
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "ending_choice": 3,
  "ending_unlocked": false,
  "ending_title": null,
  "ending_text": null,
  "score": null,
  "score_breakdown": null,
  "hints_used_note": null,
  "full_truth_reveal": null,
  "ending_condition_met": false,
  "ending_condition_message": "You are close but not there yet. You need to question all 5 characters and find at least 5 contradictions before the full truth becomes available."
}
```

| Field | Type | Nullable | Description |
|---|---|---|---|
| `ending_choice` | integer | No | Echoed back — which ending the player chose |
| `ending_unlocked` | boolean | No | Whether the player has met the conditions for this ending |
| `ending_title` | string | Yes | Short title of the ending. Null if not unlocked. |
| `ending_text` | string | Yes | The narrative ending reveal text. Null if not unlocked. |
| `score` | integer | Yes | Final score 0–100. Null if not unlocked. |
| `score_breakdown` | object | Yes | Breakdown of how score was calculated. Null if not unlocked. |
| `hints_used_note` | string | Yes | One of three strings based on hints_used count. Null if not unlocked. |
| `full_truth_reveal` | string | Yes | The complete canonical truth paragraph shown after the ending text. Null if not unlocked. |
| `ending_condition_met` | boolean | No | If false, frontend shows ending_condition_message instead of the ending reveal. |
| `ending_condition_message` | string | No | Guidance for the player when the ending condition is not met. Empty string when condition is met. |

**Hints used note logic:**
- 0 hints → `"Case solved without assistance — Master Detective."`
- 1–2 hints → `""` (no note shown)
- 3+ hints → `"Case solved with investigative assistance."`

**Ending unlock conditions:**
- Ending 1 → Always available regardless of game state
- Ending 2 → Requires at least 3 contradictions found AND at least 3 characters questioned
- Ending 3 → Requires at least 5 contradictions found AND all 5 characters questioned AND at least 6 evidence items submitted

---

### Error Responses

| Status | Body | When |
|---|---|---|
| `400` | `{"error": "invalid_ending_choice", "message": "ending_choice must be 1, 2, or 3"}` | Invalid ending number sent |
| `404` | `{"error": "session_not_found"}` | Session ID not found |

---

---

## Shared Types Reference

### GameState Object
Used inside `/interview` and `/evidence` responses.

```json
{
  "phase": 2,
  "questioned_characters": ["victor", "martha"],
  "found_contradictions": ["C1"],
  "unlocked_evidence": ["evidence_sticky_note", "evidence_camera_timestamp", "evidence_scoring_sheet"],
  "submitted_evidence": ["evidence_camera_timestamp"],
  "available_endings": [],
  "hints_used": 0
}
```

### ProgressData Object
Used inside `/interview` and `/evidence` responses.

```json
{
  "show": true,
  "score": 44,
  "label": "Something's Off",
  "flavor_text": "The stories do not quite fit together yet but the edges are starting to show."
}
```

### ContradictionEvent Object
Used inside `/interview`, `/evidence`, `/game-state`, and `/contradictions` responses.

```json
{
  "contradiction_id": "C1",
  "characters": ["victor", "hayes"],
  "claim_a": {
    "character_id": "victor",
    "text": "I was nowhere near the judges lounge last night."
  },
  "claim_b": {
    "character_id": "hayes",
    "text": "Camera timestamp confirms Victor entered the judges lounge at 12:05 AM."
  },
  "detected_at": "2024-01-15T02:14:33"
}
```

---

## Integration Rules

These rules exist to prevent the most common integration failures between the three team tracks.

**Rule 1 — Never call PersonaAgent directly from a route.** All FastAPI routes call the Orchestrator only. The Orchestrator calls PersonaAgents internally. If a route imports a PersonaAgent directly, that is a bug.

**Rule 2 — Always return the full GameState object.** Every endpoint that modifies session state must return the full updated GameState in its response. The frontend never patches state locally — it always replaces with what the server returns.

**Rule 3 — Never return a null session_id.** Every response includes `session_id`. If a new session was created, the new ID is returned. The frontend stores this on the very first response.

**Rule 4 — The progress object is always present.** Even when `show` is false, the `progress` object is always included in `/interview` and `/evidence` responses with `show: false` and empty strings. The frontend never checks for the presence of the object — only checks `progress.show`.

**Rule 5 — contradiction_event in /interview is a single event or null.** It is never an array. Only the most recently detected contradiction is returned here. The full list is always available via `/contradictions` or inside `game_state.found_contradictions`.

**Rule 6 — Evidence submission is idempotent on the frontend only.** The backend returns `400 evidence_already_submitted` if submitted twice. The frontend must disable the Submit button immediately after first submission to prevent double calls.

**Rule 7 — Polling stops at phase 5.** The Corkboard polling loop for `/contradictions` must stop when `game_state.phase` reaches 5. Add a check in the `useEffect` cleanup.

---

## Field Name Freeze

These field names are frozen from the moment development begins. Renaming any field requires updating the backend model, the frontend type, and every component that reads it simultaneously — which is a coordination nightmare during a 24-hour build. If a field name feels wrong, raise it before Hour 2. After that it is locked.

| Field | Frozen Name | Do Not Rename To |
|---|---|---|
| Character response text | `response_text` | `message`, `content`, `reply` |
| RAG fact node IDs | `active_fact_ids` | `nodes`, `facts`, `retrieved_ids` |
| Character stress value | `stress_level` | `stress`, `anxiety`, `tension` |
| Contradiction object | `contradiction_event` | `conflict`, `contradiction`, `alert` |
| Progress show flag | `progress.show` | `visible`, `display`, `active` |
| Hint flag on response | `hint_injected` | `has_hint`, `hint_added`, `nudge` |
| Game phase | `phase` | `stage`, `level`, `step` |
| Questioned characters | `questioned_characters` | `interviewed`, `visited`, `talked_to` |

---

*Contract locked. Any changes require agreement from all three team members and must be reflected in both backend Pydantic models and frontend TypeScript types before merging.*
