# backend/main.py

from typing import Any, Dict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import os
import traceback
from dotenv import load_dotenv

from models import JobApplication, JobIntelligence
from database import get_jobs_for_user, add_job_application, update_job, delete_job, db
from tools import scrape_job_text
from agents import analyze_job_text

# Load environment variables from .env file
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="CareerPilot ADK Backend")

# CORS configuration to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Default route to check if the server is running
@app.get("/")
def health_check():
    return {
        "status": "CareerPilot ADK Backend is running",
        "system": "CareerPilot Agentic Core",
        "version": "1.0.0"
    }

# Placeholder for additional routes and logic
@app.get("/api/agent/status")
def agent_status():
    return {
        "agent": "RecruiterAgent",
        "status": "IDLE"
    }
    
# Create jobs route placeholder
@app.post("/api/jobs", response_model=JobApplication)
async def create_job(job: JobApplication):
    # for now, we will use hardcoded user_id
    try:
        # convert pydantic model to dict and save to database
        job_dict = job.model_dump(mode="json")
        saved_job = await add_job_application(job.user_id, job_dict)
        return saved_job
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
# Get jobs for user route placeholder
@app.get("/api/jobs/{user_id}")
async def get_jobs_for_user_route(user_id: str):
    try:
        # Fetch jobs from database
        jobs = await get_jobs_for_user(user_id)
        return jobs
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))    
    
# Update job route placeholder
@app.put("/api/jobs/{user_id}/{job_id}")
async def update_job_status(user_id: str, job_id: str, payload: Dict[str, Any]):
    try:
        # Extract allowed fields to update
        allowed_updates = {key: payload[key] for key in [
            'status',
            'raw_description', 
            'position_title', 
            'job_url', 
            'company_name',
            ] if key in payload}
        
        # Update the job in the database
        result = await update_job(user_id, job_id, allowed_updates)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/analyze/{user_id}/{job_id}")
async def analyze_job(user_id: str, job_id: str):
    # 1. Fetch job posting from Firestore
    doc_ref = db.collection('users').document(user_id).collection('jobs').document(job_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job_data = doc.to_dict()
    
    # 2. Check if raw_description already exists
    description = job_data.get('raw_description', '')
    if len(description) < 50:
        return {"status": "error", "message": "No job description found. Please paste it first."}
    
    # 3. Run the Recruiter Agent to analyze the job description
    print(f"Agent Analyzing Job: {job_id}...")
    analysis_dict = analyze_job_text(description)
    
    # 4. Save the analysis back to Firestore
    try:
        job_intel = JobIntelligence(**analysis_dict)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis result validation failed: {str(e)}")
    
    updates = {
        "job_intel": job_intel.model_dump(mode="json"),
        "position_title": job_intel.role_name,
    }
    
    # 5. Update the job document in Firestore
    doc_ref.update(updates)
    
    return {"status": "success", "data": job_intel.model_dump(mode="json")}
    
# Delete job posting route placeholder
@app.delete("/api/jobs/{user_id}/{job_id}")
async def delete_job_posting(user_id: str, job_id: str):
    try:
        result = await delete_job(user_id, job_id)
        return {"status": "success", "deleted": result, "job_id": job_id}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 