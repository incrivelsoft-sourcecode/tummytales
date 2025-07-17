# ## nutritionist-lite/app/core/meal/meal_service.py

import logging
import json
import re
from typing import Dict, List, Any, Optional
import time

from app.core.knowledge.rag_service import rag_service
from app.services.llm import llm_service
from app.core.meal.meal_model import Meal, MealPlanRequest, MealPlanResponse
from app.core.meal.meal_model import RegenerateRequest, IngredientEditRequest, PortionAdjustRequest
from app.core.meal.repository import meal_repository
from app.core.meal.meal_model import (
    Meal, MealPlanRequest, MealPlanResponse,
    RegenerateRequest, IngredientEditRequest, PortionAdjustRequest,
    SpiceLevelRequest, CookingTimeRequest, CookingMethodRequest,
    ComplexityRequest, NutritionBoostRequest, BatchCookingRequest,
    CulturalAdaptationRequest
)

logger = logging.getLogger(__name__)

class MealPlanningService:
    """Optimized service for generating high-quality meal plans under 10 seconds"""
    
    def __init__(self):
        self.initialized = False
    
    async def initialize(self):
        """Initialize the meal planning service"""
        if self.initialized:
            return True
            
        try:
            await rag_service.initialize()
            logger.info("Optimized meal planning service initialized successfully")
            self.initialized = True
            return True
        except Exception as e:
            logger.error(f"Error initializing meal planning service: {str(e)}")
            raise

    async def generate_meal(self, request: MealPlanRequest) -> str:
        """
        Generate high-quality personalized meal plan optimized for speed
        
        Args:
            request: MealPlanRequest with meal type, trimester, and preferences
            
        Returns:
            Markdown formatted meal plan string
        """
        if not self.initialized:
            await self.initialize()
            
        try:
            total_start = time.time()
            logger.info(f"🚀 Starting optimized meal generation for {request.meal_type}")
            
            # Optimized RAG Query
            rag_start = time.time()
            nutrition_query = f"{request.meal_type} nutrition {request.trimester} trimester"
            nutrition_result = await rag_service.query(nutrition_query, request.trimester)
            rag_time = time.time() - rag_start
            logger.info(f"⏱️ RAG Query took: {rag_time:.2f} seconds")
            
            # Extract preferences efficiently
            dietary = ", ".join(request.preferences.get("dietary", []))
            cuisine = ", ".join(request.preferences.get("cuisine", []))
            allergies = ", ".join(request.preferences.get("allergies", []))
            nutritional_focus = request.preferences.get("nutritionalFocus", "")
            is_regeneration = request.preferences.get("regenerate", False)
            
            # Build quality-optimized prompt
            prompt = self._build_quality_prompt(
                meal_type=request.meal_type,
                trimester=request.trimester,
                dietary=dietary,
                cuisine=cuisine,
                allergies=allergies,
                nutritional_focus=nutritional_focus,
                nutritional_guidance=nutrition_result.answer,
                is_regeneration=is_regeneration
            )
            
            logger.info(f"⏱️ Prompt length: {len(prompt)} characters")
            
            # Quality Recipe Generation
            recipe_start = time.time()
            logger.info(f"Generating high-quality {request.meal_type} recipe")
            
            # Optimized for quality + speed balance
            meal_markdown = await llm_service.generate_text(
                prompt, 
                temperature=0.1,  # Consistency
                max_tokens=2000   # Quality sufficient
            )
            
            recipe_time = time.time() - recipe_start
            logger.info(f"⏱️ Recipe Generation took: {recipe_time:.2f} seconds")
            
            total_time = time.time() - total_start
            logger.info(f"⏱️ 🎯 TOTAL OPTIMIZED GENERATION: {total_time:.2f} seconds")
            logger.info(f"⏱️ 📊 BREAKDOWN: RAG={rag_time:.1f}s, Claude={recipe_time:.1f}s")
            logger.info(f"Generated quality recipe: {len(meal_markdown)} characters")
            
            return meal_markdown
            
        except Exception as e:
            logger.error(f"Error generating meal plan: {str(e)}")
            return self._create_quality_fallback(
                request.meal_type, 
                request.trimester,
                dietary,
                cuisine,
                allergies,
                nutritional_focus
            )

    def _build_quality_prompt(self, meal_type, trimester, dietary, cuisine, 
                             allergies, nutritional_focus, nutritional_guidance,
                             is_regeneration=False):
        """Build optimized prompt maintaining quality while improving speed"""
        
        regeneration_hint = " Create a different recipe variation." if is_regeneration else ""
        essential_guidance = nutritional_guidance[:350] + "..." if len(nutritional_guidance) > 350 else nutritional_guidance
        
        prompt = f"""Create a detailed {cuisine or 'traditional'} {meal_type} recipe for {trimester} trimester pregnancy.{regeneration_hint}

Requirements: Dietary: {dietary or 'None'} | Avoid: {allergies or 'None'} | Focus: {nutritional_focus or 'Balanced nutrition'}

Nutrition guidance: {essential_guidance}

Return complete markdown format:

# [Specific Traditional Dish Name with Key Ingredients]
**Servings:** 2

## Ingredients
* [ingredient 1 with exact measurements]
* [ingredient 2 with exact measurements]
* [continue with 8-12 ingredients total]

## Instructions
1. [Detailed first step with timing and technique]
2. [Detailed second step with specific instructions]
3. [Continue with 6-8 comprehensive numbered steps]
4. [Include cooking times and temperatures]
5. [Final presentation and serving instructions]

## Nutritional Values
- **Calories:** [calculated number] kcal per serving
- **Protein:** [number] g
- **Carbohydrates:** [number] g
- **Fat:** [number] g
- **Fiber:** [number] g
- **Calcium:** [number] mg
- **Iron:** [number] mg

## Pregnancy-Safe Notes
- [Specific {trimester} trimester nutritional benefit]
- [Food safety consideration for pregnancy]
- [Ingredient benefit explanation]
- [Additional pregnancy-specific guidance]

## Substitution Options
- [Dietary restriction alternative]
- [Allergy-safe substitute]
- [Cultural variation option]
- [Nutritional enhancement suggestion]

CRITICAL: Use specific traditional names, include 6-8 detailed steps, calculate accurate nutrition values."""

        return prompt

    async def regenerate_meal(self, request: RegenerateRequest) -> MealPlanResponse:
        """Regenerate with same criteria but different recipe - optimized"""
        if not self.initialized:
            await self.initialize()
            
        try:
            meal_document = await meal_repository.get_meal_by_id(request.meal_id)
            if not meal_document:
                raise ValueError(f"Meal not found with ID: {request.meal_id}")
            
            original_request_data = meal_document["original_request"]
            original_request = MealPlanRequest(**original_request_data)
            
            if request.user_id:
                original_request.user_id = request.user_id
            
            if not original_request.preferences:
                original_request.preferences = {}
            original_request.preferences["regenerate"] = True
            
            logger.info(f"Regenerating meal with ID: {request.meal_id}")
            return await self.generate_meal(original_request)
        
        except Exception as e:
            logger.error(f"Error regenerating meal: {str(e)}")
            raise ValueError(f"Failed to regenerate meal: {str(e)}")

    async def edit_ingredients(self, request: IngredientEditRequest) -> MealPlanResponse:
        """Edit ingredients with AI assistance - optimized"""
        if not self.initialized:
            await self.initialize()
            
        try:
            meal_document = await meal_repository.get_meal_by_id(request.meal_id)
            if not meal_document:
                raise ValueError(f"Meal not found with ID: {request.meal_id}")
            
            original_meal = Meal(**meal_document["meal"])
            meal_data = original_meal.model_dump()
            
            manual_replacements = request.replacements
            ai_ingredients = getattr(request, 'ai_replacements', [])
            all_replacements = dict(manual_replacements)
            
            if ai_ingredients:
                # Optimized AI replacement prompt
                ai_prompt = f"""Replace these ingredients with pregnancy-safe alternatives:
{chr(10).join([f"- {ingredient}" for ingredient in ai_ingredients])}

Context: {original_meal.title}

Return JSON:
{{"{ai_ingredients[0] if ai_ingredients else 'ingredient1'}": "replacement1"}}"""
                            
                ai_response = await llm_service.generate_text(ai_prompt, max_tokens=300)
                try:
                    cleaned_response = self._clean_json_text(ai_response)
                    ai_replacements = json.loads(cleaned_response)
                    
                    # Verify different replacements
                    for original, replacement in ai_replacements.items():
                        if replacement.lower() != original.lower():
                            all_replacements[original] = replacement
                
                except Exception as e:
                    logger.warning(f"AI replacement parsing failed: {str(e)}")
                    # Use fallbacks
                    fallbacks = {
                        'cheese': 'nutritional yeast',
                        'chicken': 'firm tofu',
                        'milk': 'unsweetened almond milk',
                        'butter': 'olive oil'
                    }
                    for ingredient in ai_ingredients:
                        for key, fallback in fallbacks.items():
                            if key.lower() in ingredient.lower():
                                all_replacements[ingredient] = fallback
                                break

            # Enhanced ingredient replacement logic
            new_ingredients = []
            for ingredient in meal_data["ingredients"]:
                ingredient_clean = ingredient.strip().lstrip('*').strip()
                replaced = False
                
                for original, replacement in all_replacements.items():
                    if original.lower() in ingredient_clean.lower():
                        # Preserve quantity
                        parts = ingredient_clean.split()
                        if len(parts) >= 2 and any(char.isdigit() for char in parts[0]):
                            quantity_part = ' '.join(parts[:2])
                            new_ingredient = f"* {quantity_part} {replacement}"
                        else:
                            new_ingredient = f"* {replacement}"
                        
                        new_ingredients.append(new_ingredient)
                        replaced = True
                        break
                
                if not replaced:
                    new_ingredients.append(f"* {ingredient_clean}")

            meal_data["ingredients"] = new_ingredients
            
            # Update nutrition values with optimized prompt
            if all_replacements:
                nutrition_prompt = f"""Update nutrition for ingredient changes:
Original: {', '.join(all_replacements.keys())}
New: {', '.join(all_replacements.values())}

Return JSON with updated values:
{{"Calories": "number kcal per serving", "Protein": "number g", "Carbohydrates": "number g", "Fat": "number g", "Fiber": "number g", "Calcium": "number mg", "Iron": "number mg"}}"""
                
                try:
                    nutrition_response = await llm_service.generate_text(nutrition_prompt, max_tokens=200)
                    cleaned_nutrition = self._clean_json_text(nutrition_response)
                    updated_nutrition = json.loads(cleaned_nutrition)
                    meal_data["nutritionalValues"] = updated_nutrition
                except Exception as e:
                    logger.warning(f"Nutrition update failed: {str(e)}")
            
            # Update notes
            existing_notes = original_meal.pregnancy_safe_notes
            if all_replacements:
                replacement_note = f"Recipe customized with: {', '.join([f'{k}→{v}' for k, v in all_replacements.items()])}"
                if existing_notes:
                    meal_data["Pregnancy-Safe Notes"] = f"{existing_notes}\n• {replacement_note}"
                else:
                    meal_data["Pregnancy-Safe Notes"] = f"• {replacement_note}"
            
            updated_meal = Meal(**meal_data)
            success = await meal_repository.update_meal(request.meal_id, updated_meal)
            
            if not success:
                raise ValueError(f"Failed to update meal in database")
            
            response = MealPlanResponse(
                meal=updated_meal,
                sources=[],
                meal_id=request.meal_id
            )
            
            logger.info(f"Successfully edited ingredients for meal ID: {request.meal_id}")
            return response
        
        except Exception as e:
            logger.error(f"Error editing ingredients: {str(e)}")
            raise ValueError(f"Failed to edit ingredients: {str(e)}")

    async def adjust_portions(self, request: PortionAdjustRequest) -> MealPlanResponse:
        """Adjust portion sizes - optimized"""
        if not self.initialized:
            await self.initialize()
            
        try:
            meal_document = await meal_repository.get_meal_by_id(request.meal_id)
            if not meal_document:
                raise ValueError(f"Meal not found with ID: {request.meal_id}")
            
            original_meal = Meal(**meal_document["meal"])
            scaling_factor = request.servings / original_meal.servings
            meal_data = original_meal.model_dump()
            meal_data["servings"] = request.servings
            
            # Scale ingredients
            new_ingredients = []
            for ingredient in meal_data["ingredients"]:
                if "* Salt" in ingredient or "to taste" in ingredient:
                    new_ingredients.append(ingredient)
                    continue
                    
                try:
                    parts = ingredient.split("* ")[1].split(" ", 1)
                    if len(parts) >= 2:
                        quantity_str = parts[0]
                        rest = parts[1]
                        
                        # Handle fractions
                        if "/" in quantity_str:
                            num, denom = quantity_str.split("/")
                            quantity = float(num) / float(denom)
                        else:
                            quantity = float(quantity_str)
                        
                        new_quantity = quantity * scaling_factor
                        
                        # Format new quantity
                        if new_quantity < 1:
                            if abs(new_quantity - 0.25) < 0.01:
                                new_quantity_str = "1/4"
                            elif abs(new_quantity - 0.5) < 0.01:
                                new_quantity_str = "1/2"
                            elif abs(new_quantity - 0.75) < 0.01:
                                new_quantity_str = "3/4"
                            else:
                                new_quantity_str = f"{new_quantity:.2f}".rstrip('0').rstrip('.')
                        else:
                            new_quantity = round(new_quantity * 2) / 2
                            new_quantity_str = str(int(new_quantity)) if new_quantity == int(new_quantity) else str(new_quantity)
                        
                        new_ingredients.append(f"* {new_quantity_str} {rest}")
                    else:
                        new_ingredients.append(ingredient)
                except ValueError:
                    new_ingredients.append(ingredient)
            
            meal_data["ingredients"] = new_ingredients
            updated_meal = Meal(**meal_data)
            
            success = await meal_repository.update_meal(request.meal_id, updated_meal)
            if not success:
                raise ValueError(f"Failed to update meal in database")
            
            response = MealPlanResponse(
                meal=updated_meal,
                sources=[],
                meal_id=request.meal_id
            )
            
            logger.info(f"Successfully adjusted portions for meal ID: {request.meal_id}")
            return response
        
        except Exception as e:
            logger.error(f"Error adjusting portions: {str(e)}")
            raise ValueError(f"Failed to adjust portions: {str(e)}")

    async def adjust_spice_level(self, request: SpiceLevelRequest) -> MealPlanResponse:
        """Adjust spice level - optimized"""
        if not self.initialized:
            await self.initialize()
            
        try:
            meal_document = await meal_repository.get_meal_by_id(request.meal_id)
            if not meal_document:
                raise ValueError(f"Meal not found with ID: {request.meal_id}")
            
            original_meal = Meal(**meal_document["meal"])
            
            # Optimized spice adjustment prompt
            spice_prompt = f"""Adjust recipe to "{request.spice_level}" spice level:

Original: {original_meal.title}
Ingredients: {chr(10).join(original_meal.ingredients[:5])}

Spice levels:
- none: Remove spicy ingredients, use herbs
- mild: Gentle spices for morning sickness
- medium: Moderate, flavorful spices
- hot: More spices but pregnancy-safe

Return JSON with modified recipe."""
            
            adjusted_json = await llm_service.generate_text(spice_prompt, temperature=0.3, max_tokens=800)
            cleaned_json = self._clean_json_text(adjusted_json)
            
            if cleaned_json:
                meal_data = json.loads(cleaned_json)
                updated_meal = Meal(**meal_data)
                
                success = await meal_repository.update_meal(request.meal_id, updated_meal)
                if not success:
                    raise ValueError(f"Failed to update meal in database")
                
                response = MealPlanResponse(
                    meal=updated_meal,
                    sources=[],
                    meal_id=request.meal_id
                )
                
                logger.info(f"Successfully adjusted spice level for meal ID: {request.meal_id}")
                return response
            else:
                raise ValueError("Failed to parse adjusted recipe")
                
        except Exception as e:
            logger.error(f"Error adjusting spice level: {str(e)}")
            raise ValueError(f"Failed to adjust spice level: {str(e)}")

    def _clean_json_text(self, json_text):
        """Optimized JSON cleaning"""
        if json_text.strip().startswith('{') and json_text.strip().endswith('}'):
            try:
                json_obj = json.loads(json_text)
                return json_text
            except json.JSONDecodeError:
                pass
        
        # Extract JSON if surrounded by other text
        json_match = re.search(r'(\{[\s\S]*\})', json_text)
        if json_match:
            json_text = json_match.group(1)
        
        # Clean control characters
        json_text = re.sub(r'[\x00-\x1F\x7F]', ' ', json_text)
        
        try:
            json_obj = json.loads(json_text)
            return json.dumps(json_obj)
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parsing failed: {str(e)}")
            return None

    def _create_quality_fallback(self, meal_type, trimester, dietary, cuisine, allergies, nutritional_focus):
        """Create high-quality fallback when generation fails"""
        
        title = f"Nutritious {nutritional_focus.title() if nutritional_focus else 'Balanced'} {meal_type.title()}"
        
        if meal_type.lower() == "breakfast":
            ingredients = """* 2 cups fresh spinach, washed and chopped
* 2 large organic eggs
* 1 slice whole grain bread, toasted
* 1 tbsp extra virgin olive oil
* 1/4 tsp sea salt
* 1/8 tsp black pepper
* 1 medium tomato, diced
* 2 tbsp feta cheese (optional)"""
            
            instructions = """1. Heat olive oil in a non-stick pan over medium heat for 2 minutes until warm.
2. Add chopped spinach and cook for 2-3 minutes until wilted, stirring occasionally.
3. In a bowl, whisk eggs with salt and pepper until well combined.
4. Add diced tomato to the pan with spinach and cook for 1 minute.
5. Pour beaten eggs over vegetables and let set for 2 minutes without stirring.
6. Gently fold omelette in half using a spatula, add feta if using.
7. Cook for another minute until eggs are fully set but still creamy.
8. Serve immediately with toasted whole grain bread on the side."""
            
        else:  # lunch or dinner
            ingredients = """* 1 cup brown rice, cooked
* 1 cup mixed vegetables (carrots, peas, bell peppers), diced
* 1/2 cup chickpeas, drained and rinsed
* 1 tbsp olive oil
* 1 tsp ground cumin
* 1/2 tsp turmeric powder
* 1/4 tsp sea salt
* 2 tbsp fresh cilantro, chopped
* 1 lemon, juiced"""
            
            instructions = """1. Heat olive oil in a large pan over medium heat for 1-2 minutes.
2. Add diced mixed vegetables and sauté for 5-6 minutes until tender-crisp.
3. Add chickpeas, cumin, turmeric, and salt, stirring to combine.
4. Cook spice mixture for 3-4 minutes until fragrant and well mixed.
5. Add cooked brown rice and gently fold to combine all ingredients.
6. Cook for 2-3 minutes more until everything is heated through.
7. Remove from heat and stir in fresh cilantro and lemon juice.
8. Serve warm as a complete, nutritious meal."""
        
        return f"""# {title}
**Servings:** 2

## Ingredients
{ingredients}

## Instructions
{instructions}

## Nutritional Values
- **Calories:** 380 kcal per serving
- **Protein:** 16 g
- **Carbohydrates:** 35 g
- **Fat:** 14 g
- **Fiber:** 7 g
- **Calcium:** 150 mg
- **Iron:** 6 mg

## Pregnancy-Safe Notes
- This meal provides balanced nutrition for {trimester} trimester
- Contains essential nutrients including iron, calcium, and fiber
- All ingredients are fully cooked for food safety
- Gentle on the stomach and suitable for morning sickness

## Substitution Options
- For dairy-free: Omit feta cheese, add avocado slices
- For extra protein: Add 1/4 cup hemp seeds or cooked quinoa
- For gluten-free: Ensure bread is certified gluten-free
- For additional iron: Add 1 tbsp pumpkin seeds as garnish"""

