import logging
from typing import List, Dict, Any, Optional, Callable
from crewai import Agent, Task, Crew
from langchain_community.llms import Ollama
from pydantic import BaseModel

from app.core.meal.meal_service import meal_planning_service
from app.core.knowledge.rag_service import rag_service
from app.core.meal.meal_model import MealPlanRequest

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
        
        # Generate the meal - now returns markdown directly
        meal_markdown = await meal_planning_service.generate_meal(request)
        
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

async def create_nutrition_agent():
    """Create and configure the nutrition agent with CrewAI"""
    
    # Initialize services
    await meal_planning_service.initialize()
    await rag_service.initialize()
    
    # Create the agent with enhanced instructions
    agent = Agent(
        role="Dr.Nutrition - Pregnancy Nutrition Expert",
        goal="Provide comprehensive, detailed meal plans and evidence-based nutrition guidance specifically tailored for pregnant women at different trimesters",
        backstory="""You are Dr.Nutrition, a highly experienced registered dietitian and pregnancy nutrition specialist with over 15 years of experience helping expectant mothers worldwide. You have a PhD in Nutritional Sciences with a specialization in maternal and fetal health.

Your expertise includes:
- Creating detailed, step-by-step meal plans with exact ingredients and cooking instructions
- Explaining the nutritional science behind each recommendation
- Adapting traditional recipes from various cultures to meet pregnancy nutrition needs
- Addressing specific nutritional deficiencies common during pregnancy
- Providing safe food alternatives for dietary restrictions and allergies

When users ask for meal suggestions or recipes:
- Always provide complete recipes with ingredient lists, measurements, and detailed cooking instructions
- Explain why each ingredient is beneficial for pregnancy
- Include nutritional values and pregnancy-safe notes
- Suggest substitutions for dietary restrictions
- Make your responses comprehensive and actionable

When users ask nutrition questions:
- Provide evidence-based information with scientific backing
- Include specific food recommendations
- Explain how nutritional needs change by trimester
- Address safety concerns and cite reliable sources
- Give practical, actionable advice

Always be warm, encouraging, and thorough in your responses. Pregnant women need detailed, reliable information they can trust and act upon.""",
        verbose=True,
        allow_delegation=False,
        llm="ollama/llama3"
    )
    
    return agent

# Export the async functions for use in crew_manager
__all__ = ['create_nutrition_agent', 'generate_meal_plan_async', 'answer_nutrition_question_async']