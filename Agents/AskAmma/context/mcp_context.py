from typing import Dict, Any, List
from datetime import datetime, timezone


class MCPContext:
    """MCP Context handler for managing input data and conversation context"""
    
    def __init__(self, input_dict: Dict[str, Any]):
        self.input = input_dict
        self.question = input_dict.get("question", "No question provided")
        self.chat_history = input_dict.get("chat_history", [])
        self.category = self._categorize_question(self.question)
        self.timestamp = datetime.now(timezone.utc).isoformat()
        self.metadata = self._extract_metadata()

    def _categorize_question(self, question: str) -> str:
        """Categorize the question type for better response handling"""
        question = question.lower()
        
        if any(x in question for x in ["pain", "cramp", "bleeding", "nausea", "headache", "dizzy"]):
            return "symptom"
        elif any(x in question for x in ["food", "eat", "diet", "nutrition", "vitamin"]):
            return "nutrition"
        elif any(x in question for x in ["feel", "anxious", "depressed", "mood", "stress", "worry"]):
            return "emotional"
        elif any(x in question for x in ["appointment", "travel", "schedule", "work"]):
            return "logistics"
        elif any(x in question for x in ["exercise", "activity", "sleep", "rest"]):
            return "lifestyle"
        elif any(x in question for x in ["test", "results", "scan", "ultrasound"]):
            return "medical_tests"
        else:
            return "general"

    def _extract_metadata(self) -> Dict[str, str]:
        """Extract and clean patient metadata"""
        fields = [
            "age", "weight", "height_ft", "height_in", "gestational_age",
            "symptoms", "allergies", "medications", "blood_test",
            "urine_test", "diabetes_test", "culture", "location"
        ]
        return {field: self._clean_value(self.input.get(field)) for field in fields}

    def _clean_value(self, value) -> str:
        """Clean and standardize input values"""
        if value is None or value == "" or value == "null":
            return "not specified"
        if isinstance(value, (list, dict)):
            return str(value) if value else "not specified"
        return str(value).strip()

    def format_context(self) -> str:
        """Format patient context for system prompts"""
        formatted_items = []
        for k, v in self.metadata.items():
            if v != "not specified":
                formatted_items.append(f"- {k.replace('_', ' ').title()}: {v}")
        
        return "\n".join(formatted_items) if formatted_items else "- No additional patient information provided"

    def format_chat_history(self) -> str:
        """Format chat history for context"""
        if not self.chat_history or not isinstance(self.chat_history, list):
            return "This is our first interaction."
        
        # Take only the last 4 messages to avoid token overflow
        recent_messages = self.chat_history[-4:] if len(self.chat_history) > 4 else self.chat_history
        
        formatted_history = []
        for msg in recent_messages:
            if isinstance(msg, dict) and "role" in msg and "content" in msg:
                role = msg["role"].title()
                content = msg["content"][:200]  # Limit content length
                formatted_history.append(f"{role}: {content}")
        
        return "\n".join(formatted_history) if formatted_history else "This is our first interaction."

    def get_priority_level(self) -> str:
        """Determine priority level based on question category and content"""
        urgent_keywords = ["bleeding", "severe pain", "emergency", "urgent", "can't breathe"]
        moderate_keywords = ["pain", "cramp", "nausea", "worried", "concerned"]
        
        question_lower = self.question.lower()
        
        if any(keyword in question_lower for keyword in urgent_keywords):
            return "urgent"
        elif any(keyword in question_lower for keyword in moderate_keywords):
            return "moderate"
        else:
            return "routine"

    def to_dict(self) -> Dict[str, Any]:
        """Convert context to dictionary format"""
        return {
            "question": self.question,
            "category": self.category,
            "priority": self.get_priority_level(),
            "timestamp": self.timestamp,
            "metadata": self.metadata,
            "chat_history_summary": self.format_chat_history()
        }