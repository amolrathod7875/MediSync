"""
Clinical Summary Generation Service
Generates structured clinical summaries using LLM with RAG
"""

from typing import Dict, Any, List, Optional
import json

from backend.core.config import settings
from backend.services.rag import retrieve_documents


# JSON Schema for clinical output
CLINICAL_SCHEMA = {
    "patient_summary": {
        "chief_complaint": "string",
        "diagnosis": ["string"],
        "medications": [
            {
                "name": "string",
                "dosage": "string",
                "frequency": "string",
                "route": "string"
            }
        ],
        "allergies": ["string"],
        "vitals": {
            "blood_pressure": "string",
            "heart_rate": "string",
            "temperature": "string",
            "respiratory_rate": "string"
        },
        "procedures_performed": ["string"],
        "follow_up_instructions": "string",
        "discharge_disposition": "string"
    },
    "citations": [
        {
            "claim": "string",
            "source_document": "string",
            "chunk_id": "string"
        }
    ]
}


# System prompts
DISCHARGE_SUMMARY_PROMPT = """You are a medical AI assistant specialized in generating discharge summaries.

Generate a comprehensive discharge summary based on the patient's clinical documents.

REQUIREMENTS:
1. Output MUST be valid JSON following this schema:
{schema}

2. For each clinical claim, include a [CHUNK_ID] citation in brackets.

3. Include only information present in the provided context.

4. If information is not available, use null or empty arrays.

CONTEXT:
{context}

Generate the discharge summary now:"""

HANDOFF_NOTE_PROMPT = """You are a medical AI assistant specialized in generating shift handoff notes.

Generate a structured handoff note (SOAP format) based on the patient's clinical documents.

REQUIREMENTS:
1. Output MUST be valid JSON following this schema:
{schema}

2. For each clinical claim, include a [CHUNK_ID] citation in brackets.

3. Include only information present in the provided context.

4. If information is not available, use null or empty arrays.

CONTEXT:
{context}

Generate the handoff note now:"""


async def generate_clinical_summary(
    patient_id: str,
    document_ids: List[str],
    summary_type: str = "discharge",
    include_citations: bool = True
) -> Dict[str, Any]:
    """
    Generate a clinical summary using RAG and LLM
    """
    # Retrieve relevant context
    query = "patient clinical information diagnosis medications allergies vitals discharge"
    context_docs = await retrieve_documents(query, patient_id, k=10)
    
    # Build context from retrieved documents
    context = _build_context(context_docs)
    
    # Select prompt based on summary type
    if summary_type == "discharge":
        system_prompt = DISCHARGE_SUMMARY_PROMPT.format(
            schema=json.dumps(CLINICAL_SCHEMA),
            context=context
        )
    else:
        system_prompt = HANDOFF_NOTE_PROMPT.format(
            schema=json.dumps(CLINICAL_SCHEMA),
            context=context
        )
    
    # Generate summary using LLM
    generated_content = await _call_llm(system_prompt)
    
    # Parse and validate output
    parsed_content = _parse_llm_output(generated_content)
    
    # Extract citations
    citations = _extract_citations(parsed_content, context_docs)
    
    return {
        "content": parsed_content.get("patient_summary", {}),
        "raw_output": generated_content,
        "citations": citations
    }


def _build_context(documents: List[Dict[str, Any]]) -> str:
    """Build context string from retrieved documents"""
    context_parts = []
    
    for i, doc in enumerate(documents):
        chunk_id = doc.get("chunk_id", f"chunk_{i}")
        content = doc.get("content", "")
        
        context_parts.append(f"[{chunk_id}] {content}")
    
    return "\n\n".join(context_parts)


async def _call_llm(prompt: str) -> str:
    """
    Call LLM to generate summary
    """
    # Placeholder - would integrate with OpenAI or Anthropic
    # For now, return a mock response
    
    mock_response = {
        "patient_summary": {
            "chief_complaint": "Chest pain and shortness of breath",
            "diagnosis": ["Acute myocardial infarction", "Hypertension"],
            "medications": [
                {
                    "name": "Aspirin",
                    "dosage": "81mg",
                    "frequency": "Daily",
                    "route": "Oral"
                }
            ],
            "allergies": ["Penicillin"],
            "vitals": {
                "blood_pressure": "140/90 mmHg",
                "heart_rate": "88 bpm",
                "temperature": "98.6°F",
                "respiratory_rate": "18/min"
            },
            "procedures_performed": ["ECG", "Cardiac enzymes"],
            "follow_up_instructions": "Follow up with cardiology in 2 weeks",
            "discharge_disposition": "Home"
        },
        "citations": []
    }
    
    return json.dumps(mock_response)


def _parse_llm_output(output: str) -> Dict[str, Any]:
    """Parse LLM JSON output"""
    try:
        return json.loads(output)
    except json.JSONDecodeError:
        # Try to extract JSON from output
        import re
        json_match = re.search(r'\{.*\}', output, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except:
                pass
        
        return {"patient_summary": {}, "citations": []}


def _extract_citations(
    content: Dict[str, Any],
    context_docs: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Extract citations from generated content"""
    citations = []
    
    # This would parse the [CHUNK_ID] tags from LLM output
    # For now, return placeholder
    
    return citations
