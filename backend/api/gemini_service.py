"""
api/gemini_service.py — Gemini AI integration layer
"""
import time
import json
import re
import google.generativeai as genai
from django.conf import settings


def _get_model():
    """Configure and return the Gemini model."""
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured.")
    genai.configure(api_key=settings.GEMINI_API_KEY)
    return genai.GenerativeModel(settings.GEMINI_MODEL)


MEDICAL_CODING_SYSTEM_PROMPT = """
You are MediCode AI — an expert clinical documentation and medical coding assistant specializing in:
- ICD-11 TM2 disease classification
- CPT procedure codes
- SNOMED CT clinical terminology
- ABDM (Ayushman Bharat Digital Mission) v3 standards
- HL7 FHIR R4 compliance

Always respond in valid JSON format. Be precise and clinically accurate.
"""

def generate_medical_codes(clinical_note: str) -> dict:
    """Generate ICD/CPT codes from a clinical note."""
    start = time.time()
    model = _get_model()

    prompt = f"""{MEDICAL_CODING_SYSTEM_PROMPT}

Analyze the following clinical note and return a JSON object with:
{{
  "icd_codes": [
    {{"code": "...", "description": "...", "confidence": 0.0-1.0}}
  ],
  "cpt_codes": [
    {{"code": "...", "description": "...", "confidence": 0.0-1.0}}
  ],
  "snomed_codes": [
    {{"code": "...", "description": "..."}}
  ],
  "primary_diagnosis": "...",
  "risk_level": "low|medium|high|critical",
  "summary": "...",
  "abdm_tags": []
}}

Clinical Note:
{clinical_note}
"""

    response = model.generate_content(prompt)
    elapsed_ms = int((time.time() - start) * 1000)

    text = response.text.strip()
    # Strip markdown code fences if present
    text = re.sub(r'^```(?:json)?\n?', '', text)
    text = re.sub(r'\n?```$', '', text)

    data = json.loads(text)
    data['processing_ms'] = elapsed_ms
    return data


def generate_clinical_summary(clinical_note: str) -> dict:
    """Generate a concise AI-powered clinical summary."""
    model = _get_model()
    prompt = f"""{MEDICAL_CODING_SYSTEM_PROMPT}

Provide a concise clinical summary in JSON:
{{
  "chief_complaint": "...",
  "history": "...",
  "assessment": "...",
  "plan": "...",
  "follow_up": "...",
  "red_flags": ["..."]
}}

Clinical Note:
{clinical_note}
"""
    response = model.generate_content(prompt)
    text = response.text.strip()
    text = re.sub(r'^```(?:json)?\n?', '', text)
    text = re.sub(r'\n?```$', '', text)
    return json.loads(text)


def ai_assistant_query(prompt: str, query_type: str = 'general') -> str:
    """General-purpose AI assistant for medical queries."""
    model = _get_model()
    system = f"""{MEDICAL_CODING_SYSTEM_PROMPT}
Query type: {query_type}
Answer concisely and accurately. If unsure, say so. Never fabricate medical facts.
"""
    response = model.generate_content(f"{system}\n\nQuestion: {prompt}")
    return response.text


def check_fhir_compliance(fhir_resource: dict) -> dict:
    """Check a FHIR resource for compliance issues."""
    model = _get_model()
    prompt = f"""{MEDICAL_CODING_SYSTEM_PROMPT}

Analyze this FHIR R4 resource for compliance and return JSON:
{{
  "is_compliant": true/false,
  "score": 0-100,
  "issues": ["..."],
  "recommendations": ["..."],
  "resource_type": "..."
}}

FHIR Resource:
{json.dumps(fhir_resource, indent=2)}
"""
    response = model.generate_content(prompt)
    text = response.text.strip()
    text = re.sub(r'^```(?:json)?\n?', '', text)
    text = re.sub(r'\n?```$', '', text)
    return json.loads(text)


def analyze_patient_risk(patient_data: dict) -> dict:
    """AI-powered patient risk stratification."""
    model = _get_model()
    prompt = f"""{MEDICAL_CODING_SYSTEM_PROMPT}

Analyze this patient data and return a risk assessment in JSON:
{{
  "risk_level": "low|medium|high|critical",
  "risk_score": 0-100,
  "risk_factors": ["..."],
  "protective_factors": ["..."],
  "recommendations": ["..."],
  "urgency": "routine|soon|urgent|emergency"
}}

Patient Data:
{json.dumps(patient_data, indent=2)}
"""
    response = model.generate_content(prompt)
    text = response.text.strip()
    text = re.sub(r'^```(?:json)?\n?', '', text)
    text = re.sub(r'\n?```$', '', text)
    return json.loads(text)
