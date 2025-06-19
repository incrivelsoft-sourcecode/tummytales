// src/services/recipeService.js
const API_BASE_URL = 'http://localhost:5001';

class RecipeService {
  // Helper function to get user info
  static getUserInfo() {
    return {
      user_name: localStorage.getItem('user_name') || 'test_user',
      user_id: localStorage.getItem('user_id') || 'test_user'
    };
  }

  // Helper function to handle API responses
  static async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `Request failed: ${response.status}`);
    }
    return response.json();
  }

  // Generate new meal
  static async generateMeal(mealType, preferences) {
    const { user_name } = this.getUserInfo();
    
    const response = await fetch(`${API_BASE_URL}/ai/generate-meal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_name,
        mealType,
        age: 30,
        reminderTime: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        repeatDaily: false,
        trimester: preferences.trimester?.toLowerCase().split(' ')[0] || 'first',
        preferences: {
          dietary: preferences.dietary || [],
          cuisine: preferences.cuisine || [],
          allergies: preferences.allergies || [],
          nutritionalFocus: preferences.nutritionalFocus || ''
        }
      })
    });
    
    return this.handleResponse(response);
  }

  // Check meal generation status
  static async checkMealStatus(mealId) {
    const { user_name } = this.getUserInfo();
    
    const response = await fetch(
      `${API_BASE_URL}/ai/meal/status/${mealId}?user_name=${user_name}`,
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    return this.handleResponse(response);
  }

  // Get meal history
  static async getMealHistory() {
    const { user_name } = this.getUserInfo();
    
    const response = await fetch(
      `${API_BASE_URL}/ai/meal/history?user_name=${user_name}`,
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    return this.handleResponse(response);
  }

  // Regenerate recipe
  static async regenerateRecipe(mealId) {
    const { user_name } = this.getUserInfo();
    
    const response = await fetch(`${API_BASE_URL}/ai/recipe/${mealId}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name })
    });
    
    return this.handleResponse(response);
  }

  // Edit ingredients
  static async editIngredients(mealId, ingredients, alternatives) {
    const { user_name } = this.getUserInfo();
    
    const response = await fetch(`${API_BASE_URL}/ai/recipe/${mealId}/edit-ingredients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name, ingredients, alternatives })
    });
    
    return this.handleResponse(response);
  }

  // Adjust portions
  static async adjustPortions(mealId, servings) {
    const { user_name } = this.getUserInfo();
    
    const response = await fetch(`${API_BASE_URL}/ai/recipe/${mealId}/adjust-portions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name, servings })
    });
    
    return this.handleResponse(response);
  }

  // Adjust spice level
  static async adjustSpiceLevel(mealId, spiceLevel) {
    const { user_id } = this.getUserInfo();
    
    const response = await fetch(`${API_BASE_URL}/api/customization/adjust-spice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal_id: mealId, spice_level: spiceLevel, user_id })
    });
    
    return this.handleResponse(response);
  }

  // Cultural adaptation
  static async adaptToCulture(mealId, targetCuisine, maintainNutrition = true) {
    const { user_id } = this.getUserInfo();
    
    const response = await fetch(`${API_BASE_URL}/api/customization/cultural-adaptation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        meal_id: mealId, 
        target_cuisine: targetCuisine, 
        maintain_nutrition: maintainNutrition,
        user_id 
      })
    });
    
    return this.handleResponse(response);
  }

  // Adjust cooking time
  static async adjustCookingTime(mealId, maxTime) {
    const { user_id } = this.getUserInfo();
    
    const response = await fetch(`${API_BASE_URL}/api/customization/adjust-time`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal_id: mealId, max_time: maxTime, user_id })
    });
    
    return this.handleResponse(response);
  }

  // Change cooking method
  static async changeCookingMethod(mealId, method) {
    const { user_id } = this.getUserInfo();
    
    const response = await fetch(`${API_BASE_URL}/api/customization/change-method`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal_id: mealId, method, user_id })
    });
    
    return this.handleResponse(response);
  }

  // Adjust complexity
  static async adjustComplexity(mealId, complexity) {
    const { user_id } = this.getUserInfo();
    
    const response = await fetch(`${API_BASE_URL}/api/customization/adjust-complexity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal_id: mealId, complexity, user_id })
    });
    
    return this.handleResponse(response);
  }

  // Boost nutrition
  static async boostNutrition(mealId, nutrients) {
    const { user_id } = this.getUserInfo();
    
    const response = await fetch(`${API_BASE_URL}/api/customization/boost-nutrition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal_id: mealId, boost_nutrients: nutrients, user_id })
    });
    
    return this.handleResponse(response);
  }

  // Batch cooking
  static async scaleBatchCooking(mealId, days, portionsPerDay) {
    const { user_id } = this.getUserInfo();
    
    const response = await fetch(`${API_BASE_URL}/api/customization/batch-cooking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        meal_id: mealId, 
        days, 
        portions_per_day: portionsPerDay, 
        user_id 
      })
    });
    
    return this.handleResponse(response);
  }

  // Leftover transformation
  static async transformLeftovers(mealId) {
    const { user_id } = this.getUserInfo();
    
    const response = await fetch(`${API_BASE_URL}/api/customization/leftover-transformation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal_id: mealId, user_id })
    });
    
    return this.handleResponse(response);
  }

  // Get customization options
  static async getCustomizationOptions() {
    const response = await fetch(`${API_BASE_URL}/api/customization/customization-options`, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    return this.handleResponse(response);
  }
}

export default RecipeService;