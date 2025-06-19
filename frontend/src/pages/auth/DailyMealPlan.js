// src/pages/DailyMealPlan.js
import React, { useState } from "react";
import LiveGenerationComponent from "../../components/LiveGenerationComponent";
import RecipeDisplayComponent from "../../components/RecipeDisplayComponent";
import IngredientEditModal from "../../components/IngredientEditModal";
import RecipeHistoryComponent from "../../components/RecipeHistoryComponent";

const DailyMealPlan = () => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedPreferences, setSelectedPreferences] = useState({
    cuisine: [],
    dietary: [],
    allergies: [],
    nutritionalFocus: "",
    trimester: "First Trimester"
  });
  const [reminderDetails, setReminderDetails] = useState({});
  const [activeReminder, setActiveReminder] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState("breakfast");
  const [generatingMealId, setGeneratingMealId] = useState(null);
  const [generatedMeal, setGeneratedMeal] = useState(null);
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  
  const handleClickOutside = (event) => {
    if (!event.target.closest('.preference-dropdown')) {
      setOpenDropdown(null);
    }
  };

  React.useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Handle selection of preferences
  const handlePreferenceChange = (category, option, isMulti = true) => {
    setSelectedPreferences((prev) => {
      if (isMulti) {
        const categorySelections = prev[category] || [];
        const isSelected = categorySelections.includes(option);
        const newSelections = isSelected
          ? categorySelections.filter((item) => item !== option)
          : [...categorySelections, option];

        return {
          ...prev,
          [category]: newSelections,
        };
      } else {
        // For single selection options like trimester
        return {
          ...prev,
          [category]: option,
        };
      }
    });
  };

  // Handle reminder settings
  const handleDetailChange = (meal, field, value) => {
    setReminderDetails((prev) => ({
      ...prev,
      [meal]: {
        ...prev[meal],
        [field]: value,
      },
    }));
  };

  // Handle meal type selection
  const handleMealTypeSelect = (mealType) => {
    setSelectedMealType(mealType);
  };

  // Handle ingredient edit modal submission
 // Handle ingredient edit modal submission
  const handleIngredientEdit = (editData) => {
    console.log("Ingredient edit data received:", editData); // Debug log
    
    // Call the customization API with the replacements data
    handleCustomize('editIngredients', generatedMeal._id, {
      replacements: editData.replacements || {},
      aiReplacements: editData.aiReplacements || []
    });
    setShowIngredientModal(false);
  };

