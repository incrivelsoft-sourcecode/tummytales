import os
import time
import httpx
from collections import Counter
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv
import subprocess
import signal

# Load .env variables
load_dotenv()

# Ollama configuration
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

# Function to start the Ollama process
def ensure_ollama_model_loaded():
    try:
        response = httpx.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={"model": OLLAMA_MODEL, "prompt": "ping", "stream": False},
            timeout=60.0
        )
        if response.status_code == 200:
            print("Ollama model is ready.")
        else:
            print("Ollama responded but did not start the model. Try running it manually.")
    except Exception as e:
        print(f"Ensure Ollama is running: {e}")

# Prompt template
prompt_template = PromptTemplate(
    input_variables=[
        "age", "weight", "height_ft", "height_in", "gestational_age",
        "symptoms", "allergies", "medications", "blood_test", "urine_test",
        "diabetes_test", "culture", "location", "question"
    ],
    template="""
You are Dr. Amma, a culturally aware, medically accurate virtual pregnancy advisor.
You are a medical professional with expertise in obstetrics and gynecology.
You are a compassionate and empathetic doctor who is here to help. You are not a therapist, but you can provide emotional support and reassurance.
You are not a substitute for a doctor, but you can provide general information and advice. You are not a licensed medical professional, but you can provide general information and advice.

Only answer the question the user is asking and do not answer any additional questions.
Please think step-by-step before answering. Consider the user's symptoms, culture, test results, and pregnancy stage carefully.
If there is more than one possible explanation, mention them and choose the most likely or safest option.

User Details:
- Age: {age}
- Weight: {weight} lb
- Height: {height_ft} ft {height_in} in
- Gestational Age: {gestational_age}
- Location: {location}
- Culture: {culture}
- Symptoms: {symptoms}
- Allergies: {allergies}
- Medications: {medications}
- Blood Test Results: {blood_test}
- Urine Test Results: {urine_test}
- Diabetes Test Results: {diabetes_test}

Question: {question}
Answer:
"""
)

# Function to generate a single response from Ollama
def generate_with_ollama(prompt, temperature=0.4, max_tokens=256):
    try:
        response = httpx.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": False
            },
            timeout=60.0
        )
        result = response.json()
        return result.get("response", "").strip()
    except Exception as e:
        print(f"[Ollama Error] {e}")
        return "Error generating response."

# Wrapper with retry and response consensus
def generate_response(input_dict, max_retries=5):
    ensure_ollama_model_loaded()
    print(f"Request Sent: {input_dict}")
    
    final_prompt = prompt_template.format(**input_dict)
    print(f"\n[Final Prompt]:\n{final_prompt}\n")

    for attempt in range(1, max_retries + 1):
        try:
            response = generate_with_ollama(final_prompt)
            if response and response.strip():
                print(f"[Attempt {attempt}] Successful response.")
                print(f"[Response]: {response}")
                return response.strip()
            else:
                print(f"[Attempt {attempt}] Blank response received. Retrying...")
                time.sleep(1)
        except Exception as e:
            print(f"[Attempt {attempt}] Error: {e}")
            time.sleep(1)

    return "Unable to generate a valid response after multiple attempts."