# Create singleton instance
meal_planning_service = MealPlanningService()









# import logging
# import json
# import re
# from typing import Dict, List, Any, Optional
# import time

# from app.core.knowledge.rag_service import rag_service
# from app.services.llm import llm_service
# from app.core.meal.meal_model import Meal, MealPlanRequest, MealPlanResponse
# from app.core.meal.meal_model import RegenerateRequest, IngredientEditRequest, PortionAdjustRequest
# from app.core.meal.repository import meal_repository
# from app.core.meal.meal_model import (
#     Meal, MealPlanRequest, MealPlanResponse,
#     RegenerateRequest, IngredientEditRequest, PortionAdjustRequest,
#     SpiceLevelRequest, CookingTimeRequest, CookingMethodRequest,
#     ComplexityRequest, NutritionBoostRequest, BatchCookingRequest,
#     CulturalAdaptationRequest
# )

# logger = logging.getLogger(__name__)

# class MealPlanningService:
#     """Service for generating personalized meal plans"""
    
#     def __init__(self):
#         self.initialized = False
    
#     async def initialize(self):
#         """Initialize the meal planning service"""
#         if self.initialized:
#             return True
            
#         try:
#             # Initialize the RAG service
#             await rag_service.initialize()
            
#             logger.info("Meal planning service initialized successfully")
#             self.initialized = True
#             return True
#         except Exception as e:
#             logger.error(f"Error initializing meal planning service: {str(e)}")
#             raise
    
    

#     async def generate_meal(self, request: MealPlanRequest) -> str:
#         """
#         Generate a personalized meal plan based on user preferences
        
#         Args:
#             request: MealPlanRequest with meal type, trimester, and preferences
            
#         Returns:
#             Markdown formatted meal plan string
#         """
#         if not self.initialized:
#             await self.initialize()
            
#         try:
#             total_start = time.time()
#             logger.info(f"🚀 Starting meal generation for {request.meal_type}")
            
#             # RAG Query Timing
#             rag_start = time.time()
#             nutrition_query = f"{request.meal_type} nutrition for {request.trimester} trimester pregnancy"
#             nutrition_result = await rag_service.query(nutrition_query, request.trimester)
#             rag_time = time.time() - rag_start
#             logger.info(f"⏱️ RAG Query took: {rag_time:.2f} seconds")
            
