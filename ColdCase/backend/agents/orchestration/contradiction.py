import logging
from typing import Dict, Any

from google import genai
from google.genai import types

from backend.config import settings
from backend.agents.agent_registry import agents
from backend.agents.tools import claims_store
from backend.agents.orchestration.state import get_or_create_session

log = logging.getLogger(__name__)

# In-memory caches for the contradiction engine to speed up repeated queries
EMBEDDING_CACHE: Dict[str, Any] = {}
JUDGMENT_CACHE: Dict[str, str] = {}

def check_contradiction(new_claim: str, character_id: str, session_id: str) -> Dict[str, Any]:
    """
    Core engine that evaluates a new claim against all previously logged claims 
    by *other* characters. If semantic similarity is > 0.55 AND the LLM deems them 
    contradictory, a ContradictionEvent fires.
    """
    import numpy as np
    from datetime import datetime
    
    from backend.agents.llm_client import execute_with_fallback
    
    # Setup the embedding client (removed direct instantiation)
    # client = genai.Client(api_key=settings.gemini_api_key)
    
    # 1. Embed the new claim
    new_claim_key = new_claim.strip().lower()
    try:
        if new_claim_key in EMBEDDING_CACHE:
            log.info(f"[CONTRADICTION ENGINE] Cache hit for new claim embedding: '{new_claim}'")
            new_vec = EMBEDDING_CACHE[new_claim_key]
        else:
            def _embed_new(active_client, model_name):
                return active_client.models.embed_content(
                    model=model_name,
                    contents=new_claim
                )
            log.info(f"[CONTRADICTION ENGINE] Calling Gemini to embed new claim for {character_id}: '{new_claim}'")
            new_embed_response = execute_with_fallback(_embed_new, models=["models/gemini-embedding-001"])
            new_vec = np.array(new_embed_response.embeddings[0].values)
            EMBEDDING_CACHE[new_claim_key] = new_vec
    except Exception as e:
        log.error(f"Embedding failed: {e}")
        return {"status": "error", "message": "Embedding failed"}

    session_state = get_or_create_session(session_id)
    if "found_contradictions" not in session_state:
        session_state["found_contradictions"] = []
        
    # We will track all found contradictions from this single claim evaluation
    newly_found = []

    # 2. Loop through all claims for all OTHER characters in this session
    session_claims = claims_store.get(session_id, {})
    
    for other_char, claims_list in session_claims.items():
        if other_char == character_id:
            continue
            
        for stored_claim_obj in claims_list:
            stored_claim_text = stored_claim_obj["claim"]
            stored_claim_key = stored_claim_text.strip().lower()
            
            # 3. Compute cosine similarity
            try:
                if stored_claim_key in EMBEDDING_CACHE:
                    log.info(f"[CONTRADICTION ENGINE] Cache hit for stored claim embedding by {other_char}: '{stored_claim_text}'")
                    stored_vec = EMBEDDING_CACHE[stored_claim_key]
                else:
                    def _embed_stored(active_client, model_name):
                        return active_client.models.embed_content(
                            model=model_name,
                            contents=stored_claim_text
                        )
                    log.info(f"[CONTRADICTION ENGINE] Calling Gemini to embed stored claim by {other_char}: '{stored_claim_text}'")
                    stored_embed_resp = execute_with_fallback(_embed_stored, models=["models/gemini-embedding-001"])
                    stored_vec = np.array(stored_embed_resp.embeddings[0].values)
                    EMBEDDING_CACHE[stored_claim_key] = stored_vec
                
                # Cosine similarity formula
                cos_sim = np.dot(new_vec, stored_vec) / (np.linalg.norm(new_vec) * np.linalg.norm(stored_vec))
                log.info(f"Similarity Score: {cos_sim:.3f} | {other_char} <-> {character_id}")
            except Exception as e:
                log.error(f"Stored claim embedding calculation failed: {e}")
                continue
                
            # 4. If they are topically similar, execute the LLM Semantic Opposition Check
            if cos_sim > 0.55:
                # Generate a symmetric cache key so A vs B is the same as B vs A
                sorted_claims = tuple(sorted([new_claim_key, stored_claim_key]))
                judgment_key = f"{sorted_claims[0]}_|_{sorted_claims[1]}"
                
                try:
                    if judgment_key in JUDGMENT_CACHE:
                        log.info(f"[CONTRADICTION ENGINE] Cache hit for judgment between {other_char} and {character_id}")
                        judgment = JUDGMENT_CACHE[judgment_key]
                    else:
                        # Prompt Gemini to be a pure logical judge
                        eval_prompt = (
                            "Context: You are a logic evaluating engine for a detective game.\n"
                            f"Statement A (by {other_char}): '{stored_claim_text}'\n"
                            f"Statement B (by {character_id}): '{new_claim}'\n\n"
                            "Do these two statements directly contradict each other? (e.g. one affirms what the other denies, "
                            "or they provide mutually exclusive accounts of an event). Answer ONLY 'YES' or 'NO'."
                        )
                    
                        def _eval_judge(active_client, model_name):
                            return active_client.models.generate_content(
                                model=model_name,
                                contents=eval_prompt,
                                config=types.GenerateContentConfig(temperature=0.0)
                            )
                        log.info(f"[CONTRADICTION ENGINE] High Similarity Score ({cos_sim:.3f}). Calling Gemini to evaluate direct logical contradiction.")
                        eval_resp = execute_with_fallback(_eval_judge, models=["gemini-2.5-flash", "gemini-2.0-flash"])
                        
                        judgment = eval_resp.text.strip().upper()
                        JUDGMENT_CACHE[judgment_key] = judgment
                except Exception as e:
                    log.error(f"Contradiction validation call failed: {e}")
                    continue
                    
                if "YES" in judgment:
                    # 5. Determine specifics for C1-C7
                    char_set = {other_char, character_id}
                    c_id = "UNKNOWN"
                    
                    if char_set == {"victor", "hayes"}:
                        c_id = "C1"
                    elif char_set == {"martha", "victor"}:
                        c_id = "C2"
                    elif char_set == {"victor", "dr_collins"}:
                        c_id = "C3"
                    elif char_set == {"dr_collins", "hayes"}:
                        c_id = "C5"
                    elif char_set == {"martha", "dr_collins"}:
                        c_id = "C6"
                    elif char_set == {"victor", "rose"}:
                        # C4 (Alibi vs Text) or C7 (Motive vs Score)
                        combined_text = (stored_claim_text + " " + new_claim).lower()
                        if "score" in combined_text or "win" in combined_text or "worried" in combined_text:
                            c_id = "C7"
                        else:
                            c_id = "C4"
                            
                    event = {
                        "contradiction_id": c_id,
                        "characters": [other_char, character_id],
                        "claim_a": stored_claim_text,
                        "claim_b": new_claim,
                        "timestamp": datetime.now().isoformat()
                    }
                    
                    # 6. Store it
                    session_state["found_contradictions"].append(event)
                    newly_found.append(event)
                    
                    log.info(f"CONTRADICTION DETECTED between {other_char} and {character_id}!")
                    
                    # 7. Increase the stress level of both assigned characters by 0.15
                    if other_char in agents:
                        agents[other_char].update_stress(0.15)
                    if character_id in agents:
                        agents[character_id].update_stress(0.15)

    return {
        "status": "success",
        "contradictions_found": newly_found
    }
