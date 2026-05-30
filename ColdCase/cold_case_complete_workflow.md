# Cold Case — Complete Development Workflow
# All Phases, All Roles, All Features

---

## 🗂️ Phase 0 — Project Foundation (Hour 0–2, Whole Team)

This phase is done together before splitting into parallel tracks. Everyone needs shared clarity before touching code.

### Step 1 — Freeze the Canonical Truth
Read Section 8 of the story document together as a team. The ground truth is that Julian staged his own collapse and died accidentally through a chain of petty sabotage. Every agent, every graph, and every prompt must be consistent with this truth. Write it on a shared Google Doc visible to everyone during the hackathon. Pin the doc link in your team chat so nobody has to ask for it.

### Step 2 — Lock the Character Knowledge Boundaries
Each character has a specific cutoff — what they knew, when they knew it, and what they are hiding. Assign these cutoff timestamps based on the event timeline in Section 9 of the story document.

- Victor's knowledge freezes after 12:05 AM. He entered the lounge, swapped the drink, and left. He knows nothing after that point.
- Martha's knowledge freezes after 11:18 PM. She filmed, rearranged objects, and left the lounge before Victor arrived.
- Rose's knowledge freezes after 10:20 PM for her own actions. She swapped the VIP kit and left Julian's setup alone after that.
- Hayes and Dr. Collins have progressive knowledge starting from 2:07 AM when they arrived at the scene. They accumulate facts as the investigation unfolds.

Write these cutoff timestamps explicitly in the shared doc. Every fact node created later will reference these times.

### Step 3 — Set Up Shared Infrastructure
One person creates the Git repository on GitHub. Add all three team members as collaborators with write access. Agree on this branching rule: everyone works on their own branch named after their role — `branch/nlp`, `branch/data`, `branch/frontend` — and merges into `main` only at the four sync checkpoints defined later. Never push directly to `main` during active development.

Create the root folder structure immediately so everyone works in the same layout:

```
cold-case/
├── backend/
│   ├── agents/
│   ├── graph/
│   ├── api/
│   └── main.py
├── frontend/
│   └── src/
├── data/
│   ├── schema.cypher
│   ├── characters/
│   │   └── characters.json
│   ├── evidence/
│   │   └── evidence.json
│   └── hints/
│       ├── passive_hints.json
│       └── active_hints.json
├── .env.example
├── .gitignore
├── requirements.txt
└── API_CONTRACT.md
```

### Step 4 — Create the .env.example File
Before anyone writes a single line of code, create a `.env.example` file in the root listing every environment variable the project needs:

```
GEMINI_API_KEY=
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=
NEO4J_DATABASE=neo4j
FRONTEND_URL=http://localhost:5173
```

Add `.env` to `.gitignore` immediately. Every team member copies `.env.example` to `.env` and fills in their own values. API keys pushed to GitHub will be revoked automatically by Google within minutes — do not let this happen during a hackathon.

### Step 5 — Spin Up Neo4j
The data scientist owns this step. Use Neo4j AuraDB free tier — it is cloud-hosted and removes all "it works on my machine" problems. Go to auradb.neo4j.com, create a free instance, and note the connection URI, username, and password. Open Neo4j Browser and run this test query to confirm the database is live:

```cypher
RETURN "Cold Case is live" AS status
```

If a result comes back, the database is working. Share the credentials with all team members via a secure private channel. Confirm all three team members can connect to the same instance before proceeding.

### Step 6 — Confirm Gemini API Access
One person goes to aistudio.google.com, creates a project, generates an API key, and tests it immediately with the simplest possible call — just ask it "say hello" and confirm a response comes back. Confirm that `gemini-1.5-pro` is available. If the free tier only gives `gemini-1.5-flash`, that is acceptable for a hackathon — it is faster. Agree on which model the whole team will use and write it in the shared doc. Mismatched model names cause silent failures at 3 AM.

### Step 7 — Set Up Python Environment
Create `requirements.txt` in the root with all backend dependencies. Everyone installs from it using Python 3.10 or higher. The packages needed are: `fastapi`, `uvicorn`, `google-generativeai`, `langchain-google-genai`, `crewai`, `neo4j`, `faiss-cpu`, `sentence-transformers`, `python-dotenv`, and `pydantic`. Run `pip install -r requirements.txt` and fix any version conflicts now. Do not carry dependency issues past Hour 2.

### Step 8 — Set Up the React App
The full stack engineer runs `npm create vite@latest frontend -- --template react` from the project root. Install all frontend dependencies: `react-router-dom`, `reactflow`, `framer-motion`, `howler`, and `axios`. Configure Tailwind CSS following the official Vite setup guide. Run `npm run dev` and confirm the default page loads on `localhost:5173`. That is the only thing that needs to work right now on the frontend.

### Step 9 — Seed the Shared Data Files
The data scientist creates two files that every part of the system will reference.

`data/characters/characters.json` defines all five characters with their IDs, names, roles, knowledge cutoff timestamps, and a one-line description. The character IDs are: `victor`, `martha`, `hayes`, `dr_collins`, `rose`. These exact strings will be hardcoded across the backend, frontend, and database. Agree on them now and never change them.

`data/evidence/evidence.json` lists all 10 evidence items from Section 10 of the story document. Each item has an `id`, `name`, `description`, `unlocks_at_phase` (integer 1–4), `affects_characters` (list of character ID strings), and `contradiction_ids` (list of contradiction IDs this evidence supports).

### Step 10 — Write the API Contract
All three team members sit together for 20 minutes and write `API_CONTRACT.md` in the root. This file defines exactly what every endpoint receives and returns. It is the contract the full stack engineer builds the UI against and the NLP engineer builds the agents against.

The six endpoints are:

`POST /interview` — receives `{character_id, player_message, session_id}`, returns `{response_text, active_fact_ids, stress_level, contradiction_event, progress, hint_injected}`.

`POST /evidence` — receives `{evidence_id, session_id}`, returns `{game_state, new_contradictions, progress}`.

`GET /game-state/{session_id}` — returns `{phase, questioned_characters, found_contradictions, unlocked_evidence, available_endings, hints_used}`.

`GET /contradictions/{session_id}` — returns all contradiction events found so far, each with `{contradiction_id, characters, claim_a, claim_b}`.

`POST /hint` — receives `{session_id}`, returns `{hint_text, cooldown_remaining, hints_used}`.

`POST /accusation` — receives `{session_id, ending_choice}`, returns `{ending_text, score, hints_used_note, full_truth_reveal}`.

### Step 11 — Final Alignment Check
Before anyone opens their code editor, spend 10 minutes answering these questions out loud as a team. Does everyone have a working `.env` file with real credentials? Does everyone agree on all six character IDs? Does everyone know what every API endpoint returns? Does the data scientist know which facts belong to which character? Does the NLP engineer know they are building Victor's agent first? Does the full stack engineer know they are building the FastAPI shell and the opening crime scene first? If any answer is uncertain, resolve it now. Unresolved ambiguity at Hour 2 becomes a two-hour debugging session at Hour 14.

---

## 🗃️ Data Scientist Workflow — Knowledge Graph Build (Hour 2–17)

---

### Hour 2–4: Schema Design

#### Step 1 — Define Node Types
You need six node types. `Character` represents each of the five suspects and investigators. `Fact` represents a single piece of knowledge that belongs to a character — this is the core unit of the RAG system. `Evidence` represents a physical clue the player can find and submit. `Event` represents a timestamped action that happened during the night. `Object` represents a physical item in the scene. `Location` represents a place in the hackathon venue.

Every story element maps to one of these. The judges' lounge is a Location. The keycap trophy is an Object. Victor swapping the drink at 12:05 AM is an Event. "Victor entered the judges' lounge" is a Fact belonging to Victor.

#### Step 2 — Define Relationship Types
The six core relationships are:

`KNOWS` connects a Character to a Fact. It carries `known_since` (timestamp) and `will_reveal` (boolean). This is the most important relationship in the entire system — it defines the temporal boundary of each character's knowledge.