#             # Prompt Building Timing
#             prompt_start = time.time()
            
#             # Extract dietary preferences
#             dietary = ", ".join(request.preferences.get("dietary", []))
#             cuisine = ", ".join(request.preferences.get("cuisine", []))
#             allergies = ", ".join(request.preferences.get("allergies", []))
#             nutritional_focus = request.preferences.get("nutritionalFocus", "")
            
#             # Check if this is a regeneration request
#             is_regeneration = request.preferences.get("regenerate", False)
            
#             # Build the meal generation prompt
#             prompt = self._build_meal_generation_prompt(
#                 meal_type=request.meal_type,
#                 trimester=request.trimester,
#                 dietary=dietary,
#                 cuisine=cuisine,
#                 allergies=allergies,
#                 nutritional_focus=nutritional_focus,
#                 nutritional_guidance=nutrition_result.answer,
#                 is_regeneration=is_regeneration
#             )
            
#             prompt_time = time.time() - prompt_start
#             logger.info(f"⏱️ Prompt Building took: {prompt_time:.2f} seconds")
#             logger.info(f"⏱️ Prompt length: {len(prompt)} characters")
            
#             # Recipe Generation Timing
#             recipe_start = time.time()
#             logger.info(f"Generating {request.meal_type} recipe for {request.trimester} trimester")
            
#             # SPEED OPTIMIZATION: Reduce max_tokens for faster generation
#             meal_markdown = await llm_service.generate_text(prompt, temperature=0.1, max_tokens=2400)
            
#             recipe_time = time.time() - recipe_start
#             logger.info(f"⏱️ Recipe Generation (Claude API) took: {recipe_time:.2f} seconds")
            
#             # Return the markdown directly - no JSON parsing needed
#             logger.info(f"Generated markdown recipe: {len(meal_markdown)} characters")
            
#             total_time = time.time() - total_start
#             logger.info(f"⏱️ 🎯 TOTAL MEAL GENERATION: {total_time:.2f} seconds")
#             logger.info(f"⏱️ 📊 BREAKDOWN: RAG={rag_time:.1f}s, Prompt={prompt_time:.1f}s, Claude={recipe_time:.1f}s")
            
#             return meal_markdown
            
#         except Exception as e:
#             logger.error(f"Error generating meal plan: {str(e)}")
#             # Return fallback markdown if generation fails
#             return self._create_fallback_markdown(
#                 request.meal_type, 
#                 request.trimester,
#                 dietary,
#                 cuisine,
#                 allergies,
#                 nutritional_focus
#         )

#     def _create_fallback_markdown(self, meal_type, trimester, dietary, cuisine, allergies, nutritional_focus):
#         """Create a fallback markdown recipe when generation fails"""
        
#         title = f"Simple {nutritional_focus.title() if nutritional_focus else 'Nutritious'} {meal_type.title()}"
        
#         if meal_type.lower() == "breakfast":
#             ingredients = """* 2 cups of spinach, washed and chopped
#     * 2 large eggs
#     * 1 slice whole grain bread, toasted
#     * 1 tbsp olive oil
#     * 1/4 tsp salt
#     * 1/8 tsp black pepper"""
            
#             instructions = """1. Heat olive oil in a non-stick pan over medium heat (about 2 minutes).
#     2. Add spinach to the pan and sauté until wilted, about 2-3 minutes.
#     3. In a small bowl, whisk the eggs with salt and pepper.
#     4. Pour the eggs over the spinach in the pan.
#     5. Cook until the edges are set but the center is still slightly runny, about 2 minutes.
#     6. Using a spatula, gently fold the omelette in half.
#     7. Cook for another 1 minute until eggs are fully set but not overcooked.
#     8. Serve immediately with the toasted whole grain bread on the side."""
            
#         else:  # lunch or dinner
#             ingredients = """* 1 cup brown rice, cooked
#     * 1 cup mixed vegetables (carrots, peas, bell peppers), chopped
#     * 1/2 cup chickpeas, drained and rinsed
#     * 1 tbsp olive oil
#     * 1 tsp cumin powder
#     * 1/2 tsp turmeric powder
#     * 1/4 tsp salt
#     * Fresh cilantro for garnish"""
            
#             instructions = """1. Heat olive oil in a large pan over medium heat (about 1 minute).
#     2. Add the mixed vegetables and sauté for 5-6 minutes until slightly tender.
#     3. Add the chickpeas, cumin powder, turmeric powder, and salt.
#     4. Stir well and cook for another 3-4 minutes.
#     5. Add the cooked brown rice and mix thoroughly.
#     6. Cook for 2-3 more minutes until everything is heated through.
#     7. Garnish with fresh cilantro before serving."""
        
#         return f"""# {title}
#     **Servings:** 2

#     ## Ingredients
#     {ingredients}

#     ## Instructions
#     {instructions}

#     ## Nutritional Values
#     - **Calories:** 350 kcal per serving
#     - **Protein:** 18 g
#     - **Carbohydrates:** 32 g
#     - **Fat:** 12 g
#     - **Fiber:** 6 g
#     - **Calcium:** 120 mg
#     - **Iron:** 5 mg

#     ## Pregnancy-Safe Notes
#     * This meal is nutritionally balanced for {trimester} trimester
#     * Contains essential nutrients including iron, calcium, and fiber
#     * All ingredients are fully cooked to avoid foodborne illness
#     * Gentle on the stomach for those experiencing morning sickness

#     ## Substitution Options
#     * For dairy-free: Use olive oil instead of butter for cooking
#     * For extra protein: Add 1/4 cup of tofu or legumes
#     * For gluten-free: Replace any wheat products with gluten-free alternatives
#     * Safe for common allergies: This recipe avoids major allergens"""
    
#     async def regenerate_meal(self, request: RegenerateRequest) -> MealPlanResponse:
#         """
#         Regenerate a meal with the same criteria but a different recipe
        
#         Args:
#             request: RegenerateRequest with the meal ID to regenerate
            
#         Returns:
#             MealPlanResponse with the newly generated meal
#         """
#         if not self.initialized:
#             await self.initialize()
            
#         try:
#             # Retrieve the original meal from the database
#             meal_document = await meal_repository.get_meal_by_id(request.meal_id)
            
#             if not meal_document:
#                 logger.error(f"Meal not found with ID: {request.meal_id}")
#                 raise ValueError(f"Meal not found with ID: {request.meal_id}")
            
#             # Get the original request parameters
#             original_request_data = meal_document["original_request"]
            
#             # Create a MealPlanRequest from the stored data
#             original_request = MealPlanRequest(**original_request_data)
            
#             # Update the user ID if provided
#             if request.user_id:
#                 original_request.user_id = request.user_id
            
#             # Add a special flag to the prompt to ensure we get a different recipe
#             if not original_request.preferences:
#                 original_request.preferences = {}
#             original_request.preferences["regenerate"] = True
            
#             # Use the existing generate_meal method with the original preferences
#             logger.info(f"Regenerating meal with ID: {request.meal_id}")
#             return await self.generate_meal(original_request)
        
#         except Exception as e:
#             logger.error(f"Error regenerating meal: {str(e)}")
#             raise ValueError(f"Failed to regenerate meal: {str(e)}")

#     async def edit_ingredients(self, request: IngredientEditRequest) -> MealPlanResponse:
#         """
#         Edit specific ingredients in a meal
        
#         Args:
#             request: IngredientEditRequest with the meal ID and ingredient replacements
            
#         Returns:
#             MealPlanResponse with the updated meal
#         """
#         if not self.initialized:
#             await self.initialize()
            
#         try:
#             # Retrieve the original meal from the database
#             meal_document = await meal_repository.get_meal_by_id(request.meal_id)
            
#             if not meal_document:
#                 logger.error(f"Meal not found with ID: {request.meal_id}")
#                 raise ValueError(f"Meal not found with ID: {request.meal_id}")
            
#             # Create a Meal object from the stored data
#             original_meal = Meal(**meal_document["meal"])
            
#             # Create a copy of the original meal to modify
#             meal_data = original_meal.model_dump()
            
#             # Process both manual and AI replacements
#             manual_replacements = request.replacements
#             ai_ingredients = getattr(request, 'ai_replacements', [])
            
#             # For AI replacements, let the LLM choose appropriate substitutes
#             all_replacements = dict(manual_replacements)
            
#             if ai_ingredients:
#                 ai_replacement_prompt = f"""You are a pregnancy nutrition expert. For each ingredient listed below, suggest a DIFFERENT pregnancy-safe, nutritionally similar replacement:

#                 Ingredients to replace (provide DIFFERENT alternatives):
#                 {chr(10).join([f"- {ingredient}" for ingredient in ai_ingredients])}

#                 Original dish context: {original_meal.title}

#                 IMPORTANT RULES:
#                 - Each replacement must be DIFFERENT from the original ingredient
#                 - Choose pregnancy-safe alternatives with similar nutritional value
#                 - Consider flavor compatibility with the dish
#                 - If original contains dairy, suggest dairy-free alternatives
#                 - If original contains meat, suggest plant-based or different protein options

#                 Examples:
#                 - "chicken breast" → "firm tofu" or "tempeh"
#                 - "feta cheese" → "nutritional yeast" or "cashew cheese"
#                 - "milk" → "unsweetened almond milk"
#                 - "eggs" → "flax eggs (1 tbsp ground flax + 3 tbsp water)"

#                 Respond with ONLY a JSON object:
#                 {{
#                 "{ai_ingredients[0] if ai_ingredients else 'ingredient1'}": "different replacement 1",
#                 "{ai_ingredients[1] if len(ai_ingredients) > 1 else 'ingredient2'}": "different replacement 2"
#                 }}
#                 """
                            
#                 ai_response = await llm_service.generate_text(ai_replacement_prompt)
#                 try:
#                     import json
#                     # Clean the response and parse JSON
#                     cleaned_ai_response = self._clean_json_text(ai_response)
#                     ai_replacements = json.loads(cleaned_ai_response)
                    
#                     # Verify AI actually provided different replacements
#                     verified_replacements = {}
#                     for original, replacement in ai_replacements.items():
#                         if replacement.lower() != original.lower():
#                             verified_replacements[original] = replacement
#                         else:
#                             logger.warning(f"AI returned same ingredient for {original}, using fallback")
#                             # Use fallback if AI returned same ingredient
#                             fallback_used = False
#                             ai_fallbacks = {
#                                 'butter': 'olive oil',
#                                 'feta cheese': 'nutritional yeast',
#                                 'cheese': 'cashew cheese',
#                                 'chicken': 'firm tofu',
#                                 'beef': 'lentils',
#                                 'milk': 'unsweetened almond milk',
#                                 'eggs': 'flax eggs',
#                                 'fish': 'cooked tempeh'
#                             }
#                             for key, fallback in ai_fallbacks.items():
#                                 if key.lower() in original.lower():
#                                     verified_replacements[original] = fallback
#                                     fallback_used = True
#                                     break
                            
#                             if not fallback_used:
#                                 verified_replacements[original] = f"pregnancy-safe alternative to {original.split()[-1]}"
                    
#                     all_replacements.update(verified_replacements)
                
