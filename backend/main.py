# backend/main.py

from typing import Any, Dict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import JobApplication
from database import get_jobs_for_user, add_job_application, update_job, delete_job
import os
import traceback
from dotenv import load_dotenv
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
        jobs = await get_jobs_for_user(user_id)
        return jobs
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))    
    
# Update job route placeholder
@app.put("/api/jobs/{user_id}/{job_id}")
async def update_job_status(user_id: str, job_id: str, payload: Dict[str, Any]):
    try:
        # Only allow updating certain fields for now
        allowed_updates = {}
        if 'status' in payload:
            allowed_updates['status'] = payload['status']
            
        if not allowed_updates:
            raise HTTPException(status_code=400, detail="No valid fields to update.")
        
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
    analysis_result = analyze_job_text(description)
    
    # 4. Save the analysis back to Firestore
    updates = {
        "job_intel": analysis_result,
        "status": "analyzing",
        "technical_requirements": analysis_result.get("hard_skills", []),
        "cultural_values": analysis_result.get("cultural_values", [])
    }
    
    # If the AI found a clear Role Name, update the card title
    if analysis_result.get("role_name"):
        updates["position_title"] = analysis_result["role_name"]
        
    doc_ref.update(updates)
    
    return {"status": "success", "data": analysis_result}
    
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