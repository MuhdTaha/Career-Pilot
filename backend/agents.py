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
    You are an expert Technical Recruiter and Career Coach. 
    Analyze the job description provided below. Your goal is to normalize varied job posting styles into a structured format.

    ### INSTRUCTIONS:
    1. **Identify Semantics over Syntax:** Job descriptions use different headers. 
       - Treat sections like "You are a good fit if...", "What you bring", "About you", "Qualifications", or "Requirements" as **Required Experience**.
       - Treat sections like "Bonus points", "Nice to have", "Preferred Qualifications", "Pluses", or "It would be great if..." as **Desirable Experience**.
    2. **Inference:** If distinct headers are missing, infer the requirements based on language intensity (e.g., "Must have" vs. "Experience with X is a plus").
    3. **Extraction:** Populate the JSON fields below.

    ### TARGET JSON STRUCTURE:
    {{
        "role_name": "The specific job title mentioned",
        "job_description_summary": "A concise summary of the overall job description in 2-3 sentences.",
        "required_experience": "A comprehensive summary of the mandatory experience/background. Include years of experience if stated.",
        "desirable_experience": "A summary of preferred or bonus experience. If none is found, return null.",
        "hard_skills": ["List", "of", "specific", "tools", "languages", "or", "platforms"],
        "soft_skills": ["List", "of", "interpersonal", "or", "behavioral", "traits"],
        "cultural_values": ["List", "of", "explicit", "or", "implied", "company", "values"],
        "mission_critical": "A one-sentence synthesis of the core problem this role solves for the company."
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