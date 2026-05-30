import json
import logging
from typing import List, Dict, Any
from backend.scripts.graph.search import semantic_search

log = logging.getLogger(__name__)

def query_character_knowledge(character_id: str, query: str, before_timestamp: str) -> str:
    """
    Search a character's knowledge graph for facts relevant to a query,
    filtered by what they knew before a specific timestamp.
    
    Args:
        character_id: The ID of the character (e.g., "victor", "martha")
        query: The question or topic to search for
        before_timestamp: ISO 8601 string representing the character's knowledge cutoff
        
    Returns:
        A JSON string containing the formatted list of relevant facts.
    """
    log.info(f"[TOOL EXECUTION] Executing 'query_character_knowledge' for {character_id}. Goal: Semantic search memory graph for '{query}'")
    try:
        log.info(f"[KNOWLEDGE GRAPH] 🔄 Fetching character memory from Neo4j KG for: {character_id}")
        log.info(f"[KNOWLEDGE GRAPH] 🔍 Query: '{query}' | Cutoff: {before_timestamp}")
        
        results = semantic_search(
            query=query,
            character_id=character_id,
            before_timestamp=before_timestamp,
            top_k=5
        )
        
        log.info(f"[KNOWLEDGE GRAPH] ✅ Successfully retrieved {len(results)} facts from KG for {character_id}")
        
        # Format the facts for the LLM to easily consume
        formatted_facts = []
        for fact in results:
            formatted_facts.append({
                "fact": fact["content"],
                "source": fact["source"],
                "is_lie": fact["is_lie"],
                "confidence": fact["confidence"]
            })
            
        return json.dumps(formatted_facts, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e)})

# The explicit JSON schema for Gemini Function Calling
query_tool = {
    "name": "query_character_knowledge",
    "description": "Retrieves facts this character knows, filtered by their knowledge cutoff date",
    "parameters": {
        "type": "object",
        "properties": {
            "character_id": {
                "type": "string",
                "description": "The ID of the character (e.g., 'victor', 'martha', 'hayes', 'dr_collins', 'rose')"
            },
            "query": {
                "type": "string",
                "description": "The precise question or topic to semantic search against their memory"
            },
            "before_timestamp": {
                "type": "string", 
                "format": "date-time",
                "description": "ISO 8601 timestamp representing the character's knowledge cutoff"
            }
        },
        "required": ["character_id", "query", "before_timestamp"]
    }
}

# In-memory store for character claims during a session.
# Format: { "session_id": { "character_id": [ {"claim": "...", "question": "..."} ] } }
claims_store: Dict[str, Dict[str, List[Dict[str, str]]]] = {}

def log_claim(session_id: str, character_id: str, claim_text: str, question_asked: str) -> str:
    """
    Logs a claim made by a character during an interview. 
    This is used by the contradiction engine to cross-reference statements.
    
    Args:
        session_id: The UUID representing the current player session
        character_id: The ID of the character making the claim
        claim_text: What the character actually claimed
        question_asked: The question the player asked that prompted the claim
        
    Returns:
        JSON string confirming the logging success
    """
    log.info(f"[TOOL EXECUTION] Executing 'log_claim'. Saving claim from {character_id} for contradiction checking: '{claim_text}'")
    if session_id not in claims_store:
        claims_store[session_id] = {}
        
    if character_id not in claims_store[session_id]:
        claims_store[session_id][character_id] = []
        
    claims_store[session_id][character_id].append({
        "claim": claim_text,
        "question": question_asked
    })
    
    return json.dumps({"status": "success", "message": f"Claim logged for {character_id}"})

log_tool = {
    "name": "log_claim",
    "description": "Logs a factual claim or specific defensive statement made by the character so other systems can check it for contradictions.",
    "parameters": {
        "type": "object",
        "properties": {
            "session_id": {
                "type": "string",
                "description": "The current game session ID"
            },
            "character_id": {
                "type": "string",
                "description": "The ID of the character making the claim"
            },
            "claim_text": {
                "type": "string",
                "description": "The exact factual claim they are making (e.g. 'I was in the hallway at 11 PM')"
            },
            "question_asked": {
                "type": "string",
                "description": "The question the player just asked"
            }
        },
        "required": ["session_id", "character_id", "claim_text", "question_asked"]
    }
}
