# The Case of the Dead Demo Judge

## 1. Project Summary
**The Case of the Dead Demo Judge** is a comedic AI-powered murder mystery game set during the final hours of a university hackathon.

At **2:07 AM**, during demo night, the star judge **Professor Julian Byte** is found collapsed in the judges' lounge beside:
- a half-finished cold brew,
- a trophy labeled **"Most Disruptive Hack"**,
- and a sticky note that says: **"THIS DEMO WILL KILL."**

At first, everyone assumes it is murder.

The player must interrogate multiple AI-driven characters, compare contradictions in their stories, inspect evidence, and determine what really happened.

---

## 2. One-Line Pitch
**A comedic AI murder mystery set during a hackathon, where players interrogate multiple persona agents with conflicting private knowledge and solve the case by exposing contradictions.**

---

## 3. Why This Story Works
This setup is strong for a hackathon because it is:
- directly related to the event setting,
- funny and memorable,
- easy to understand quickly,
- manageable to build within a short timeline,
- and naturally suited for contradiction-based gameplay.

The humor comes from the fact that everyone is hiding something petty, embarrassing, or stupid rather than something deeply evil.

---

## 4. Core Gameplay Loop
The game loop should be simple and demo-friendly:

1. The player selects a character to question.
2. The character responds in persona using only what they know.
3. The player unlocks or reviews evidence.
4. The contradiction engine compares statements against prior statements and evidence.
5. New dialogue paths unlock when contradictions are found.
6. The player revisits suspects with sharper questions.
7. The player makes a final accusation or chooses a final explanation.

This loop is small enough for a hackathon build but still shows off the AI architecture clearly.

---

## 5. Setting and Tone
The game takes place at a chaotic university hackathon during the last stretch before judging ends.

Tone references:
- serious investigation, silly cause,
- sleep-deprived hackers acting suspicious,
- everyone thinks they are the smartest person in the room,
- the detective talks like this is organized crime,
- the actual truth is absurd.

The tone should feel like a mix of:
- **Knives Out**,
- a university hackathon,
- and a room full of people who have had too much caffeine and too little sleep.

---

## 6. Story Setup
Professor Julian Byte is a famous but insufferable hackathon judge.

He is known for:
- humiliating teams during demos,
- making harsh public comments,
- favoring flashy projects,
- and turning every event into a performance about himself.

He says things like:
> "If your app needs a login, it already lost."

A lot of people have reasons to dislike him.

When he is found dead in the judges' lounge, the hackathon turns into a chaotic crime scene.

---

## 7. Character Cards

### 7.1 Victor - Finalist Team Captain
**Role:** finalist founder / team lead  
**Public Personality:** confident, dramatic, competitive, startup-bro energy  
**Motive:** Julian mocked Victor's project in front of everyone and hinted he would not make finals.  
**Secret:** Victor replaced Julian's premium cold brew with an ultra-caffeinated sponsor energy drink to make him miserable during judging.  
**What Victor Actually Knows:**
- he entered the judges' lounge,
- he touched Julian's drink,
- Julian was already acting dramatic before the collapse,
- he did not intend to kill him.

**What Victor Lies About:**
- says he never entered the lounge,
- says he did not touch Julian's drink,
- claims the judge was targeting him unfairly all night.

**Funny Detail:** Victor calls sabotage **"competitive correction."**

---

### 7.2 Martha - Volunteer / Social Media Lead
**Role:** volunteer and event social media manager  
**Public Personality:** chaotic, chatty, overconfident, always online  
**Motive:** Julian insulted the event branding and said the hackathon logo looked like a failed crypto coin.  
**Secret:** Martha moved objects around the judges' lounge to make her behind-the-scenes reel look more aesthetic. She moved the inhaler, pill case, and trophy.  
**What Martha Actually Knows:**
- she touched several objects in the lounge,
- she filmed near the time of the incident,
- Julian looked stressed and theatrical before collapsing,
- she saw Victor near the drink station.

**What Martha Lies About:**
- says she never touched anything,
- says she clearly saw the entire incident,
- pretends her memory is perfect even though she missed major details.

**Funny Detail:** She insists she was **"preserving the event vibe."**

---

### 7.3 Detective Hayes - Campus Security Officer
**Role:** campus security officer handling the scene  
**Public Personality:** serious, tired, noir detective energy  
**Motive:** no direct motive  
**Secret:** Hayes already suspects this is not a normal poisoning case, but he wants stronger evidence before committing to a theory.  
**What Hayes Actually Knows:**
- almost everyone is lying in small ways,
- the scene looks tampered with,
- the case does not fully fit a classic murder pattern,
- the sticky note may not be a threat.

