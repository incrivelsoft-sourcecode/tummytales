from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
from langchain.prompts import PromptTemplate
from langchain_huggingface import HuggingFacePipeline
from collections import Counter
from dotenv import load_dotenv
from huggingface_hub import login
import torch
import os
import time

# Load .env variables
load_dotenv()

hf_token = os.getenv("HUGGINGFACE_HUB_TOKEN")
if hf_token:
    login(token=hf_token)
else:
    print("HuggingFace token not found in environment.")

# Model config from env
model_name = os.getenv("LLAMA_MODEL", "meta-llama/Meta-Llama-3-8B")
torch_dtype = torch.float16 if os.getenv("TORCH_DTYPE") == "float16" else torch.float32

# Force GPU if available
device = "cuda:0" if torch.cuda.is_available() else "cpu"
device_map = {"": 0} if device.startswith("cuda") else "cpu"

print("Using device:", device)

# Load model/tokenizer
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch_dtype,
    device_map=device_map
)

# Build HuggingFace pipeline
hf_pipe = pipeline(
    "text-generation",
    model=model,
    tokenizer=tokenizer,
    device=0 if torch.cuda.is_available() else -1,
    torch_dtype=torch_dtype,
    return_full_text=False,
    max_new_tokens=256,
    do_sample=True,
    temperature=0.4,
    top_k=150,
    top_p=0.75
)

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

# Response generator with retry
def generate_response(input_dict, max_retries=5):
    print(f"Request Sent: {input_dict}")
    final_prompt = prompt_template.format(**input_dict)
    
    for attempt in range(max_retries):
        try:
            responses = [hf_pipe(final_prompt)[0]["generated_text"].strip() for _ in range(1)]
            valid_responses = [r for r in responses if r.strip()]
            
            if valid_responses:
                return Counter(valid_responses).most_common(1)[0][0]
            else:
                print(f"[Attempt {attempt + 1}] Blank response. Retrying...")
                time.sleep(1)
        except Exception as e:
            print(f"[Attempt {attempt + 1}] Error: {e}")
            time.sleep(1)
    
    return "Unable to generate a valid response after multiple attempts."