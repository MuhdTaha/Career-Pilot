# backend/agent.py
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig
import json

# Initialize Vertex AI
vertexai.init(project="career-pilot-480900", location="us-central1")

# Configure model to output JSON natively
model = GenerativeModel("gemini-2.5-pro")

def analyze_job_text(job_text: str):
    """
    Uses Gemini to extract structured intelligence from a job description.
    """
    prompt = f"""
    You are an expert Technical Recruiter. Analyze the job description below.
    
    ### TARGET JSON STRUCTURE:
    Ensure the output matches this structure exactly:
    {{
        "role_name": "The specific job title mentioned",
        "job_description_summary": "A concise summary of the role in 2 sentences.",
        "required_experience": "Summary of mandatory technical/professional experience.",
        "desirable_experience": "Summary of 'nice-to-have' skills (or null if none).",
        "hard_skills": ["List", "of", "technical", "skills", "tools", "languages"],
        "soft_skills": ["List", "of", "behavioral", "traits"],
        "cultural_values": ["List", "of", "company", "values"],
        "mission_critical": "One sentence on the core problem this role solves."
    }}

    JOB DESCRIPTION:
    {job_text}
    """

    # Use JSON mode for reliability
    response = model.generate_content(
        prompt,
        generation_config=GenerationConfig(
            response_mime_type="application/json",
            temperature=0.2 # Low temperature for factual extraction
        )
    )
    
    try:
        # With response_mime_type="application/json", .text usually returns clean JSON
        return json.loads(response.text)
    except json.JSONDecodeError:
        # Fallback in case of model hallucination
        raw_json = response.text.strip()
        if raw_json.startswith("```json"):
            raw_json = raw_json[7:-3]
        return json.loads(raw_json)