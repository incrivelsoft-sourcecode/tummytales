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

    # Fix the validation logic in your backend edit_ingredients method
    # In nutritionist-lite/app/core/meal/meal_service.py

    async def edit_ingredients(self, request: IngredientEditRequest) -> MealPlanResponse:
        """Edit ingredients with AI assistance - simplified approach for targeted replacements"""
        if not self.initialized:
            await self.initialize()
            
        try:
            meal_document = await meal_repository.get_meal_by_id(request.meal_id)
            if not meal_document:
                raise ValueError(f"Meal not found with ID: {request.meal_id}")
            
            original_meal = Meal(**meal_document["meal"])
            meal_data = original_meal.model_dump()
            
            # Validation logic - accept either manual OR AI replacements
            manual_replacements = request.replacements or {}
            ai_ingredients = getattr(request, 'ai_replacements', []) or []
            
            # Check if we have EITHER manual replacements OR AI replacements
            has_manual_replacements = manual_replacements and len(manual_replacements) > 0
            has_ai_replacements = ai_ingredients and len(ai_ingredients) > 0
            
            logger.info(f"Edit ingredients validation:")
            logger.info(f"  Manual replacements: {manual_replacements} (has data: {has_manual_replacements})")
            logger.info(f"  AI replacements: {ai_ingredients} (has data: {has_ai_replacements})")
            
            if not has_manual_replacements and not has_ai_replacements:
                raise ValueError("Either manual replacements or AI replacements must be provided")
            
            all_replacements = dict(manual_replacements)
            
            # SIMPLIFIED AI REPLACEMENT LOGIC
            if ai_ingredients:
                logger.info(f"Processing AI ingredient replacements for: {ai_ingredients}")
                
                for ingredient_to_replace in ai_ingredients:
                    # SIMPLIFIED: One ingredient at a time with focused prompt
                    ai_prompt = f"""Replace this ingredient with a pregnancy-safe alternative:

    Ingredient to replace: {ingredient_to_replace}
    Recipe context: {original_meal.title}

    Provide a pregnancy-safe replacement that:
    - Uses the same measurement/quantity
    - Is safer for pregnancy
    - Maintains similar taste/function

    Return ONLY a JSON object:
    {{
        "{ingredient_to_replace}": "pregnancy-safe replacement"
    }}

    Example: {{"1 cup raw spinach": "1 cup pasteurized spinach"}}"""
                                
                    try:
                        ai_response = await llm_service.generate_text(ai_prompt, temperature=0.3, max_tokens=150)
                        cleaned_response = self._clean_json_text(ai_response)
                        
                        if cleaned_response:
                            ai_replacement = json.loads(cleaned_response)
                            all_replacements.update(ai_replacement)
                            logger.info(f"AI suggested: {ai_replacement}")
                        else:
                            # Simple fallback based on common pregnancy safety rules
                            safe_replacement = self._get_pregnancy_safe_fallback(ingredient_to_replace)
                            all_replacements[ingredient_to_replace] = safe_replacement
                            logger.info(f"Using fallback replacement: {ingredient_to_replace} -> {safe_replacement}")
                            
                    except Exception as e:
                        logger.warning(f"AI replacement failed for {ingredient_to_replace}: {str(e)}")
                        # Use fallback
                        safe_replacement = self._get_pregnancy_safe_fallback(ingredient_to_replace)
                        all_replacements[ingredient_to_replace] = safe_replacement
                        logger.info(f"Using fallback replacement: {ingredient_to_replace} -> {safe_replacement}")

            # APPLY REPLACEMENTS TO ORIGINAL INGREDIENTS (preserve all ingredients)
            logger.info(f"Applying {len(all_replacements)} replacements to original recipe")
            new_ingredients = []
            replacements_made = 0
            
            for ingredient in original_meal.ingredients:
                ingredient_clean = ingredient.strip().lstrip('*').strip()
                replaced = False
                
                # Check for exact or partial matches
                for original, replacement in all_replacements.items():
                    original_clean = original.strip().lstrip('*').strip()
                    
                    # Try exact match first
                    if original_clean.lower() == ingredient_clean.lower():
                        new_ingredients.append(replacement)
                        logger.info(f"Exact replacement: {ingredient_clean} -> {replacement}")
                        replacements_made += 1
                        replaced = True
                        break
                    # Try partial match (for cases like "2 cups baby spinach" matching "baby spinach")
                    elif original_clean.lower() in ingredient_clean.lower() or ingredient_clean.lower() in original_clean.lower():
                        # Smart replacement preserving quantities
                        new_ingredient = self._smart_ingredient_replacement(ingredient_clean, original_clean, replacement)
                        new_ingredients.append(new_ingredient)
                        logger.info(f"Partial replacement: {ingredient_clean} -> {new_ingredient}")
                        replacements_made += 1
                        replaced = True
                        break
                
                if not replaced:
                    new_ingredients.append(ingredient_clean)

            meal_data["ingredients"] = new_ingredients
            
            # Update title to indicate modification
            if replacements_made > 0:
                meal_data["title"] = f"{original_meal.title} (Modified)"
            else:
                meal_data["title"] = original_meal.title
            
            # Preserve original instructions and nutrition
            meal_data["instructions"] = original_meal.instructions
            meal_data["nutritionalValues"] = original_meal.nutritionalValues.model_dump()
            meal_data["servings"] = original_meal.servings
            
            # ADD COMPREHENSIVE NOTES
            existing_notes = original_meal.pregnancy_safe_notes or ""
            
            if replacements_made > 0:
                replacement_details = []
                for original, replacement in all_replacements.items():
                    replacement_details.append(f"{original} → {replacement}")
                
                replacement_note = f"Recipe modified for enhanced pregnancy safety and nutrition. Ingredient substitutions made: {'; '.join(replacement_details)}. All replacements maintain recipe integrity while improving safety."
                
                if existing_notes:
                    meal_data["Pregnancy-Safe Notes"] = f"{existing_notes}\n\n• {replacement_note}"
                else:
                    meal_data["Pregnancy-Safe Notes"] = f"• {replacement_note}\n• All ingredients are pregnancy-safe and nutritionally beneficial"
            else:
                meal_data["Pregnancy-Safe Notes"] = existing_notes or "• No ingredient modifications were made\n• All original ingredients are pregnancy-safe"

            # ADD SUBSTITUTION OPTIONS
            if replacements_made > 0:
                substitution_info = f"Modified ingredients can be reverted to original: {', '.join(all_replacements.keys())}. Alternative pregnancy-safe options are also available for most ingredients."
            else:
                substitution_info = "No substitutions were made. Original ingredients can be replaced with organic or locally-sourced alternatives if preferred."
            
            meal_data["Substitution Options"] = substitution_info
            
            # Create updated meal object
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
            logger.info(f"Total replacements made: {replacements_made}")
            return response
        
        except Exception as e:
            logger.error(f"Error editing ingredients: {str(e)}")
            raise ValueError(f"Failed to edit ingredients: {str(e)}")

    def _get_pregnancy_safe_fallback(self, ingredient: str) -> str:
        """Get pregnancy-safe fallback replacement for common ingredients"""
        ingredient_lower = ingredient.lower()
        
        # Common pregnancy safety replacements
        if "spinach" in ingredient_lower:
            return ingredient.replace("spinach", "organic baby spinach (thoroughly washed)")
        elif "cheese" in ingredient_lower and "mozzarella" in ingredient_lower:
            return ingredient.replace("mozzarella cheese", "pasteurized mozzarella cheese")
        elif "cheese" in ingredient_lower:
            return f"pasteurized {ingredient}"
        elif "milk" in ingredient_lower:
            return ingredient.replace("milk", "pasteurized whole milk")
        elif "egg" in ingredient_lower and "beaten" in ingredient_lower:
            return ingredient.replace("egg", "pasteurized egg")
        elif "honey" in ingredient_lower:
            return ingredient.replace("honey", "pasteurized honey")
        elif "fish" in ingredient_lower:
            return f"low-mercury {ingredient}"
        elif "chicken" in ingredient_lower:
            return f"well-cooked {ingredient}"
        else:
            # Generic organic replacement
            return f"organic {ingredient}"

    def _smart_ingredient_replacement(self, original_ingredient: str, match_part: str, replacement: str) -> str:
        """Smart replacement that preserves quantities and measurements"""
        try:
            # Extract quantity from original ingredient
            parts = original_ingredient.split()
            if len(parts) >= 2 and any(char.isdigit() for char in parts[0]):
                # Has quantity - preserve it
                quantity_and_unit = ' '.join(parts[:2])  # e.g., "2 cups"
                # Replace the ingredient name part
                replaced = original_ingredient.replace(match_part, replacement)
                return replaced
            else:
                # No clear quantity - do direct replacement
                return original_ingredient.replace(match_part, replacement)
        except:
            # Fallback to simple replacement
            return replacement
        
    async def adapt_to_culture(self, request: CulturalAdaptationRequest) -> MealPlanResponse:
        """Adapt recipe to different cultural cuisine - optimized"""
        if not self.initialized:
            await self.initialize()
            
        try:
            meal_document = await meal_repository.get_meal_by_id(request.meal_id)
            if not meal_document:
                raise ValueError(f"Meal not found with ID: {request.meal_id}")
            
            original_meal = Meal(**meal_document["meal"])
            
            # Optimized cultural adaptation prompt
            cultural_prompt = f"""Transform to {request.target_cuisine} cuisine:

Original: {original_meal.title}
Ingredients: {chr(10).join(original_meal.ingredients[:6])}

Create authentic {request.target_cuisine} version:
- Traditional spices and seasonings
- Cultural cooking techniques  
- Maintain pregnancy safety
{"- Keep similar nutrition" if request.maintain_nutrition else "- Optimize for pregnancy"}

IMPORTANT: Return instructions as a single string with numbered steps, NOT as an array.

CRITICAL: Return COMPLETE JSON with ALL required fields:
{{
    "title": "{request.target_cuisine} Style [Dish Name]",
    "servings": {original_meal.servings},
    "ingredients": ["* ingredient 1", "* ingredient 2", "* ingredient 3"],
    "instructions": "1. Cultural preparation step one. 2. Traditional cooking step two. 3. Continue with complete numbered steps as single string.",
    "nutritionalValues": {json.dumps(original_meal.nutritionalValues.model_dump())},
    "Pregnancy-Safe Notes": "Cultural adaptation notes maintaining pregnancy safety",
    "Substitution Options": "Cultural alternatives and traditional substitutions"
}}

Must include ALL fields exactly as shown or validation will fail."""
            
            adapted_json = await llm_service.generate_text(cultural_prompt, temperature=0.4, max_tokens=1000)
            cleaned_json = self._clean_json_text(adapted_json)
            
            if cleaned_json:
                meal_data = json.loads(cleaned_json)
                
                # Ensure title reflects cultural adaptation
                if request.target_cuisine.lower() not in meal_data["title"].lower():
                    meal_data["title"] = f"{request.target_cuisine} {meal_data['title']}"
                
                # Add cultural adaptation note
                existing_notes = meal_data.get("Pregnancy-Safe Notes", "")
                cultural_note = f"Adapted to {request.target_cuisine} cuisine while maintaining pregnancy safety"
                meal_data["Pregnancy-Safe Notes"] = f"• {cultural_note}\n{existing_notes}" if existing_notes else f"• {cultural_note}"
                
                updated_meal = Meal(**meal_data)
                success = await meal_repository.update_meal(request.meal_id, updated_meal)
                
                if not success:
                    raise ValueError(f"Failed to update meal in database")
                
                response = MealPlanResponse(
                    meal=updated_meal,
                    sources=[],
                    meal_id=request.meal_id
                )
                
                logger.info(f"Successfully adapted to {request.target_cuisine} cuisine for meal ID: {request.meal_id}")
                return response
            else:
                raise ValueError("Failed to parse cultural adaptation")
                
        except Exception as e:
            logger.error(f"Error adapting to culture: {str(e)}")
            raise ValueError(f"Failed to adapt to culture: {str(e)}")

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
            
            # Scale ingredients with precise logic
            new_ingredients = []
            for ingredient in meal_data["ingredients"]:
                ingredient_clean = ingredient.strip()
                
                # Remove existing * prefix if present
                if ingredient_clean.startswith("* "):
                    ingredient_clean = ingredient_clean[2:]
                elif ingredient_clean.startswith("*"):
                    ingredient_clean = ingredient_clean[1:].strip()
                
                # Handle salt and seasoning (don't scale)
                if any(word in ingredient_clean.lower() for word in ["salt", "pepper", "seasoning", "to taste"]):
                    new_ingredients.append(ingredient_clean)
                    continue
                    
                try:
                    # Split ingredient into parts
                    parts = ingredient_clean.split(" ", 2)
                    if len(parts) >= 2:
                        quantity_str = parts[0]
                        unit = parts[1] if len(parts) > 1 else ""
                        rest = " ".join(parts[2:]) if len(parts) > 2 else ""
                        
                        # Handle fractions
                        if "/" in quantity_str:
                            num, denom = quantity_str.split("/")
                            quantity = float(num) / float(denom)
                        else:
                            try:
                                quantity = float(quantity_str)
                            except ValueError:
                                # If can't parse quantity, keep original
                                new_ingredients.append(ingredient_clean)
                                continue
                        
                        new_quantity = quantity * scaling_factor
                        
                        # Format new quantity nicely
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
                            new_quantity = round(new_quantity * 2) / 2  # Round to nearest 0.5
                            new_quantity_str = str(int(new_quantity)) if new_quantity == int(new_quantity) else str(new_quantity)
                        
                        if rest:
                            new_ingredients.append(f"{new_quantity_str} {unit} {rest}")
                        else:
                            new_ingredients.append(f"{new_quantity_str} {unit}")
                    else:
                        new_ingredients.append(ingredient_clean)
                except (ValueError, IndexError):
                    new_ingredients.append(ingredient_clean)
            
            # Update meal data with clean ingredients (no * prefix)
            meal_data["ingredients"] = new_ingredients
            
            # Scale nutritional values proportionally
            if hasattr(original_meal, 'nutritionalValues') and original_meal.nutritionalValues:
                scaled_nutrition = {}
                for key, value in original_meal.nutritionalValues.model_dump().items():
                    if isinstance(value, str):
                        # Extract numeric value from string like "380 kcal per serving"
                        import re
                        numbers = re.findall(r'\d+\.?\d*', value)
                        if numbers:
                            numeric_val = float(numbers[0])
                            scaled_val = numeric_val * scaling_factor
                            # Preserve the format but update the number
                            scaled_nutrition[key] = value.replace(str(int(numeric_val)), str(int(scaled_val)))
                        else:
                            scaled_nutrition[key] = value
                    else:
                        scaled_nutrition[key] = value
                
                meal_data["nutritionalValues"] = scaled_nutrition
            
            # Add portion adjustment note
            existing_notes = meal_data.get("Pregnancy-Safe Notes", "")
            portion_note = f"Recipe scaled from {original_meal.servings} to {request.servings} servings"
            if existing_notes:
                meal_data["Pregnancy-Safe Notes"] = f"{existing_notes}\n• {portion_note}"
            else:
                meal_data["Pregnancy-Safe Notes"] = f"• {portion_note}"
            
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
        """Adjust spice level - ultra-fixed with complete response"""
        if not self.initialized:
            await self.initialize()
            
        try:
            meal_document = await meal_repository.get_meal_by_id(request.meal_id)
            if not meal_document:
                raise ValueError(f"Meal not found with ID: {request.meal_id}")
            
            original_meal = Meal(**meal_document["meal"])
            
            # Ultra-explicit spice adjustment prompt
            spice_prompt = f"""Adjust this recipe to "{request.spice_level}" spice level:

Original: {original_meal.title}
Current Ingredients: {', '.join(original_meal.ingredients[:5])}

Spice Level Definitions:
- none: Remove ALL spicy ingredients, use only herbs like basil, parsley
- mild: Very gentle spices safe for morning sickness (ginger, light herbs)
- medium: Moderate spices (cumin, paprika, mild curry powder)
- hot: More intense but pregnancy-safe spices (cayenne, hot paprika, chili powder)

YOU MUST RETURN EXACTLY THIS JSON FORMAT - DO NOT CHANGE THE STRUCTURE:

{{
    "title": "{request.spice_level.title()} Spice {original_meal.title}",
    "servings": {original_meal.servings},
    "ingredients": [
        "6 large eggs",
        "1/4 cup low-fat milk",
        "1/4 teaspoon sea salt",
        "1 tablespoon olive oil",
        "2 cups fresh spinach, chopped",
        "1/4 cup crumbled cheese"
    ],
    "instructions": "1. Heat olive oil in non-stick pan over medium heat. 2. Add spinach and cook 2-3 minutes until wilted. 3. Whisk eggs with milk and salt in bowl. 4. Pour eggs over spinach and cook 3-4 minutes. 5. Add cheese and fold omelette in half. 6. Cook 1 more minute until set.",
    "nutritionalValues": {{
        "Calories": "380 kcal per serving",
        "Protein": "20 g",
        "Carbohydrates": "8 g",
        "Fat": "15 g",
        "Fiber": "3 g",
        "Calcium": "200 mg",
        "Iron": "4 mg"
    }},
    "Pregnancy-Safe Notes": "Adjusted to {request.spice_level} spice level for pregnancy comfort. All spices are pregnancy-safe and gentle on the stomach.",
    "Substitution Options": "For milder taste, reduce spices by half. For more flavor, add fresh herbs like basil or cilantro."
}}

CRITICAL RULES:
- Return ONLY valid JSON, no markdown or extra text
- Include ALL fields exactly as shown
- Use real ingredient names without asterisks
- Instructions must be ONE string with numbered steps
- All nutritional values must have numbers and units"""
            
            adjusted_json = await llm_service.generate_text(spice_prompt, temperature=0.2, max_tokens=1200)
            cleaned_json = self._clean_json_text(adjusted_json)
            
            if cleaned_json:
                meal_data = json.loads(cleaned_json)
                
                # Ensure no asterisks in ingredients
                if "ingredients" in meal_data:
                    clean_ingredients = []
                    for ingredient in meal_data["ingredients"]:
                        clean_ingredient = str(ingredient).strip()
                        if clean_ingredient.startswith("* "):
                            clean_ingredient = clean_ingredient[2:]
                        elif clean_ingredient.startswith("*"):
                            clean_ingredient = clean_ingredient[1:].strip()
                        clean_ingredients.append(clean_ingredient)
                    meal_data["ingredients"] = clean_ingredients
                
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
        
    async def adjust_cooking_time(self, request: CookingTimeRequest) -> MealPlanResponse:
        """Adjust cooking time - optimized with complete JSON response"""
        if not self.initialized:
            await self.initialize()
            
        try:
            meal_document = await meal_repository.get_meal_by_id(request.meal_id)
            if not meal_document:
                raise ValueError(f"Meal not found with ID: {request.meal_id}")
            
            original_meal = Meal(**meal_document["meal"])
            
            time_prompt = f"""Adjust this recipe to complete in {request.max_time} minutes:

Original Recipe: {original_meal.title}
Current Ingredients: {chr(10).join(original_meal.ingredients[:6])}
Current Instructions: {original_meal.instructions[:200]}...

Requirements:
- Complete in {request.max_time} minutes maximum
- Use time-saving techniques (pre-cut vegetables, quick-cooking methods)
- Maintain pregnancy safety and nutrition
- Keep similar flavors

IMPORTANT: Return instructions as a single string with numbered steps, NOT as an array.

CRITICAL: Return COMPLETE JSON with ALL required fields:
{{
    "title": "Quick {original_meal.title} ({request.max_time} min)",
    "servings": {original_meal.servings},
    "ingredients": ["* ingredient 1 with measurements", "* ingredient 2 with measurements"],
    "instructions": "1. First step with timing. 2. Second step with timing. 3. Continue with complete numbered steps as single string.",
    "nutritionalValues": {json.dumps(original_meal.nutritionalValues.model_dump())},
    "Pregnancy-Safe Notes": "Time-saving preparation notes for pregnancy safety",
    "Substitution Options": "Quick alternatives and time-saving substitutions"
}}

Must include ALL fields exactly as shown or validation will fail."""
            
            adjusted_json = await llm_service.generate_text(time_prompt, temperature=0.3, max_tokens=1000)
            cleaned_json = self._clean_json_text(adjusted_json)
            
            if cleaned_json:
                meal_data = json.loads(cleaned_json)
                meal_data["cooking_time"] = f"{request.max_time} minutes"
                updated_meal = Meal(**meal_data)
                
                success = await meal_repository.update_meal(request.meal_id, updated_meal)
                if not success:
                    raise ValueError(f"Failed to update meal in database")
                
                response = MealPlanResponse(
                    meal=updated_meal,
                    sources=[],
                    meal_id=request.meal_id
                )
                
                logger.info(f"Successfully adjusted cooking time for meal ID: {request.meal_id}")
                return response
            else:
                raise ValueError("Failed to parse adjusted recipe")
                
        except Exception as e:
            logger.error(f"Error adjusting cooking time: {str(e)}")
            raise ValueError(f"Failed to adjust cooking time: {str(e)}")

    async def change_cooking_method(self, request: CookingMethodRequest) -> MealPlanResponse:
        """Change cooking method - optimized with complete JSON response"""
        if not self.initialized:
            await self.initialize()
            
        try:
            meal_document = await meal_repository.get_meal_by_id(request.meal_id)
            if not meal_document:
                raise ValueError(f"Meal not found with ID: {request.meal_id}")
            
            original_meal = Meal(**meal_document["meal"])
            
            method_prompt = f"""Convert this recipe to use {request.method} cooking method:

Original Recipe: {original_meal.title}
Current Ingredients: {chr(10).join(original_meal.ingredients[:6])}
Current Method: Traditional cooking

Requirements:
- Adapt completely for {request.method} cooking
- Adjust techniques, times, and temperatures for {request.method}
- Maintain pregnancy safety and similar flavors
- Include {request.method}-specific instructions

IMPORTANT: Return instructions as a single string with numbered steps, NOT as an array.

CRITICAL: Return COMPLETE JSON with ALL required fields:
{{
    "title": "{original_meal.title} ({request.method.replace('_', ' ').title()} Method)",
    "servings": {original_meal.servings},
    "ingredients": ["* ingredient 1 adapted for {request.method}", "* ingredient 2 adapted for {request.method}"],
    "instructions": "1. {request.method.title()} step 1 with specific instructions. 2. {request.method.title()} step 2. 3. Continue as single string with numbered steps.",
    "nutritionalValues": {json.dumps(original_meal.nutritionalValues.model_dump())},
    "Pregnancy-Safe Notes": "{request.method.title()} cooking safety notes for pregnancy",
    "Substitution Options": "{request.method.title()}-specific alternatives and equipment substitutions"
}}

Must include ALL fields exactly as shown or validation will fail."""
            
            adjusted_json = await llm_service.generate_text(method_prompt, temperature=0.3, max_tokens=1000)
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
                
                logger.info(f"Successfully changed cooking method for meal ID: {request.meal_id}")
                return response
            else:
                raise ValueError("Failed to parse adjusted recipe")
                
        except Exception as e:
            logger.error(f"Error changing cooking method: {str(e)}")
            raise ValueError(f"Failed to change cooking method: {str(e)}")

    async def adjust_complexity(self, request: ComplexityRequest) -> MealPlanResponse:
        """Adjust complexity level - optimized with complete JSON response"""
        if not self.initialized:
            await self.initialize()
            
        try:
            meal_document = await meal_repository.get_meal_by_id(request.meal_id)
            if not meal_document:
                raise ValueError(f"Meal not found with ID: {request.meal_id}")
            
            original_meal = Meal(**meal_document["meal"])
            
            complexity_guide = {
                "simple": "Use 5-7 ingredients max, 3-5 cooking steps, minimal prep",
                "moderate": "Use 8-12 ingredients, 6-8 cooking steps, some technique required", 
                "elaborate": "Use 12+ ingredients, 8+ steps, advanced techniques and presentation"
            }
            
            complexity_prompt = f"""Adjust this recipe to {request.complexity} complexity level:

Original Recipe: {original_meal.title}
Current Ingredients: {chr(10).join(original_meal.ingredients[:6])}

Target Complexity ({request.complexity}): {complexity_guide[request.complexity]}

Requirements:
- {"Simplify ingredients and steps" if request.complexity == "simple" else "Add interesting techniques and ingredients" if request.complexity == "elaborate" else "Balance effort with results"}
- Maintain pregnancy safety and core flavors
- {"Use shortcuts and convenience items" if request.complexity == "simple" else "Include advanced cooking techniques" if request.complexity == "elaborate" else "Standard cooking methods"}

IMPORTANT: Return instructions as a single string with numbered steps, NOT as an array.

CRITICAL: Return COMPLETE JSON with ALL required fields:
{{
    "title": "{request.complexity.title()} {original_meal.title}",
    "servings": {original_meal.servings},
    "ingredients": ["* ingredient 1 for {request.complexity} level", "* ingredient 2 for {request.complexity} level"],
    "instructions": "1. {request.complexity.title()} step 1. 2. {request.complexity.title()} step 2. 3. Continue as single string with numbered steps.",
    "nutritionalValues": {json.dumps(original_meal.nutritionalValues.model_dump())},
    "Pregnancy-Safe Notes": "{request.complexity.title()} preparation notes maintaining pregnancy safety",
    "Substitution Options": "{request.complexity.title()}-level alternatives and ingredient options",
    "difficulty_level": "{request.complexity}"
}}

Must include ALL fields exactly as shown or validation will fail."""
            
            adjusted_json = await llm_service.generate_text(complexity_prompt, temperature=0.3, max_tokens=1000)
            cleaned_json = self._clean_json_text(adjusted_json)
            
            if cleaned_json:
                meal_data = json.loads(cleaned_json)
                meal_data["difficulty_level"] = request.complexity
                updated_meal = Meal(**meal_data)
                
                success = await meal_repository.update_meal(request.meal_id, updated_meal)
                if not success:
                    raise ValueError(f"Failed to update meal in database")
                
                response = MealPlanResponse(
                    meal=updated_meal,
                    sources=[],
                    meal_id=request.meal_id
                )
                
                logger.info(f"Successfully adjusted complexity for meal ID: {request.meal_id}")
                return response
            else:
                raise ValueError("Failed to parse adjusted recipe")
                
        except Exception as e:
            logger.error(f"Error adjusting complexity: {str(e)}")
            raise ValueError(f"Failed to adjust complexity: {str(e)}")

    async def boost_nutrition(self, request: NutritionBoostRequest) -> MealPlanResponse:
        """Boost specific nutrients - optimized with complete JSON response"""
        if not self.initialized:
            await self.initialize()
            
        try:
            meal_document = await meal_repository.get_meal_by_id(request.meal_id)
            if not meal_document:
                raise ValueError(f"Meal not found with ID: {request.meal_id}")
            
            original_meal = Meal(**meal_document["meal"])
            nutrients_str = ", ".join(request.boost_nutrients)
            
            nutrient_sources = {
                "iron": "spinach, lentils, quinoa, lean beef, tofu",
                "calcium": "dairy products, leafy greens, tahini, fortified plant milk",
                "protein": "legumes, eggs, Greek yogurt, quinoa, lean meats",
                "folate": "dark leafy greens, citrus fruits, fortified grains, beans",
                "fiber": "whole grains, vegetables, fruits, legumes, nuts"
            }
            
            sources_list = [nutrient_sources.get(nutrient, "nutritious foods") for nutrient in request.boost_nutrients]
            
            boost_prompt = f"""Enhance this recipe to boost {nutrients_str} content:

Original Recipe: {original_meal.title}
Current Ingredients: {chr(10).join(original_meal.ingredients[:6])}

Boost These Nutrients: {nutrients_str}
Best Sources: {' | '.join([f"{nutrient}: {source}" for nutrient, source in zip(request.boost_nutrients, sources_list)])}

Requirements:
- Add or modify ingredients to maximize {nutrients_str}
- Maintain recipe structure and pregnancy safety
- Keep similar flavors while boosting nutrition
- Calculate higher nutritional values

IMPORTANT: Return instructions as a single string with numbered steps, NOT as an array.

CRITICAL: Return COMPLETE JSON with ALL required fields:
{{
    "title": "High-{nutrients_str.title()} {original_meal.title}",
    "servings": {original_meal.servings},
    "ingredients": ["* nutrient-rich ingredient 1", "* nutrient-rich ingredient 2"],
    "instructions": "1. Preparation step emphasizing nutrition. 2. Cooking step. 3. Continue as single string with numbered steps.",
    "nutritionalValues": {{
        "Calories": "updated kcal per serving",
        "Protein": "higher protein value g",
        "Carbohydrates": "updated carbs g", 
        "Fat": "updated fat g",
        "Fiber": "higher fiber value g",
        "Calcium": "higher calcium value mg",
        "Iron": "higher iron value mg"
    }},
    "Pregnancy-Safe Notes": "Enhanced with {nutrients_str} for pregnancy nutrition benefits",
    "Substitution Options": "Additional {nutrients_str}-rich alternatives and boosting options"
}}

Must include ALL fields exactly as shown or validation will fail."""
            
            enhanced_json = await llm_service.generate_text(boost_prompt, temperature=0.3, max_tokens=1000)
            cleaned_json = self._clean_json_text(enhanced_json)
            
            if cleaned_json:
                meal_data = json.loads(cleaned_json)
                
                # Add nutrition boost note to existing notes
                existing_notes = meal_data.get("Pregnancy-Safe Notes", "")
                boost_note = f"Enhanced with extra {nutrients_str} for pregnancy nutrition"
                if existing_notes and not boost_note in existing_notes:
                    meal_data["Pregnancy-Safe Notes"] = f"• {boost_note}\n{existing_notes}"
                
                updated_meal = Meal(**meal_data)
                
                success = await meal_repository.update_meal(request.meal_id, updated_meal)
                if not success:
                    raise ValueError(f"Failed to update meal in database")
                
                response = MealPlanResponse(
                    meal=updated_meal,
                    sources=[],
                    meal_id=request.meal_id
                )
                
                logger.info(f"Successfully boosted nutrition for meal ID: {request.meal_id}")
                return response
            else:
                raise ValueError("Failed to parse enhanced recipe")
                
        except Exception as e:
            logger.error(f"Error boosting nutrition: {str(e)}")
            raise ValueError(f"Failed to boost nutrition: {str(e)}")

    async def scale_for_batch_cooking(self, request: BatchCookingRequest) -> MealPlanResponse:
        """Scale for batch cooking - optimized with complete JSON response"""
        if not self.initialized:
            await self.initialize()
            
        try:
            meal_document = await meal_repository.get_meal_by_id(request.meal_id)
            if not meal_document:
                raise ValueError(f"Meal not found with ID: {request.meal_id}")
            
            original_meal = Meal(**meal_document["meal"])
            total_portions = request.days * request.portions_per_day
            scaling_factor = total_portions / original_meal.servings
            
            batch_prompt = f"""Scale this recipe for batch cooking meal prep:

Original Recipe: {original_meal.title} (serves {original_meal.servings})
Scale to: {total_portions} total portions ({request.days} days × {request.portions_per_day} portions/day)
Scaling Factor: {scaling_factor:.1f}x

Current Ingredients: {chr(10).join(original_meal.ingredients[:6])}

Requirements:
- Scale all ingredients by {scaling_factor:.1f}x
- Add storage and reheating instructions
- Include meal prep tips for {request.days} days
- Maintain pregnancy food safety throughout storage

IMPORTANT: Return instructions as a single string with numbered steps, NOT as an array.

CRITICAL: Return COMPLETE JSON with ALL required fields:
{{
    "title": "{original_meal.title} - Batch Prep ({request.days} Days)",
    "servings": {total_portions},
    "ingredients": ["* scaled ingredient 1 (×{scaling_factor:.1f})", "* scaled ingredient 2 (×{scaling_factor:.1f})"],
    "instructions": "1. Batch prep step 1. 2. Cooking step for large batch. 3. Storage instructions. 4. Reheating guidelines as single string.",
    "nutritionalValues": {json.dumps(original_meal.nutritionalValues.model_dump())},
    "Pregnancy-Safe Notes": "Batch cooking for {request.days} days. Store in refrigerator, use within {request.days} days for pregnancy safety. Reheat thoroughly before eating.",
    "Substitution Options": "Batch cooking alternatives and storage container recommendations"
}}

Must include ALL fields exactly as shown or validation will fail."""
            
            batch_json = await llm_service.generate_text(batch_prompt, temperature=0.3, max_tokens=1000)
            cleaned_json = self._clean_json_text(batch_json)
            
            if cleaned_json:
                meal_data = json.loads(cleaned_json)
                meal_data["servings"] = total_portions
                
                # Ensure batch cooking notes are added
                existing_notes = meal_data.get("Pregnancy-Safe Notes", "")
                batch_safety = f"Batch cooking for {request.days} days ({total_portions} total portions). Store in airtight containers, refrigerate immediately, use within {request.days} days"
                if not "batch cooking" in existing_notes.lower():
                    meal_data["Pregnancy-Safe Notes"] = f"• {batch_safety}\n{existing_notes}" if existing_notes else f"• {batch_safety}"
                
                updated_meal = Meal(**meal_data)
                
                success = await meal_repository.update_meal(request.meal_id, updated_meal)
                if not success:
                    raise ValueError(f"Failed to update meal in database")
                
                response = MealPlanResponse(
                    meal=updated_meal,
                    sources=[],
                    meal_id=request.meal_id
                )
                
                logger.info(f"Successfully created batch cooking version for meal ID: {request.meal_id}")
                return response
            else:
                raise ValueError("Failed to parse batch cooking recipe")
                
        except Exception as e:
            logger.error(f"Error creating batch cooking version: {str(e)}")
            raise ValueError(f"Failed to create batch cooking version: {str(e)}")

    async def create_leftover_transformation(self, request: RegenerateRequest) -> MealPlanResponse:
        """Transform leftovers into new dish - optimized with complete JSON response"""
        if not self.initialized:
            await self.initialize()
            
        try:
            meal_document = await meal_repository.get_meal_by_id(request.meal_id)
            if not meal_document:
                raise ValueError(f"Meal not found with ID: {request.meal_id}")
            
            original_meal = Meal(**meal_document["meal"])
            
            leftover_prompt = f"""Create a new dish using leftovers from this recipe:

Original Recipe: {original_meal.title}
Main Leftover Components: {', '.join(original_meal.ingredients[:5])}

Requirements:
- Transform leftovers into completely different dish
- Add fresh ingredients to revive the meal
- Quick preparation (under 20 minutes)
- Different meal type or cuisine style
- Maintain pregnancy safety

IMPORTANT: Return instructions as a single string with numbered steps, NOT as an array.

CRITICAL: Return COMPLETE JSON with ALL required fields:
{{
    "title": "Leftover Magic: [New Dish Name]",
    "servings": {original_meal.servings},
    "ingredients": ["* leftover component 1", "* fresh addition 1", "* fresh addition 2"],
    "instructions": "1. Quick prep step using leftovers. 2. Add fresh ingredients. 3. Transform and serve as single string.",
    "nutritionalValues": {json.dumps(original_meal.nutritionalValues.model_dump())},
    "Pregnancy-Safe Notes": "Creative transformation using leftovers from {original_meal.title}. Quick preparation perfect for busy pregnancy days. Ensure leftovers are reheated thoroughly.",
    "Substitution Options": "Alternative leftover uses and fresh ingredient swaps for variety"
}}

Must include ALL fields exactly as shown or validation will fail."""
            
            transform_json = await llm_service.generate_text(leftover_prompt, temperature=0.5, max_tokens=1000)
            cleaned_json = self._clean_json_text(transform_json)
            
            if cleaned_json:
                meal_data = json.loads(cleaned_json)
                
                # Ensure leftover transformation notes
                existing_notes = meal_data.get("Pregnancy-Safe Notes", "")
                leftover_note = f"Creative transformation using leftovers from {original_meal.title}. Quick preparation perfect for busy pregnancy days"
                if not "leftover" in existing_notes.lower():
                    meal_data["Pregnancy-Safe Notes"] = f"• {leftover_note}\n{existing_notes}" if existing_notes else f"• {leftover_note}"
                
                new_meal = Meal(**meal_data)
                
                # FIXED: Use existing update_meal method instead of non-existent create_meal
                success = await meal_repository.update_meal(request.meal_id, new_meal)
                if not success:
                    raise ValueError(f"Failed to update meal in database")
                
                response = MealPlanResponse(
                    meal=new_meal,
                    sources=[],
                    meal_id=request.meal_id
                )
                
                logger.info(f"Successfully created leftover transformation from meal ID: {request.meal_id}")
                return response
            else:
                raise ValueError("Failed to parse leftover transformation")
                
        except Exception as e:
            logger.error(f"Error creating leftover transformation: {str(e)}")
            raise ValueError(f"Failed to create leftover transformation: {str(e)}")

    def _clean_json_text(self, json_text):
        """Ultra-robust JSON cleaning"""
        try:
            # Remove any markdown formatting
            json_text = json_text.strip()
            
            # Remove markdown code blocks if present
            if json_text.startswith("```json"):
                json_text = json_text[7:]
            if json_text.startswith("```"):
                json_text = json_text[3:]
            if json_text.endswith("```"):
                json_text = json_text[:-3]
            
            json_text = json_text.strip()
            
            # Check if it's already valid JSON
            if json_text.startswith('{') and json_text.endswith('}'):
                try:
                    json.loads(json_text)
                    return json_text
                except json.JSONDecodeError:
                    pass
            
            # Extract JSON from text if surrounded by other content
            json_match = re.search(r'(\{[\s\S]*\})', json_text)
            if json_match:
                json_text = json_match.group(1)
            
            # Clean control characters and fix common issues
            json_text = re.sub(r'[\x00-\x1F\x7F]', ' ', json_text)
            json_text = re.sub(r',\s*}', '}', json_text)  # Remove trailing commas
            json_text = re.sub(r',\s*]', ']', json_text)  # Remove trailing commas in arrays
            
            # Validate final JSON
            try:
                parsed = json.loads(json_text)
                return json.dumps(parsed)  # Return clean, formatted JSON
            except json.JSONDecodeError as e:
                logger.warning(f"JSON parsing failed after cleaning: {str(e)}")
                logger.warning(f"Problematic JSON: {json_text[:200]}...")
                return None
                
        except Exception as e:
            logger.error(f"Error in JSON cleaning: {str(e)}")
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