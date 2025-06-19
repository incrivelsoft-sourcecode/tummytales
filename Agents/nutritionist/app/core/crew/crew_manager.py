import asyncio
import logging
from typing import Dict, Any, List, Optional
from crewai import Crew, Task, Process

from app.core.crew.nutrition_agent import create_nutrition_agent, generate_meal_plan_async, answer_nutrition_question_async

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
            # Remove agent signatures and conversation artifacts
            if any(phrase in line.lower() for phrase in [
                'please review my response', 'let me know if', 'happy cooking',
                'best regards', 'dr.nutrition', 'i hope you enjoy'
            ]):
                continue
                
            # If line contains multiple bullet points in one line, split them
            if line.count('•') > 1:
                # Split by bullet points
                bullet_parts = line.split('•')
                for part in bullet_parts:
                    part = part.strip()
                    if len(part) > 10:  # Only keep substantial content
                        if not part.startswith('•'):
                            cleaned_lines.append(f"• {part}")
                        else:
                            cleaned_lines.append(part)
            
            # If line contains multiple sentences separated by periods
            elif '. •' in line or (line.count('. ') >= 2 and any(word in line for word in ['This', 'The', 'For', 'If'])):
                # Split by periods followed by capital letters or bullet points
                sentences = []
                current_sentence = ""
                
                words = line.split()
                for i, word in enumerate(words):
                    current_sentence += word + " "
                    
                    # Check if this word ends a sentence and next word starts new thought
                    if (word.endswith('.') and i < len(words) - 1 and 
                        (words[i + 1].startswith('•') or 
                         (len(words[i + 1]) > 0 and words[i + 1][0].isupper() and 
                          words[i + 1] in ['This', 'The', 'For', 'If', 'Tofu', 'Sweet']))):
                        
                        sentences.append(current_sentence.strip())
                        current_sentence = ""
                
                # Add remaining sentence
                if current_sentence.strip():
                    sentences.append(current_sentence.strip())
                
                # Format each sentence as bullet point
                for sentence in sentences:
                    sentence = sentence.strip()
                    if len(sentence) > 10:
                        # Remove existing bullet if present
                        sentence = sentence.lstrip('•').strip()
                        # Ensure proper ending
                        if not sentence.endswith('.') and not sentence.endswith('!'):
                            sentence += '.'
                        cleaned_lines.append(f"• {sentence}")
            
            # Single sentence/point
            else:
                if len(line) > 10:  # Only keep substantial content
                    # Remove existing bullet if present
                    clean_line = line.lstrip('•').strip()
                    # Ensure proper ending
                    if not clean_line.endswith('.') and not clean_line.endswith('!'):
                        clean_line += '.'
                    cleaned_lines.append(f"• {clean_line}")
        else:
            # Not in notes section, keep original formatting
            cleaned_lines.append(original_line)
    
    result = '\n'.join(cleaned_lines)
    logger.info(f"Cleaned response: notes sections processed")
    return result