`WITNESSED` connects a Character to an Event. Used for things characters directly saw happen.

`TOUCHED` connects a Character to an Object. Used to track physical interactions Martha and Victor had with items in the lounge.

`CONTRADICTS` connects a Fact to another Fact. Pre-mapped during graph population to power the contradiction engine.

`CONNECTED_TO` connects an Evidence node to the Facts it supports or reveals. When evidence is submitted, the system walks this relationship to determine which facts become newly known.

`PART_OF` connects an Event to the master Timeline node. Keeps all events chronologically ordered.

#### Step 3 — Define Fact Node Properties
Every Fact node needs exactly these properties:

- `id` — unique string, format `fact_{character_id}_{number}`, example `fact_victor_001`
- `content` — plain English statement of the fact, example "Victor entered the judges' lounge at 12:05 AM"
- `known_since` — ISO 8601 timestamp from the Section 9 timeline
- `source` — how the character learned this, example "direct experience", "overheard", "observed"
- `confidence` — float 0.0 to 1.0, lower for things the character is uncertain about
- `is_lie` — boolean, true for facts the character actively denies or misrepresents
- `embedding` — float array, populated later by the embedding script, null at creation time
- `character_id` — which character this fact belongs to, for fast filtering

#### Step 4 — Define KNOWS Relationship Properties
Beyond the Fact node properties, every KNOWS edge carries:

- `known_since` — timestamp (mirrors the Fact property, here for fast indexed queries)
- `certainty` — string enum: "certain", "suspected", or "rumored"
- `will_reveal` — boolean, false for facts the character hides under normal questioning, true for facts they would volunteer

#### Step 5 — Write the Cypher Schema File
Create `data/schema.cypher` with all constraints and indexes. Run this file first every time you reset the database.

```cypher
CREATE CONSTRAINT character_id_unique IF NOT EXISTS
FOR (c:Character) REQUIRE c.id IS UNIQUE;

CREATE CONSTRAINT fact_id_unique IF NOT EXISTS
FOR (f:Fact) REQUIRE f.id IS UNIQUE;

CREATE CONSTRAINT evidence_id_unique IF NOT EXISTS
FOR (e:Evidence) REQUIRE e.id IS UNIQUE;

CREATE FULLTEXT INDEX fact_content_index IF NOT EXISTS
FOR (f:Fact) ON EACH [f.content];

CREATE VECTOR INDEX fact_embedding_index IF NOT EXISTS
FOR (f:Fact) ON (f.embedding)
OPTIONS {indexConfig: {`vector.dimensions`: 768, `vector.similarity_function`: 'cosine'}};
```

---

### Hour 4–8: Populating All 5 Character Graphs

#### Step 6 — Victor's Knowledge Graph (~18 Facts)
Create the Victor Character node first:

```cypher
CREATE (:Character {
  id: "victor",
  name: "Victor",
  role: "Finalist Team Captain",
  knowledge_cutoff: "2024-01-15T00:05:00",
  stress: 0.3
});
```

Then create his Fact nodes in three categories.

**Facts he knows and will partially admit (will_reveal: true, is_lie: false):**
- Julian publicly humiliated his team during practice demos at 9:45 PM
- Julian implied Victor's team might not deserve finals
- Julian was acting theatrical and dramatic before the collapse
- Julian had been drinking the sponsor energy drink when Victor last saw him
- Victor has strong competitive feelings about the judging process

**Facts he knows but actively lies about (is_lie: true, will_reveal: false):**
- Victor entered the judges' lounge at 12:05 AM
- Victor swapped Julian's premium cold brew with an ultra-caffeinated sponsor energy drink
- Victor sent a text message reading "Let him survive finals on 400mg caffeine"
- Victor called this action "competitive correction" in his own mind
- Victor touched the drink station during his time in the lounge

**Facts Victor genuinely does not know (do not create these in his graph — their absence is the point):**
- Martha moved Julian's inhaler and pill case
- Julian was planning a fake collapse stunt
- The sticky note was written by Julian himself
- Dr. Collins warned Julian to slow down at 12:20 AM
- Rose swapped Julian's VIP kit

All Victor's Fact nodes get `known_since: "2024-01-15T00:05:00"` or earlier based on the Section 9 timeline. Connect all Victor facts to Victor with KNOWS relationships.

#### Step 7 — Martha's Knowledge Graph (~18 Facts)
Create Martha's Character node with `knowledge_cutoff: "2024-01-14T23:18:00"`.

**Facts she knows and will partially admit:**
- She entered the judges' lounge at 11:15 PM to film a behind-the-scenes reel
- Julian looked stressed and theatrical when she saw him
- She saw Victor near the drink station area earlier in the evening
- Julian had been making harsh comments about the event branding all night
- The lounge was somewhat disorganized when she arrived

**Facts she knows but actively lies about (is_lie: true):**
- She rearranged objects in the lounge for aesthetic purposes while filming
- She moved Julian's inhaler from its original location
- She moved Julian's pill case to a different surface
- She moved the novelty keyboard trophy to a more photogenic spot
- Her behind-the-scenes reel contains footage showing the rearrangement
- She was not a passive observer — she was actively interacting with the room

**Facts Martha genuinely does not know:**
- Victor swapped Julian's drink
- Julian planned a fake collapse
- The drink contained ultra-high caffeine
- Dr. Collins had warned Julian earlier

Martha's knowledge cutoff is 11:18 PM. All her lounge-related facts get `known_since: "2024-01-14T23:18:00"`.

#### Step 8 — Detective Hayes' Knowledge Graph (~20 Facts)
Create Hayes' Character node with `knowledge_cutoff: "2024-01-15T02:07:00"` as a starting point, with facts accumulating progressively as the investigation unfolds.

**Facts Hayes knows from arriving at the scene:**
- Julian Byte was found collapsed at 2:07 AM in the judges' lounge
- The scene shows signs of having been tampered with before his arrival
- Multiple objects in the lounge are not in their expected positions
- The sticky note reading "THIS DEMO WILL KILL" was found beside the body
- The sticky note does not match the typical profile of a murder threat
- Multiple people present have plausible motives to dislike Julian
- The cause of death does not fit a straightforward poisoning pattern
- At least two people are lying in small but detectable ways
- A sponsor energy drink can was found near the body rather than Julian's usual cold brew

**Facts Hayes holds back strategically (will_reveal: false):**
- He already suspects this was not a deliberate murder
- He believes multiple independent actions converged accidentally
- He thinks the sticky note may have been written by Julian himself
- He wants more evidence before committing to any theory publicly

Hayes has the widest knowledge of any character and should feel like the most reliable source — but he strategically withholds his conclusions to avoid suspects coordinating their stories.

#### Step 9 — Dr. Collins' Knowledge Graph (~15 Facts)
Create Dr. Collins' Character node with `knowledge_cutoff: "2024-01-15T02:07:00"`.

**Facts he knows from medical observation:**
- Julian appeared overstimulated at 12:20 AM when Collins warned him to slow down
- Collins warned Julian specifically about caffeine intake that night
- The cause of death involved more than simple poisoning
- Caffeine overload was a contributing factor to the collapse
- Stress-triggered breathing difficulty played a role
- Airway obstruction was a significant factor in the final cause of death
- The medical picture is significantly more complex than the group assumes
- Julian had a history of ignoring medical advice

**Facts Collins holds back until evidence is presented (will_reveal: false until triggered):**
- The full chain: caffeine overload + missing inhaler + keycap airway obstruction
- That Julian likely choked on the detachable keycap from the novelty trophy
- That the combination of Victor's drink swap, Martha's inhaler move, and Julian's own trophy handling converged fatally

Collins should only confirm the full chain after the player presents him with the energy drink can AND the broken keycap trophy. Until then, he hints at complexity without confirming the absurdity.

#### Step 10 — Rose's Knowledge Graph (~16 Facts)
Create Rose's Character node with `knowledge_cutoff: "2024-01-14T22:20:00"` for her direct actions, though she observed the chaos until 2:07 AM.