#                 except Exception as e:
#                     logger.warning(f"Could not parse AI replacements: {str(e)}")
#                     # Fallback: use default pregnancy-safe replacements
#                     ai_fallbacks = {
#                         'feta cheese': 'nutritional yeast',
#                         'cheese': 'cashew cheese', 
#                         'chicken': 'firm tofu',
#                         'beef': 'lentils',
#                         'milk': 'unsweetened almond milk',
#                         'butter': 'olive oil',
#                         'eggs': 'flax eggs',
#                         'fish': 'cooked tempeh'
#                     }
#                     for ingredient in ai_ingredients:
#                         replacement_found = False
#                         for key, replacement in ai_fallbacks.items():
#                             if key.lower() in ingredient.lower():
#                                 all_replacements[ingredient] = replacement
#                                 replacement_found = True
#                                 break
#                         if not replacement_found:
#                             # Extract main ingredient word and create meaningful replacement
#                             main_ingredient = ingredient.split()[-1].lower()
#                             if 'cheese' in main_ingredient:
#                                 all_replacements[ingredient] = 'nutritional yeast'
#                             elif any(protein in main_ingredient for protein in ['chicken', 'beef', 'meat']):
#                                 all_replacements[ingredient] = 'firm tofu'
#                             elif 'milk' in main_ingredient:
#                                 all_replacements[ingredient] = 'unsweetened almond milk'
#                             else:
#                                 all_replacements[ingredient] = f"pregnancy-safe {main_ingredient} alternative"

#                 # Enhanced ingredient replacement logic
#                 # FIXED: Much more precise ingredient replacement logic
#                 new_ingredients = []
#                 for ingredient in meal_data["ingredients"]:
#                     ingredient_clean = ingredient.strip()
#                     if ingredient_clean.startswith('*'):
#                         ingredient_clean = ingredient_clean[1:].strip()
                    
#                     # Check if this ingredient should be replaced - EXACT MATCHING ONLY
#                     replaced = False
#                     for original, replacement in all_replacements.items():
#                         # MUCH MORE PRECISE MATCHING - only replace very similar ingredients
#                         original_clean = original.strip().lower()
#                         ingredient_lower = ingredient_clean.lower()
                        
#                         # Only replace if:
#                         # 1. Exact match, OR
#                         # 2. Original ingredient is substantially contained in current ingredient
#                         if (original_clean == ingredient_lower or 
#                             (len(original_clean) > 8 and original_clean in ingredient_lower and 
#                             len(set(original_clean.split()) & set(ingredient_lower.split())) >= 2)):
                            
#                             # Try to preserve quantity and format
#                             parts = ingredient_clean.split()
#                             if len(parts) >= 2 and any(char.isdigit() for char in parts[0]):
#                                 # Has quantity - keep quantity, replace ingredient
#                                 quantity_parts = []
                                
#                                 for i, part in enumerate(parts):
#                                     if i < 3 and (any(char.isdigit() for char in part) or 
#                                                 part.lower() in ['cup', 'cups', 'tbsp', 'tsp', 'oz', 'lb', 'g', 'mg', 'tablespoon', 'teaspoon']):
#                                         quantity_parts.append(part)
#                                     else:
#                                         break
                                
#                                 if quantity_parts:
#                                     new_ingredient = f"{' '.join(quantity_parts)} {replacement}"
#                                 else:
#                                     new_ingredient = replacement
#                             else:
#                                 # No clear quantity - just replace the ingredient
#                                 new_ingredient = replacement
                            
#                             new_ingredients.append(new_ingredient)
#                             replaced = True
#                             logger.info(f"MATCHED & REPLACED: '{ingredient_clean}' → '{new_ingredient}'")
#                             break
                    
#                     # If not replaced, keep the original
#                     if not replaced:
#                         new_ingredients.append(ingredient_clean)
#                         logger.info(f"KEPT ORIGINAL: '{ingredient_clean}'")

#                 # Update the meal with new ingredients
#                 meal_data["ingredients"] = new_ingredients
            
#             # Create a string representation of the nutrition values for the prompt
#             nutrition_str = "\n".join([f"{k}: {v}" for k, v in original_meal.nutritionalValues.model_dump().items()])
            
#             # Prompt the LLM to update nutritional values based on ingredient changes
#             nutrition_update_prompt = f"""You are a nutrition expert. I need to update the nutritional values for a recipe after replacing some ingredients.

#         ORIGINAL INGREDIENTS:
#         {chr(10).join(original_meal.ingredients)}

#         NEW INGREDIENTS:
#         {chr(10).join(new_ingredients)}

#         REPLACEMENTS MADE:
#         {chr(10).join([f"- Replace {original} with {replacement}" for original, replacement in all_replacements.items()])}

#         ORIGINAL NUTRITIONAL VALUES:
#         {nutrition_str}

#         Please calculate the updated nutritional values after these ingredient changes.
#         Return ONLY a JSON object with the updated nutritional values, following the same format as the original:
#         {{
#         "Calories": "number kcal per serving",
#         "Protein": "number g",
#         "Carbohydrates": "number g",
#         "Fat": "number g",
#         "Fiber": "number g",
#         "Calcium": "number mg",
#         "Iron": "number mg"
#         }}
#         """
            
#             nutrition_response = await llm_service.generate_text(nutrition_update_prompt)
            
#             try:
#                 # Try to parse the nutrition response as JSON
#                 cleaned_response = self._clean_json_text(nutrition_response)
#                 updated_nutrition = json.loads(cleaned_response)
#                 meal_data["nutritionalValues"] = updated_nutrition
#             except Exception as e:
#                 logger.warning(f"Could not parse updated nutrition values: {str(e)}")
#                 # Keep the original nutritional values but add a note
#                 nutrition_values = meal_data["nutritionalValues"].copy()
#                 nutrition_values["Note"] = "Values are estimates and may vary with ingredient changes"
#                 meal_data["nutritionalValues"] = nutrition_values
            
#             # Update notes to reflect the changes
#             # PRESERVE EXISTING NOTES - Don't lose content
#             existing_notes = original_meal.pregnancy_safe_notes
#             logger.info(f"Original notes: {existing_notes}")
#             logger.info(f"All replacements made: {all_replacements}")

#             if existing_notes and len(existing_notes.strip()) > 0:
#                 # We have existing notes to preserve
#                 if all_replacements:
#                     replacement_note = f"Recipe updated with ingredient substitutions: {', '.join([f'{k} → {v}' for k, v in all_replacements.items()])}"
#                     meal_data["Pregnancy-Safe Notes"] = f"{existing_notes}\n\n• {replacement_note}"
#                     logger.info(f"Added replacement note to existing notes")
#                 else:
#                     # No replacements made, keep original notes
#                     meal_data["Pregnancy-Safe Notes"] = existing_notes
#                     logger.info(f"Kept original notes without changes")
#             elif all_replacements:
#                 # No existing notes but we made replacements
#                 replacement_note = f"Recipe updated with ingredient substitutions: {', '.join([f'{k} → {v}' for k, v in all_replacements.items()])}"
#                 meal_data["Pregnancy-Safe Notes"] = f"• {replacement_note}"
#                 logger.info(f"Created new notes with replacement info")
#             else:
#                 # No existing notes and no replacements - this shouldn't happen but let's handle it
#                 meal_data["Pregnancy-Safe Notes"] = "• This recipe has been customized for your dietary preferences."
#                 logger.warning(f"No existing notes and no replacements - using fallback")

#             logger.info(f"Final notes set to: {meal_data.get('Pregnancy-Safe Notes', 'NOT SET')}")
            
#             # Create an updated meal
#             updated_meal = Meal(**meal_data)
            
#             # Update the meal in the database
#             success = await meal_repository.update_meal(request.meal_id, updated_meal)
            
#             if not success:
#                 raise ValueError(f"Failed to update meal in database: {request.meal_id}")
            
#             # Create a response
#             response = MealPlanResponse(
#                 meal=updated_meal,
#                 sources=[],  # No need for sources in this case
#                 meal_id=request.meal_id
#             )
            
#             logger.info(f"Successfully edited ingredients for meal ID: {request.meal_id} with {len(all_replacements)} replacements")
#             return response
        
#         except Exception as e:
#             logger.error(f"Error editing ingredients: {str(e)}")
#             raise ValueError(f"Failed to edit ingredients: {str(e)}")

#     async def adjust_portions(self, request: PortionAdjustRequest) -> MealPlanResponse:
#         """
#         Adjust the portion size (number of servings) for a meal
        
#         Args:
#             request: PortionAdjustRequest with the meal ID and new number of servings
            
#         Returns:
#             MealPlanResponse with the updated meal
#         """
#         if not self.initialized:
#             await self.initialize()
            
#         try:
#             # Retrieve the original meal from the database
#             meal_document = await meal_repository.get_meal_by_id(request.meal_id)
            
#             if not meal_document:
#                 logger.error(f"Meal not found with ID: {request.meal_id}")
#                 raise ValueError(f"Meal not found with ID: {request.meal_id}")
            
#             # Create a Meal object from the stored data
#             original_meal = Meal(**meal_document["meal"])
            
#             # Calculate the scaling factor
#             original_servings = original_meal.servings
#             scaling_factor = request.servings / original_servings
            
#             # Create a copy of the original meal to modify
#             meal_data = original_meal.model_dump()
            
#             # Update the servings
#             meal_data["servings"] = request.servings
            
#             # Scale the ingredients
#             new_ingredients = []
#             for ingredient in meal_data["ingredients"]:
#                 # Skip ingredients that don't have quantities
#                 if "* Salt" in ingredient or "to taste" in ingredient:
#                     new_ingredients.append(ingredient)
#                     continue
                    
#                 # Extract the quantity and unit
#                 parts = ingredient.split("* ")[1].split(" ", 1)
#                 if len(parts) < 2:
#                     # No quantity to scale
#                     new_ingredients.append(ingredient)
#                     continue
                    
#                 try:
#                     # Try to parse the quantity
#                     quantity_str = parts[0]
#                     rest = parts[1]
                    
#                     # Handle fractions like "1/2"
#                     if "/" in quantity_str:
#                         num, denom = quantity_str.split("/")
#                         quantity = float(num) / float(denom)
#                     else:
#                         quantity = float(quantity_str)
                    
#                     # Scale the quantity
#                     new_quantity = quantity * scaling_factor
                    
#                     # Format the new quantity
#                     if new_quantity < 1 and new_quantity > 0:
#                         # Convert to fraction for small quantities
#                         if abs(new_quantity - 0.25) < 0.01:
#                             new_quantity_str = "1/4"
#                         elif abs(new_quantity - 0.33) < 0.01:
#                             new_quantity_str = "1/3"
#                         elif abs(new_quantity - 0.5) < 0.01:
#                             new_quantity_str = "1/2"
#                         elif abs(new_quantity - 0.67) < 0.01:
#                             new_quantity_str = "2/3"
#                         elif abs(new_quantity - 0.75) < 0.01:
#                             new_quantity_str = "3/4"
#                         else:
#                             new_quantity_str = f"{new_quantity:.2f}".rstrip('0').rstrip('.')
#                     else:
#                         # Round to nearest 0.5 for most quantities
#                         new_quantity = round(new_quantity * 2) / 2
#                         if new_quantity == int(new_quantity):
#                             new_quantity_str = str(int(new_quantity))
#                         else:
#                             new_quantity_str = str(new_quantity)
                    
