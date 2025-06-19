// src/hooks/useRecipeCustomization.js
import { useState, useCallback } from 'react';
import RecipeService from '../services/recipeService';

export const useRecipeCustomization = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customizationOptions, setCustomizationOptions] = useState(null);

  // Load customization options
  const loadCustomizationOptions = useCallback(async () => {
    try {
      const options = await RecipeService.getCustomizationOptions();
      setCustomizationOptions(options.customizations);
      return options.customizations;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Generic customization handler
  const customizeRecipe = useCallback(async (type, mealId, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      
      switch (type) {
        case 'regenerate':
          result = await RecipeService.regenerateRecipe(mealId);
          break;
          
        case 'adjust-spice':
          result = await RecipeService.adjustSpiceLevel(mealId, options.spice_level);
          break;
          
        case 'cultural-adaptation':
          result = await RecipeService.adaptToCulture(
            mealId, 
            options.target_cuisine, 
            options.maintain_nutrition
          );
          break;
          
        case 'adjust-time':
          result = await RecipeService.adjustCookingTime(mealId, options.max_time);
          break;
          
        case 'change-method':
          result = await RecipeService.changeCookingMethod(mealId, options.method);
          break;
          
        case 'adjust-complexity':
          result = await RecipeService.adjustComplexity(mealId, options.complexity);
          break;
          
        case 'boost-nutrition':
          result = await RecipeService.boostNutrition(mealId, options.boost_nutrients);
          break;
          
        case 'batch-cooking':
          result = await RecipeService.scaleBatchCooking(
            mealId, 
            options.days, 
            options.portions_per_day
          );
          break;
          
        case 'leftover-transformation':
          result = await RecipeService.transformLeftovers(mealId);
          break;
          
        case 'editIngredients':
          result = await RecipeService.editIngredients(
            mealId, 
            options.ingredients, 
            options.alternatives
          );
          break;
          
        case 'adjustPortions':
          result = await RecipeService.adjustPortions(mealId, options.servings);
          break;
          
        default:
          throw new Error(`Unknown customization type: ${type}`);
      }
      
      setLoading(false);
      return result;
      
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  return {
    loading,
    error,
    customizationOptions,
    loadCustomizationOptions,
    customizeRecipe
  };
};