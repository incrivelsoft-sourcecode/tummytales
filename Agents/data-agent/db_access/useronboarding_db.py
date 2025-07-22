# useronboarding_agent_collections.py
from datetime import datetime, timezone
from utils.db import db, users

from models.useronboarding_models import (
    UserDetailsModel,
    MomProfileModel,
    SupporterProfileModel
)
from utils.user_metadata import (
    extract_user_metadata_from_mom_profile, 
    extract_onboarding_summary
)

# -----------------------------
# Agent-Specific Collections (Retained)
# -----------------------------
onboarding_user_details = db["onboarding_agent_user_details"]
onboarding_mom_profiles = db["onboarding_agent_mom_profile"]
onboarding_supporter_profiles = db["onboarding_agent_supporter_profile"]

# -----------------------------
# Insert Functions
# -----------------------------
def insert_user_details(user_doc: UserDetailsModel):
    doc = user_doc.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    return onboarding_user_details.insert_one(doc)

def insert_mom_profile(user_id: str, mom_doc: MomProfileModel):
    doc = mom_doc.model_dump()
    doc["user_id"] = user_id
    doc["created_at"] = datetime.now(timezone.utc)
    return onboarding_mom_profiles.insert_one(doc)

def insert_supporter_profile(user_id: str, supporter_doc: SupporterProfileModel):
    doc = supporter_doc.model_dump()
    doc["user_id"] = user_id
    doc["created_at"] = datetime.now(timezone.utc)
    return onboarding_supporter_profiles.insert_one(doc)

# -----------------------------
# Retrieve Functions
# -----------------------------
def get_user_details(user_id: str):
    return onboarding_user_details.find_one({"user_id": user_id})

def get_mom_profile(user_id: str):
    return onboarding_mom_profiles.find_one({"user_id": user_id})

def get_supporter_profile(user_id: str):
    return onboarding_supporter_profiles.find_one({"user_id": user_id})

# -----------------------------
# Update Functions
# -----------------------------
def update_user_details(user_id: str, update_fields: dict):
    return onboarding_user_details.update_one({"user_id": user_id}, {"$set": update_fields})

def update_mom_profile(user_id: str, update_fields: dict):
    return onboarding_mom_profiles.update_one({"user_id": user_id}, {"$set": update_fields})

def update_supporter_profile(user_id: str, update_fields: dict):
    return onboarding_supporter_profiles.update_one({"user_id": user_id}, {"$set": update_fields})

# -----------------------------
# Delete Functions
# -----------------------------
def delete_user_details(user_id: str):
    return onboarding_user_details.delete_one({"user_id": user_id})

def delete_mom_profile(user_id: str):
    return onboarding_mom_profiles.delete_one({"user_id": user_id})

def delete_supporter_profile(user_id: str):
    return onboarding_supporter_profiles.delete_one({"user_id": user_id})

# -----------------------------
# Update Shared Users Collection
# -----------------------------
def update_user_profile_with_onboarding_data(user_id: str, mom_doc=None, supporter_doc=None):
    user_doc = onboarding_user_details.find_one({"user_id": user_id})
    if not user_doc:
        print(f"[onboarding] User {user_id} not found.")
        return None

    metadata_fields = extract_user_metadata_from_mom_profile(mom_doc) if mom_doc else {}
    onboarding_summary = extract_onboarding_summary(user_doc, mom_doc, supporter_doc)

    update_doc = {"$set": {**metadata_fields, **onboarding_summary}}
    users.update_one({"user_id": user_id}, update_doc, upsert=True)
    print(f"[onboarding] Updated shared user profile for user_id {user_id}")
    return True


# # -----------------------------
# # Metadata Extraction for Shared `users` Collection
# # -----------------------------
# def extract_user_metadata_from_mom_profile(mom_doc):
#     return {
#         "trimester_info": {
#             "estimatedDueDate": mom_doc.get("pregnancyStatus", {}).get("estimatedDueDate")
#         },
#         "cultural_background": mom_doc.get("generalDetails", {}).get("nationality"),
#         "language": mom_doc.get("lifestylePreferences", {}).get("preferredLanguage")
#     }

# def extract_onboarding_summary(user_doc, mom_doc=None, supporter_doc=None):
#     return {
#         "agent_metadata": {
#             "onboarding": {
#                 "role": user_doc.get("role"),
#                 "supporterLinked": bool(supporter_doc),
#                 "pregnant": mom_doc.get("pregnancyStatus", {}).get("currentlyPregnant") if mom_doc else None,
#                 "expectations": mom_doc.get("experienceAndExpectations", {}).get("expectations") if mom_doc else None
#             }
#         }
#     }