#                     # Create the new ingredient string
#                     new_ingredients.append(f"* {new_quantity_str} {rest}")
                    
#                 except ValueError:
#                     # If we can't parse the quantity, keep the original
#                     new_ingredients.append(ingredient)
            
#             # Update the meal with new ingredients
#             meal_data["ingredients"] = new_ingredients
            
#             # The nutritional values per serving remain the same
            
#             # Create an updated meal
#             updated_meal = Meal(**meal_data)
            
#             # Update the meal in the database
#             success = await meal_repository.update_meal(request.meal_id, updated_meal)
            
#             if not success:
#                 raise ValueError(f"Failed to update meal in database: {request.meal_id}")
            
#             # Create a response
#             response = MealPlanResponse(
#                 meal=updated_meal,
#                 sources=[],  # No need for sources in this case
#                 meal_id=request.meal_id
#             )
            
#             logger.info(f"Successfully adjusted portions for meal ID: {request.meal_id} to {request.servings} servings")
#             return response
        
#         except Exception as e:
#             logger.error(f"Error adjusting portions: {str(e)}")
#             raise ValueError(f"Failed to adjust portions: {str(e)}")
    
#     def _clean_json_text(self, json_text):
#         """Clean JSON text to handle control characters and other issues"""
#         logger.debug(f"Original JSON text length: {len(json_text)}")
        
#         # Check if the text already looks like valid JSON
#         if json_text.strip().startswith('{') and json_text.strip().endswith('}'):
#             try:
#                 # Try to parse it directly first
#                 json_obj = json.loads(json_text)
#                 return json_text
#             except json.JSONDecodeError:
#                 # If that fails, continue with cleaning
#                 pass
        
#         # First try to extract JSON if it's surrounded by other text
#         json_match = re.search(r'(\{[\s\S]*\})', json_text)
#         if json_match:
#             json_text = json_match.group(1)
#             logger.debug(f"Extracted JSON: {json_text[:100]}...")
        
#         # Replace all control characters with spaces
#         json_text = re.sub(r'[\x00-\x1F\x7F]', ' ', json_text)
        
#         # Fix newlines in JSON (replace literal \n with actual newlines)
#         json_text = re.sub(r'\\n', '\n', json_text)
        
#         # Try to parse the cleaned JSON
#         try:
#             json_obj = json.loads(json_text)
#             return json.dumps(json_obj)  # Re-serialize to ensure proper format
#         except json.JSONDecodeError as e:
#             logger.info(f"JSON parsing error after basic cleaning: {str(e)}")
            
#             # Try more aggressive cleaning
#             try:
#                 # Fix common JSON syntax issues
#                 # Replace single backslashes that aren't escaping anything
#                 json_text = re.sub(r'(?<!\\)\\(?!["\\/bfnrt])', '\\\\', json_text)
                
#                 # Fix unescaped quotes
#                 json_text = re.sub(r'(?<!\\)"(?=.*":\s*)', '\\"', json_text)
                
#                 # Try parsing again after fixes
#                 json_obj = json.loads(json_text)
#                 return json.dumps(json_obj)
#             except json.JSONDecodeError as e:
#                 logger.error(f"JSON parsing failed after aggressive cleaning: {str(e)}")
                
#                 # Last resort: Try using demjson3 for more tolerant parsing
#                 try:
#                     import demjson3
#                     parsed = demjson3.decode(json_text)
#                     return json.dumps(parsed)
#                 except ImportError:
#                     logger.warning("demjson3 not available")
#                 except Exception as e:
#                     logger.error(f"Failed to parse with demjson3: {str(e)}")
                
#                 # If we get here, we couldn't parse the JSON
#                 # Return None to indicate failure, so we can use a fallback
#                 return None
    
#     # def _build_meal_generation_prompt(self, meal_type, trimester, dietary, cuisine, 
#     #                             allergies, nutritional_focus, nutritional_guidance,
#     #                             is_regeneration=False):
#     #     """Build a prompt for meal generation"""
        
#     #     # Add a hint for regeneration if needed
#     #     regeneration_hint = ""
#     #     if is_regeneration:
#     #         regeneration_hint = "\nIMPORTANT: Create a completely different recipe than you might have created before with these same parameters. Be creative and offer a distinct alternative."
        
#     #     # Updated prompt to generate markdown directly
#     #     prompt = """You are a professional chef and pregnancy nutrition expert specialized in creating delicious, healthy, and detailed meal plans.

#     # TASK:
#     # Create a {meal_type} recipe for a woman in her {trimester} trimester of pregnancy.{regeneration_hint}

#     # NUTRITIONAL GUIDANCE:
#     # {nutritional_guidance}

#     # DIETARY PREFERENCES:
#     # Dietary restrictions: {dietary}
#     # Preferred cuisine: {cuisine}
#     # Allergies to avoid: {allergies}
#     # Nutritional focus: {nutritional_focus}

#     # CRITICAL RECIPE NAMING:
#     # - Recipe name must be SPECIFIC and DESCRIPTIVE, not generic
#     # - Use specific ingredients and cooking method in the name
#     # - Examples of GOOD names: "Punjabi-Style Spinach and Chickpea Stuffed Paratha", "Mediterranean Quinoa Bowl with Roasted Vegetables and Tahini Drizzle"
#     # - Examples of BAD names: "High Iron Breakfast", "Healthy Lunch", "Nutritious {meal_type}"
#     # - For {cuisine} cuisine: Incorporate traditional dish names and cooking styles

#     # CONTENT REQUIREMENTS:
#     # 1. Create a HIGHLY DETAILED recipe with specific, descriptive title
#     # 2. Include exact measurements and detailed cooking instructions
#     # 3. Calculate accurate nutritional values for the specific ingredients used
#     # 4. Include specific "Pregnancy-Safe Notes" explaining benefits for {trimester} trimester
#     # 5. Provide practical "Substitution Options" for dietary needs
#     # 6. Ensure cultural authenticity for {cuisine} cuisine preferences

#     # OUTPUT FORMAT:
#     # You must respond in EXACT markdown format as shown below. Do NOT use JSON.

#     # # [Specific Recipe Name Here - Be Creative and Descriptive]
#     # **Servings:** [number]

#     # ## Ingredients
#     # * [ingredient 1 with exact measurements]
#     # * [ingredient 2 with exact measurements]
#     # * [continue with all ingredients]

#     # ## Instructions
#     # 1. [First step with detailed instructions]
#     # 2. [Second step with detailed instructions]
#     # [continue with numbered steps]

#     # ## Nutritional Values
#     # - **Calories:** [calculated number] kcal per serving
#     # - **Protein:** [calculated number] g
#     # - **Carbohydrates:** [calculated number] g
#     # - **Fat:** [calculated number] g
#     # - **Fiber:** [calculated number] g
#     # - **Calcium:** [calculated number] mg
#     # - **Iron:** [calculated number] mg

#     # ## Pregnancy-Safe Notes
#     # * [Specific benefit for {trimester} trimester]
#     # * [Safety consideration]
#     # * [Nutritional benefit explanation]
#     # * [Additional pregnancy-specific note]

#     # ## Substitution Options
#     # * [Substitution for dietary restriction]
#     # * [Alternative for allergy concern]
#     # * [Cultural variation option]
#     # * [Nutritional enhancement option]

#     # FORMATTING RULES:
#     # - Use exactly one # for the recipe title
#     # - Use ## for section headers
#     # - Use * for ingredient lists and notes
#     # - Use numbers for instruction steps
#     # - Use - for nutritional values
#     # - Each bullet point in notes should be on a separate line
#     # - Calculate nutritional values based on actual ingredients used
#     # - Make the recipe name creative and specific to the dish you're creating

#     # EXAMPLE GOOD RECIPE NAMES:
#     # - "Kashmiri-Style Saffron and Almond Quinoa Porridge with Dried Fruits"
#     # - "Bengali Fish Curry with Sweet Potato and Baby Spinach"
#     # - "Gujarati-Inspired Dhokla Breakfast Bowl with Mint Chutney Drizzle"
#     # - "Punjabi Methi Paratha with Homemade Yogurt and Pickled Vegetables"
#     # """.format(
#     #         meal_type=meal_type,
#     #         trimester=trimester,
#     #         dietary=dietary if dietary else "None",
#     #         cuisine=cuisine if cuisine else "Any",
#     #         allergies=allergies if allergies else "None",
#     #         nutritional_focus=nutritional_focus if nutritional_focus else "Balanced nutrition",
#     #         nutritional_guidance=nutritional_guidance,
#     #         regeneration_hint=regeneration_hint
#     #     )
        
#     #     return prompt

#     def _build_meal_generation_prompt(self, meal_type, trimester, dietary, cuisine, 
#                             allergies, nutritional_focus, nutritional_guidance,
#                             is_regeneration=False):
#             """Build an optimized prompt for meal generation"""
            
#             # Regeneration hint (keep concise)
#             regeneration_hint = " Generate a different recipe." if is_regeneration else ""
            
#             # Limit RAG guidance to essential info only
#             essential_guidance = nutritional_guidance[:300] + "..." if len(nutritional_guidance) > 300 else nutritional_guidance
            
#             prompt = f"""Create a detailed {cuisine or 'traditional'} {meal_type} recipe for {trimester} trimester pregnancy.{regeneration_hint}

#         Requirements: Dietary: {dietary or 'None'} | Avoid: {allergies or 'None'} | Focus: {nutritional_focus or 'Balanced'}

#         Nutrition guidance: {essential_guidance}

#         Return markdown format:
#         # [Specific Traditional Dish Name]
#         **Servings:** 2

#         ## Ingredients
#         * [ingredient with measurements]
#         * [continue...]

#         ## Instructions
#         1. [step with timing]
#         2. [continue...]

#         ## Nutritional Values
#         - **Calories:** [number] kcal per serving
#         - **Protein:** [number] g | **Carbs:** [number] g | **Fat:** [number] g
#         - **Fiber:** [number] g | **Calcium:** [number] mg | **Iron:** [number] mg

#         ## Pregnancy-Safe Notes
#         - [Specific {trimester} trimester benefit]
#         - [Safety consideration and nutritional benefits]

#         ## Substitution Options
#         - [Dietary/allergy alternatives and cultural variations]

#         Use specific traditional dish names (e.g., "Punjabi Palak Paneer with Cumin Rice").
#         """
#             return prompt
    
#     def _create_fallback_recipe(self, meal_type, trimester, dietary, cuisine, allergies, nutritional_focus):
#         """Create a fallback recipe when JSON parsing fails"""
        
#         # Base recipe structure that will be customized
#         recipe = {
#             "title": f"Simple {nutritional_focus.title() if nutritional_focus else 'Nutritious'} {meal_type.title()}",
#             "servings": 2,
#             "ingredients": [],
#             "instructions": "",
#             "nutritionalValues": {
#                 "Calories": "300 kcal per serving",
#                 "Protein": "15 g",
#                 "Carbohydrates": "30 g",
#                 "Fat": "10 g",
#                 "Fiber": "5 g",
#                 "Calcium": "100 mg",
#                 "Iron": "4 mg"
#             },
#             "Pregnancy-Safe Notes": "",
#             "Substitution Options": ""
#         }
        