**Facts she knows and will partially admit:**
- Julian demanded special VIP treatment all evening
- Julian made complaints about the food and judging setup at 10:05 PM
- Julian hinted at a dramatic reveal during the event — something about "making it unforgettable"
- The hackathon was already running in chaos before Julian's collapse
- Julian had conflicts with multiple teams throughout the evening

**Facts she knows but actively lies about (is_lie: true):**
- She swapped Julian's VIP judge snack kit with a regular participant snack bag at 10:20 PM
- The VIP kit contained Julian's preferred medications and specific snacks
- She made this swap deliberately because she was tired of his attitude
- She knew the regular snack bag did not contain what Julian expected

**Facts Rose genuinely does not know:**
- Victor swapped the drink
- Martha moved the inhaler specifically
- The keycap caused airway obstruction
- Julian was planning a fake collapse (she only knew he planned "something dramatic")

---

### Hour 8–11: Embeddings

#### Step 11 — Write the Embedding Script
Create `backend/graph/embed_facts.py`. This script connects to Neo4j, fetches all Fact nodes that have a null embedding, sends each `fact.content` string to the Google Embedding API (`models/embedding-001`), receives a 768-dimension vector, and writes it back to the node using a `SET f.embedding = $vector` Cypher query. Process facts in batches of 10 to avoid rate limiting. Log progress so you can see it running.

#### Step 12 — Run the Embedding Script
With approximately 87 facts total across all five characters, the script should complete in under 3 minutes. After it finishes, open Neo4j Browser and run:

```cypher
MATCH (f:Fact) WHERE f.embedding IS NULL RETURN count(f)
```

The result should be zero. If any facts still have null embeddings, check the error log from the script and rerun for the failed nodes only.

#### Step 13 — Build the FAISS Index
Create `backend/graph/faiss_index.py`. Load all embeddings from Neo4j into memory. Build a FAISS `IndexFlatL2` index from the embedding vectors. Critically, maintain a parallel list that maps each FAISS index position to its corresponding Neo4j Fact node ID. Without this mapping, you will get vectors back from FAISS with no way to know which facts they correspond to. Save both the FAISS index and the ID mapping to disk so they can be loaded at server startup without re-querying Neo4j every time.

#### Step 14 — Write and Test the Semantic Search Function
Create `backend/graph/search.py` with a function `semantic_search(query, character_id, before_timestamp, top_k=5)`. This function does four things in sequence:

First, embed the query string using the same Google Embedding API. Second, search the FAISS index for the top 20 nearest neighbors. Third, filter those 20 results to only facts where `character_id` matches and `known_since` is earlier than or equal to `before_timestamp`. Fourth, return the top 5 filtered results as a list of fact content strings.

Test this function with the query "did you enter the lounge" against Victor with his cutoff timestamp. Confirm it returns his alibi-related facts. Test it with a query about events after his cutoff timestamp — confirm those facts are excluded.

---

### Hour 11–14: Mystery QA

#### Step 15 — Full Playthrough as a Naive Player
Go through the 11-step demo flow in Section 16 of the story document manually. For each step, run the semantic search function directly in Python (not through the full agent yet) and inspect the results. Verify Victor returns his denial facts when asked about the lounge. Verify Martha returns her "I didn't touch anything" facts when asked about the room. Verify Hayes expresses skepticism about the poison theory. Verify Collins hints at a non-standard cause of death.

#### Step 16 — Verify All 7 Contradictions Are Detectable
Go through each contradiction listed in Section 11 of the story document. For each one, confirm that both sides of the contradiction exist as Fact nodes in the correct character graphs. Contradiction 1 requires Victor's "I never entered the lounge" lie fact AND a fact in Hayes' graph that Victor was seen entering. Contradiction 3 requires Martha's "I never touched anything" lie fact AND a fact connected to her reel evidence showing she rearranged objects. If either side of any contradiction is missing, create the missing fact node and re-run the embedding script for that node only.

#### Step 17 — Verify the Case Is Solvable in Under 20 Questions
Conduct a timed playthrough where you ask no more than 20 questions total across all characters. The player should be able to reach the Best Ending within this limit. If it takes more than 20 questions, identify which connections are too obscure and add bridging fact nodes that make them more discoverable through natural language questions.

#### Step 18 — Fix Any Plot Holes
Check every character's graph for facts they should not know. Victor must not know about the missing inhaler. Martha must not know about the drink swap. Rose must not know the specific cause of death. If any character has facts outside their logical knowledge boundary, either delete those fact nodes or push their `known_since` timestamp past the character's cutoff date so they are filtered out by the temporal constraint.

---

### Hour 14–17: Evidence Nodes, Progress Data, and Hint Data

#### Step 19 — Create Evidence Nodes for All 10 Items
Each of the 10 evidence items from Section 10 becomes an Evidence node in Neo4j. Properties needed: `id` (example: `evidence_camera_timestamp`), `name`, `description`, `unlocks_at_phase` (integer 1–4), `affects_characters` (list of character ID strings), `contradiction_ids` (list of contradiction IDs this evidence supports), and `is_unlocked` (boolean, default false).

The 10 evidence items and their unlock phases are:
- Sticky Note → Phase 1
- Lounge Camera Timestamp → Phase 1
- Sponsor Energy Drink Can → Phase 2
- Martha's Behind-the-Scenes Reel → Phase 2
- Missing Inhaler → Phase 2
- Broken Keyboard Keycap Trophy → Phase 3
- Judge Scoring Sheet with Angry Notes → Phase 1
- Organizer Checklist Showing VIP Kit Swap → Phase 3
- Victor's Text Message → Phase 2
- Julian's "Tonight's reveal will be unforgettable" Message → Phase 3

#### Step 20 — Write Cypher Queries for Evidence Ingestion
For each evidence item, write a specific Cypher query that fires when the player submits it. Each query creates new KNOWS relationships between affected characters and new or existing Fact nodes. For example, submitting the Camera Timestamp evidence runs:

```cypher
MATCH (h:Character {id: "hayes"})
MERGE (f:Fact {id: "fact_hayes_camera_victor"})
SET f.content = "Camera timestamp confirms Victor entered the judges lounge at 12:05 AM",
    f.known_since = $submission_timestamp,
    f.source = "camera evidence",
    f.confidence = 1.0,
    f.is_lie = false,
    f.character_id = "hayes"
MERGE (h)-[:KNOWS {known_since: $submission_timestamp, certainty: "certain", will_reveal: true}]->(f)
```

Write and test all 10 of these ingestion queries before moving to integration.

#### Step 21 — Create the Progress Pivot Moments Data
Create `data/progress_pivots.json`. Define the four key pivot moments that grant a one-time 10-point bonus to the progress score:

- `JULIAN_PLANNED_COLLAPSE` — triggered when Hayes responds to a question about the sticky note and mentions it may not be a murder threat. Detection condition: the player has asked Hayes about the sticky note AND Hayes' stress is above 0.4.
- `KEYCAP_AIRWAY_CONNECTION` — triggered when Dr. Collins confirms airway obstruction after the keycap trophy evidence is submitted. Detection condition: keycap trophy evidence has been submitted AND Collins has been questioned this session.
- `DRINK_SWAP_CONFIRMED` — triggered when Victor's text message evidence is submitted. Detection condition: evidence ID `evidence_victor_text` is submitted.
- `MARTHA_REEL_CONFIRMED` — triggered when Martha's reel evidence is submitted. Detection condition: evidence ID `evidence_martha_reel` is submitted.

Each pivot moment can only fire once per session. Track which have fired in the session game state.

#### Step 22 — Create the Progress Flavor Text Data
Create `data/progress_flavor_text.json`. Write 5 flavor text strings per score range. The tone should be noir-serious about an absurd hackathon murder.

Score range 0–25 ("Cold Trail"): strings like "The lounge holds its secrets tightly. Start with the people who were there." and "Someone in this building is lying about something small that matters enormously."

Score range 26–50 ("Something's Off"): strings like "The stories don't quite fit together yet, but the edges are starting to show." and "At least one person in this room is pretending their memory is worse than it is."

