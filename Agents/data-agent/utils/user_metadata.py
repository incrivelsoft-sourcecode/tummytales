# utils/user_metadata.py

def extract_user_metadata_from_mom_profile(mom_doc):
    return {
        "trimester_info": {
            "estimatedDueDate": mom_doc.get("pregnancyStatus", {}).get("estimatedDueDate")
        },
        "cultural_background": mom_doc.get("generalDetails", {}).get("nationality"),
        "language": mom_doc.get("lifestylePreferences", {}).get("preferredLanguage")
    }

def extract_onboarding_summary(user_doc, mom_doc=None, supporter_doc=None):
    return {
        "agent_metadata": {
            "onboarding": {
                "role": user_doc.get("role"),
                "supporterLinked": bool(supporter_doc),
                "pregnant": mom_doc.get("pregnancyStatus", {}).get("currentlyPregnant") if mom_doc else None,
                "expectations": mom_doc.get("experienceAndExpectations", {}).get("expectations") if mom_doc else None
            }
        }
    }

def extract_nutrition_context_from_user(user_doc):
    return {
        "trimester": user_doc.get("trimester_info", {}).get("estimatedDueDate"),
        "dietary_restrictions": user_doc.get("dietary_restrictions"),
        "cuisine_preferences": user_doc.get("cuisine_preferences"),
        "allergies": user_doc.get("allergies"),
        "nutritional_focus": user_doc.get("nutritional_focus"),
        "user_id": user_doc.get("user_id"),
    }
