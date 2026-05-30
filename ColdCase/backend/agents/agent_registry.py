from backend.agents.persona_agent import PersonaAgent

# Instantiate the single point of access for all character agents
# The knowledge cutoffs map to the story design spec.

victor_agent = PersonaAgent(
    character_id="victor", 
    knowledge_cutoff="2024-01-15T00:05:00", 
    stress=0.3
)

martha_agent = PersonaAgent(
    character_id="martha", 
    knowledge_cutoff="2024-01-14T23:18:00", 
    stress=0.3
)

hayes_agent = PersonaAgent(
    character_id="hayes", 
    knowledge_cutoff="2024-01-15T02:07:00", 
    stress=0.2
)

collins_agent = PersonaAgent(
    character_id="dr_collins", 
    knowledge_cutoff="2024-01-15T02:07:00", 
    stress=0.2
)

rose_agent = PersonaAgent(
    character_id="rose", 
    knowledge_cutoff="2024-01-14T22:20:00", 
    stress=0.3
)

agents = {
    "victor": victor_agent,
    "martha": martha_agent,
    "hayes": hayes_agent,
    "dr_collins": collins_agent,
    "rose": rose_agent
}