Score range 51–75 ("You're Onto Something"): strings like "The contradictions are mounting. Someone's alibi has a hole in it." and "The doctor's hesitation is telling. He knows more than he's saying about the cause of death."

Score range 76–90 ("Getting Dangerous"): strings like "You're close. The truth is stranger than anyone has admitted." and "Connect what Victor did, what Martha moved, and what Julian planned. The answer is in the overlap."

Score range 91–100 ("You Know the Truth"): strings like "You have everything. The only question is how to explain the most absurd death in hackathon history." and "Julian Byte tried to steal the show. The show had other ideas."

#### Step 23 — Create the Passive Hints Data
Create `data/hints/passive_hints.json`. Organize it by character ID, then by trigger type. Each character has 4 trigger types with 3 hint strings each.

**Victor's passive hints:**

`stuck_on_suspect` (player has asked Victor more than 5 questions without finding a contradiction): "Look, I'm not the only person who had a reason to be unhappy with Julian tonight. Have you talked to the organizer?" / "I'm telling you what I know. Maybe you should ask the woman who was filming everything." / "There were a lot of people in and out of that lounge. I wasn't the only one."

`too_early_accusation` (player tries to accuse in Phase 1 or 2): "You're jumping to conclusions. Classic mistake. Even I know you need more evidence than that." / "That's a bold theory. You're missing about three more pieces of the puzzle." / "Come on. Even Julian deserved better detective work than that."

`not_spreading` (player has only questioned one or two characters): "I feel like you're fixated on me when there's a whole building of people here." / "Maybe talk to Hayes. He actually investigated the scene, unlike some people." / "You're asking me the same questions in different orders. Try a different suspect."

`phase_stalled` (player stuck in Phase 1 for 15+ questions): "The camera near the lounge entrance. That's all I'm going to say." / "Someone moved things in that room. It wasn't me." / "Julian was performing for someone that night. Find out who."

Write equivalent hint strings for Martha, Hayes, Dr. Collins, and Rose in the same structure. Hayes' hints should sound like a tired detective dropping clues. Collins' hints should sound clinical and understated. Rose's hints should sound like an exhausted organizer who is tired of everyone's drama.

#### Step 24 — Create the Active Hints Data
Create `data/hints/active_hints.json`. Organize by phase. Each phase has 5 hint strings pointing toward the next key discovery, written to be vague enough to guide direction without solving the puzzle.

Phase 1 hints: "Someone entered the lounge after 11 PM. The building's camera system knows who." / "Julian's drink was not what it appeared to be. Check what was left near the drink station." / "Start with the people who were physically in the lounge that night." / "The sticky note is not what it looks like. Julian wrote it himself." / "Ask Hayes what the crime scene actually tells him. He's holding something back."

Phase 2 hints: "Martha's reel shows more than she admits. Watch what she moved." / "Victor's phone contains a message that explains everything about the drink." / "The inhaler was not where Julian expected it to be. Who moved it?" / "Ask Dr. Collins what he warned Julian about at 12:20 AM." / "Rose's logistics checklist shows she changed Julian's setup. Ask her about the VIP kit."

Phase 3 hints: "The trophy is not just a trophy. Look at it closely." / "Dr. Collins needs the physical evidence before he will tell you the full story. Bring him something." / "Connect the drink swap, the missing inhaler, and the broken trophy. They are not three separate problems." / "Julian was planning a dramatic moment. The sticky note was his own script." / "Ask Dr. Collins specifically about airway obstruction."

Phase 4 hints: "This was not a murder in the traditional sense. Multiple people made small, stupid decisions independently." / "Julian staged the collapse. Everyone else accidentally made it real." / "The best ending requires you to explain what each of the three people did and how they connected." / "Victor, Martha, and Rose each did something petty. None of them planned to kill anyone." / "The final answer involves a keycap, a missing inhaler, and 400mg of caffeine."

#### Step 25 — Integration Support
From Hour 17 onward, be available to the NLP engineer and full stack engineer for graph debugging. Common issues to watch for: incorrect `known_since` timestamps that filter out facts too aggressively, missing CONTRADICTS relationships between fact nodes, and evidence ingestion queries that create duplicate fact nodes instead of merging. Run `MATCH (f:Fact) RETURN f.character_id, count(f)` periodically to confirm node counts are stable.

---

## 🧠 NLP Engineer Workflow — Agent System (Hour 2–22)

---

### Hour 2–5: Single Persona Agent

#### Step 1 — Install Dependencies
Run: `pip install google-generativeai langchain-google-genai crewai neo4j faiss-cpu sentence-transformers python-dotenv`

Confirm each package imports without error in a test Python file before writing any agent code.

#### Step 2 — Write the Neo4j Query Tool for Gemini Function Calling
Create `backend/agents/tools.py`. Define a Python function `query_character_knowledge(character_id, query, before_timestamp)` that calls the `semantic_search` function built by the data scientist and returns a formatted list of relevant fact strings. Wrap this function as a Gemini function calling tool by defining its JSON schema explicitly:

```python
query_tool = {
    "name": "query_character_knowledge",
    "description": "Retrieves facts this character knows, filtered by their knowledge cutoff date",
    "parameters": {
        "type": "object",
        "properties": {
            "character_id": {"type": "string"},
            "query": {"type": "string"},
            "before_timestamp": {"type": "string", "format": "date-time"}
        },
        "required": ["character_id", "query", "before_timestamp"]
    }
}
```

#### Step 3 — Write the Claim Logger Tool
In `backend/agents/tools.py`, define a global in-memory dictionary `claims_store = {}` keyed by session ID, then by character ID, containing a list of logged claim strings. Write `log_claim(session_id, character_id, claim_text, question_asked)` that appends a new claim entry to this store. This is the raw material the contradiction engine compares across characters.

#### Step 4 — Write Victor's Identity System Prompt
Create `backend/agents/prompts/victor_prompt.py`. Write a detailed system prompt covering six areas:

**Identity:** You are Victor, a finalist team captain at a university hackathon. You are being questioned about the collapse of judge Professor Julian Byte at approximately 2:07 AM.

**Personality:** You are confident, dramatic, competitive, and have startup-bro energy. You genuinely believe your project deserves to win. You call sabotage "competitive correction." You are performatively cooperative while hiding what you did.

**Speech patterns:** You speak in business-casual startup language. You use phrases like "objectively speaking," "to be transparent," and "from a strategic standpoint." You are slightly too smooth when lying.

**Temporal boundary:** You have no knowledge of events after 12:05 AM. If asked about anything after that time, you respond with genuine confusion or deflect naturally in character. Do not hallucinate post-cutoff information.

**What you are hiding:** You entered the judges' lounge at 12:05 AM and swapped Julian's cold brew with an ultra-caffeinated sponsor energy drink. You sent a text message about it. You will deny both of these facts under all normal questioning.

**Stress response:** When your stress level is above 0.7, you become slightly less smooth. You over-explain. You reference your "competitive correction" framing more defensively. You may let small details slip that you would normally suppress.

#### Step 5 — Instantiate Victor as a Gemini Agent
Create `backend/agents/persona_agent.py`. Write a `PersonaAgent` class with these attributes: `character_id`, `model` (Gemini instance), `system_prompt`, `knowledge_cutoff`, `stress` (float starting at 0.3), `session_history` (list for multi-turn context). Write a `respond(player_message, session_id)` method that builds the full prompt including the current stress level context, calls the Gemini model with the query tool attached, handles the function call response by actually running `query_character_knowledge`, then generates the final character response using the retrieved facts as context.

Instantiate Victor and send the test message: "Did you enter the judges' lounge tonight?" Verify he denies it and that the tool call fetches his alibi-related facts from Neo4j.

#### Step 6 — Test Temporal Constraint
Ask Victor: "What happened after 1 AM?" He should respond with uncertainty or in-character deflection. If he hallucinates events after 12:05 AM, add this explicit rule to his system prompt: "You have absolutely no knowledge of what happened after 12:05 AM. If asked about any event after that time, respond naturally in character with 'I don't know what happened after I left' or similar. Never invent details about events you were not present for."

