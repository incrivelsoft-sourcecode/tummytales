from datetime import datetime
from db.mongo import profile_col, memory_col
from agents.superkick import SuperKickFeedbackAgent
from agents.rag_query import RAGEngine
from fastapi import HTTPException


async def get_feedback_for_user(user_id: str):
    # 📥 Load user profile
    profile = await profile_col.find_one({"userId": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="No profile found for this user.")

    # 📑 Get kick entries
    kick_entries = profile.get("kickEntries", [])
    if not kick_entries:
        return {"message": "No kick logs available for this user."}

    # 📌 Pregnancy info
    preg = profile.get("pregnancyStatus", {})
    loss = preg.get("PregnancyLossInfo", {}).get("details", {})
    child = preg.get("firstChildInfo", {}).get("details", {})
    health = profile.get("healthCare", {})
    exp = profile.get("experienceAndExpectations", {})

    # 📊 Kick summary
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

    # 🔗 Build analysis context
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

    # ✅ Run SuperKick Agent (agent handles technique, performance, wellness)
    superkick_agent = SuperKickFeedbackAgent()
    agent_feedback = superkick_agent.run(context)

    # 🔎 RAG: dynamically query medical best practices
    rag_query = "What best practices should the mom follow based on these kick logs?"
    rag_result = RAGEngine(rag_query)

    # 🗂️ Save combined output
    await memory_col.insert_one({
        "user_id": user_id,
        "timestamp": datetime.utcnow().isoformat(),
        "context": context,
        "feedback_summary": agent_feedback.get("summary", ""),
        "technique": agent_feedback.get("technique", ""),
        "performance": agent_feedback.get("performance", ""),
        "wellness": agent_feedback.get("wellness", ""),
        "rag_answer": rag_result.get("answer", ""),
        "rag_sources": rag_result.get("sources", []),
    })

    return {
        "summary": agent_feedback.get("summary", ""),
        "technique": agent_feedback.get("technique", ""),
        "performance": agent_feedback.get("performance", ""),
        "wellness": agent_feedback.get("wellness", ""),
        "rag_answer": rag_result.get("answer", ""),
        "rag_sources": rag_result.get("sources", []),
    }