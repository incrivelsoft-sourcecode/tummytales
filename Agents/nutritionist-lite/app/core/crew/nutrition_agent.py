import logging
from typing import List, Dict, Any, Optional, Callable
from pydantic import BaseModel

from app.core.meal.meal_service import meal_planning_service
from app.core.knowledge.rag_service import rag_service
from app.core.meal.meal_model import MealPlanRequest

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info(f"DEBUG: Imported meal_planning_service type: {type(meal_planning_service)}")

def clean_meal_response(response_text: str) -> str:
    """Clean up meal response formatting to ensure proper bullet points"""
    
    # Replace asterisks with bullet points in notes sections
    lines = response_text.split('\n')
    cleaned_lines = []
    in_notes_section = False
    
    for line in lines:
        # Check if we're entering a notes section
        if '## Pregnancy-Safe Notes' in line or '## Substitution Options' in line:
            in_notes_section = True
            cleaned_lines.append(line)
        elif line.startswith('##'):
            in_notes_section = False
            cleaned_lines.append(line)
        elif in_notes_section and line.strip():
            # Clean up notes sections
            cleaned_line = line.strip()
            
            # Convert asterisk to bullet point
            if cleaned_line.startswith('*'):
                cleaned_line = cleaned_line.replace('*', '•', 1)
                cleaned_lines.append(cleaned_line)
            # Add bullet point if missing and line is substantial
            elif not cleaned_line.startswith('•') and len(cleaned_line) > 10:
                cleaned_lines.append(f"• {cleaned_line}")
            # Keep existing bullet points
            elif cleaned_line.startswith('•'):
                cleaned_lines.append(cleaned_line)
            else:
                # Skip very short lines in notes sections
                if len(cleaned_line) > 5:
                    cleaned_lines.append(cleaned_line)
        else:
            cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines)

async def generate_meal_plan_async(meal_type: str, trimester: str, 
                            dietary_restrictions: str = "", 
                            cuisine_preferences: str = "", 
                            allergies: str = "", 
                            nutritional_focus: str = "") -> str:
    """
    Generate a meal plan based on user preferences
    """
    try:
        # Parse comma-separated strings into lists
        dietary_list = [d.strip() for d in dietary_restrictions.split(',')] if dietary_restrictions else []
        cuisine_list = [c.strip() for c in cuisine_preferences.split(',')] if cuisine_preferences else []
        allergies_list = [a.strip() for a in allergies.split(',')] if allergies else []
        
        # Create request object
        request = MealPlanRequest(
            meal_type=meal_type,
            trimester=trimester,
            preferences={
                "dietary": dietary_list,
                "cuisine": cuisine_list,
                "allergies": allergies_list,
                "nutritionalFocus": nutritional_focus
            },
            user_id="crew_agent_user"
        )
        
        # Ensure meal planning service is initialized
        if not meal_planning_service.initialized:
            await meal_planning_service.initialize()
        
        # DEBUG: Check what methods are available
        logger.info(f"DEBUG: Available methods on meal_planning_service: {dir(meal_planning_service)}")
        logger.info(f"DEBUG: Has generate_meal: {hasattr(meal_planning_service, 'generate_meal')}")
        logger.info(f"DEBUG: Type of meal_planning_service: {type(meal_planning_service)}")
        
        # Try to call the method with different possible names
        if hasattr(meal_planning_service, 'generate_meal'):
            meal_markdown = await meal_planning_service.generate_meal(request)
        elif hasattr(meal_planning_service, 'generate_meal_plan'):
            meal_markdown = await meal_planning_service.generate_meal_plan(request)
        elif hasattr(meal_planning_service, 'generate'):
            meal_markdown = await meal_planning_service.generate(request)
        else:
            logger.error("DEBUG: No suitable method found!")
            return "Error: Could not find meal generation method"
        
        # Clean up the formatting before returning
        cleaned_meal_str = clean_meal_response(meal_markdown)
        return cleaned_meal_str
        
    except Exception as e:
        logger.error(f"Error in meal plan generation: {str(e)}")
        return f"I encountered an error generating the meal plan: {str(e)}"

async def answer_nutrition_question_async(query: str, trimester: str) -> str:
    """
    Answer a nutrition question based on pregnancy knowledge
    """
    try:
        # Ensure RAG service is initialized
        if not rag_service.initialized:
            await rag_service.initialize()
        
        # Query the RAG service
        result = await rag_service.query(query, trimester)
        
        # Format the response
        answer = f"""
{result.answer}

**Sources:**
"""
        for source in result.sources:
            answer += f"- {source}\n"
            
        return answer
    except Exception as e:
        logger.error(f"Error in nutrition question answering: {str(e)}")
        return f"I encountered an error answering your nutrition question: {str(e)}"

# Export the async functions for use in lightweight crew_manager
__all__ = ['generate_meal_plan_async', 'answer_nutrition_question_async']
