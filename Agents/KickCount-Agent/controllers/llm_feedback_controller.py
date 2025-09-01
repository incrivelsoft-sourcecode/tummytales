from datetime import datetime, timedelta
from fastapi import HTTPException
from db.mongo import profile_col, memory_col, entries_col
from agents.rag_query import RAGEngine
from utils.llm import LLMWrapper
from bson import ObjectId
from fastapi import HTTPException
import json

llm = LLMWrapper()  # Wraps Groq or any LLM of choice

async def get_feedback_for_user(user_id: str):

    print(user_id)
    # ── 1. Validate user ─────────────────────────────────────────────
    profile = await profile_col.find_one({"_id": ObjectId(user_id)})
    if not profile:
        raise HTTPException(status_code=404, detail="No profile found for this user.")

    # ── 2. Pull today’s kicks  (or use whole collection –‑ keep your logic) ──────
    kicks_cursor = entries_col.find({"user_id": user_id})
    kicks = await kicks_cursor.to_list(length=None)
    if not kicks:
        return {"message": "No kick logs available for this user."}

    # ── 3. Build kick‑count summary text ─────────────────────────────
    kick_counts = {}
    for k in kicks:
        strength = k.get("strength", "Unknown")
        kick_counts[strength] = kick_counts.get(strength, 0) + 1

    kick_summary_text = "\n".join(f"- {s}: {c}" for s, c in kick_counts.items())
    kick_log_text      = "\n".join(f"- {k['timestamp']}: {k.get('strength','Unknown')}" for k in kicks)

    # ── 4. Build user context (trimmed for brevity) ──────────────────
    preg   = profile.get("pregnancyStatus", {})
    health = profile.get("healthCare", {})
    exp    = profile.get("experienceAndExpectations", {})

    context = f"""
### Pregnancy Details
- Currently Pregnant: {preg.get('currentlyPregnant')}
- EDD: {preg.get('estimatedDueDate')}

### Health
- Height: {health.get('height')}
- Weight: {health.get('weight')}

### Expectations & Challenges
- Expectations: {exp.get('expectations')}
- Challenges:   {exp.get('challenges')}

### Kick Count Summary
{kick_summary_text}

### Kick Log
{kick_log_text}
"""

    # ── 5.   🔍  Retrieve best‑practice guidance with RAG  ─────────────
    rag_query  = "What best practices should the mom follow based on these kick logs?"
    #  👉  call static method (await because the method is declared async)
    rag_answer = await RAGEngine.query(rag_query)       # returns a string

    # ── 6.   🧠  Compose final prompt & generate feedback  ─────────────
    prompt = f"""
You are a helpful pregnancy assistant AI. Using the information below,
generate a concise and supportive report in the following **exact JSON format**:

{{
  "title": "string – a reassuring or cautionary headline",
  "summary": "string – 3-4 sentence summary of fetal movement",
  "takeaways": ["string", "string", "string"],  // 2–3 bullet points
  "riskLevel": "low" | "medium" | "high"        // based on movement patterns
}}

Only return the JSON object. Do not include explanations or formatting outside the JSON.

Use the following information for your analysis:

User Context:
{context}

Medical Guidance (from RAG):
{rag_answer}
"""


    llm_feedback = llm.generate(prompt)

    # ── 7.   💾  Persist in memory_col (optional) ─────────────────────
    await memory_col.insert_one({
        "user_id":    user_id,
        "timestamp":  datetime.utcnow().isoformat(),
        "context":    context,
        "feedback":   llm_feedback,
        "rag_answer": rag_answer
    })

    # ── 8.   Return payload back to the route  ────────────────────────
    try:
        parsed = json.loads(llm_feedback)
    except Exception:
        parsed = {
            "title": "Feedback could not be fetched",
            "summary": "An error occurred while generating feedback. Please try again later.",
            "takeaways": [
                "✖ Unable to analyze movement data",
                "✖ LLM did not return structured output"
            ],
            "riskLevel": "unknown",  # frontend expects camelCase key
            "details": "The feedback generation process encountered an issue."
        }

    return {
    "feedback": parsed,
    "rag_answer": rag_answer
}


# ─────────────────────────────────────────────────────────────
# NEW: Generate Daily Summary for Today's Kicks
# ─────────────────────────────────────────────────────────────
async def get_daily_summary(user_id: str):
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    kicks_cursor = entries_col.find({
        "user_id": user_id,
        "timestamp": {"$gte": today_start, "$lt": today_end}
    })
    kicks = await kicks_cursor.to_list(length=None)

    if not kicks:
        return {"message": "No kicks recorded for today."}

    # Count kicks by strength
    kick_count_summary = {}
    for entry in kicks:
        strength = entry.get("strength", "Unknown")
        kick_count_summary[strength] = kick_count_summary.get(strength, 0) + 1

    kick_summary_text = "\n".join(
        f"- {strength}: {count}" for strength, count in kick_count_summary.items()
    )

    kick_log_text = "\n".join(
        f"- {k['timestamp']}: {k.get('strength', 'Unknown')}" for k in kicks
    )

    prompt = f"""
    Summarize today's fetal kick activity in **one single sentence**.
    Only include:
    1. Total kicks recorded today ({len(kicks)}).
    2. A short suggestion on when to have the next session.
    Avoid adding any detailed explanation or multiple sentences.
    Do not include types of kicks or any other details.
    Today's Kick Summary:
    {kick_summary_text}
    """

    daily_feedback = llm.generate(prompt)

    return {
        "summary": daily_feedback,
        "kick_summary": kick_count_summary,
        "total_kicks": len(kicks)
    }