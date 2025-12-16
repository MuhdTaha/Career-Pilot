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
class ProfileLink(BaseModel):
    label: str # e.g., "LinkedIn", "GitHub", "Portfolio"
    url: HttpUrl

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
    user_id: str
    full_name: str
    summary: Optional[str] = ""
    links: List[ProfileLink] = []
    skills: List[str] = []
    experience: List[WorkExperience] = []
    education: List[Education] = []
    projects: List[ProjectExperience] = []

# --- 2. AI Intelligence Model ---
class JobIntelligence(BaseModel):
    role_name: str
    job_description_summary: str
    required_experience: str
    desirable_experience: Optional[str] = None
    hard_skills: List[str]
    soft_skills: List[str]
    cultural_values: List[str]
    mission_critical: str
    
# --- 3. Career Coach Model ---
class TailoringStrategy(BaseModel):
    match_score: int # 0-100
    gap_analysis: Dict[str, List[str]] # {"missing": [], "matching": []}
    tailoring_instructions: List[str]
    suggested_summary: str

# --- 4. Job Application Model ---
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
    
    # Structured output from Career Coach Agent
    tailoring_strategy: Optional[TailoringStrategy] = None
    
    # Final Resume (Future Phase)
    tailored_resume_markdown: Optional[str] = None