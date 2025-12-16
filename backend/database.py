# backend/database.py

import firebase_admin
from firebase_admin import credentials, firestore
from models import JobApplication, JobStatus

# Initialize Firebase Admin (Only once)
if not firebase_admin._apps:
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred, {
        'projectId': 'career-pilot-480900',
    })

db = firestore.client()

async def add_job_application(user_id: str, job_data: dict):
    # Reference: users/{user_id}/jobs/{auto_generated_id}
    # Note: We create the 'jobs' subcollection automatically by writing to it
    doc_ref = db.collection('users').document(user_id).collection('jobs').document()
    job_data['id'] = doc_ref.id
    doc_ref.set(job_data)
    return job_data

async def get_jobs_for_user(user_id: str):
    jobs_ref = db.collection('users').document(user_id).collection('jobs')
    docs = jobs_ref.stream()
    return [doc.to_dict() for doc in docs]

async def update_job(user_id: str, job_id: str, updates: dict):
    job_ref = db.collection('users').document(user_id).collection('jobs').document(job_id)
    job_ref.update(updates)
    return {"id": job_id, "updated": True}

async def delete_job(user_id: str, job_id: str):
    db.collection('users').document(user_id).collection('jobs').document(job_id).delete()
    return True

async def get_user_profile(user_id: str):
    doc_ref = db.collection('users').document(user_id).collection('profile').document('master')
    doc = doc_ref.get()
    if doc.exists:
        return doc.to_dict()
    return None

async def save_user_profile(user_id: str, profile_data: dict):
    doc_ref = db.collection('users').document(user_id).collection('profile').document('master')
    # Ensure user_id is set
    profile_data['user_id'] = user_id
    doc_ref.set(profile_data, merge=True)
    return profile_data