class CrewManager:
    """Manager for CrewAI agents and tasks"""
    
    def __init__(self):
        self.initialized = False
        self.nutrition_agent = None
        self.crew = None
    
    async def initialize(self):
        """Initialize the CrewAI manager"""
        if self.initialized:
            return
        
        try:
            # Create nutrition agent
            self.nutrition_agent = await create_nutrition_agent()
            
            self.initialized = True
            logger.info("CrewAI manager initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing CrewAI manager: {str(e)}")
            raise
    
    async def process_nutrition_request(self, query: str, context: Dict[str, Any] = None) -> str:
        """
        Process a nutrition-related request
        
        Args:
            query: User's query
            context: Additional context information
            
        Returns:
            Response from the CrewAI agent
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
        
        logger.info(f"Meal keywords found: {has_meal_keywords}")
        logger.info(f"Nutrition keywords found: {has_nutrition_keywords}")
        
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
        
        # Handle meal requests
        if is_meal_request:
            logger.info(">>> PROCESSING AS MEAL REQUEST <<<")
            try:
                # Extract meal type from query
                meal_type = 'breakfast'  # default
                for m_type in ['dessert', 'breakfast', 'lunch', 'dinner', 'snack']:
                    if m_type in query.lower():
                        meal_type = m_type
                        break
                
                logger.info(f"🎯 Detected meal type: {meal_type}")
                logger.info(f"🍽️  User preferences: Trimester={trimester}, Dietary={context.get('dietary_restrictions', 'None')}")
                logger.info(f"🌍 Cultural preferences: {context.get('cuisine_preferences', 'Any')}")
                logger.info(f"⚠️  Allergies: {context.get('allergies', 'None')}")
                logger.info(f"💪 Nutritional focus: {context.get('nutritional_focus', 'Balanced')}")
                
                logger.info("🔄 Starting meal generation process...")
                
                # Generate meal plan using our async function
                meal_result = await generate_meal_plan_async(
                    meal_type=meal_type,
                    trimester=trimester,
                    dietary_restrictions=context.get('dietary_restrictions', ''),
                    cuisine_preferences=context.get('cuisine_preferences', ''),
                    allergies=context.get('allergies', ''),
                    nutritional_focus=context.get('nutritional_focus', '')
                )
                
                logger.info(f"✅ Meal generation completed: {len(meal_result)} characters")
                
                # DETAILED LOGGING: Show complete meal result
                logger.info("=" * 80)
                logger.info("📋 COMPLETE MEAL RESULT FROM BACKEND:")
                logger.info("=" * 80)
                logger.info(meal_result)
                logger.info("=" * 80)
                
                # Extract and log specific components for comparison
                lines = meal_result.split('\n')
                
                # Extract recipe title
                title_line = ""
                for line in lines:
                    if line.strip().startswith('#') and not line.startswith('##'):
                        title_line = line.strip()
                        break
                logger.info(f"🍽️  Recipe Title: '{title_line}'")
                
                # Extract nutrition values
                in_nutrition_section = False
                nutrition_values = []
                for line in lines:
                    if '## Nutritional Values' in line:
                        in_nutrition_section = True
                        continue
                    elif line.startswith('##') and in_nutrition_section:
                        break
                    elif in_nutrition_section and line.strip():
                        nutrition_values.append(line.strip())
                
                logger.info("📊 NUTRITION VALUES FROM BACKEND:")
                for value in nutrition_values:
                    logger.info(f"   {value}")
                
                # Extract notes sections
                in_notes_section = False
                current_section = ""
                notes_content = []
                
                for line in lines:
                    if '## Pregnancy-Safe Notes' in line:
                        in_notes_section = True
                        current_section = "Pregnancy-Safe Notes"
                        continue
                    elif '## Substitution Options' in line:
                        in_notes_section = True
                        current_section = "Substitution Options"
                        continue
                    elif line.startswith('##') and in_notes_section:
                        in_notes_section = False
                        current_section = ""
                        continue
                    elif in_notes_section and line.strip():
                        notes_content.append(f"{current_section}: {line.strip()}")
                
                logger.info("📝 NOTES FROM BACKEND:")
                for note in notes_content:
                    logger.info(f"   {note}")
                
                # Clean up the meal result
                logger.info("🧹 Starting response cleaning...")
                cleaned_meal_result = clean_agent_response(meal_result)
                
                logger.info(f"🧹 Response cleaned: {len(cleaned_meal_result)} characters")
                
                # Log cleaned result for comparison
                logger.info("=" * 80)
                logger.info("🔄 CLEANED MEAL RESULT (SENT TO FRONTEND):")
                logger.info("=" * 80)
                logger.info(cleaned_meal_result)
                logger.info("=" * 80)
                
                logger.info("🚀 Returning meal data to frontend")
                
                return cleaned_meal_result
                
            except Exception as e:
                logger.error(f"Error in meal processing: {str(e)}")
                
                # Fallback: Use CrewAI for error handling
                task = Task(
                    description=f"""
                    TASK TYPE: MEAL PLANNING REQUEST (ERROR FALLBACK)
                    
                    User asked: "{query}"
                    
                    There was an error generating the specific meal plan. As Dr.Nutrition, please provide helpful 
                    guidance about {trimester} trimester meal planning based on their preferences:
                    
                    - Dietary restrictions: {context.get('dietary_restrictions', 'None')}
                    - Cuisine preferences: {context.get('cuisine_preferences', 'Any')}
                    - Nutritional focus: {context.get('nutritional_focus', 'Balanced nutrition')}
                    
                    Provide a warm, helpful response with general meal suggestions that would be appropriate 
                    for {meal_type} during {trimester} trimester.
                    
                    IMPORTANT FORMATTING:
                    - Use bullet points (•) for all lists in notes sections
                    - Each bullet point should be on a separate line
                    - Do NOT include conversational endings like "Happy cooking!" or signatures
                    """,
                    expected_output="Helpful meal planning guidance with suggestions",
                    agent=self.nutrition_agent
                )
                
                # Execute fallback task
                crew = Crew(
                    agents=[self.nutrition_agent],
                    tasks=[task],
                    verbose=True,
                    process=Process.sequential
                )

                logger.info("CrewAI crew created for fallback, executing task...")
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(None, crew.kickoff)
                
                # Clean up CrewAI response
                cleaned_result = clean_agent_response(str(result))
                
                logger.info(f"CrewAI fallback execution completed: {len(cleaned_result)} characters")
                return cleaned_result
        
        # Handle nutrition questions
        else:
            logger.info(">>> PROCESSING AS NUTRITION QUESTION <<<")
            try:
                logger.info("Getting nutrition information...")
                
                # Get nutrition information using our async function
                nutrition_result = await answer_nutrition_question_async(query, trimester)
                
                logger.info(f"Nutrition result: {len(nutrition_result)} chars")
                logger.info("Sample of nutrition content:")
                logger.info(nutrition_result[:200] + "..." if len(nutrition_result) > 200 else nutrition_result)
                
                # Create task for nutrition question - let CrewAI format this nicely
                task = Task(
                    description=f"""
                    TASK TYPE: NUTRITION EDUCATION REQUEST
                    
                    User asked: "{query}"
                    
                    I have researched this nutrition question and found detailed information:
                    
                    {nutrition_result}
                    
                    As Dr.Nutrition, please present this information in a warm, professional manner:
                    
                    1. Start with a friendly greeting acknowledging their excellent question
                    2. Present the nutrition information clearly and comprehensively
                    3. Explain each nutrient mentioned and why it's important for {trimester} trimester
                    4. Provide specific food recommendations for getting these nutrients
                    5. Include practical tips for incorporating these foods into daily meals
                    6. End with encouragement about their focus on proper nutrition
                    
                    Make your response detailed, informative, and supportive. Use the research 
                    information provided above as your foundation.
                    
                    IMPORTANT FORMATTING:
                    - Use bullet points (•) for all lists
                    - Each bullet point should be on a separate line
                    - Do NOT include conversational endings like "Happy cooking!" or signatures
                    
                    This is a NUTRITION EDUCATION REQUEST - provide educational content about 
                    nutrients and food sources, NOT a recipe.
                    """,
                    expected_output="Comprehensive nutrition education about important nutrients, their benefits, and food sources with warm, professional presentation",
                    agent=self.nutrition_agent
                )
                
                # Execute nutrition education task
                crew = Crew(
                    agents=[self.nutrition_agent],
                    tasks=[task],
                    verbose=True,
                    process=Process.sequential
                )
                
                logger.info("Executing CrewAI task for nutrition education...")
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(None, crew.kickoff)
                
                # Clean up CrewAI response
                cleaned_result = clean_agent_response(str(result))
                
                logger.info(f"CrewAI nutrition education completed: {len(cleaned_result)} characters")
                return cleaned_result
                
            except Exception as e:
                logger.error(f"Error answering nutrition question: {str(e)}")
                
                # Fallback for nutrition questions
                task = Task(
                    description=f"""
                    TASK TYPE: NUTRITION EDUCATION REQUEST (ERROR FALLBACK)
                    
                    User asked: "{query}"
                    
                    As Dr.Nutrition, please provide a comprehensive answer to this nutrition question 
                    with specific relevance to {trimester} trimester pregnancy.
                    
                    Your response should include:
                    1. Acknowledgment of their important question
                    2. Evidence-based nutritional information about key nutrients for {trimester} trimester
                    3. Specific food recommendations for each nutrient
                    4. Practical meal planning suggestions
                    5. Safety considerations
                    6. Tips for implementation
                    7. Supportive encouragement
                    
                    Focus on the most important nutrients for {trimester} trimester: folate, iron, 
                    calcium, DHA omega-3s, protein, and vitamin D. Provide specific food sources 
                    for each nutrient and explain why they're important.
                    
                    IMPORTANT FORMATTING:
                    - Use bullet points (•) for all lists
                    - Each bullet point should be on a separate line
                    - Do NOT include conversational endings like "Happy cooking!" or signatures
                    """,
                    expected_output="Comprehensive nutrition education with specific recommendations",
                    agent=self.nutrition_agent
                )
                
                crew = Crew(
                    agents=[self.nutrition_agent],
                    tasks=[task],
                    verbose=True,
                    process=Process.sequential
                )
                
                logger.info("CrewAI crew created for nutrition fallback, executing task...")
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(None, crew.kickoff)
                
                # Clean up CrewAI response
                cleaned_result = clean_agent_response(str(result))
                
                logger.info(f"CrewAI nutrition fallback completed: {len(cleaned_result)} characters")
                return cleaned_result

# Create singleton instance
crew_manager = CrewManager()