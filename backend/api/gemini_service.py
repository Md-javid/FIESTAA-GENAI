"""
api/gemini_service.py — Gemini AI integration layer
Supports: auto model fallback, retry with backoff on quota errors.
"""
import time
import json
import re
import logging
import google.generativeai as genai
from django.conf import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Fallback model chain — tried in order when quota is exhausted.
# ✅ These are confirmed available for this API key via ListModels.
# ---------------------------------------------------------------------------
FALLBACK_MODELS = [
    'gemini-2.0-flash-lite',    # Primary — most generous free quota
    'gemini-2.0-flash',          # Standard
    'gemini-2.5-flash-lite',     # Next-gen lite fallback
    'gemini-2.5-flash',          # Next-gen standard fallback
]


def _configure():
    """Configure Gemini with the API key."""
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured.")
    genai.configure(api_key=settings.GEMINI_API_KEY)


def _generate_with_fallback(prompt: str, retries: int = 2) -> str:
    """
    Try generating content using the configured model first,
    then fall through the FALLBACK_MODELS chain if quota is exceeded.
    Returns the raw response text.
    """
    _configure()

    # Build ordered list: configured model first, then the rest
    primary = getattr(settings, 'GEMINI_MODEL', 'gemini-2.0-flash-lite')
    model_chain = [primary] + [m for m in FALLBACK_MODELS if m != primary]

    last_error = None
    for model_name in model_chain:
        for attempt in range(retries + 1):
            try:
                logger.info(f"[Gemini] Trying model={model_name} attempt={attempt + 1}")
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt)
                logger.info(f"[Gemini] Success with model={model_name}")
                return response.text.strip()

            except Exception as e:
                err_str = str(e)
                is_quota = (
                    'quota' in err_str.lower() or
                    'rate' in err_str.lower() or
                    '429' in err_str or
                    'RESOURCE_EXHAUSTED' in err_str
                )
                last_error = e

                if is_quota:
                    if attempt < retries:
                        wait = (2 ** attempt) * 2   # 2s, 4s
                        logger.warning(
                            f"[Gemini] Quota hit on {model_name}, "
                            f"retrying in {wait}s... ({err_str[:120]})"
                        )
                        time.sleep(wait)
                    else:
                        logger.warning(
                            f"[Gemini] Quota exhausted on {model_name}, "
                            f"switching to next fallback model."
                        )
                        break   # try next model
                else:
                    # Non-quota error — raise immediately, no point retrying
                    raise

    raise RuntimeError(
        f"All Gemini models exhausted their quota. Last error: {last_error}"
    )


def _clean_json(text: str) -> str:
    """Strip markdown code fences from JSON responses."""
    text = re.sub(r'^```(?:json)?\n?', '', text)
    text = re.sub(r'\n?```$', '', text)
    return text.strip()


# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------
MEDICAL_CODING_SYSTEM_PROMPT = """
You are MediCode AI — an expert clinical documentation and medical coding assistant specializing in:
- ICD-11 TM2 disease classification
- CPT procedure codes
- SNOMED CT clinical terminology
- ABDM (Ayushman Bharat Digital Mission) v3 standards
- HL7 FHIR R4 compliance

Always respond in valid JSON format. Be precise and clinically accurate.
"""


# ---------------------------------------------------------------------------
# Public service functions
# ---------------------------------------------------------------------------
def generate_medical_codes(clinical_note: str) -> dict:
    """Generate ICD/CPT codes from a clinical note."""
    start = time.time()

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
    text = _generate_with_fallback(prompt)
    elapsed_ms = int((time.time() - start) * 1000)

    data = json.loads(_clean_json(text))
    data['processing_ms'] = elapsed_ms
    return data


def generate_clinical_summary(clinical_note: str) -> dict:
    """Generate a concise AI-powered clinical summary."""
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
    text = _generate_with_fallback(prompt)
    return json.loads(_clean_json(text))


def ai_assistant_query(prompt: str, query_type: str = 'general') -> str:
    """General-purpose AI assistant for medical queries."""
    system = f"""{MEDICAL_CODING_SYSTEM_PROMPT}
Query type: {query_type}
Answer concisely and accurately. If unsure, say so. Never fabricate medical facts.
"""
    return _generate_with_fallback(f"{system}\n\nQuestion: {prompt}")


def check_fhir_compliance(fhir_resource: dict) -> dict:
    """Check a FHIR resource for compliance issues."""
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
    text = _generate_with_fallback(prompt)
    return json.loads(_clean_json(text))


def analyze_patient_risk(patient_data: dict) -> dict:
    """AI-powered patient risk stratification."""
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
    text = _generate_with_fallback(prompt)
    return json.loads(_clean_json(text))
