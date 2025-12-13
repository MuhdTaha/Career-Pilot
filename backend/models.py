# backend/models.py

from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

# Enums
class JobStatus(str, Enum):
    WISHLIST = "wishlist"
    ANALYZING = "analyzing"
    GENERATING = "generating"
    APPLIED = "applied"
    INTERVIEW = "interview"
    OFFER = "offer"

# --- 1. Master Resume Models ---
class WorkExperience(BaseModel):
    company: str
    role: str
    duration: str
    description: List[str]
    
class ProjectExperience(BaseModel):
    name: str
    link: Optional[HttpUrl] = None
    description: List[str]

class Education(BaseModel):
    institution: str
    degree: str
    major: str
    graduation_year: str

class MasterResume(BaseModel):
    skills: List[str]
    experience: List[WorkExperience]
    education: List[Education]
    projects: Optional[List[ProjectExperience]] = None

# --- 2. AI Intelligence Model ---
# This matches the JSON output from the Recruiter Agent exactly
class JobIntelligence(BaseModel):
    role_name: str
    job_description_summary: str
    required_experience: str
    desirable_experience: Optional[str] = None
    hard_skills: List[str]
    soft_skills: List[str]
    cultural_values: List[str]
    mission_critical: str

# --- 3. Job Application Model ---
class JobApplication(BaseModel):
    id: Optional[str] = None
    user_id: str
    company_name: str
    position_title: str
    job_url: HttpUrl
    status: JobStatus = JobStatus.WISHLIST
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Raw input
    raw_description: Optional[str] = None
    
    # Structured output from Agent (Stored as a nested object)
    job_intel: Optional[JobIntelligence] = None
    
    # The output of the "Writer" Agent (Future Phase)
    tailored_resume_markdown: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_123",
                "company_name": "Google",
                "position_title": "Software Engineer II",
                "job_url": "https://careers.google.com/jobs/results/123",
                "status": "wishlist"
            }
        }