---

### Hour 5–8: All 5 Persona Agents

#### Step 7 — Write System Prompts for All Remaining Characters
Create individual prompt files for each character in `backend/agents/prompts/`.

**Martha's prompt:** You are Martha, the volunteer social media lead. You are chaotic, chatty, and always online. You are defensively certain your memory is perfect even though you missed major details. You use social media vocabulary. You call your rearrangement of the room "preserving the event vibe." Your cutoff is 11:18 PM — you left the lounge before Victor arrived and have no knowledge of the drink swap. You will deny touching anything in the lounge under all normal questioning.

**Hayes' prompt:** You are Detective Hayes, a campus security officer. You speak like you are investigating a cartel assassination even though the suspects are exhausted student hackers. You are tired, serious, and noir. You have already formed a theory but you are not sharing it yet. You drop hints through rhetorical observations rather than direct statements. Your goal is to guide the player toward the truth without handing it to them. You genuinely do not know the full medical picture — that is Collins' domain.

**Dr. Collins' prompt:** You are Dr. Collins, the medical judge and on-call doctor. You are calm, clinical, and have dry humor. You explain genuinely absurd medical situations with complete seriousness. You know the cause of death was not simple poisoning but you will not confirm the full chain — caffeine overload, missing inhaler, keycap airway obstruction — until the player presents you with the physical evidence. Until then, you express measured skepticism about the poison theory and hint that the medical picture is "more complex than it first appears."

**Rose's prompt:** You are Rose, the lead organizer of the hackathon. You are smart, exhausted, and completely unimpressed by everyone's drama. You are practical. You speak in short, tired sentences. You are hiding the VIP kit swap but are not particularly guilty about it — you believe Julian deserved worse. Your famous line is "I did not kill him. I merely downgraded his snacks." You will use variations of this framing when defending yourself.

#### Step 8 — Instantiate All 5 Agents
In `backend/agents/agent_registry.py`, instantiate all five PersonaAgent objects and store them in a dictionary: `agents = {"victor": victor_agent, "martha": martha_agent, "hayes": hayes_agent, "dr_collins": collins_agent, "rose": rose_agent}`. This registry is the single point of access for all agent instances. Every other part of the backend imports from here.

#### Step 9 — Test All 5 Agents Independently
Before building the orchestrator, test each agent with 3 targeted questions. For Victor: ask about the lounge, ask about the drink, ask about his feelings toward Julian. For Martha: ask about the lounge, ask about what she filmed, ask what she saw. For Hayes: ask about the cause of death, ask about the sticky note, ask if anyone is lying. For Collins: ask about Julian's condition, ask about the cause of death, ask what he would need to confirm his theory. For Rose: ask about Julian's VIP setup, ask about what she changed, ask what Julian told her about his plans. Log all 15 responses and flag any that are out of character, temporally incorrect, or that reveal too much too early.

---

### Hour 8–12: Orchestrator Agent

#### Step 10 — Write the Orchestrator System Prompt
Create `backend/agents/prompts/orchestrator_prompt.py`. The orchestrator is the Game Master. It is not a character. It knows the full canonical ground truth from Section 8 of the story document. Its job is to manage the game session, route player messages to the correct persona agent, control what evidence is available at each phase, prevent the full solution from leaking before the player earns it, and manage the progress meter and hint system.

The orchestrator never speaks directly to the player. It operates entirely through tools and state management. Its system prompt should be written in procedural language — a set of rules, not a personality.

#### Step 11 — Build the `route_to_persona` Tool
In `backend/agents/orchestrator.py`, write `route_to_persona(character_id, player_message, session_id)`. This function looks up the correct PersonaAgent from the agent registry, calls `agent.respond(player_message, session_id)`, logs the resulting claim through `log_claim`, updates the session's `questioned_characters` list if this is the first time this character has been questioned, and returns the full response object including the response text, active fact IDs used, and the character's current stress level.

#### Step 12 — Build the `unlock_evidence` Tool
Write `unlock_evidence(session_id)` in the orchestrator. This function checks the current phase from session state and queries `data/evidence/evidence.json` for all items whose `unlocks_at_phase` matches the current phase or lower. Returns the full list of evidence items the player currently has access to. Called every time the phase advances and on initial game state load.

#### Step 13 — Build the `check_contradiction` Tool
This is the most important function in the entire system. Write `check_contradiction(new_claim, character_id, session_id)` in the orchestrator.

The function does the following in sequence: First, embed the new claim using the Google Embedding API. Second, loop through all claims logged for all other characters in this session from the claims store. Third, for each other character's claim, compute cosine similarity between the new claim embedding and the stored claim embedding. Fourth, if similarity exceeds 0.75 (meaning the claims are about the same topic) AND a semantic opposition check returns true (meaning the claims conflict — one affirms what the other denies), fire a ContradictionEvent. Fifth, the ContradictionEvent object contains: `contradiction_id` (matched against the 7 pre-defined contradiction IDs from Section 11), `characters` (the two character IDs), `claim_a` (the earlier claim), `claim_b` (the new claim), `timestamp`. Sixth, append the event to the session's `found_contradictions` list. Seventh, increase the stress level of both involved characters by 0.15.

For the semantic opposition check, use a simple Gemini call: send both claims as context and ask "Do these two statements contradict each other? Answer only YES or NO." This is cheaper and more accurate than trying to engineer a pure embedding-based opposition detector.

#### Step 14 — Build the `get_game_state` Tool
Write `get_game_state(session_id)` that returns the full current session state: `phase`, `questioned_characters`, `found_contradictions` (list of ContradictionEvent objects), `unlocked_evidence`, `available_endings`, `hints_used`, `progress_score`, and `pivot_moments_triggered`. This is the single source of truth for the frontend's game state.

#### Step 15 — Build the `advance_phase` Logic
Write `advance_phase(session_id)` that checks the current phase and applies the advancement conditions:

Phase 1 advances to Phase 2 when: Hayes has been questioned AND at least one of Victor or Martha has been questioned.

Phase 2 advances to Phase 3 when: at least 2 contradictions have been found in this session.

Phase 3 advances to Phase 4 when: Rose has been questioned AND Dr. Collins has been questioned.

Phase 4 advances to Phase 5 (accusation available) when: the player clicks "Make Accusation." Phase 5 is the ending resolution phase.

Call `advance_phase` at the end of every `route_to_persona` call and every `POST /evidence` call.

#### Step 16 — Wire the Orchestrator to All 5 Agents
The orchestrator should be the only entry point for all player interactions. The FastAPI `/interview` endpoint calls the orchestrator's `route_to_persona` tool. The `/evidence` endpoint calls the orchestrator's evidence ingestion and graph update logic. The `/hint` endpoint calls the orchestrator's hint selection logic. No FastAPI endpoint should call a PersonaAgent directly.

---

### Hour 12–16: Contradiction Engine + Stress System + Progress Meter + Hint System

#### Step 17 — Build the Contradiction Detection Pipeline End-to-End
Run a scripted test conversation to verify the full pipeline. First, call Victor with "Did you enter the judges' lounge?" — he denies it, the claim "I never entered the judges' lounge" is logged for Victor. Second, submit the Camera Timestamp evidence — this adds the fact "Victor entered the lounge at 12:05 AM" to Hayes' graph. Third, call Hayes with "Did anyone enter the lounge last night?" — Hayes confirms Victor did, the claim "Victor entered the judges' lounge at 12:05 AM" is logged for Hayes. Fourth, the check_contradiction function runs, detects that Victor's denial and Hayes' confirmation oppose each other, fires ContradictionEvent with `contradiction_id: "C1"`. Verify this event appears in the session's `found_contradictions` list.

Repeat this test for all 7 contradictions from Section 11. Document which ones pass and which need debugging.

