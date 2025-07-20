import os
from dotenv import load_dotenv

from agent.askamma_agent import DrAmmaAgent

# Load environment variables
load_dotenv()

# Sample input (can be modified)
test_input = {
    "age": "29",
    "weight": "140",
    "height_ft": "5",
    "height_in": "4",
    "gestational_age": "31",
    "symptoms": "spotting",
    "allergies": "none",
    "medications": "prenatal vitamins",
    "blood_test": "",
    "urine_test": "",
    "diabetes_test": "",
    "culture": "South Asian",
    "location": "New Jersey",
    "question": "I have been spotting for the past 2 nights. It is not active bleeding, but when I wipe, I can see bright red drops. Should I be concerned, what could this mean, and should I tell my doctor?",
    "chat_history": []
}

if __name__ == "__main__":
    agent = DrAmmaAgent()
    
    print("\n🔍 Running Direct LLM Test...\n")
    try:
        result = agent.generate_response(test_input)
        print("\n✅ Final AI Response:\n")
        print(result)
    except Exception as e:
        print("\n❌ Test failed:", str(e))