from datetime import datetime
from fastapi import HTTPException
from db.mongo import profile_col, memory_col
from agents.rag_query import RAGEngine
from utils.llm import LLMWrapper

llm = LLMWrapper()  # Wraps Groq or any LLM you defined

async def get_feedback_for_user(user_id: str):
    profile = await profile_col.find_one({"userId": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="No profile found for this user.")

    kick_entries = profile.get("kickEntries", [])
    if not kick_entries:
        return {"message": "No kick logs available for this user."}

    preg = profile.get("pregnancyStatus", {})
    loss = preg.get("PregnancyLossInfo", {}).get("details", {})
    child = preg.get("firstChildInfo", {}).get("details", {})
    health = profile.get("healthCare", {})
    exp = profile.get("experienceAndExpectations", {})

    kick_count_summary = {}
    for entry in kick_entries:
        strength = entry.get("strength", "Unknown")
        kick_count_summary[strength] = kick_count_summary.get(strength, 0) + 1

    kick_summary_text = "\n".join(
        f"- {strength}: {count}" for strength, count in kick_count_summary.items()
    )

    kick_log_text = "\n".join(
        f"- {k['date']} {k.get('timestamp', '')}: {k['strength']}"
        for k in kick_entries
    )

    context = f"""
### Pregnancy Details:
- Currently Pregnant: {preg.get('currentlyPregnant')}
- LMP: {preg.get('Last_menstrualperiod')}
- EDD: {preg.get('estimatedDueDate')}

### Previous Pregnancy Loss:
- Had Loss: {preg.get('PregnancyLossInfo', {}).get('hasPregnancyLoss')}
- Date of Loss: {loss.get('dateOfLoss')}
- Reason: {loss.get('reason')}
- Gestation Weeks: {loss.get('gestationWeeks')}
- Treatment Location: {loss.get('treatmentLocation')}

### Last Child Info:
- Is First Child: {preg.get('firstChildInfo', {}).get('isFirstChild')}
- DOB: {child.get('dob')}
- Complications: {child.get('complications')}
- Delivery Method: {child.get('deliverymethod')}
- Birth Location: {child.get('childbornlocation')}
- Gestational Age at Birth: {child.get('gestationalAgeAtBirth')}

### Health Info:
- Height: {health.get('height')}
- Weight: {health.get('weight')}

### Experience & Expectations:
- Expectations: {exp.get('expectations')}
- Challenges: {exp.get('challenges')}

### Kick Count Summary:
{kick_summary_text}

### Kick Log Details:
{kick_log_text}
"""

    rag_query = "What best practices should the mom follow based on these kick logs?"
    rag_result = RAGEngine(rag_query)

    prompt = f"""
You are a helpful and empathetic pregnancy assistant AI. Based on the user's profile, pregnancy history, and recent fetal movement log, provide tailored feedback and actionable advice.

Respond with:

1. A summary of the user's fetal kick activity
2. Any insights or concerns
3. Suggested monitoring techniques
4. Tips for comfort and home care
5. Reassuring tone, avoiding alarm unless medically justified

User Context:
{context}

Medical Guidance:
{rag_result.get("answer", "")}

Please generate detailed and thoughtful feedback.
"""

    llm_feedback = llm.generate(prompt)

    await memory_col.insert_one({
        "user_id": user_id,
        "timestamp": datetime.utcnow().isoformat(),
        "context": context,
        "feedback_text": llm_feedback,
        "rag_answer": rag_result.get("answer", ""),
        "rag_sources": rag_result.get("sources", [])
    })

    return {
        "summary": llm_feedback,
        "rag_answer": rag_result.get("answer", ""),
        "rag_sources": rag_result.get("sources", [])
    }