#         # Customize based on meal type
#         if meal_type.lower() == "breakfast":
#             recipe["ingredients"] = [
#                 "* 2 cups of spinach, washed and chopped",
#                 "* 2 large eggs",
#                 "* 1 slice whole grain bread, toasted",
#                 "* 1 tbsp olive oil",
#                 "* 1/4 tsp salt",
#                 "* 1/8 tsp black pepper"
#             ]
#             recipe["instructions"] = "1. Heat olive oil in a non-stick pan over medium heat (about 2 minutes). 2. Add spinach to the pan and sauté until wilted, about 2-3 minutes. 3. In a small bowl, whisk the eggs with salt and pepper. 4. Pour the eggs over the spinach in the pan. 5. Cook until the edges are set but the center is still slightly runny, about 2 minutes. 6. Using a spatula, gently fold the omelette in half. 7. Cook for another 1 minute until eggs are fully set but not overcooked. 8. Serve immediately with the toasted whole grain bread on the side."
            
#         elif meal_type.lower() == "lunch" or meal_type.lower() == "dinner":
#             recipe["ingredients"] = [
#                 "* 1 cup brown rice, cooked",
#                 "* 1 cup mixed vegetables (carrots, peas, bell peppers), chopped",
#                 "* 1/2 cup chickpeas, drained and rinsed",
#                 "* 1 tbsp olive oil",
#                 "* 1 tsp cumin powder",
#                 "* 1/2 tsp turmeric powder",
#                 "* 1/4 tsp salt",
#                 "* Fresh cilantro for garnish"
#             ]
#             recipe["instructions"] = "1. Heat olive oil in a large pan over medium heat (about 1 minute). 2. Add the mixed vegetables and sauté for 5-6 minutes until slightly tender. 3. Add the chickpeas, cumin powder, turmeric powder, and salt. 4. Stir well and cook for another 3-4 minutes. 5. Add the cooked brown rice and mix thoroughly. 6. Cook for 2-3 more minutes until everything is heated through. 7. Garnish with fresh cilantro before serving."
            
#         elif meal_type.lower() == "snack":
#             recipe["ingredients"] = [
#                 "* 1 apple, sliced",
#                 "* 2 tbsp almond butter",
#                 "* 1 tbsp honey",
#                 "* 1/4 tsp cinnamon"
#             ]
#             recipe["instructions"] = "1. Wash and slice the apple into 8-10 pieces. 2. Arrange the apple slices on a plate. 3. In a small bowl, mix the almond butter with honey and cinnamon. 4. Serve the apple slices with the almond butter mixture for dipping."
        
#         # Add pregnancy-safe notes
#         recipe["Pregnancy-Safe Notes"] = f"* This meal is nutritionally balanced for {trimester} trimester\n* Contains essential nutrients including iron, calcium, and fiber\n* All ingredients are fully cooked to avoid foodborne illness\n* Gentle on the stomach for those experiencing morning sickness"
        
#         # Add substitution options based on dietary preferences
#         recipe["Substitution Options"] = "* For dairy-free: Use olive oil instead of butter for cooking\n* For extra protein: Add 1/4 cup of tofu or legumes\n* For gluten-free: Replace any wheat products with gluten-free alternatives"
        
#         # Customize for cuisine if specified
#         if cuisine and "indian" in cuisine.lower():
#             recipe["Substitution Options"] += "\n* For Indian flavor: Add 1/2 tsp garam masala and 1/4 tsp turmeric"
        
#         # Customize for allergies if specified
#         if allergies and "peanuts" in allergies.lower():
#             recipe["Substitution Options"] += "\n* Safe for peanut allergies: This recipe contains no peanuts or peanut products"
        
#         return recipe
    
#     # app/core/meal/meal_service.py
# # Add these methods to the MealPlanningService class after the existing methods

#     async def adjust_spice_level(self, request: SpiceLevelRequest) -> MealPlanResponse:
#         """
#         Adjust the spice level of a meal
        
#         Args:
#             request: SpiceLevelRequest with the meal ID and desired spice level
            
#         Returns:
#             MealPlanResponse with the updated meal
#         """
#         if not self.initialized:
#             await self.initialize()
            
#         try:
#             # Retrieve the original meal from the database
#             meal_document = await meal_repository.get_meal_by_id(request.meal_id)
            
#             if not meal_document:
#                 logger.error(f"Meal not found with ID: {request.meal_id}")
#                 raise ValueError(f"Meal not found with ID: {request.meal_id}")
            
#             # Create a Meal object from the stored data
#             original_meal = Meal(**meal_document["meal"])
            
#             # Create the prompt for spice adjustment
#             spice_prompt = f"""You are a culinary expert specializing in pregnancy-safe recipes. 
# I need you to adjust the spice level of this recipe to be "{request.spice_level}".

# ORIGINAL RECIPE:
# Title: {original_meal.title}
# Ingredients:
# {chr(10).join(original_meal.ingredients)}

# Instructions:
# {original_meal.instructions}

# TASK:
# Modify the recipe to achieve a "{request.spice_level}" spice level while maintaining pregnancy safety.
# - none: Remove all spicy ingredients, use herbs for flavor
# - mild: Very gentle spices, suitable for morning sickness
# - medium: Moderate spices, flavorful but not overwhelming  
# - hot: More spices but still pregnancy-safe (no excessive chili)

# Return ONLY a JSON object with these fields:
# {{
#     "title": "Modified recipe title reflecting spice level",
#     "servings": {original_meal.servings},
#     "ingredients": ["list of modified ingredients"],
#     "instructions": "Updated cooking instructions",
#     "nutritionalValues": {json.dumps(original_meal.nutritionalValues.model_dump())},
#     "Pregnancy-Safe Notes": "Updated notes about spice level and pregnancy safety",
#     "Substitution Options": "Updated substitution options",
#     "spice_level": "{request.spice_level}"
# }}
# """
            
#             # Generate the adjusted recipe
#             adjusted_json = await llm_service.generate_text(spice_prompt, temperature=0.3)
            
#             # Parse the response
#             cleaned_json = self._clean_json_text(adjusted_json)
#             if cleaned_json is None:
#                 raise ValueError("Failed to parse adjusted recipe")
                
#             meal_data = json.loads(cleaned_json)
            
#             # Create the updated meal
#             updated_meal = Meal(**meal_data)
            
#             # Update in database
#             success = await meal_repository.update_meal(request.meal_id, updated_meal)
            
#             if not success:
#                 raise ValueError(f"Failed to update meal in database: {request.meal_id}")
            
#             # Create response
#             response = MealPlanResponse(
#                 meal=updated_meal,
#                 sources=[],
#                 meal_id=request.meal_id
#             )
            
#             logger.info(f"Successfully adjusted spice level for meal ID: {request.meal_id} to {request.spice_level}")
#             return response
            
#         except Exception as e:
#             logger.error(f"Error adjusting spice level: {str(e)}")
#             raise ValueError(f"Failed to adjust spice level: {str(e)}")

#     async def adjust_cooking_time(self, request: CookingTimeRequest) -> MealPlanResponse:
#         """
#         Adjust the recipe to fit within a specified cooking time
        
#         Args:
#             request: CookingTimeRequest with the meal ID and maximum cooking time
            
#         Returns:
#             MealPlanResponse with the updated meal
#         """
#         if not self.initialized:
#             await self.initialize()
            
#         try:
#             # Retrieve the original meal from the database
#             meal_document = await meal_repository.get_meal_by_id(request.meal_id)
            
#             if not meal_document:
#                 logger.error(f"Meal not found with ID: {request.meal_id}")
#                 raise ValueError(f"Meal not found with ID: {request.meal_id}")
            
#             # Create a Meal object from the stored data
#             original_meal = Meal(**meal_document["meal"])
            
#             # Create the prompt for time adjustment
#             time_prompt = f"""You are a culinary expert specializing in quick pregnancy-safe recipes. 
# I need you to modify this recipe to be completed within {request.max_time} minutes.

# ORIGINAL RECIPE:
# Title: {original_meal.title}
# Ingredients:
# {chr(10).join(original_meal.ingredients)}

# Instructions:
# {original_meal.instructions}

# TASK:
# Create a faster version that can be completed in {request.max_time} minutes or less.
# Consider:
# - Using pre-cut vegetables or canned alternatives
# - Pressure cooker or microwave methods
# - Reducing cooking steps
# - Using quick-cooking ingredients
# - Maintaining nutritional value for pregnancy

# Return ONLY a JSON object with these fields:
# {{
#     "title": "Quick version of the recipe title",
#     "servings": {original_meal.servings},
#     "ingredients": ["list of time-saving ingredients"],
#     "instructions": "Simplified, time-efficient cooking instructions",
#     "nutritionalValues": {json.dumps(original_meal.nutritionalValues.model_dump())},
#     "Pregnancy-Safe Notes": "Notes about quick cooking and pregnancy safety",
#     "Substitution Options": "Time-saving substitution options",
#     "cooking_time": "{request.max_time} minutes"
# }}
# """
            
#             # Generate the adjusted recipe
#             adjusted_json = await llm_service.generate_text(time_prompt, temperature=0.3)
            
#             # Parse the response
#             cleaned_json = self._clean_json_text(adjusted_json)
#             if cleaned_json is None:
#                 raise ValueError("Failed to parse adjusted recipe")
                
#             meal_data = json.loads(cleaned_json)
            
#             # Create the updated meal
#             updated_meal = Meal(**meal_data)
            
#             # Update in database
#             success = await meal_repository.update_meal(request.meal_id, updated_meal)
            
#             if not success:
#                 raise ValueError(f"Failed to update meal in database: {request.meal_id}")
            
#             # Create response
#             response = MealPlanResponse(
#                 meal=updated_meal,
#                 sources=[],
#                 meal_id=request.meal_id
#             )
            
#             logger.info(f"Successfully adjusted cooking time for meal ID: {request.meal_id} to {request.max_time} minutes")
#             return response
            
#         except Exception as e:
#             logger.error(f"Error adjusting cooking time: {str(e)}")
#             raise ValueError(f"Failed to adjust cooking time: {str(e)}")

#     async def change_cooking_method(self, request: CookingMethodRequest) -> MealPlanResponse:
#         """
#         Change the cooking method of a recipe
        
#         Args:
#             request: CookingMethodRequest with the meal ID and desired cooking method
            
#         Returns:
#             MealPlanResponse with the updated meal
#         """
#         if not self.initialized:
#             await self.initialize()
            
#         try:
#             # Retrieve the original meal from the database
#             meal_document = await meal_repository.get_meal_by_id(request.meal_id)
            
#             if not meal_document:
#                 logger.error(f"Meal not found with ID: {request.meal_id}")
#                 raise ValueError(f"Meal not found with ID: {request.meal_id}")
            
#             # Create a Meal object from the stored data
#             original_meal = Meal(**meal_document["meal"])
            
#             # Map cooking methods to descriptions
#             method_descriptions = {
#                 "stovetop": "stovetop cooking using pans, pots, or skillets",
#                 "oven": "oven baking or roasting",
#                 "pressure_cooker": "pressure cooker or Instant Pot",
#                 "microwave": "microwave cooking",
#                 "no_cook": "no-cook preparation (salads, cold dishes, overnight preparations)"
#             }
            