#### Step 18 — Build the Stress Modulation System
In the PersonaAgent class, add a `update_stress(delta)` method that clamps the result between 0.0 and 1.0. When a ContradictionEvent fires involving a character, call `agent.update_stress(0.15)` for both involved characters. In the `respond()` method, before constructing the final prompt, check the current stress level. If stress exceeds 0.7, append this instruction to the system prompt for this response only: "You are becoming visibly flustered. Your composure is slipping slightly. You may over-explain, use your defensive catchphrases more than usual, and accidentally let small details through that you would normally suppress."

#### Step 19 — Build the `calculate_progress_score` Function
Create `backend/agents/progress.py`. Write `calculate_progress_score(game_state)` using the weighted formula:

```
contradictions_score = len(found_contradictions) * 8        # max 56
characters_score = len(questioned_characters) * 4           # max 20
evidence_score = len(submitted_evidence) * 2                # max 20
phase_bonus = {1: 0, 2: 5, 3: 10, 4: 15, 5: 20}[phase]
pivot_bonus = len(triggered_pivots) * 10                    # max 40

raw_score = contradictions_score + characters_score + evidence_score + phase_bonus + pivot_bonus
normalized = min(100, int((raw_score / 121) * 100))
```

Return the normalized 0–100 integer.

#### Step 20 — Build the `should_show_meter` Function
Write `should_show_meter(session_state)` in `progress.py`. The function returns True only when all four conditions are met: a random roll between 0.0 and 1.0 is greater than 0.65, at least 30 seconds have passed since the meter last appeared (check `session_state.last_meter_shown_timestamp`), the current score is different from the score when the meter last appeared (check `session_state.last_meter_score`), and the meter is not being suppressed by a passive hint firing on this same action (check `session_state.suppress_progress_meter` flag).

Additionally, force `should_show_meter` to return True regardless of the random roll at three specific moments: when `len(found_contradictions) == 1` for the first time, when the phase advances to 3 for the first time, and when the player submits their final accusation.

#### Step 21 — Build the `get_progress_label` and `get_flavor_text` Functions
Write `get_progress_label(score)` that maps score ranges to labels: 0–25 returns "Cold Trail", 26–50 returns "Something's Off", 51–75 returns "You're Onto Something", 76–90 returns "Getting Dangerous", 91–100 returns "You Know the Truth".

Write `get_flavor_text(score)` that loads `data/progress_flavor_text.json`, finds the correct score range bucket, and returns a randomly selected string from that bucket's array. Use `random.choice()`. The same flavor text should never appear twice in the same session — track shown flavor texts in session state and filter them out before selecting.

#### Step 22 — Build the `wrong_direction_detector` Function
Create `backend/agents/hints.py`. Write `wrong_direction_detector(game_state, session_history)` that checks four conditions and returns a `wrong_direction_score` integer starting at 0:

Condition 1 — Add 1 if the player's last 5 questions were all directed at the same character without finding a contradiction.

Condition 2 — Add 1 if the player has asked more than 8 total questions but has only questioned 1 or 2 different characters.

Condition 3 — Add 1 if the player attempted to submit an accusation while in Phase 1 or Phase 2.

Condition 4 — Add 1 if the player has been in Phase 1 for more than 15 questions total without finding any contradiction.

When `wrong_direction_score >= 2`, a passive hint should fire on the next response.

#### Step 23 — Build the `get_passive_hint` Function
Write `get_passive_hint(character_id, trigger_type, session_state)` in `hints.py`. Load `data/hints/passive_hints.json`. Look up the array for this character ID and trigger type. Filter out any hint strings already shown in this session (tracked in `session_state.shown_passive_hints`). Return a randomly selected remaining hint string. Add it to the shown list.

This hint string is not returned as a separate field — it is appended to the end of the character's normal response text by the `route_to_persona` function, separated by a line break, so it reads as part of the character's natural dialogue.

When a passive hint fires, set `session_state.suppress_progress_meter = True` for this action. Reset the flag to False on the next action.

#### Step 24 — Build the `POST /hint` Endpoint Logic
Write `get_active_hint(session_id)` in `hints.py`. This function is called when the player explicitly requests a hint.

First, check the cooldown. If fewer than 90 seconds have passed since the last active hint was given (tracked in `session_state.last_hint_timestamp`), return `{hint_text: None, cooldown_remaining: seconds_remaining, hints_used: current_count}`.

If not on cooldown, determine which hint to give. Load `data/hints/active_hints.json`. Select the correct phase array. Filter out hints that point toward evidence the player has already submitted or contradictions already found. Select a random remaining hint from the filtered array. Increment `session_state.hints_used`. Update `session_state.last_hint_timestamp`. Return `{hint_text: selected_hint, cooldown_remaining: 0, hints_used: updated_count}`.

#### Step 25 — Test All 7 Contradictions End-to-End
Write a test script in `backend/tests/test_contradictions.py` that runs all 7 contradiction scenarios by scripting the exact sequence of character questions and evidence submissions that should trigger each one. For each contradiction, assert that a ContradictionEvent with the correct `contradiction_id` appears in the session state afterward. All 7 must pass before moving to integration.

---

### Hour 16–22: Integration, Tuning, Stress Testing

#### Step 26 — Connect All Agents to FastAPI Endpoints
In `backend/api/routes.py`, implement all six endpoints using the orchestrator as the single intermediary. The `/interview` endpoint calls `orchestrator.route_to_persona()`, then calls `calculate_progress_score()`, then calls `should_show_meter()`, then calls `wrong_direction_detector()`, then conditionally calls `get_passive_hint()`, then calls `advance_phase()`, then assembles the full `InterviewResponse` object and returns it.

#### Step 27 — Tune All 5 Persona Prompts
Run 10 test questions per character. For each response, check three things: Is it in character tonally? Is it temporally correct (no post-cutoff hallucinations)? Does it reveal the right amount — not too much, not too little? Flag every failure. Fix failures through prompt adjustments only — do not change the model or the graph data unless the data is factually wrong.

#### Step 28 — Tune the Contradiction Threshold
Run the contradiction test suite with different threshold values. At 0.75, check for false positives (unrelated claims incorrectly flagged). If false positives appear, raise to 0.80. Run again. If real contradictions are being missed at 0.80, compromise at 0.77. Document the final threshold in a comment in the code so nobody changes it without understanding why.

#### Step 29 — Stress Test Rapid-Fire Questioning
Send 20 questions to Victor in quick succession within one session. Verify the claims store does not grow beyond its expected size. Verify stress levels update correctly without exceeding 1.0. Verify response quality stays consistent throughout. Verify the progress score increments correctly. Verify hint cooldown persists correctly across the rapid questions.

---

## 🖥️ Full Stack Workflow — Frontend + API (Hour 2–24)

---

### Hour 2–5: FastAPI Shell

#### Step 1 — Create the FastAPI App
Create `backend/main.py`. Initialize FastAPI with a title and CORS middleware that explicitly allows `http://localhost:5173` as an origin. Import and include the routes from `backend/api/routes.py`. Add a root health check endpoint `GET /` that returns `{"status": "Cold Case backend is live"}`. Run with `uvicorn backend.main:app --reload` and confirm the health check returns in the browser.

#### Step 2 — Define All Pydantic Models
Create `backend/api/models.py` with the following models:

`InterviewRequest`: `character_id` (str), `player_message` (str), `session_id` (str).

`ContradictionEvent`: `contradiction_id` (str), `characters` (list of str), `claim_a` (str), `claim_b` (str).

`ProgressData`: `show` (bool), `score` (int), `label` (str), `flavor_text` (str).

`InterviewResponse`: `response_text` (str), `active_fact_ids` (list of str), `stress_level` (float), `contradiction_event` (Optional ContradictionEvent), `progress` (ProgressData), `hint_injected` (bool).

`EvidenceSubmitRequest`: `evidence_id` (str), `session_id` (str).

`GameStateResponse`: `phase` (int), `questioned_characters` (list of str), `found_contradictions` (list of ContradictionEvent), `unlocked_evidence` (list of str), `available_endings` (list of str), `hints_used` (int), `progress_score` (int).

`HintRequest`: `session_id` (str).

`HintResponse`: `hint_text` (Optional str), `cooldown_remaining` (int), `hints_used` (int).

