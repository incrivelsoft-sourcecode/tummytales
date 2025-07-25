import asyncio
from superkick import SuperKickFeedbackAgent, RAGEngine

async def run():
    test_input = {
        "user_id": "test-user-001",
        "personal_info": {
            "name": "Ananya Sharma",
            "age": 30,
            "weight_kg": 68,
            "height_cm": 165,
            "weeks_pregnant": 32,
            "due_date": "2025-08-15",
            "health_conditions": ["Gestational diabetes"]
        },
        "kick_logs": [
            {"timestamp": "2025-07-01T06:30:00Z", "strength": "Light flutter"},
            {"timestamp": "2025-07-01T07:45:00Z", "strength": "Gentle bump"},
            {"timestamp": "2025-07-01T08:30:00Z", "strength": "Strong kick"},
            {"timestamp": "2025-07-01T09:15:00Z", "strength": "Gentle bump"},
            {"timestamp": "2025-07-01T10:30:00Z", "strength": "Very strong kick"},
            {"timestamp": "2025-07-01T11:45:00Z", "strength": "Light flutter"},
            {"timestamp": "2025-07-01T13:00:00Z", "strength": "Strong kick"},
            {"timestamp": "2025-07-01T14:30:00Z", "strength": "Barely felt"},
            {"timestamp": "2025-07-01T15:15:00Z", "strength": "Gentle bump"},
            {"timestamp": "2025-07-01T16:45:00Z", "strength": "Strong kick"},
            {"timestamp": "2025-07-01T18:00:00Z", "strength": "Very strong kick"},
            {"timestamp": "2025-07-01T19:30:00Z", "strength": "Light flutter"},
            {"timestamp": "2025-07-01T21:00:00Z", "strength": "Gentle bump"},
            {"timestamp": "2025-07-01T22:15:00Z", "strength": "Barely felt"}
        ],
        "previous_pregnancy": {
            "history": "Normal delivery in 2021 with mild preeclampsia during third trimester.",
            "complications": ["Mild preeclampsia"],
            "medications": ["Iron supplements"]
        },
        "lifestyle": {
            "smoker": False,
            "alcohol": "Occasional",
            "exercise_routine": "Light yoga and walking 30 mins daily"
        },
        "recent_symptoms": [
            "Mild swelling in feet",
            "Occasional headaches",
            "Feeling tired more often"
        ]
    }

   # 🟢 2️⃣ Query RAG for context
    rag_context = await RAGEngine.query("best monitoring practice for fetal kicks")

    # 🟢 3️⃣ Run the SuperKickFeedbackAgent with the test input
    agent = SuperKickFeedbackAgent()
    final_feedback = await agent.run(test_input)
    print("Summary of Agent Feedback:\n", final_feedback["summary"])
    print("Technique:\n", final_feedback["technique"])
    print("\nPerformance:\n", final_feedback["performance"])
    print("\nWellness:\n", final_feedback["wellness"])


if __name__ == "__main__":
    asyncio.run(run())
