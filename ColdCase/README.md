# Cold Case — The Case of the Dead Demo Judge

A comedic AI-powered murder mystery game set during the final hours of a university hackathon. At 2:07 AM, star judge **Professor Julian Byte** is found collapsed in the judges' lounge. Everyone looks guilty. Nobody actually did it on purpose.

Players interrogate five AI-driven suspects with conflicting private knowledge, expose contradictions in their stories, and determine what really happened.

---

## Gameplay

1. Select a character to question in the Interview Room
2. The character responds in persona using only what they know
3. Review or unlock evidence on the Evidence Board
4. The contradiction engine flags inconsistencies between statements and evidence
5. Revisit suspects with sharper questions as new facts surface
6. Make a final accusation from the Accusation screen

---

## Characters

| ID | Name | Role |
|---|---|---|
| `victor` | Victor | Hardware hacker, was near the lounge |
| `martha` | Martha | Filmed the scene, rearranged objects |
| `rose` | Rose | Swapped the VIP kit before the incident |
| `hayes` | Hayes | Arrived at scene at 2:07 AM |
| `dr_collins` | Dr. Collins | Arrived at scene at 2:07 AM |

Each character has a knowledge cutoff — they only know what they saw before they left. Statements past their cutoff timestamp are fabricated.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | FastAPI + Uvicorn |
| AI / LLM | Google Gemini (`gemini-1.5-pro` / `flash`) via LangChain |
| Graph Database | Neo4j AuraDB |
| Vector Search | FAISS + sentence-transformers |
| Agent Framework | CrewAI |
| Frontend | React + Vite + Tailwind CSS |
| Config | Pydantic Settings |

---

## Project Structure

```
ColdCase/
├── backend/
│   ├── agents/
│   │   ├── persona_agent.py       # Per-character LLM persona
│   │   ├── orchestrator.py        # Routes messages, runs contradiction checks
│   │   ├── orchestration/         # Contradiction, evidence, hint, phase logic
│   │   └── prompts/               # System prompts for each character
│   ├── api/
│   │   ├── routes.py              # FastAPI route definitions
│   │   ├── models.py              # Pydantic request/response models
│   │   └── session.py             # In-memory session store
│   ├── scripts/graph/             # Neo4j node/relationship creation scripts
│   ├── config.py                  # All env vars via Pydantic Settings
│   └── main.py                    # FastAPI app + CORS setup
├── frontend/
│   └── src/
│       ├── screens/               # OpeningScene, InterviewRoom, EvidenceBoard,
│       │                          #   CharacterDossier, Corkboard, Accusation
│       ├── components/            # HUD, ProgressMeter, HintCard, ContradictionAlert
│       └── context/               # Session, Hint, Progress React contexts
├── data/
│   ├── characters/characters.json
│   ├── evidence/evidence.json
│   └── hints/                     # active_hints.json, passive_hints.json
├── API_CONTRACT.md
└── requirements.txt
```

---

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Neo4j AuraDB](https://auradb.neo4j.com) free instance
- A [Google AI Studio](https://aistudio.google.com) Gemini API key

### Backend

```bash
# Enter the project directory
cd ColdCase

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Fill in your values in .env
```

Required `.env` variables:

```
GEMINI_API_KEY=your_key_here
NEO4J_URI=neo4j+s://xxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
```

```bash
# Start the backend
uvicorn backend.main:app --reload
# Runs on http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## API Overview

All endpoints are prefixed with `/api/v1`. Full spec in [API_CONTRACT.md](API_CONTRACT.md).

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/interview` | Send a message to a character, receive response + contradiction events |
| `POST` | `/api/v1/evidence` | Submit an evidence item, update game state |
| `GET` | `/api/v1/game-state/{session_id}` | Fetch current phase, found contradictions, unlocked evidence |

Sessions are created automatically on the first `/interview` call and tracked via `session_id`.

---

## Contradictions

There are 7 contradictions (`C1`–`C7`) hidden across character statements and evidence. Exposing contradictions advances the game phase (1–4) and unlocks new dialogue paths.

---