const parseRecipeFromResponse = (responseText) => {
  try {
    console.log("Raw response text:", responseText); // Debug log
    
    // Initialize default recipe structure
    const recipe = {
      title: "Generated Recipe",
      servings: 2,
      ingredients: [],
      instructions: "",
      nutritionalValues: {
        Calories: "250 kcal",
        Protein: "10g",
        Carbohydrates: "40g",
        Fat: "10g",
        Fiber: "8g",
        Calcium: "0mg",
        Iron: "3mg"
      },
      "Pregnancy-Safe Notes": "",
      "Substitution Options": ""
    };

    // Extract title - look for # at start of line
    const titleMatch = responseText.match(/^#\s*(.+)/m);
    if (titleMatch) {
      recipe.title = titleMatch[1].replace(/\*\*/g, '').trim();
    }

    // Extract servings
    const servingsMatch = responseText.match(/\*\*Servings:\*\*\s*(\d+)/);
    if (servingsMatch) {
      recipe.servings = parseInt(servingsMatch[1]);
    }

    // Extract ingredients - find everything between ## Ingredients and next ##
    const ingredientsMatch = responseText.match(/## Ingredients([\s\S]*?)(?=##|$)/);
    if (ingredientsMatch) {
      const ingredientText = ingredientsMatch[1];
      const ingredientLines = ingredientText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('*'))
        .map(line => line.replace(/^\*\s*/, '')); // Remove the * completely
      
      if (ingredientLines.length > 0) {
        recipe.ingredients = ingredientLines;
      }
      console.log("Parsed ingredients:", ingredientLines); // Debug log
    }

    // Extract instructions - find everything between ## Instructions and next ##
    const instructionsMatch = responseText.match(/## Instructions([\s\S]*?)(?=##|$)/);
    if (instructionsMatch) {
      recipe.instructions = instructionsMatch[1].trim();
      console.log("Parsed instructions:", recipe.instructions.substring(0, 100)); // Debug log
    }

    // Extract nutritional values - UPDATED to match actual backend format
    const nutritionMatch = responseText.match(/## Nutritional Values([\s\S]*?)(?=##|$)/);
    if (nutritionMatch) {
      const nutritionText = nutritionMatch[1];
      console.log("Found nutrition section:", nutritionText); // Debug log
      
      // Parse nutrition values with correct patterns for backend format
      const parseNutrition = (text, nutrient) => {
        const patterns = [
          new RegExp(`-\\s*\\*\\*${nutrient}:\\*\\*\\s*([^\\n]+)`, 'i'),  // - **Calories:** 350 kcal
          new RegExp(`${nutrient}[:\\s]*([^\\n]+)`, 'i'),                   // Calories: 350 kcal
          new RegExp(`\\*\\*${nutrient}:\\*\\*\\s*([^\\n]+)`, 'i')          // **Calories:** 350 kcal
        ];
        
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            return match[1].trim();
          }
        }
        return null;
      };

      // Extract each nutrition value
      const calories = parseNutrition(nutritionText, 'Calories');
      const protein = parseNutrition(nutritionText, 'Protein');
      const carbs = parseNutrition(nutritionText, 'Carbohydrates');
      const fat = parseNutrition(nutritionText, 'Fat');
      const fiber = parseNutrition(nutritionText, 'Fiber');
      const calcium = parseNutrition(nutritionText, 'Calcium');
      const iron = parseNutrition(nutritionText, 'Iron');

      // Update nutrition values if found
      if (calories) recipe.nutritionalValues.Calories = calories;
      if (protein) recipe.nutritionalValues.Protein = protein;
      if (carbs) recipe.nutritionalValues.Carbohydrates = carbs;
      if (fat) recipe.nutritionalValues.Fat = fat;
      if (fiber) recipe.nutritionalValues.Fiber = fiber;
      if (calcium) recipe.nutritionalValues.Calcium = calcium;
      if (iron) recipe.nutritionalValues.Iron = iron;

      console.log("Parsed nutrition values:", recipe.nutritionalValues); // Debug log
    }

    // FIXED: Better Notes Parsing Function
    // ENHANCED: Better Notes Parsing Function
    const formatNotesToBullets = (text) => {
      // Remove artifacts
      text = text.replace(/Please review my response.*$/i, '');
      text = text.replace(/let me know if.*$/i, '');
      text = text.replace(/I.*met the requirements.*$/i, '');
      text = text.trim();
      
      // Debug: Log what we're working with
      console.log("Raw text for bullet formatting:", text);
      
      // Method 1: Split by bullet points (•)
      let points = text.split('•').map(p => p.trim()).filter(p => p.length > 5);
      
      // Method 2: If no bullet points, try splitting by sentence patterns
      if (points.length <= 1) {
        // Look for patterns like ". [Capital Letter]" or ". •"
        points = text.split(/\.\s*(?=[A-Z•])/);
        points = points.map(p => p.trim()).filter(p => p.length > 10);
        
        // Add periods back if missing
        points = points.map(point => {
          if (!point.endsWith('.') && !point.endsWith('!') && !point.endsWith('?')) {
            return point + '.';
          }
          return point;
        });
      }
      
      // Method 3: If still no good split, try by common pregnancy/nutrition phrases
      if (points.length <= 1) {
        const splitPatterns = [
          /\s*•\s*(?=This)/i,
          /\s*•\s*(?=The)/i,
          /\s*•\s*(?=For)/i,
          /\s*•\s*(?=If)/i,
          /\.\s*(?=This)/i,
          /\.\s*(?=The)/i,
          /\.\s*(?=For)/i
        ];
        
        for (const pattern of splitPatterns) {
          const testSplit = text.split(pattern);
          if (testSplit.length > 1) {
            points = testSplit.map(p => p.trim()).filter(p => p.length > 10);
            break;
          }
        }
      }
      
      // Format as clean bullet points
      const formattedPoints = points
        .map(point => {
          // Clean up the point
          point = point.replace(/^[•\-*\s]+/, ''); // Remove existing bullets
          point = point.replace(/\s+/g, ' '); // Clean up multiple spaces
          point = point.trim();
          
          // Ensure proper ending punctuation
          if (point.length > 0 && !point.endsWith('.') && !point.endsWith('!') && !point.endsWith('?')) {
            point += '.';
          }
          
          // Capitalize first letter
          if (point.length > 0) {
            point = point.charAt(0).toUpperCase() + point.slice(1);
          }
          
          return point;
        })
        .filter(point => point.length > 1)
        .map(point => `• ${point}`)
        .join('\n\n'); // Double spacing for better readability
      
      console.log("Formatted bullet points:", formattedPoints);
      return formattedPoints || text; // Fallback to original text if formatting fails
    };
    // Apply to notes sections
    const notesMatch = responseText.match(/## Pregnancy-Safe Notes([\s\S]*?)(?=##|$)/);
    if (notesMatch) {
      recipe["Pregnancy-Safe Notes"] = formatNotesToBullets(notesMatch[1]);
      console.log("Raw notes text:", notesMatch[1]); // Debug
      console.log("Formatted notes:", recipe["Pregnancy-Safe Notes"]); // Debug
    }

    const substitutionMatch = responseText.match(/## Substitution Options([\s\S]*?)(?=##|$)/);
    if (substitutionMatch) {
      recipe["Substitution Options"] = formatNotesToBullets(substitutionMatch[1]);
      console.log("Raw substitution text:", substitutionMatch[1]); // Debug
      console.log("Formatted substitution:", recipe["Substitution Options"]); // Debug
    }

    console.log("Final parsed recipe:", recipe); // Debug log
    return recipe;

  } catch (error) {
    console.error("Error parsing recipe:", error);
    return {
      title: "Generated Recipe",
      servings: 2,
      ingredients: ["* Check instructions for ingredient details"],
      instructions: responseText,
      nutritionalValues: {
        Calories: "250 kcal",
        Protein: "10g"
      },
      "Pregnancy-Safe Notes": "Recipe generated successfully",
      "Substitution Options": "Customizable based on preferences"
    };
  }
};

  // Handle generate meal button click
  const handleGenerateMeal = async () => {
    setIsGenerating(true);
    setGeneratingMealId(null);
    setGeneratedMeal(null);
    
    try {
      const response = await fetch('http://localhost:5001/api/agent/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `Generate a ${selectedMealType} recipe for ${selectedPreferences.trimester}`,
          trimester: selectedPreferences.trimester?.toLowerCase().split(' ')[0] || 'first',
          dietary_restrictions: selectedPreferences.dietary?.join(', ') || '',
          cuisine_preferences: selectedPreferences.cuisine?.join(', ') || '',
          allergies: selectedPreferences.allergies?.join(', ') || '',
          nutritional_focus: selectedPreferences.nutritionalFocus || '',
          user_id: localStorage.getItem('user_name') || 'test_user'
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Raw API response:", data); // Debug log

      if (data.status === 'success' && data.response) {
        // Parse the recipe from the CrewAI response
        const parsedRecipe = parseRecipeFromResponse(data.response);
        console.log("Parsed recipe:", parsedRecipe); // Debug log
        
        // Save the meal to database to get a real ObjectId
        try {
          const saveResponse = await fetch('http://localhost:5001/api/meal/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              meal: parsedRecipe,
              user_id: localStorage.getItem('user_name') || 'test_user',
              meal_type: selectedMealType,
              trimester: selectedPreferences.trimester?.toLowerCase().split(' ')[0] || 'first',
              preferences: selectedPreferences
            })
          });
          
          if (!saveResponse.ok) {
            throw new Error('Failed to save meal');
          }
          
          const saveData = await saveResponse.json();
          
          setIsGenerating(false);
          setGeneratedMeal({
            _id: saveData.meal_id,  // Real MongoDB ObjectId
            aiGeneratedMeal: parsedRecipe
          });
          
        } catch (saveError) {
          console.error("Error saving meal:", saveError);
          // Fallback: use temporary ID but warn user about limited functionality
          setGeneratedMeal({
            _id: `meal_${Date.now()}`,
            aiGeneratedMeal: parsedRecipe
          });
        }
      } else {
        throw new Error('Invalid response format from server');
      }
      
    } catch (error) {
      console.error("Error generating meal:", error);
      setIsGenerating(false);
      alert(`Failed to generate meal: ${error.message}`);
    }
  };

  // Handle generation completion
  const handleGenerationComplete = (mealData) => {
    setIsGenerating(false);
    setGeneratedMeal(mealData);
  };

  // Enhanced customization handler for all new endpoints
  const handleCustomize = async (customizationType, mealId, options = {}) => {
    setIsGenerating(true);
    setGeneratingMealId(null);
    setGeneratedMeal(null);
    
    try {
      // Get the user name from local storage or state management
      const user_name = localStorage.getItem('user_name') || 'test_user';
      
      let endpoint = '';
      let requestBody = { 
        user_name, 
        trimester: selectedPreferences.trimester?.toLowerCase().split(' ')[0] || 'first' 
      };
      
      // Map customization types to endpoints and build request body
      switch (customizationType) {
        case 'regenerate':
          endpoint = `/api/meal/regenerate`;
          requestBody = {
            meal_id: mealId,
            user_id: user_name
          };
          break;
          
        case 'editIngredients':
          endpoint = `/api/meal/edit-ingredients`;
          requestBody = {
            meal_id: mealId,
            user_id: user_name,
            replacements: options.replacements || {},
            aiReplacements: options.aiReplacements || []
          };
          break;
          
        case 'adjustPortions':
          endpoint = `/ai/recipe/${mealId}/adjust-portions`;
          requestBody.servings = options.servings || 2;
          break;
          
        case 'adjust-spice':
          endpoint = `/api/customization/adjust-spice`;
          requestBody = {
            meal_id: mealId,
            spice_level: options.spice_level,
            user_id: user_name
          };
          break;
          
        case 'cultural-adaptation':
          endpoint = `/api/customization/cultural-adaptation`;
          requestBody = {
            meal_id: mealId,
            target_cuisine: options.target_cuisine,
            maintain_nutrition: true,
            user_id: user_name
          };
          break;
          
        case 'adjust-time':
          endpoint = `/api/customization/adjust-time`;
          requestBody = {
            meal_id: mealId,
            max_time: options.max_time,
            user_id: user_name
          };
          break;
          
        case 'change-method':
          endpoint = `/api/customization/change-method`;
          requestBody = {
            meal_id: mealId,
            method: options.method,
            user_id: user_name
          };
          break;
          
        case 'adjust-complexity':
          endpoint = `/api/customization/adjust-complexity`;
          requestBody = {
            meal_id: mealId,
            complexity: options.complexity,
            user_id: user_name
          };
          break;
          
        case 'boost-nutrition':
          endpoint = `/api/customization/boost-nutrition`;
          requestBody = {
            meal_id: mealId,
            boost_nutrients: options.boost_nutrients || [],
            user_id: user_name
          };
          break;
          
        case 'batch-cooking':
          endpoint = `/api/customization/batch-cooking`;
          requestBody = {
            meal_id: mealId,
            days: options.days || 3,
            portions_per_day: options.portions_per_day || 2,
            user_id: user_name
          };
          break;
          
        case 'leftover-transformation':
          endpoint = `/api/customization/leftover-transformation`;
          requestBody = {
            meal_id: mealId,
            user_id: user_name
          };
          break;
          
        default:
          throw new Error(`Invalid customization type: ${customizationType}`);
      }
      
      const response = await fetch(`http://localhost:5001${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `API request failed: ${response.status}`);
      }

      // Add this check before parsing JSON
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers.get('content-type'));

      // Check if response has content
      const responseText = await response.text();
      console.log("Raw response text:", responseText);

      let data = null;
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse JSON:', parseError);
          console.error('Response text was:', responseText);
          throw new Error('Invalid JSON response from server');
        }
      } else {
        console.error('Empty response from server');
        throw new Error('No response data from server');
      }

      console.log("=== EDIT INGREDIENTS DEBUG ===");
      console.log("Full response:", data);
      console.log("Response structure check:", {
        hasData: !!data,
        hasStatus: !!data?.status,
        hasDataData: !!data?.data,
        hasDataId: !!data?.data?._id,
        status: data?.status,
        message: data?.message
      });
      console.log("=== END DEBUG ===");

      // Keep all the if/else logic exactly the same:
      if (customizationType === 'regenerate' && data.data) {
        // ... regenerate logic
      } else if (data && data.data && data.data._id) {
        // For other customization endpoints
        setIsGenerating(false);
        setGeneratedMeal({
          _id: data.data._id,
          aiGeneratedMeal: data.data.meal
        });
      } else if (data && data.status === 'success') {
        // Handle successful responses that might not have the expected structure
        setIsGenerating(false);
        // Show success message and reload/refresh the current recipe
        alert(data.message || `${customizationType} completed successfully!`);
        
        // Option: Reload the current recipe to show changes
        // You could fetch the updated recipe here or just show success
      } else {
        console.error("Unexpected response structure:", data);
        throw new Error(`Failed to ${customizationType} - no valid data returned`);
      }
      
      // Handle regenerate specially
      if (customizationType === 'regenerate' && data.data) {
        try {
          // Special handling for regenerate - call the agent endpoint
          const regenerateQuery = data.data.query;
          const originalPrefs = data.data.preferences || {};
          
          // Call the main agent endpoint with regeneration flag
          const agentResponse = await fetch('http://localhost:5001/api/agent/query', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              query: `${regenerateQuery} - Generate a COMPLETELY DIFFERENT recipe from "${data.data.original_title}"`,
              trimester: data.data.trimester,
              dietary_restrictions: originalPrefs.dietary?.join(', ') || '',
              cuisine_preferences: originalPrefs.cuisine?.join(', ') || '',
              allergies: originalPrefs.allergies?.join(', ') || '',
              nutritional_focus: originalPrefs.nutritionalFocus || '',
              user_id: user_name,
              regenerate: true
            })
          });
          
          if (agentResponse.ok) {
            const agentData = await agentResponse.json();
            if (agentData.status === 'success' && agentData.response) {
              // Parse and save the new recipe
              const parsedRecipe = parseRecipeFromResponse(agentData.response);
              
              // Save the regenerated meal
              const saveResponse = await fetch('http://localhost:5001/api/meal/save', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  meal: parsedRecipe,
                  user_id: user_name,
                  meal_type: data.data.meal_type,
                  trimester: data.data.trimester,
                  preferences: originalPrefs
                })
              });
              
              if (saveResponse.ok) {
                const saveData = await saveResponse.json();
                setIsGenerating(false);
                setGeneratedMeal({
                  _id: saveData.meal_id,
                  aiGeneratedMeal: parsedRecipe
                });
                return; // Exit function successfully
              } else {
                throw new Error('Failed to save regenerated meal');
              }
            } else {
              throw new Error('Failed to generate new recipe');
            }
          } else {
            throw new Error('Failed to call agent for regeneration');
          }
        } catch (regenerateError) {
          console.error('Error during regeneration:', regenerateError);
          throw new Error(`Regeneration failed: ${regenerateError.message}`);
        }
      } else if (data && data.data && data.data._id) {
        // For other customization endpoints
        setIsGenerating(false);
        setGeneratedMeal({
          _id: data.data._id,
          aiGeneratedMeal: data.data.meal
        });
      } else if (data && data.status === 'success') {
        // Handle successful responses that might not have the expected structure
        setIsGenerating(false);
        // Refresh the current meal or show success message
        alert(data.message || `${customizationType} completed successfully!`);
      
      } else {
        throw new Error(`Failed to ${customizationType} - no valid data returned`);
      }
      
    } catch (error) {
      console.error(`Error during ${customizationType}:`, error);
      setIsGenerating(false);
      // Show error to user with more context
      alert(`Failed to ${customizationType.replace('-', ' ')}: ${error.message}`);
    }
  };
  // Preference options for dropdowns
  const preferenceOptions = {
    cuisine: [
      "North Indian",
      "South Indian",
      "Indo-Chinese",
      "Gujarati",
      "Bengali",
      "Punjabi",
      "Rajasthani",
      "Maharashtrian",
      "Kerala",
      "Mediterranean",
      "Italian",
      "Mexican",
      "Thai",
      "Japanese",
      "American",
      "No Preference"
    ],
    dietary: [
      "Vegetarian",
      "Vegan",
      "Gluten-Free",
      "Low-Carb",
      "High-Protein",
      "High-Fiber",
      "Low-Sodium",
      "Lactose-Free",
      "No Preference"
    ],
    allergies: [
      "Peanuts",
      "Tree Nuts",
      "Milk",
      "Eggs",
      "Wheat",
      "Soy",
      "Fish",
      "Shellfish",
      "Corn",
      "No Allergies"
    ],
    nutritionalFocus: [
      "High Iron",
      "High Folate",
      "High Calcium",
      "High Fiber",
      "Balanced Nutrition",
      "Energy Boosting",
      "No Specific Focus"
    ],
    trimester: [
      "First Trimester",
      "Second Trimester",
      "Third Trimester"
    ],
    reminders: [
      "Breakfast",
      "Lunch",
      "Snack",
      "Dinner",
      "Dessert"
    ]
  };

  // Dropdown categories with labels and icons
  const dropdowns = [
    {
      key: "cuisine",
      title: "Cuisine Preference",
      icon: "🌍",
      options: preferenceOptions.cuisine,
      isMulti: true,
      color: "from-red-500 to-orange-500"
    },
    {
      key: "dietary",
      title: "Dietary Needs",
      icon: "🥗",
      options: preferenceOptions.dietary,
      isMulti: true,
      color: "from-green-500 to-emerald-500"
    },
    {
      key: "allergies",
      title: "Allergies",
      icon: "⚠️",
      options: preferenceOptions.allergies,
      isMulti: true,
      color: "from-yellow-500 to-amber-500"
    },
    {
      key: "nutritionalFocus",
      title: "Nutrition Focus",
      icon: "💪",
      options: preferenceOptions.nutritionalFocus,
      isMulti: false,
      color: "from-purple-500 to-pink-500"
    },
    {
      key: "trimester",
      title: "Pregnancy Stage",
      icon: "🤱",
      options: preferenceOptions.trimester,
      isMulti: false,
      color: "from-blue-500 to-cyan-500"
    },
    {
      key: "reminders",
      title: "Meal Reminders",
      icon: "⏰",
      options: preferenceOptions.reminders,
      isMulti: true,
      color: "from-indigo-500 to-purple-500"
    }
  ];

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50">
      {/* Modern Header Section */}
      <div className="bg-gradient-to-br from-teal-500 via-blue-600 to-purple-700 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-10 right-20 w-24 h-24 bg-white/5 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white/20 rounded-full blur-lg animate-bounce delay-500"></div>
          <div className="absolute top-10 right-10 w-20 h-20 bg-yellow-300/20 rounded-full blur-lg animate-pulse delay-700"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center p-6 md:p-12 w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-2xl mb-4 leading-tight">
              Smart Pregnancy
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                Meal Planner
              </span>
            </h1>
            <p className="text-xl text-white/90 font-light max-w-2xl mx-auto leading-relaxed mb-6">
              AI-powered nutrition guidance tailored for your pregnancy journey
            </p>
          </div>

          {/* Modern Stats/Features */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl px-6 py-3 text-white border border-white/30 hover:bg-white/30 transition-all">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                <span className="font-semibold">AI-Powered</span>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-md rounded-2xl px-6 py-3 text-white border border-white/30 hover:bg-white/30 transition-all">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌍</span>
                <span className="font-semibold">Cultural Recipes</span>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-md rounded-2xl px-6 py-3 text-white border border-white/30 hover:bg-white/30 transition-all">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤱</span>
                <span className="font-semibold">Pregnancy Safe</span>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-md rounded-2xl px-6 py-3 text-white border border-white/30 hover:bg-white/30 transition-all">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <span className="font-semibold">Instant Results</span>
              </div>
            </div>
          </div>

          {/* Modern Preferences Grid */}
          <div className="w-full max-w-6xl">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Customize Your Meal Experience
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10 relative">
              {dropdowns.map((dropdown, index) => (
                <div key={index} className="relative">
                  <div
                    className="preference-dropdown group bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 cursor-pointer relative z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdown(openDropdown === index ? null : index);
                    }}
                  >
                    {/* Gradient Accent */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${dropdown.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity`}></div>
                    
                    <div className="relative z-20">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{dropdown.icon}</span>
                          <h3 className="font-semibold text-white">{dropdown.title}</h3>
                        </div>
                        <div className="text-white/70 text-sm">
                          {dropdown.isMulti 
                            ? selectedPreferences[dropdown.key]?.length > 0 
                              ? `${selectedPreferences[dropdown.key]?.length} selected` 
                              : 'None'
                            : selectedPreferences[dropdown.key] 
                              ? selectedPreferences[dropdown.key].replace('Trimester', '').trim()
                              : 'Select...'}
                        </div>
                      </div>
                      
                      {/* Selection Preview */}
                      <div className="text-white/60 text-xs">
                        {dropdown.isMulti && selectedPreferences[dropdown.key]?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {selectedPreferences[dropdown.key].slice(0, 2).map((item, idx) => (
                              <span key={idx} className="bg-white/20 px-2 py-1 rounded-full text-xs">
                                {item}
                              </span>
                            ))}
                            {selectedPreferences[dropdown.key].length > 2 && (
                              <span className="text-white/40">+{selectedPreferences[dropdown.key].length - 2} more</span>
                            )}
                          </div>
                        ) : !dropdown.isMulti && selectedPreferences[dropdown.key] ? (
                          <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                            {selectedPreferences[dropdown.key]}
                          </span>
                        ) : (
                          <span className="italic">Click to select preferences</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dropdown - positioned absolutely relative to the container */}
                  {openDropdown === index && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[100] max-h-80 overflow-y-auto">
                      <div className="p-4 space-y-2">
                        {dropdown.options.map((option, idx) => (
                          <div 
                            key={idx} 
                            className="hover:bg-gray-50 rounded-lg p-3 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <label className="flex items-center cursor-pointer text-gray-700">
                              {dropdown.isMulti ? (
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 mr-3"
                                  checked={selectedPreferences[dropdown.key]?.includes(option) || false}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handlePreferenceChange(dropdown.key, option, true);
                                  }}
                                />
                              ) : (
                                <input
                                  type="radio"
                                  name={dropdown.key}
                                  className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500 mr-3"
                                  checked={selectedPreferences[dropdown.key] === option}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handlePreferenceChange(dropdown.key, option, false);
                                  }}
                                />
                              )}
                              <span className="font-medium">{option}</span>
                            </label>
                            
                            {/* Reminder settings */}
                            {dropdown.key === "reminders" && 
                            selectedPreferences.reminders?.includes(option) && (
                              <div className="mt-2 ml-7">
                                <button 
                                  className="text-teal-600 text-sm hover:text-teal-700 font-medium"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveReminder(option);
                                  }}
                                >
                                  Set reminder time →
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modern Generate Button */}
            <div className="text-center">
              <button
                onClick={handleGenerateMeal}
                disabled={isGenerating}
                className={`group relative px-12 py-4 rounded-2xl text-white font-bold text-lg shadow-2xl transition-all duration-300 transform ${
                  isGenerating 
                    ? "bg-gray-500 cursor-not-allowed scale-95" 
                    : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 hover:scale-105 hover:shadow-emerald-500/25"
                }`}
              >
                {/* Button Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
                
                <div className="relative flex items-center justify-center gap-3">
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Generating Recipe...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">✨</span>
                      <span>Generate {selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)} Recipe</span>
                    </>
                  )}
                </div>
              </button>
              
              <p className="text-white/80 mt-4 text-sm">
                Personalized AI-powered recipe based on your preferences
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Reminder Panel */}
      {activeReminder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">⏰</span>
                {activeReminder} Reminder
              </h2>
              <button
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setActiveReminder(null)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={reminderDetails[activeReminder]?.time || ""}
                  onChange={(e) => handleDetailChange(activeReminder, "time", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={reminderDetails[activeReminder]?.date || ""}
                  onChange={(e) => handleDetailChange(activeReminder, "date", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Timezone
                </label>
                <select
                  value={reminderDetails[activeReminder]?.timezone || ""}
                  onChange={(e) => handleDetailChange(activeReminder, "timezone", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">Select Timezone</option>
                  <option value="America/Los_Angeles">Pacific Time (PST)</option>
                  <option value="America/Denver">Mountain Time (MST)</option>
                  <option value="America/Chicago">Central Time (CST)</option>
                  <option value="America/New_York">Eastern Time (EST)</option>
                  <option value="Asia/Kolkata">India Standard Time (IST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="repeatDaily"
                  checked={reminderDetails[activeReminder]?.repeatDaily || false}
                  onChange={(e) => handleDetailChange(activeReminder, "repeatDaily", e.target.checked)}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <label htmlFor="repeatDaily" className="text-gray-700 font-medium cursor-pointer">
                  Repeat Daily
                </label>
              </div>
              
              <button
                className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105"
                onClick={() => setActiveReminder(null)}
              >
                Save Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Generation and Display */}
      {(isGenerating || generatingMealId) && !generatedMeal && (
        <LiveGenerationComponent 
          mealId={generatingMealId}
          onGenerationComplete={handleGenerationComplete}
        />
      )}

      {generatedMeal && generatedMeal.aiGeneratedMeal && (
        <div>
          <RecipeDisplayComponent 
            recipe={generatedMeal.aiGeneratedMeal}
            mealId={generatedMeal._id}
            onCustomize={(type, id, options) => {
              if (type === 'editIngredients') {
                setShowIngredientModal(true);
              } else {
                handleCustomize(type, id, options);
              }
            }}
          />
          
          {/* Navigation Back to Meal Selection */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mt-6 mx-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Want to Generate Another Recipe?
              </h3>
              <p className="text-gray-600 mb-6">
                Choose a different meal type or modify your preferences
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 mb-6">
                {[
                  { name: "Breakfast", icon: "🌅", color: "from-yellow-400 to-orange-500" },
                  { name: "Lunch", icon: "☀️", color: "from-green-400 to-emerald-500" },
                  { name: "Dinner", icon: "🌙", color: "from-purple-500 to-indigo-600" },
                  { name: "Snacks", icon: "🍎", color: "from-pink-400 to-rose-500" },
                  { name: "Dessert", icon: "🍰", color: "from-indigo-400 to-purple-500" }
                ].map((meal, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedMealType(meal.name.toLowerCase());
                      setGeneratedMeal(null);
                    }}
                    className={`group relative bg-white border-2 border-gray-200 hover:border-teal-500 rounded-xl p-4 transition-all duration-300 transform hover:scale-105 ${
                      selectedMealType.toLowerCase() === meal.name.toLowerCase()
                        ? "border-teal-500 bg-teal-50"
                        : ""
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${meal.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity`}></div>
                    <div className="relative text-center">
                      <div className="text-2xl mb-2">{meal.icon}</div>
                      <div className="text-sm font-semibold text-gray-700">{meal.name}</div>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setGeneratedMeal(null)}
                  className="px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  ✨ Generate New Recipe
                </button>
                
                <button
                  onClick={() => setShowHistory(true)}
                  className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  📚 View Recipe History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ingredient Edit Modal */}
      {showIngredientModal && generatedMeal && generatedMeal.aiGeneratedMeal && (
        <IngredientEditModal
          isOpen={showIngredientModal}
          onClose={() => setShowIngredientModal(false)}
          ingredients={generatedMeal.aiGeneratedMeal.ingredients || []}
          onSubmit={handleIngredientEdit}
        />
      )}

      {/* Modern History Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="group bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-blue-500 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity"></div>
          <div className="relative">
            {showHistory ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
        </button>
      </div>

      {/* Modern Recipe History */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 overflow-auto">
          <div className="container mx-auto max-w-6xl px-4 py-10">
            <div className="bg-white rounded-2xl shadow-2xl">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <span className="text-3xl">📚</span>
                  Recipe History
                </h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <RecipeHistoryComponent
                  onSelectRecipe={(meal) => {
                    setGeneratedMeal({
                      _id: meal._id,
                      aiGeneratedMeal: meal.meal
                    });
                    setShowHistory(false);
                  }}
                  userID={localStorage.getItem('user_name') || 'test_user'}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Meal Selection Section */}
      {!generatedMeal && !isGenerating && !generatingMealId && (
        <div className="flex-grow bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex flex-col justify-center items-center text-gray-800 w-full py-20">
          <div className="max-w-6xl w-full px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Choose Your Meal Type
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Select the meal you'd like to generate a personalized recipe for
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[
                { name: "Breakfast", icon: "🌅", color: "from-yellow-400 to-orange-500" },
                { name: "Lunch", icon: "☀️", color: "from-green-400 to-emerald-500" },
                { name: "Dinner", icon: "🌙", color: "from-purple-500 to-indigo-600" },
                { name: "Snacks", icon: "🍎", color: "from-pink-400 to-rose-500" },
                { name: "Dessert", icon: "🍰", color: "from-indigo-400 to-purple-500" }
              ].map((meal, index) => (
                <div 
                  key={index}
                  className={`group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    selectedMealType.toLowerCase() === meal.name.toLowerCase()
                      ? "ring-4 ring-teal-500 scale-105"
                      : ""
                  }`}
                  onClick={() => handleMealTypeSelect(meal.name.toLowerCase())}
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${meal.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity`}></div>
                  
                  <div className="relative text-center">
                    <div className="text-4xl mb-4">{meal.icon}</div>
                    <h3 className={`text-xl font-bold mb-2 ${
                      selectedMealType.toLowerCase() === meal.name.toLowerCase()
                        ? "text-teal-600"
                        : "text-gray-800 group-hover:text-gray-900"
                    }`}>
                      {meal.name}
                    </h3>
                    
                    {selectedMealType.toLowerCase() === meal.name.toLowerCase() && (
                      <div className="mt-3">
                        <span className="bg-teal-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          Selected
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DailyMealPlan;