**What Hayes Holds Back:**
- he avoids revealing his uncertainty too early,
- he does not want suspects aligning their stories.

**Funny Detail:** He speaks like he is investigating a cartel assassination even though the suspects are exhausted student hackers and one organizer.

---

### 7.4 Dr. Collins - Medical Judge / On-Call Doctor
**Role:** doctor and technical judge  
**Public Personality:** calm, clinical, dry humor  
**Motive:** Julian ignored medical advice and made the judging process harder for everyone.  
**Secret:** Julian did not die from classic poisoning. The real cause involved severe caffeine overload, stress-triggered breathing trouble, and choking on a detachable keyboard keycap from a novelty trophy.  
**What Dr. Collins Actually Knows:**
- the death was not straightforward poison,
- caffeine and breathing stress played a role,
- airway obstruction was important,
- multiple people may have indirectly contributed.

**What Dr. Collins Holds Back:**
- he does not reveal the full cause immediately,
- he waits for the player to connect evidence before confirming the absurdity.

**Funny Detail:** He explains this ridiculous chain of events with complete medical seriousness.

---

### 7.5 Rose - Hackathon Organizer
**Role:** lead organizer of the hackathon  
**Public Personality:** smart, exhausted, practical, unimpressed by drama  
**Motive:** Julian demanded special treatment, threatened to embarrass the organizers, and kept making the event harder to run.  
**Secret:** Rose replaced Julian's VIP judge snack kit with the regular participant snack bag because she was tired of his attitude. She also knew Julian had planned some kind of dramatic stunt.  
**What Rose Actually Knows:**
- Julian loved attention,
- Julian hinted at a dramatic reveal,
- the VIP kit was swapped,
- the event was already running in chaos before the collapse.

**What Rose Lies About:**
- says she only handled logistics,
- avoids admitting she tampered with Julian's judge kit,
- downplays what she knew about Julian's behavior.

**Funny Detail:** Rose says, **"I did not kill him. I merely downgraded his snacks."**

---

## 8. Ground Truth
This section should be treated as the **canonical truth** for the game.

### What Actually Happened
Julian Byte planned to **fake a dramatic collapse** during demo night.

He wanted to do this because he believed one finalist had broken the spirit of the rules by leaning too heavily on AI-generated code, and he wanted to make a theatrical public reveal so that he would become the center of attention.

The sticky note saying **"THIS DEMO WILL KILL"** was not a murder threat.
It was Julian's own dramatic note about an upcoming project presentation.

### The Chain of Events
Several petty actions stacked together:
- **Victor** swapped Julian's cold brew with an ultra-caffeinated sponsor drink.
- **Rose** replaced Julian's VIP kit, so his preferred meds/snacks were missing.
- **Martha** moved his inhaler while filming a social media reel.
- Julian handled the novelty keyboard trophy and loosened a keycap.
- During his fake collapse speech, he started coughing.
- He panicked, inhaled sharply, and choked on the keycap.
- Caffeine overload and breathing distress made the situation worse.

### Final Truth
It was not a clean murder by one villain.

It was:
**a fake dramatic hackathon stunt that became a real death because multiple people independently made stupid, petty decisions.**

---

## 9. Timeline of Events
A simple timeline helps both implementation and demo narration.

### 9:20 PM
Julian publicly insults several teams during practice demos.

### 9:45 PM
Julian humiliates Victor's team and implies they may not deserve finals.

### 10:05 PM
Julian complains to Rose about his VIP treatment, food, and judging setup.

### 10:20 PM
Rose swaps Julian's VIP snack/judge kit with a regular participant snack bag.

### 10:50 PM
Julian messages someone that **"tonight's reveal will be unforgettable."**

### 11:15 PM
Martha enters the judges' lounge to film a behind-the-scenes reel.

### 11:18 PM
Martha rearranges items for aesthetics and moves Julian's inhaler and pill case.

### 11:40 PM
Julian rehearses a dramatic reveal speech alone.

### 12:05 AM
Victor enters the lounge briefly and swaps Julian's premium cold brew with an ultra-caffeinated sponsor drink.

### 12:20 AM
Dr. Collins notices Julian seems overstimulated and tells him to slow down.

### 12:50 AM
Julian handles the novelty keyboard trophy and loosens a detachable keycap.

### 1:35 AM
Julian becomes more theatrical and agitated as final demos continue.

### 2:05 AM
Julian begins his planned dramatic reveal / fake collapse moment.

