#app/core/crew/crew_manager.py
import asyncio
import logging
from typing import Dict, Any, List, Optional

from app.core.crew.nutrition_agent import generate_meal_plan_async, answer_nutrition_question_async

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def clean_agent_response(response_text: str) -> str:
    """Clean up agent response to ensure proper bullet point formatting"""
    lines = response_text.split('\n')
    cleaned_lines = []
    in_notes_section = False
    
    for line in lines:
        original_line = line
        line = line.strip()
        
        # Check if we're entering a notes section
        if '## Pregnancy-Safe Notes' in line or '## Substitution Options' in line:
            in_notes_section = True
            cleaned_lines.append(original_line)
            continue
        elif line.startswith('##'):
            in_notes_section = False
            cleaned_lines.append(original_line)
            continue
        
        # Process notes sections
        if in_notes_section and line:
            if len(line) > 10:
                clean_line = line.lstrip('•').strip()
                if not clean_line.endswith('.') and not clean_line.endswith('!'):
                    clean_line += '.'
                cleaned_lines.append(f"• {clean_line}")
        else:
            cleaned_lines.append(original_line)
    
    result = '\n'.join(cleaned_lines)
    logger.info(f"Cleaned response: notes sections processed")
    return result

class LightweightCrewManager:
    """Lightweight manager for nutrition agent (no CrewAI dependency)"""
    
    def __init__(self):
        self.initialized = False
    
    async def initialize(self):
        """Initialize the lightweight manager"""
        if self.initialized:
            return
        
        try:
            # No heavy initialization needed - just direct function calls
            self.initialized = True
            logger.info("Lightweight crew manager initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing lightweight manager: {str(e)}")
            raise
    
    async def process_nutrition_request(self, query: str, context: Dict[str, Any] = None) -> str:
        """
        Process a nutrition-related request using direct function calls
        """
        if not self.initialized:
            await self.initialize()
        
        context = context or {}
        trimester = context.get('trimester', 'second')
        
        # Debug logging
        logger.info(f"Processing query: '{query}'")
        
        # Determine task type based on query
        meal_keywords = ['recipe', 'suggest', 'breakfast', 'lunch', 'dinner', 'snacks', 'dessert', 'food', 'cook', 'dish', 'meal']
        nutrition_keywords = ['nutrients', 'important', 'what are', 'which', 'vitamins', 'minerals']
        
        has_meal_keywords = any(word in query.lower() for word in meal_keywords)
        has_nutrition_keywords = any(word in query.lower() for word in nutrition_keywords)
        
        # More explicit task type detection
        if has_meal_keywords and not has_nutrition_keywords:
            is_meal_request = True
        elif has_nutrition_keywords and not has_meal_keywords:
            is_meal_request = False
        elif 'suggest' in query.lower() or 'recipe' in query.lower():
            is_meal_request = True
        else:
            is_meal_request = False
        
        logger.info(f"Final decision - Is meal request: {is_meal_request}")
        
        # Handle meal requests - DIRECT FUNCTION CALL
        if is_meal_request:
            logger.info(">>> PROCESSING AS MEAL REQUEST (DIRECT CALL) <<<")
            try:
                # Extract meal type from query
                meal_type = 'breakfast'  # default
                for m_type in ['dessert', 'breakfast', 'lunch', 'dinner', 'snack']:
                    if m_type in query.lower():
                        meal_type = m_type
                        break
                
                logger.info(f"🎯 Detected meal type: {meal_type}")
                logger.info(f"🔄 Starting DIRECT meal generation process...")
                
                # DIRECT CALL - No CrewAI overhead!
                meal_result = await generate_meal_plan_async(
                    meal_type=meal_type,
                    trimester=trimester,
                    dietary_restrictions=context.get('dietary_restrictions', ''),
                    cuisine_preferences=context.get('cuisine_preferences', ''),
                    allergies=context.get('allergies', ''),
                    nutritional_focus=context.get('nutritional_focus', '')
                )
                
                logger.info(f"✅ DIRECT meal generation completed: {len(meal_result)} characters")
                
                # Clean up the response
                cleaned_meal_result = clean_agent_response(meal_result)
                
                logger.info(f"🚀 Returning meal data to frontend (DIRECT PATH)")
                return cleaned_meal_result
                
            except Exception as e:
                logger.error(f"Error in direct meal processing: {str(e)}")
                return f"I encountered an error generating the meal plan: {str(e)}"
        
        # Handle nutrition questions - DIRECT FUNCTION CALL
        else:
            logger.info(">>> PROCESSING AS NUTRITION QUESTION (DIRECT CALL) <<<")
            try:
                logger.info("Getting nutrition information via DIRECT call...")
                
                # DIRECT CALL - No CrewAI overhead!
                nutrition_result = await answer_nutrition_question_async(query, trimester)
                
                logger.info(f"✅ DIRECT nutrition result: {len(nutrition_result)} chars")
                
                # Clean up the response
                cleaned_result = clean_agent_response(nutrition_result)
                
                logger.info(f"✅ DIRECT nutrition question completed: {len(cleaned_result)} characters")
                return cleaned_result
                
            except Exception as e:
                logger.error(f"Error in direct nutrition question answering: {str(e)}")
                return f"I encountered an error answering your nutrition question: {str(e)}"

# Create singleton instance (lightweight version)
crew_manager = LightweightCrewManager()
