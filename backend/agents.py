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
    
def parse_resume_text(resume_text: str):
    """
    Uses Gemini to extract a MasterResume structure from raw resume text.
    """
    
    prompt = f"""
    You are an expert Resume Parser. Your job is to convert raw resume text into a structured JSON format.
    
    ### INSTRUCTIONS:
    1. Extract the candidate's full name, summary (generate one if missing), and contact links.
    2. Extract all Skills into a flat list of strings.
    3. Extract Work Experience. For "description", split the bullet points into a list of strings.
    4. Extract Education and Projects if present.
    
    ### TARGET JSON STRUCTURE:
    {{
        "full_name": "Name found",
        "summary": "Professional summary text",
        "links": [{{"label": "LinkedIn", "url": "..."}}],
        "skills": ["Python", "React", ...],
        "experience": [
            {{
                "company": "Company Name",
                "role": "Job Title",
                "duration": "Date Range",
                "description": ["Bullet 1", "Bullet 2"]
            }}
        ],
        "education": [
            {{
                "institution": "University Name",
                "degree": "Degree Name",
                "major": "Field of Study",
                "graduation_year": "Year"
            }}
        ],
        "projects": [
            {{
                "name": "Project Name",
                "description": ["Bullet 1", "Bullet 2"]
            }}
        ]
    }}

    ### RAW RESUME TEXT:
    {resume_text}
    """

    try:
        response = model.generate_content(
            prompt,
            generation_config=GenerationConfig(
                response_mime_type="application/json",
                temperature=0.1 # Very low temp for strict extraction
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Parsing Error: {e}")
        return None
    
def generate_tailoring_strategy(job_intel: dict, master_resume: dict):
    """
    Compares the Master Resume against Job Intel to produce a strategy.
    """
    
    # Safely extract data with defaults
    skills = master_resume.get('skills', [])
    # Get first role safely
    recent_role = "N/A"
    if master_resume.get('experience') and len(master_resume['experience']) > 0:
        recent_role = f"{master_resume['experience'][0].get('role')} at {master_resume['experience'][0].get('company')}"
    
    summary = master_resume.get('summary', '')

    prompt = f"""
    You are an expert Career Coach. Perform a Gap Analysis between the Candidate and the Job.

    **CANDIDATE:**
    - Recent Role: {recent_role}
    - Skills: {skills}
    - Summary: {summary}

    **JOB TARGET:**
    - Role: {job_intel.get('role_name')}
    - Critical Mission: {job_intel.get('mission_critical')}
    - Required Skills: {job_intel.get('hard_skills')}
    - Values: {job_intel.get('cultural_values')}

    **TASK:**
    1. Calculate a match score (0-100) based on skills and experience alignment.
    2. Identify missing hard skills vs matching skills.
    3. Provide 3-5 specific instructions to tailor the resume (e.g. "Add 'Typescript' to skills", "Highlight leadership in summary").
    4. Write a new 2-sentence Professional Summary tailored to this job.

    **OUTPUT JSON:**
    {{
        "match_score": 85,
        "gap_analysis": {{
            "missing_skills": ["List", "of", "missing"],
            "matching_skills": ["List", "of", "matches"]
        }},
        "tailoring_instructions": ["Instruction 1", "Instruction 2"],
        "suggested_summary": "New summary text..."
    }}
    """

    try:
        response = model.generate_content(
            prompt,
            generation_config=GenerationConfig(
                response_mime_type="application/json",
                temperature=0.4
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Coach Error: {e}")
        return None