### 2:07 AM
He coughs, panics, struggles to breathe, and collapses for real.

### 2:10 AM
Chaos begins. Everyone starts editing their story.

---

## 10. Evidence List
Each evidence item should do more than exist. It should support a contradiction or unlock a new line of questioning.

### 10.1 Sticky Note - "THIS DEMO WILL KILL"
**What it looks like:** handwritten note near the body  
**Initial Interpretation:** murder threat  
**What it actually proves:** Julian was planning a dramatic reveal about a demo.  
**Useful Against:** the group assumption that this was straightforward murder.

### 10.2 Lounge Camera Timestamp
**What it looks like:** hallway or entrance camera snapshot / timestamp log  
**What it proves:** Victor entered the judges' lounge even though he denies it.  
**Useful Against:** Victor.

### 10.3 Sponsor Energy Drink Can
**What it looks like:** can near the drink station or trash bin  
**What it proves:** Julian consumed a heavily caffeinated sponsor beverage rather than his normal drink.  
**Useful Against:** Victor's denial and the poison theory.

### 10.4 Martha's Behind-the-Scenes Reel
**What it looks like:** short phone video clip  
**What it proves:** Martha rearranged objects in the lounge and was not a passive observer.  
**Useful Against:** Martha.

### 10.5 Missing Inhaler
**What it looks like:** inhaler found away from the usual area  
**What it proves:** emergency aid was not where Julian expected it to be.  
**Useful Against:** Martha and the accidental-chain theory.

### 10.6 Broken Keyboard-Keycap Trophy
**What it looks like:** novelty trophy with a missing detachable keycap  
**What it proves:** airway obstruction may have come from the trophy itself.  
**Useful Against:** the simple poison theory.

### 10.7 Judge Scoring Sheet with Angry Notes
**What it looks like:** score sheet with harsh comments and circles  
**What it proves:** Julian had active conflicts with teams and may have been preparing drama around judging.  
**Useful Against:** everyone equally; establishes motive across the cast.

### 10.8 Organizer Checklist Showing VIP Kit Swap
**What it looks like:** logistics checklist or text note from organizers  
**What it proves:** Rose altered Julian's setup and is hiding part of her involvement.  
**Useful Against:** Rose.

### 10.9 Victor's Text Message
**Text:** something like **"Let him survive finals on 400mg caffeine."**  
**What it proves:** Victor intentionally tampered with Julian's drink, even if he did not intend murder.  
**Useful Against:** Victor.

### 10.10 Julian's Message - "Tonight's reveal will be unforgettable"
**What it looks like:** text, Slack message, or note  
**What it proves:** Julian was planning an attention-seeking stunt.  
**Useful Against:** the murder-only theory.

---

## 11. Contradictions the Engine Can Detect
These should be the main contradiction patterns in the demo.

### Contradiction 1
**Claim:** Victor says he never entered the judges' lounge.  
**Counter:** camera timestamp proves he did.

### Contradiction 2
**Claim:** Victor says he never touched Julian's drink.  
**Counter:** evidence suggests the drink was swapped and his text message implies intent.

### Contradiction 3
**Claim:** Martha says she never touched anything in the room.  
**Counter:** her own reel shows her rearranging items.

### Contradiction 4
**Claim:** Martha says she clearly saw the whole collapse.  
**Counter:** her reel and timestamps show she was distracted and moving around.

### Contradiction 5
**Claim:** Rose says she only handled logistics and never touched Julian's setup.  
**Counter:** organizer checklist proves the VIP kit was swapped.

### Contradiction 6
**Claim:** everyone assumes Julian was poisoned.  
**Counter:** Dr. Collins points toward airway obstruction, breathing trouble, and caffeine overload.

### Contradiction 7
**Claim:** the sticky note is a threat from the killer.  
**Counter:** later evidence shows Julian wrote it himself about a demo.

---

## 12. Suggested Player Progression
A good demo should gently guide the player through a few satisfying reveals.

### Phase 1 - Suspicion
- talk to Hayes,
- inspect the sticky note,
- hear the initial poison assumption,
- question Victor or Martha first.

### Phase 2 - First Contradictions
- discover Victor lied about entering the lounge,
- discover Martha touched the room,
- realize the scene was tampered with.

### Phase 3 - Bigger Reveal
- talk to Rose,
- uncover the VIP kit swap,
- talk to Dr. Collins,
- learn poison is probably not the full story.

### Phase 4 - Final Understanding
- connect the drink swap,
- connect the missing inhaler,
- connect the broken keycap trophy,
- realize Julian staged the whole moment.