#             method_desc = method_descriptions.get(request.method, request.method)
            
#             # Create the prompt for method change
#             method_prompt = f"""You are a culinary expert specializing in pregnancy-safe recipes. 
# I need you to adapt this recipe for {method_desc}.

# ORIGINAL RECIPE:
# Title: {original_meal.title}
# Ingredients:
# {chr(10).join(original_meal.ingredients)}

# Instructions:
# {original_meal.instructions}

# TASK:
# Convert this recipe to use {method_desc} while:
# - Maintaining the dish's essence and flavors
# - Ensuring pregnancy safety
# - Adjusting cooking times and temperatures appropriately
# - Modifying ingredients if needed for the new method
# - Keeping similar nutritional value

# Return ONLY a JSON object with these fields:
# {{
#     "title": "{original_meal.title} ({request.method.replace('_', ' ').title()} Method)",
#     "servings": {original_meal.servings},
#     "ingredients": ["list of ingredients adapted for {request.method}"],
#     "instructions": "Complete instructions for {method_desc}",
#     "nutritionalValues": {json.dumps(original_meal.nutritionalValues.model_dump())},
#     "Pregnancy-Safe Notes": "Safety notes for {request.method} cooking",
#     "Substitution Options": "Method-specific substitutions",
#     "equipment_needed": ["list of equipment needed for {request.method}"]
# }}
# """
            
#             # Generate the adjusted recipe
#             adjusted_json = await llm_service.generate_text(method_prompt, temperature=0.3)
            
#             # Parse the response
#             cleaned_json = self._clean_json_text(adjusted_json)
#             if cleaned_json is None:
#                 raise ValueError("Failed to parse adjusted recipe")
                
#             meal_data = json.loads(cleaned_json)
            
#             # Create the updated meal
#             updated_meal = Meal(**meal_data)
            
#             # Update in database
#             success = await meal_repository.update_meal(request.meal_id, updated_meal)
            
#             if not success:
#                 raise ValueError(f"Failed to update meal in database: {request.meal_id}")
            
#             # Create response
#             response = MealPlanResponse(
#                 meal=updated_meal,
#                 sources=[],
#                 meal_id=request.meal_id
#             )
            
#             logger.info(f"Successfully changed cooking method for meal ID: {request.meal_id} to {request.method}")
#             return response
            
#         except Exception as e:
#             logger.error(f"Error changing cooking method: {str(e)}")
#             raise ValueError(f"Failed to change cooking method: {str(e)}")

#     async def boost_nutrition(self, request: NutritionBoostRequest) -> MealPlanResponse:
#         """
#         Boost specific nutrients in a meal
        
#         Args:
#             request: NutritionBoostRequest with the meal ID and nutrients to boost
            
#         Returns:
#             MealPlanResponse with the nutritionally enhanced meal
#         """
#         if not self.initialized:
#             await self.initialize()
            
#         try:
#             # Retrieve the original meal from the database
#             meal_document = await meal_repository.get_meal_by_id(request.meal_id)
            
#             if not meal_document:
#                 logger.error(f"Meal not found with ID: {request.meal_id}")
#                 raise ValueError(f"Meal not found with ID: {request.meal_id}")
            
#             # Create a Meal object from the stored data
#             original_meal = Meal(**meal_document["meal"])
            
#             # Join the nutrients to boost
#             nutrients_str = ", ".join(request.boost_nutrients)
            
#             # Create the prompt for nutrition boost
#             boost_prompt = f"""You are a pregnancy nutrition expert. 
# I need you to enhance this recipe to maximize these nutrients: {nutrients_str}.

# ORIGINAL RECIPE:
# Title: {original_meal.title}
# Ingredients:
# {chr(10).join(original_meal.ingredients)}

# Instructions:
# {original_meal.instructions}

# Current Nutritional Values:
# {chr(10).join([f"{k}: {v}" for k, v in original_meal.nutritionalValues.model_dump().items()])}

# TASK:
# Enhance the recipe to boost {nutrients_str} by:
# - Adding nutrient-rich ingredients
# - Suggesting fortified alternatives
# - Including nutrient-dense toppings or sides
# - Using cooking methods that preserve nutrients
# - Maintaining taste and pregnancy safety

# Focus on these nutrient sources:
# - Iron: spinach, lentils, fortified cereals, lean meats
# - Calcium: dairy, fortified plant milks, leafy greens, tofu
# - Protein: legumes, eggs, Greek yogurt, quinoa
# - Folate: dark leafy greens, citrus, fortified grains, beans
# - Fiber: whole grains, vegetables, fruits, legumes

# Return ONLY a JSON object with these enhanced nutritional values and modifications.
# """
            
#             # Generate the enhanced recipe
#             enhanced_json = await llm_service.generate_text(boost_prompt, temperature=0.3)
            
#             # Parse the response
#             cleaned_json = self._clean_json_text(enhanced_json)
#             if cleaned_json is None:
#                 raise ValueError("Failed to parse enhanced recipe")
                
#             meal_data = json.loads(cleaned_json)
            
#             # Add a note about the nutritional boost
#             meal_data["Pregnancy-Safe Notes"] = f"* Enhanced with extra {nutrients_str} for pregnancy nutrition\n" + meal_data.get("Pregnancy-Safe Notes", "")
            
#             # Create the updated meal
#             updated_meal = Meal(**meal_data)
            
#             # Update in database
#             success = await meal_repository.update_meal(request.meal_id, updated_meal)
            
#             if not success:
#                 raise ValueError(f"Failed to update meal in database: {request.meal_id}")
            
#             # Create response
#             response = MealPlanResponse(
#                 meal=updated_meal,
#                 sources=[],
#                 meal_id=request.meal_id
#             )
            
#             logger.info(f"Successfully boosted nutrition for meal ID: {request.meal_id} with {nutrients_str}")
#             return response
            
#         except Exception as e:
#             logger.error(f"Error boosting nutrition: {str(e)}")
#             raise ValueError(f"Failed to boost nutrition: {str(e)}")
        
#     # app/core/meal/meal_service.py
# # Add these methods to the MealPlanningService class after the previous methods

#     async def adjust_complexity(self, request: ComplexityRequest) -> MealPlanResponse:
#         """
#         Adjust the complexity level of a recipe
        
#         Args:
#             request: ComplexityRequest with the meal ID and desired complexity
            
#         Returns:
#             MealPlanResponse with the adjusted meal
#         """
#         if not self.initialized:
#             await self.initialize()
            
#         try:
#             # Retrieve the original meal from the database
#             meal_document = await meal_repository.get_meal_by_id(request.meal_id)
            
#             if not meal_document:
#                 logger.error(f"Meal not found with ID: {request.meal_id}")
#                 raise ValueError(f"Meal not found with ID: {request.meal_id}")
            
#             # Create a Meal object from the stored data
#             original_meal = Meal(**meal_document["meal"])
            
#             # Define complexity parameters
#             complexity_guide = {
#                 "simple": {
#                     "max_ingredients": 7,
#                     "max_steps": 5,
#                     "prep_time": "10 minutes",
#                     "description": "minimal ingredients, basic techniques, one-pot meals"
#                 },
#                 "moderate": {
#                     "max_ingredients": 12,
#                     "max_steps": 8,
#                     "prep_time": "20 minutes",
#                     "description": "standard cooking techniques, some prep work"
#                 },
#                 "elaborate": {
#                     "max_ingredients": 20,
#                     "max_steps": 15,
#                     "prep_time": "30+ minutes",
#                     "description": "multiple components, advanced techniques, presentation focus"
#                 }
#             }
            
#             guide = complexity_guide[request.complexity]
            
#             # Create the prompt for complexity adjustment
#             # Create the prompt for complexity adjustment
#             complexity_prompt = f"""You are a culinary expert specializing in pregnancy-safe recipes. 
# I need you to adjust this recipe to be "{request.complexity}" complexity level.

# ORIGINAL RECIPE:
# Title: {original_meal.title}
# Ingredients ({len(original_meal.ingredients)} items):
# {chr(10).join(original_meal.ingredients)}

# Instructions:
# {original_meal.instructions}

# COMPLEXITY REQUIREMENTS for "{request.complexity}":
# - Maximum {guide['max_ingredients']} ingredients
# - Maximum {guide['max_steps']} cooking steps
# - Prep time around {guide['prep_time']}
# - Style: {guide['description']}

# TASK:
# {"Simplify" if request.complexity == "simple" else "Adjust"} this recipe to match the {request.complexity} complexity level while:
# - Maintaining the dish's core identity and flavors
# - Ensuring pregnancy safety
# - Keeping nutritional value as close as possible
# - {"Using shortcuts and convenience items" if request.complexity == "simple" else "Adding interesting elements" if request.complexity == "elaborate" else "Balancing effort and result"}

# Return ONLY a JSON object with the adjusted recipe following the standard format:
# {{
#     "title": "Recipe title reflecting {request.complexity} complexity",
#     "servings": {original_meal.servings},
#     "ingredients": ["ingredient 1", "ingredient 2", "ingredient 3"],
#     "instructions": "Step 1: Do this. Step 2: Do that. Step 3: Final step.",
#     "nutritionalValues": {json.dumps(original_meal.nutritionalValues.model_dump())},
#     "Pregnancy-Safe Notes": "Safety notes about {request.complexity} preparation",
#     "Substitution Options": "Substitutions appropriate for {request.complexity} cooking"
# }}

# FORMATTING RULES:
# - ingredients: array of strings
# - instructions: single string with numbered steps
# - All other fields: strings
# - Do not add extra fields

# CRITICAL: instructions must be a single string, not an array.
# """
            
#             # Generate the adjusted recipe
#             adjusted_json = await llm_service.generate_text(complexity_prompt, temperature=0.3)
            
#             # Parse the response
#             cleaned_json = self._clean_json_text(adjusted_json)
#             if cleaned_json is None:
#                 raise ValueError("Failed to parse adjusted recipe")
                
#             meal_data = json.loads(cleaned_json)
#             meal_data["difficulty_level"] = request.complexity
            
#             # Create the updated meal
#             updated_meal = Meal(**meal_data)
            
#             # Update in database
#             success = await meal_repository.update_meal(request.meal_id, updated_meal)
            
#             if not success:
#                 raise ValueError(f"Failed to update meal in database: {request.meal_id}")
            
#             # Create response
#             response = MealPlanResponse(
#                 meal=updated_meal,
#                 sources=[],
#                 meal_id=request.meal_id
#             )
            
#             logger.info(f"Successfully adjusted complexity for meal ID: {request.meal_id} to {request.complexity}")
#             return response
            
#         except Exception as e:
#             logger.error(f"Error adjusting complexity: {str(e)}")
#             raise ValueError(f"Failed to adjust complexity: {str(e)}")

#     async def scale_for_batch_cooking(self, request: BatchCookingRequest) -> MealPlanResponse:
#         """
#         Scale a recipe for batch cooking/meal prep
        
#         Args:
#             request: BatchCookingRequest with the meal ID, days, and portions per day
            
