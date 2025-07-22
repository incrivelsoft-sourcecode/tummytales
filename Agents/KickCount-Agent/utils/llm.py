import os
import requests

class LLMWrapper:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = "llama3-8b-8192"

    def generate(self, prompt: str) -> str:
        if not self.api_key:
            raise ValueError("GROQ_API_KEY is not set.")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        system_prompt = (
            "Refer to the user as 'Amma'"
            "You are a highly knowledgeable, medically-informed, and empathetic pregnancy assistant AI developed to support expectant mothers by interpreting fetal movement data. "
            "Your tone is caring, non-alarming, and emotionally supportive. You provide helpful, safe, and responsible advice based on obstetric guidelines, always urging users to consult healthcare professionals for medical concerns. "
            "Avoid technical jargon, reassure where appropriate, and highlight potential red flags gently, without diagnosing."
            
        )

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "top_p": 0.9,
            "max_tokens": 1024
        }

        try:
            response = requests.post(self.base_url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
        except requests.exceptions.RequestException as e:
            print(f"[LLM Error] API request failed: {e}")
            return "I'm sorry, I couldn't process your request at this time. Please try again later."
        except (KeyError, IndexError):
            return "Sorry, the AI could not generate a response. Please try again later."