`AccusationRequest`: `session_id` (str), `ending_choice` (int, 1–3).

`AccusationResponse`: `ending_text` (str), `score` (int), `hints_used_note` (str), `full_truth_reveal` (str).

#### Step 3 — Implement Session Management
In `backend/api/session.py`, create a global `sessions = {}` dictionary. Write `get_or_create_session(session_id)` that checks if the session ID exists and returns it, or creates a new session with default state and returns it. Default state includes: `phase: 1`, `questioned_characters: []`, `found_contradictions: []`, `unlocked_evidence: []`, `hints_used: 0`, `last_hint_timestamp: None`, `last_meter_shown_timestamp: None`, `last_meter_score: 0`, `suppress_progress_meter: False`, `shown_flavor_texts: []`, `shown_passive_hints: []`, `triggered_pivots: []`, `submitted_evidence: []`, `session_history: []`. On the very first request from a new browser session, generate a UUID as the session ID and return it in the response so the frontend can store it.

#### Step 4 — Implement All 6 Endpoint Skeletons
In `backend/api/routes.py`, implement all six route handlers with real logic stubs that return hardcoded but correctly structured dummy responses. This lets the NLP engineer integrate against real HTTP endpoints from Hour 5 onward while the actual agent logic is still being built. Mark each stub clearly with a `# TODO: replace with real orchestrator call` comment. The structure of the dummy responses must exactly match the Pydantic models — the frontend will be built against these shapes immediately.

---

### Hour 5–10: React UI Build

#### Step 5 — Set Up React App
From the `frontend/` directory, install all dependencies. Configure Tailwind by adding it to `vite.config.js` and creating `tailwind.config.js`. Set up React Router in `src/main.jsx` with routes for `/` (opening scene), `/board` (corkboard), `/interview/:characterId` (interview room), `/evidence` (evidence board), and `/accuse` (final accusation). Confirm all routes render without errors before building any screen.

#### Step 6 — Build the Opening Crime Scene Screen
This is the first screen the player sees. Build it in `src/screens/OpeningScene.jsx`. The layout shows a dark, atmospheric representation of the judges' lounge at 2:07 AM. Use CSS to create a dim room effect. Place four styled elements: a coffee cup labeled "Cold Brew (??)", a trophy labeled "Most Disruptive Hack", a sticky note reading "THIS DEMO WILL KILL", and a police tape barrier. Below the scene, show the case introduction text from the story document's opening. Include a "Begin Investigation" button that navigates to `/board` and initializes the session by calling `GET /game-state` to receive a fresh session ID, then stores it in React Context.

