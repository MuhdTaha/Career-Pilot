# backend/models.py

from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

# Enums help keep the Agent's state predictable
class JobStatus(str, Enum):
    WISHLIST = "wishlist"
    ANALYZING = "analyzing" # Agent is working
    GENERATING = "generating" # Writing resume
    APPLIED = "applied"
    INTERVIEW = "interview"
    OFFER = "offer"

# 1. The Master Resume (The User's Base Data)
class WorkExperience(BaseModel):
    company: str
    role: str
    duration: str
    description: List[str] # List of bullet points
    
class ProjectExperience(BaseModel):
    name: str
    link: Optional[HttpUrl] = None
    description: List[str] # List of bullet points
    
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

# 2. The Job Application (The Unit of Work)
class JobApplication(BaseModel):
    id: Optional[str] = None
    user_id: str
    company_name: str
    position_title: str
    job_url: HttpUrl
    status: JobStatus = JobStatus.WISHLIST
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # These fields start empty and are filled by Agents later
    raw_description: Optional[str] = None
    technical_requirements: Optional[List[str]] = []
    cultural_values: Optional[List[str]] = []
    
    # The output of the "Writer" Agent
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