### Phase 5 - Final Choice
The player chooses the final explanation or accusation.

---

## 13. Possible Endings

### Ending 1 - Wrong Accusation
The player blames Victor alone for murder.

**Result:** Victor clearly tampered with the drink and had motive, but the final explanation is incomplete.

### Ending 2 - Partial Truth
The player concludes Julian died from an accidental chain reaction caused by sabotage, stress, and carelessness.

**Result:** mostly correct.

### Ending 3 - Best Ending
The player proves that Julian staged the moment for attention, while multiple people independently tampered with the scene and indirectly contributed to the real death.

**Result:** full solution and best score.

---

## 14. Why AI Matters Here
This section is useful for judges.

This is not just a normal static mystery game. The AI architecture is part of the gameplay.

### AI-Native Value
- each persona agent has a different point of view,
- each persona knows only part of the truth,
- characters can answer dynamically to player questions,
- contradictions emerge from comparing generated responses and evidence,
- the graph database stores private relationships and facts per character,
- the orchestrator controls what can be revealed based on game state.

### Why This Is Better Than Fixed Dialogue
Instead of only clicking through a fixed script, the player can ask natural questions.
The fun comes from getting characters to contradict themselves or each other.
That makes the investigation feel more alive and makes the multi-agent architecture a visible feature, not just a backend detail.

---

## 15. Mapping to the Proposed Architecture
This story maps cleanly to the proposed system.

### React Frontend
- chat with suspects,
- evidence cards,
- contradiction alerts,
- accusation screen,
- timeline or notebook view.

### FastAPI Backend
- routes player input,
- serves evidence and state,
- handles unlock logic,
- stores session progression.

### Orchestrator Agent
- decides which persona should respond,
- injects game-state context,
- controls evidence unlocks,
- manages question flow,
- prevents early leakage of the full truth.

### Persona Agents
- Victor, Martha, Hayes, Dr. Collins, and Rose each answer from their own perspective,
- each persona has limited knowledge and specific lies,
- each persona can gradually reveal more when confronted.

### Neo4j Graphs
Each character can have a small private graph storing:
- what they know,
- who they interacted with,
- objects they touched,
- lies they tell,
- evidence connected to them.

### Contradiction Detection Engine
The engine can compare:
- statement vs statement,
- statement vs evidence,
- claim vs timestamp,
- claim vs known character graph facts.

### Evidence Ingestion Pipeline
Stores and normalizes:
- text notes,
- messages,
- screenshots,
- fake logs,
- media clips,
- timestamps.

### Game State Tracker
Tracks:
- which suspects were questioned,
- which contradictions were found,
- which evidence is unlocked,
- what endings are available.

---

## 16. Small Demo Flow for Judges
A fast live demo could go like this:

1. Show the opening crime scene.
2. Ask Victor whether he entered the judges' lounge.
3. He denies it.
4. Reveal camera evidence that proves he entered.
5. Ask Martha whether she touched anything.
6. She denies it.
7. Reveal her reel showing she rearranged the room.
8. Ask Dr. Collins if this looks like poison.
9. He hints that the medical picture is stranger than that.
10. Reveal the broken keycap trophy and missing inhaler.
11. Make the final deduction that Julian staged the moment and died through a ridiculous chain reaction.

This demo is short, understandable, and shows off the value of the multi-agent contradiction design.

---

## 17. MVP Scope for a 23-Hour Hackathon
To keep the build realistic, the MVP should focus on:
- 5 characters,
- 8 to 10 evidence items,
- 6 to 7 major contradictions,
- 1 main crime scene,
- 3 endings,
- one polished guided demo path.

### Optional Stretch Goals
- score system based on deduction quality,
- branching accusation report,
- suspicion meter per suspect,
- evidence notebook,
- replay mode with random phrasing.

---

## 18. Short Pitch for Judges
Our project is an AI-native mystery game where each suspect is powered by a separate persona agent with private knowledge.
The player investigates the suspicious death of a hackathon judge by interrogating characters, collecting evidence, and identifying contradictions across their stories.
The humor comes from the fact that everyone is hiding something petty, while the actual truth is a chain reaction of bad decisions.

---

## 19. Final Takeaway
This story is funny, relevant to the hackathon setting, small enough to build quickly, and technically aligned with the multi-agent architecture.

Most importantly, it gives judges an immediate answer to two questions:
1. **Why is this fun?** Because the mystery is absurd and interactive.
2. **Why does this need AI?** Because each character holds a different, dynamic version of the truth.