Apply the visual identity: dark background (#0a0a0a), amber/neon green accents, monospace font for all text, slightly grainy CSS texture overlay on cards.

#### Step 7 — Build the Corkboard Screen
Build `src/screens/Corkboard.jsx`. This is the main hub the player returns to between interviews. Create a cork-textured background using a CSS pattern or background image. Place 5 character cards as absolute-positioned elements in a pentagon arrangement. Each card shows a character illustration placeholder, the character name, and their role title.

Use SVG `<line>` elements to draw connections between related characters: Victor–Julian (via drink), Martha–Julian (via inhaler), Rose–Julian (via VIP kit), Victor–Martha (they were both in the lounge area), Hayes–all characters (he's the investigator). Store the pixel coordinates of each card in a constant and compute line endpoints from those coordinates.

Add a `useEffect` that polls `GET /contradictions/{session_id}` every 3 seconds. When a new contradiction event is received that wasn't in the previous poll, animate the relevant connecting line by changing its stroke to red (#ff3333) and applying a CSS pulse animation using Framer Motion. Show the ContradictionAlert toast component (built in Step 10) simultaneously.

Add a "Make Accusation" button in the bottom right, visible only when the game state phase is 4 or higher. Add a sticky note icon button in the top right for active hints. Add a progress indicator label in the top left that updates whenever the progress score changes — it shows only the label text ("Cold Trail", "Something's Off" etc.) not the numeric score.

#### Step 8 — Build the Interview Room Screen
Build `src/screens/InterviewRoom.jsx`. This screen takes a `characterId` URL parameter.

Left panel (60% width): Shows the character's name and role at the top. Below that, a stress indicator — a thin horizontal bar that fills from left to right as stress increases, colored from green (low) through amber to red (high). Below that, the dialogue history — a scrollable list of player messages and character responses. At the bottom, a text input with a Send button.

Right panel (40% width): A React Flow graph visualization. On initial load, fetch the character's base fact nodes from the backend and render them as nodes in the graph. When an `InterviewResponse` comes back with `active_fact_ids`, use a `useEffect` to find those nodes in the React Flow state and update their style to show a pulsing highlight. Use `setTimeout` to fade the highlight back to normal after 3 seconds.

Implement the typewriter effect for character responses: receive the full response text, then use `setInterval` to reveal it one character at a time at 30ms per character. Play the typewriter Howler sound on each character reveal.

When `response.hint_injected` is true, style the final line of the response in italic with a slightly different text color to subtly distinguish it as a hint without breaking character immersion.

#### Step 9 — Build the Evidence Board Screen
Build `src/screens/EvidenceBoard.jsx`. Show all 10 evidence items from `data/evidence/evidence.json` as cards in a grid. Fetch the current unlocked evidence list from game state. Render locked cards with a grayscale filter, a lock icon overlay, and a "Locked" label. Render unlocked cards in full color with the evidence name, description, and a "Submit Evidence" button.

When the Submit Evidence button is clicked, call `POST /evidence` with the evidence ID. On response, update the local unlocked evidence list. If the response includes a new progress object with `show: true`, trigger the ProgressMeter component. If the response includes new contradictions, trigger the ContradictionAlert component. Show a brief "Evidence submitted" confirmation on the card itself.

#### Step 10 — Build the Contradiction Alert Component
Build `src/components/ContradictionAlert.jsx`. This is a non-blocking toast notification. Position it fixed in the bottom-right corner. When triggered with a ContradictionEvent prop, animate it sliding in from the right using Framer Motion's `initial={{ x: 400 }}` and `animate={{ x: 0 }}` with a spring transition. Show: a lightning bolt icon, "Contradiction Detected", the two character names, and their two conflicting claims side by side. Play the spark Howler sound effect when it appears. Auto-dismiss after 6 seconds using `useEffect` with a `setTimeout`. Allow immediate dismiss on click.

#### Step 11 — Build the Progress Meter Component
Build `src/components/ProgressMeter.jsx`. This is a floating panel that slides in from the right edge of the screen independently of the contradiction alert. It should never overlap with the ContradictionAlert — add a vertical offset if both are showing simultaneously.

When the API response includes `progress.show === true`, set a `progressData` state in React Context. The ProgressMeter watches this context value and triggers its entrance animation.

The panel shows: the score label at the top in large text with a color that matches the score range (blue for cold trail, amber for middle ranges, red for high scores). Below that, an animated bar — implement this as a `motion.div` with `width` animated to `${score}%` with a 1-second ease transition. Below the bar, the flavor text string in small italic monospace text. Auto-dismiss after 5 seconds or on click. Use `AnimatePresence` to animate the exit smoothly.

#### Step 12 — Build the Hint System UI Components
Build `src/components/HintButton.jsx`. Style it as a sticky note icon (use a simple yellow square with a folded corner CSS effect). Position it fixed in the top-right corner of all screens except the opening scene. On click, call `POST /hint` with the current session ID.

Build `src/components/HintCard.jsx`. This is a torn sticky note that animates in from the top of the screen using Framer Motion `initial={{ y: -200 }}` and `animate={{ y: 20 }}`. Shows the hint text in a handwritten-style Google Font (Caveat or Patrick Hand). Auto-dismisses after 8 seconds or on click.

When the hint is on cooldown (response returns `cooldown_remaining > 0`), show a circular countdown ring around the HintButton. Implement this as a CSS `conic-gradient` that sweeps from full coverage down to zero over the cooldown period. Show the remaining seconds as a number inside the ring.

#### Step 13 — Build the Final Accusation Screen
Build `src/screens/Accusation.jsx`. Show a header: "Make Your Accusation, Detective." Below that, show three ending option cards matching the three endings in Section 13 of the story document.

Ending 1 card: "Victor is the killer. He tampered with Julian's drink with intent to harm."
Ending 2 card: "It was an accidental chain reaction. Multiple people's careless actions caused Julian's death."
Ending 3 card: "Julian staged his own death. Multiple petty acts of sabotage accidentally made the stunt real."

Each card has a brief description and a "Choose This Ending" button. When clicked, call `POST /accusation` with the session ID and ending choice integer. On response, show the ending reveal text in a dramatic full-screen overlay. Below the ending text, show: the player's score, whether they used hints and the hint note, and a "Full Truth Reveal" button that shows the complete canonical truth from Section 8 of the story document.

#### Step 14 — Add Howler.js Audio
Create `src/audio/sounds.js`. Initialize three Howler sound instances: an ambient loop (looping background of keyboard clacking, distant chatter, quiet ticking — use a royalty-free audio file or generate one), a typewriter click (short single tick sound, played per character in the typewriter effect), and a contradiction spark (sharp electrical crack sound played when a ContradictionAlert appears). Export all three instances. Import and use them in the relevant components.

---

### Hour 10–16: Integration

#### Step 15 — Connect Interview Room to `/interview` API
Replace the dummy data in InterviewRoom with real API calls. On player message submit: set a loading state to true and show a "thinking" animation on the character portrait (a subtle pulsing effect using Framer Motion). Call `POST /interview`. On response: set loading false, start the typewriter rendering of `response_text`, update the stress bar with `stress_level`, highlight `active_fact_ids` in the React Flow graph, check `contradiction_event` and trigger ContradictionAlert if present, check `progress.show` and trigger ProgressMeter if true, check `hint_injected` and style the final line accordingly.

#### Step 16 — Connect Evidence Board to `/evidence` API
Replace dummy evidence state with real API calls. On submit: show a loading spinner on the card. Call `POST /evidence`. On response: update the unlocked evidence list in React Context, animate the submitted card with a brief green flash, trigger any new ContradictionAlert events, trigger ProgressMeter if `progress.show` is true.

#### Step 17 — Connect Corkboard Polling to `/contradictions` API
Implement the polling loop in Corkboard using `useEffect` with `setInterval`. Every 3 seconds, fetch `GET /contradictions/{session_id}`. Compare the response length to the previous length stored in a `useRef`. If new contradictions have arrived, identify the new ones, animate their corresponding SVG lines to red, and trigger the ContradictionAlert. Stop polling when the game reaches Phase 5 (accusation submitted).

#### Step 18 — Implement React Context for Global Game State
Create `src/context/GameContext.jsx`. The context stores: `sessionId`, `phase`, `questionedCharacters`, `foundContradictions`, `unlockedEvidence`, `hintsUsed`, `progressScore`, `progressLabel`. Write a `GameProvider` wrapper component that fetches initial game state on mount and exposes an `updateGameState(newState)` function. Wrap the entire app in `GameProvider` in `src/main.jsx`. All screens import from the context instead of managing their own game state.

#### Step 19 — Test the Complete Demo Flow from Section 16
Walk through all 11 steps of the Section 16 demo flow manually with the full integrated stack running. At each step, verify the correct API call is made, the correct response is rendered, and the correct UI state updates. Document every bug found. Fix only bugs that break the demo flow — ignore cosmetic issues for now.

---

### Hour 16–22: Polish and Demo Prep

#### Step 20 — Apply Full Visual Polish
Review every screen for visual consistency. Ensure the dark background, amber accents, monospace fonts, and grainy texture are applied uniformly. Add the CSS grain overlay as a `::after` pseudo-element on the root div. Ensure all Framer Motion animations have consistent easing (use `ease: [0.25, 0.1, 0.25, 1]` everywhere). Make all buttons feel tactile with `whileHover` and `whileTap` Framer Motion props.

#### Step 21 — Optimize API Response Time
Test average response time for the `/interview` endpoint. If responses take more than 4 seconds, add a more prominent "thinking" state — show the character's portrait with a slow animated glow and the text "...processing" in the typewriter style. This makes the wait feel intentional and in-character rather than broken.

#### Step 22 — Verify Progress Meter Appears Correctly
Play through the game and verify the progress meter appears at the three forced moments: after the first contradiction, when reaching Phase 3, and during the final accusation. Verify it also appears approximately 35% of the time after other actions. Verify it never appears twice within 30 seconds. Verify the flavor text never repeats within the same session.

#### Step 23 — Verify Hint System Behavior End-to-End
Test the passive hint system by deliberately staying on one character for 6 questions without finding a contradiction. Verify a passive hint is appended to the character's response on the 6th question. Test the active hint by clicking the hint button in Phase 1 and verify the Phase 1 hint appears. Click it again immediately and verify the cooldown ring appears. Wait 90 seconds and verify the button is available again. Verify the hints_used counter increments correctly and appears correctly on the accusation screen.

#### Step 24 — Record Backup Demo Video
Record a screen capture of the full 11-step demo flow from Section 16. Narrate the key moments: Victor denying entry, the contradiction sparking, Martha's reel evidence, Collins hinting at a non-poison cause, the final revelation. Keep the video under 3 minutes. Upload it to a drive link and include it in the README in case of live demo failures.

#### Step 25 — Rehearse the 2-Minute Live Demo
Practice the demo flow until every team member can narrate it confidently. The sequence is: open crime scene → interview Victor (denies lounge entry) → submit camera evidence → contradiction fires → interview Martha (denies touching anything) → submit her reel → second contradiction fires → interview Collins (hints at non-poison cause) → submit keycap trophy → Collins reveals full chain → choose Ending 3 (Best Ending) → full truth reveal. This is the entire story in 2 minutes. Do not deviate from this path during the live demo.

---

## 🔄 Sync Checkpoints and Handoff Details

### Hour 5 Sync
The data scientist must have Victor's and Martha's Neo4j graphs fully populated and the semantic search function working and tested. The NLP engineer cannot build a working Victor agent without real graph data. The full stack engineer must have all 6 FastAPI endpoint skeletons returning correctly structured dummy responses. The NLP engineer must be able to call `POST /interview` over HTTP and get back the correct response shape.

### Hour 10 Sync
The NLP engineer must have all 5 persona agents instantiated and the orchestrator routing messages correctly. The full stack engineer must have all 5 React screens built and navigable even with dummy data. The data scientist must have all 5 character graphs populated and the embedding script run successfully.

### Hour 14 Sync
The contradiction detection must work end-to-end — detectable through the API response and renderable in the UI. The progress meter must fire correctly on at least the three forced moments. The passive hint system must append hints to character responses when wrong direction conditions are met. This is the moment all three tracks merge.

### Hour 20 Sync
Everyone stops adding features. From Hour 20 onward, only bugs that break the 11-step demo path are fixed. Everything else is deferred. Assign one person to be the "demo driver" who will actually control the screen during the live demo. Rehearse the demo twice in full with the demo driver at the keyboard.

---

## ⚠️ Interaction Rule: Progress Meter and Passive Hint Conflict

When both a progress meter trigger and a passive hint fire on the same player action, the passive hint takes priority because it is more actionable for the player. Set `session_state.suppress_progress_meter = True` when a passive hint fires. The progress meter fires on the next eligible action instead. Reset the suppress flag to False at the start of every new action.

---

## 🛡️ MVP Fallback (If Behind at Hour 18)

If the team is behind schedule at Hour 18, cut to this reduced scope immediately. Keep 3 characters (Victor, Martha, Hayes). Use text chat only and skip the corkboard. Use manual text input for evidence submission instead of cards. Show contradictions as highlighted text instead of spark animations. Show progress meter as a simple percentage label instead of the animated bar. Show hints as plain text popups instead of sticky note animations. The core RAG + temporal constraints + multi-agent contradiction detection remains fully intact and is still the most technically impressive part of the project.
