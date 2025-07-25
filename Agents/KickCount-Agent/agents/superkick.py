from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os
from agents.rag_query import RAGEngine # Import the RAG query function

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")

# ──────────────────────────────────────────────
# Base Agent
# ──────────────────────────────────────────────
class KickAnalysisAgent:
    def __init__(self, role: str, prompt_template: str):
        self.role = role
        self.prompt = PromptTemplate.from_template(prompt_template)
        self.model = ChatGroq(temperature=0.3, model_name="llama3-70b-8192", api_key=api_key)

    def run(self, context: str) -> str:
        chain = self.prompt | self.model
        result = chain.invoke({"context": context})
        return result.content

# ──────────────────────────────────────────────
# Role Prompts
# ──────────────────────────────────────────────
technique_prompt = """
You are a fetal movement technique coach.
Analyze the kick logs and user context for accuracy, consistency, and tracking discipline.
Provide clear advice if there are missing patterns or if the log shows inconsistencies.
Keep the tone supportive and clear. 
Advise on how to improve tracking methods if needed.
Answer like a supporter and coach, not a doctor.

Context:
{context}
"""

performance_prompt = """
You are a fetal movement performance analyst.
Evaluate the strength and frequency of the kicks based on context.
Compare them to typical healthy fetal movement ranges.
Highlight any risk signals or give positive reinforcement if patterns are healthy.
Advise on how to effectively track kicks and what to look for.
Answer like a supportive coach, not a doctor.

Context:
{context}
"""

wellness_prompt = """
You are a wellness and stress coach.
Combine maternal health, fetal movement, and any lifestyle hints.
Offer emotional support, practical advice, and ways to track more reliably.
Always close with a short supportive note.
Advise on how to maintain a healthy pregnancy and what wellness signals to watch for.
Answer like a supportive coach, not a doctor.

Context:
{context}
"""

summary_prompt = """
You are a summary synthesizer.
Combine the multi-agent feedback into a short, actionable message to the user (Amma).
Encourage the user and include any vital signals they should watch for.
Be warm, precise, and use simple words.
Always end with a positive note to keep the user motivated.
Just summarize the key points from the technique, performance, and wellness agents.
Suggest actionable next steps if needed.
Answer like a supportive AI assistant, not a doctor.

Combined Feedback:
{context}
"""

# ──────────────────────────────────────────────
# Role Agents
# ──────────────────────────────────────────────
TechniqueCoach = KickAnalysisAgent("Technique", technique_prompt)
PerformanceAnalyst = KickAnalysisAgent("Performance", performance_prompt)
WellnessObserver = KickAnalysisAgent("Wellness", wellness_prompt)
SummarySynthesizer = KickAnalysisAgent("Synthesizer", summary_prompt)

# ──────────────────────────────────────────────
# SuperKick Agent
# ──────────────────────────────────────────────
class SuperKickFeedbackAgent:
    def __init__(
        self,
        technique_agent=TechniqueCoach,
        performance_agent=PerformanceAnalyst,
        wellness_agent=WellnessObserver,
        synthesizer=SummarySynthesizer,
    ):
        self.tech_agent = technique_agent
        self.perf_agent = performance_agent
        self.well_agent = wellness_agent
        self.synthesizer = synthesizer

    async def run(self, user_context: str) -> dict:
        try:
            # ✅ Await the RAG query if async
            try:
                rag_result = await RAGEngine.query(user_context)
                rag_context = rag_result["answer"]
                rag_sources = rag_result.get("sources", [])
            except Exception as rag_error:
                rag_context = ""
                rag_sources = []

            full_context = f"{user_context}\n\n---\n\nRAG MEDICAL CONTEXT:\n{rag_context}"

            # The role agents can stay sync
            tech_feedback = self.tech_agent.run(full_context)
            perf_feedback = self.perf_agent.run(full_context)
            well_feedback = self.well_agent.run(full_context)

            combined = (
                f"TECHNIQUE:\n{tech_feedback}\n\n"
                f"PERFORMANCE:\n{perf_feedback}\n\n"
                f"WELLNESS:\n{well_feedback}"
            )

            summary = self.synthesizer.run(combined)

            return {
                "summary": summary.strip(),
                "technique": tech_feedback.strip(),
                "performance": perf_feedback.strip(),
                "wellness": well_feedback.strip(),
                "rag_context": rag_context.strip(),
                "rag_sources": rag_sources
            }

        except Exception as e:
            return {"error": str(e)}
