# app/services/llm/service.py

import os
import logging
import json
import asyncio
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LLMService:
    """Service for interacting with Language Models"""
    
    def __init__(self):
        self.ollama_base_url = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
        self.model = os.getenv('OLLAMA_MODEL', 'llama3')
        self.fallback_to_mock = os.getenv('FALLBACK_TO_MOCK', 'true').lower() == 'true'
        
        if not self.ollama_base_url:
            logger.warning('OLLAMA_BASE_URL not set, using default: http://localhost:11434')
    
    async def generate_text(self, prompt, temperature=0.7, max_tokens=2000):
        """Generate text using Ollama LLM"""
        try:
            logger.info(f"Sending prompt to Ollama model: {self.model}")
            
            # Create the API endpoint URL
            api_url = f"{self.ollama_base_url}/api/generate"
            
            # Prepare the payload
            payload = {
                "model": self.model,
                "prompt": prompt,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": False
            }
            
            # Use httpx for async HTTP requests
            async with httpx.AsyncClient(timeout=120.0) as client:
                logger.info("Sending request to Ollama API")
                response = await client.post(api_url, json=payload)
                
                # Check if request was successful
                if response.status_code != 200:
                    logger.error(f"Ollama API returned error: {response.status_code}")
                    logger.error(f"Response content: {response.text}")
                    
                    # Fall back to mock responses if configured
                    if self.fallback_to_mock:
                        logger.warning("Falling back to mock response")
                        return self._generate_mock_response(prompt)
                    
                    raise RuntimeError(f"Ollama API error: {response.status_code}")
                
                # Parse the response
                try:
                    result = response.json()
                    if 'response' in result:
                        generated_text = result['response']
                        logger.info(f"Successfully generated text with {len(generated_text)} characters")
                        return generated_text
                    else:
                        logger.error(f"Unexpected response format: {result}")
                        if self.fallback_to_mock:
                            logger.warning("Falling back to mock response due to unexpected format")
                            return self._generate_mock_response(prompt)
                        raise RuntimeError("Unexpected response format from Ollama")
                        
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse JSON response: {e}")
                    logger.error(f"Raw response: {response.text[:500]}...")
                    
                    if self.fallback_to_mock:
                        logger.warning("Falling back to mock response due to JSON parse error")
                        return self._generate_mock_response(prompt)
                        
                    raise RuntimeError(f"Failed to parse Ollama response: {e}")
                
        except httpx.RequestError as e:
            logger.error(f"Error making request to Ollama API: {str(e)}")
            
            if self.fallback_to_mock:
                logger.warning("Falling back to mock response due to request error")
                return self._generate_mock_response(prompt)
                
            raise RuntimeError(f"Failed to connect to Ollama: {str(e)}")
            
        except Exception as e:
            logger.error(f"Unexpected error in generate_text: {str(e)}")
            
            if self.fallback_to_mock:
                logger.warning("Falling back to mock response due to unexpected error")
                return self._generate_mock_response(prompt)
                
            raise
    
    def _generate_mock_response(self, prompt):
        """Generate a mock response for testing or fallback purposes"""
        logger.info("Generating mock response")
        
        if "nutrition query" in prompt.lower():
            return self._mock_nutrition_query(prompt)
        elif "meal" in prompt.lower() or "recipe" in prompt.lower():
            return self._mock_meal_recipe(prompt)
        else:
            return "I don't have enough information to provide a response to this query."
    
    def _mock_nutrition_query(self, prompt):
        """Generate mock nutrition information response"""
        if "iron" in prompt.lower():
            return "Based on the provided context, foods high in iron that are recommended during pregnancy include lean red meat, poultry, fish, iron-fortified cereals, beans, and spinach. Iron is particularly important during pregnancy, with pregnant women needing about 27 mg of iron daily."
        
        if "folate" in prompt.lower():
            return "According to the provided context, folate is crucial for preventing neural tube defects during pregnancy. Pregnant women should consume 600-800 mcg of folate daily. Good sources of folate include leafy greens, fortified cereals, beans, and citrus fruits."
        
        return "Based on the provided context, I don't have specific information to answer your query about pregnancy nutrition. Please consult with a healthcare provider for personalized nutritional guidance during pregnancy."
    
    def _mock_meal_recipe(self, prompt):
        """Generate a mock meal recipe response"""
        return """
        {
          "title": "Spinach and Lentil Curry with Brown Rice",
          "servings": 2,
          "ingredients": [
            "* 1 cup brown rice",
            "* 1 cup red lentils, rinsed and drained",
            "* 2 cups fresh spinach, chopped",
            "* 1 medium onion, finely chopped",
            "* 2 cloves garlic, minced",
            "* 1 tbsp ginger, grated",
            "* 2 tbsp olive oil",
            "* 1 tsp cumin seeds",
            "* 1 tsp turmeric powder",
            "* 1/2 tsp red chili powder (adjust to taste)",
            "* 1 medium tomato, chopped",
            "* 2 cups water or vegetable broth",
            "* Salt to taste",
            "* 1 tbsp lemon juice",
            "* 2 tbsp fresh cilantro, chopped"
          ],
          "instructions": "1. Start by cooking the brown rice according to package instructions, usually 1 cup rice to 2 cups water, simmered for about 45 minutes until tender. 2. While the rice is cooking, heat olive oil in a large pan over medium heat. 3. Add cumin seeds and let them sizzle for about 30 seconds. 4. Add the chopped onion and sauté until golden brown, about 5 minutes. 5. Add the minced garlic and grated ginger, and sauté for another minute until fragrant. 6. Add the turmeric powder and red chili powder, stir well. 7. Add the chopped tomato and cook until it softens, about 3-4 minutes. 8. Add the rinsed lentils and water/broth, bring to a boil, then reduce heat and simmer covered for about 20 minutes until lentils are tender. 9. Add the chopped spinach and cook for another 3-4 minutes until wilted. 10. Add salt to taste and lemon juice, stir well. 11. Serve the lentil curry over the cooked brown rice. 12. Garnish with fresh cilantro before serving.",
          "nutritionalValues": {
            "Calories": "450 kcal per serving",
            "Protein": "18 g",
            "Carbohydrates": "65 g",
            "Fat": "12 g",
            "Fiber": "15 g",
            "Calcium": "120 mg",
            "Iron": "8 mg"
          },
          "Pregnancy-Safe Notes": "This meal is rich in iron from lentils and spinach, which is essential during pregnancy to support increased blood volume and prevent anemia. The combination of lentils and rice provides complete protein, while the spinach offers folate, crucial for fetal neural development. The dish is also high in fiber, which helps prevent constipation, a common issue during pregnancy.",
          "Substitution Options": "You can substitute brown rice with quinoa for even more protein and iron. If you're sensitive to spices during pregnancy, reduce or omit the chili powder. For more calcium, add 1/4 cup of low-fat yogurt as a topping when serving. Frozen spinach can be used instead of fresh if needed."
        }
        """

# Create singleton instance
llm_service = LLMService()