#         Returns:
#             MealPlanResponse with the batch cooking version
#         """
#         if not self.initialized:
#             await self.initialize()
            
#         try:
#             # Retrieve the original meal from the database
#             meal_document = await meal_repository.get_meal_by_id(request.meal_id)
            
#             if not meal_document:
#                 logger.error(f"Meal not found with ID: {request.meal_id}")
#                 raise ValueError(f"Meal not found with ID: {request.meal_id}")
            
#             # Create a Meal object from the stored data
#             original_meal = Meal(**meal_document["meal"])
            
#             # Calculate total portions needed
#             total_portions = request.days * request.portions_per_day
#             scaling_factor = total_portions / original_meal.servings
            
#             # Create the prompt for batch cooking
#             batch_prompt = f"""You are a meal prep expert specializing in pregnancy-safe batch cooking. 
# I need you to adapt this recipe for batch cooking.

# ORIGINAL RECIPE:
# Title: {original_meal.title}
# Servings: {original_meal.servings}
# Ingredients:
# {chr(10).join(original_meal.ingredients)}

# Instructions:
# {original_meal.instructions}

# BATCH COOKING REQUIREMENTS:
# - Prepare for {request.days} days
# - {request.portions_per_day} portions per day
# - Total portions needed: {total_portions}
# - Scaling factor: {scaling_factor:.1f}x

# TASK:
# Create a batch cooking version that:
# 1. Scales ingredients appropriately (round to practical amounts)
# 2. Includes storage instructions for {request.days} days
# 3. Provides reheating instructions that maintain food safety
# 4. Suggests container sizes and storage methods
# 5. Notes which components store well vs. should be added fresh
# 6. Includes tips for maintaining quality over {request.days} days
# 7. Ensures pregnancy food safety throughout storage

# Return ONLY a JSON object with these modifications:
# - Scaled ingredients for {total_portions} portions
# - Instructions adapted for batch cooking
# - Storage and reheating guidelines in the instructions
# - Notes about meal prep in Pregnancy-Safe Notes
# """
            
#             # Generate the batch cooking recipe
#             batch_json = await llm_service.generate_text(batch_prompt, temperature=0.3)
            
#             # Parse the response
#             cleaned_json = self._clean_json_text(batch_json)
#             if cleaned_json is None:
#                 raise ValueError("Failed to parse batch cooking recipe")
                
#             meal_data = json.loads(cleaned_json)
            
#             # Update the title and servings
#             meal_data["title"] = f"{original_meal.title} - Batch Cooking ({request.days} Days)"
#             meal_data["servings"] = total_portions
            
#             # Add batch cooking note
#             meal_data["Pregnancy-Safe Notes"] = f"* Batch cooking for {request.days} days ({total_portions} total portions)\n* Store in airtight containers in the refrigerator\n* Use within {request.days} days for best quality and safety\n" + meal_data.get("Pregnancy-Safe Notes", "")
            
#             # Create the updated meal
#             updated_meal = Meal(**meal_data)
            
#             # Update in database
#             success = await meal_repository.update_meal(request.meal_id, updated_meal)
            
#             if not success:
#                 raise ValueError(f"Failed to update meal in database: {request.meal_id}")
            
#             # Create response
#             response = MealPlanResponse(
#                 meal=updated_meal,
#                 sources=[],
#                 meal_id=request.meal_id
#             )
            
#             logger.info(f"Successfully created batch cooking version for meal ID: {request.meal_id} for {request.days} days")
#             return response
            
#         except Exception as e:
#             logger.error(f"Error creating batch cooking version: {str(e)}")
#             raise ValueError(f"Failed to create batch cooking version: {str(e)}")

#     async def adapt_to_culture(self, request: CulturalAdaptationRequest) -> MealPlanResponse:
#         """
#         Adapt a recipe to a different cultural cuisine style
        
#         Args:
#             request: CulturalAdaptationRequest with the meal ID and target cuisine
            
#         Returns:
#             MealPlanResponse with the culturally adapted meal
#         """
#         if not self.initialized:
#             await self.initialize()
            
#         try:
#             # Retrieve the original meal from the database
#             meal_document = await meal_repository.get_meal_by_id(request.meal_id)
            
#             if not meal_document:
#                 logger.error(f"Meal not found with ID: {request.meal_id}")
#                 raise ValueError(f"Meal not found with ID: {request.meal_id}")
            
#             # Create a Meal object from the stored data
#             original_meal = Meal(**meal_document["meal"])
            
#             # Get nutritional guidance for maintaining nutrition
#             nutrition_str = ""
#             if request.maintain_nutrition:
#                 nutrition_str = f"""
# IMPORTANT: Maintain similar nutritional values to the original:
# {chr(10).join([f"{k}: {v}" for k, v in original_meal.nutritionalValues.model_dump().items()])}
# """
            
#             # Create the prompt for cultural adaptation
#             cultural_prompt = f"""You are a culinary expert specializing in cross-cultural pregnancy-safe recipes. 
# I need you to adapt this recipe to {request.target_cuisine} cuisine style.

# ORIGINAL RECIPE:
# Title: {original_meal.title}
# Ingredients:
# {chr(10).join(original_meal.ingredients)}

# Instructions:
# {original_meal.instructions}
# {nutrition_str}

# TASK:
# Transform this recipe into authentic {request.target_cuisine} cuisine while:
# 1. Using traditional {request.target_cuisine} ingredients and spices
# 2. Following {request.target_cuisine} cooking techniques and methods
# 3. Maintaining pregnancy safety (no raw fish, unpasteurized items, etc.)
# 4. Creating an authentic taste profile for {request.target_cuisine} cuisine
# 5. Suggesting {request.target_cuisine} side dishes or accompaniments
# 6. {"Maintaining similar nutritional values" if request.maintain_nutrition else "Optimizing nutrition for pregnancy"}

# Consider these {request.target_cuisine} cuisine elements:
# - Traditional spices and seasonings
# - Cooking methods and techniques
# - Common ingredient combinations
# - Cultural presentation styles
# - Regional variations if applicable

# Return ONLY a JSON object with the culturally adapted recipe.
# """
            
#             # Generate the culturally adapted recipe
#             adapted_json = await llm_service.generate_text(cultural_prompt, temperature=0.4)  # Slightly higher temperature for creativity
            
#             # Parse the response
#             cleaned_json = self._clean_json_text(adapted_json)
#             if cleaned_json is None:
#                 raise ValueError("Failed to parse culturally adapted recipe")
                
#             meal_data = json.loads(cleaned_json)
            
#             # Update the title to reflect cultural adaptation
#             if request.target_cuisine not in meal_data["title"]:
#                 meal_data["title"] = f"{request.target_cuisine} Style {meal_data['title']}"
            
#             # Add cultural adaptation note
#             meal_data["Pregnancy-Safe Notes"] = f"* Adapted to {request.target_cuisine} cuisine while maintaining pregnancy safety\n" + meal_data.get("Pregnancy-Safe Notes", "")
            
#             # Create the updated meal
#             updated_meal = Meal(**meal_data)
            
#             # Update in database
#             success = await meal_repository.update_meal(request.meal_id, updated_meal)
            
#             if not success:
#                 raise ValueError(f"Failed to update meal in database: {request.meal_id}")
            
#             # Create response
#             response = MealPlanResponse(
#                 meal=updated_meal,
#                 sources=[],
#                 meal_id=request.meal_id
#             )
            
#             logger.info(f"Successfully adapted meal ID: {request.meal_id} to {request.target_cuisine} cuisine")
#             return response
            
#         except Exception as e:
#             logger.error(f"Error adapting to culture: {str(e)}")
#             raise ValueError(f"Failed to adapt to culture: {str(e)}")

#     async def create_leftover_transformation(self, request: RegenerateRequest) -> MealPlanResponse:
#         """
#         Transform a recipe into a new dish using leftovers
        
#         Args:
#             request: RegenerateRequest with the meal ID to transform
            
#         Returns:
#             MealPlanResponse with the leftover transformation recipe
#         """
#         if not self.initialized:
#             await self.initialize()
            
#         try:
#             # Retrieve the original meal from the database
#             meal_document = await meal_repository.get_meal_by_id(request.meal_id)
            
#             if not meal_document:
#                 logger.error(f"Meal not found with ID: {request.meal_id}")
#                 raise ValueError(f"Meal not found with ID: {request.meal_id}")
            
#             # Create a Meal object from the stored data
#             original_meal = Meal(**meal_document["meal"])
            
#             # Create the prompt for leftover transformation
#             leftover_prompt = f"""You are a creative chef specializing in pregnancy-safe leftover transformations. 
# I need you to create a completely new dish using leftovers from this recipe.

# ORIGINAL RECIPE (assume we have leftovers of this):
# Title: {original_meal.title}
# Main components: {', '.join(original_meal.ingredients[:5])}

# TASK:
# Create a NEW recipe that:
# 1. Uses the leftovers as a main component
# 2. Transforms them into a different meal type (if original was dinner, make breakfast/lunch)
# 3. Adds fresh ingredients to revive and enhance the dish
# 4. Creates a completely different flavor profile
# 5. Maintains pregnancy safety
# 6. Is quick to prepare (under 20 minutes)

# Creative transformation ideas:
# - Turn curries into wraps or sandwiches
# - Transform rice dishes into fried rice or rice bowls
# - Convert cooked vegetables into frittatas or soups
# - Make leftover proteins into salads or grain bowls
# - Create fusion dishes combining leftovers with new cuisines

# Return ONLY a JSON object with the new transformed recipe.
# """
            
#             # Generate the leftover transformation
#             transform_json = await llm_service.generate_text(leftover_prompt, temperature=0.5)  # Higher temperature for creativity
            
#             # Parse the response
#             cleaned_json = self._clean_json_text(transform_json)
#             if cleaned_json is None:
#                 raise ValueError("Failed to parse leftover transformation recipe")
                
#             meal_data = json.loads(cleaned_json)
            
#             # Update the title to indicate it's a leftover transformation
#             meal_data["title"] = f"Leftover Magic: {meal_data['title']}"
            
#             # Add leftover note
#             meal_data["Pregnancy-Safe Notes"] = f"* Creative transformation using leftovers from {original_meal.title}\n* Quick preparation perfect for busy pregnancy days\n" + meal_data.get("Pregnancy-Safe Notes", "")
            
#             # Create the new meal
#             new_meal = Meal(**meal_data)
            
#             # Store as a new meal in database
#             stored_meal = await meal_repository.create_meal(
#                 meal=new_meal,
#                 user_id=request.user_id,
#                 meal_type="leftover_transformation",
#                 original_request={
#                     "original_meal_id": request.meal_id,
#                     "transformation_type": "leftover"
#                 }
#             )
            
#             # Create response
#             response = MealPlanResponse(
#                 meal=new_meal,
#                 sources=[],
#                 meal_id=stored_meal["_id"]
#             )
            
#             logger.info(f"Successfully created leftover transformation from meal ID: {request.meal_id}")
#             return response
            
#         except Exception as e:
#             logger.error(f"Error creating leftover transformation: {str(e)}")
#             raise ValueError(f"Failed to create leftover transformation: {str(e)}")

# # Create singleton instance
# meal_planning_service = MealPlanningService()
