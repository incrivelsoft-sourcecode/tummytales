// src/components/RecipeDisplayComponent.js
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RecipeCustomizationPanel from './RecipeCustomizationPanel';



const parseMarkdownRecipe = (markdownText) => {
  if (!markdownText || typeof markdownText !== 'string') {
    return null;
  }

  console.log("=== DEBUGGING MARKDOWN PARSING ===");
  console.log("Raw markdown:", markdownText.substring(0, 500) + "...");

  const lines = markdownText.split('\n');
  const recipe = {
    title: '',
    ingredients: [],
    instructions: '',
    nutritionalValues: {},
    'Pregnancy-Safe Notes': '',
    'Substitution Options': ''
  };

  let currentSection = '';
  let instructionText = '';
  let notesText = '';
  let substitutionText = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Extract title (starts with #)
    if (line.startsWith('# ') && !recipe.title) {
      recipe.title = line.substring(2).trim();
      continue;
    }
    
    // Detect sections
    if (line.startsWith('## Ingredients')) {
      currentSection = 'ingredients';
      console.log("Found ingredients section");
      continue;
    } else if (line.startsWith('## Instructions')) {
      currentSection = 'instructions';
      console.log("Found instructions section");
      continue;
    } else if (line.startsWith('## Nutritional Values')) {
      currentSection = 'nutrition';
      continue;
    } else if (line.startsWith('## Pregnancy-Safe Notes')) {
      currentSection = 'pregnancy-notes';
      continue;
    } else if (line.startsWith('## Substitution Options')) {
      currentSection = 'substitution';
      continue;
    }
    
    // Debug ingredients parsing
    if (currentSection === 'ingredients') {
      console.log(`Ingredients line: "${line}"`);
      
      if (!line.trim()) {
        console.log("Skipping empty line");
        continue;
      }
      
      if (line.match(/^\*\*.*:\*\*$/)) {
        console.log("Skipping bold header:", line);
        continue;
      }
      
      if (line.startsWith('### ')) {
        console.log("Skipping ### header:", line);
        continue;
      }
      
      if (line.match(/^\*.*:\*\*$/)) {
        console.log("Skipping section header:", line);
        continue;
      }
      
      if (line.startsWith('* ')) {
        console.log("Adding ingredient:", line.substring(2).trim());
        recipe.ingredients.push(line.substring(2).trim());
      } else {
        console.log("Not processing line:", line);
      }
    }
    
    // Rest of parsing logic...
    else if (currentSection === 'instructions' && line.match(/^\d+\./)) {
      const cleanedLine = line.replace(/\*\*(.*?)\*\*/g, '$1');
      instructionText += cleanedLine + '\n';
    } else if (currentSection === 'nutrition' && line.startsWith('- **')) {
      const match = line.match(/- \*\*(.+?):\*\* (.+)/);
      if (match) {
        recipe.nutritionalValues[match[1]] = match[2];
      }
    } else if (currentSection === 'pregnancy-notes' && line.startsWith('• ')) {
      const cleanedNote = line.substring(2).trim().replace(/\*\*(.*?)\*\*/g, '$1');
      notesText += cleanedNote + '\n';
    } else if (currentSection === 'substitution' && line.startsWith('• ')) {
      const cleanedOption = line.substring(2).trim().replace(/\*\*(.*?)\*\*/g, '$1');
      substitutionText += cleanedOption + '\n';
    }
  }
  
  recipe.instructions = instructionText.trim();
  recipe['Pregnancy-Safe Notes'] = notesText.trim();
  recipe['Substitution Options'] = substitutionText.trim();
  
  console.log("Final ingredients:", recipe.ingredients);
  console.log("=== END DEBUG ===");
  
  return recipe;
};

const RecipeDisplayComponent = ({ recipe: rawRecipe, mealId, onCustomize }) => {
  const [servingsCount, setServingsCount] = useState(2);
  const [showCustomizationPanel, setShowCustomizationPanel] = useState(false);
  const [activeSection, setActiveSection] = useState('ingredients');
  
  // Parse the recipe if it's markdown text
  const recipe = React.useMemo(() => {
    if (typeof rawRecipe === 'string') {
      return parseMarkdownRecipe(rawRecipe);
    }
    return rawRecipe;
  }, [rawRecipe]);
  
  if (!recipe) return null;

  const handleRegenerateClick = () => {
    if (onCustomize) {
      onCustomize('regenerate', mealId);
    }
  };

  const handleEditIngredientsClick = () => {
    if (onCustomize) {
      onCustomize('editIngredients', mealId);
    }
  };

  const handleAdjustPortionsClick = () => {
    if (onCustomize) {
      onCustomize('adjustPortions', mealId, { servings: servingsCount });
    }
  };

  const handleCustomizationPanelAction = async (action, mealId, options) => {
    // Map the customization panel actions to the existing API endpoints
    const actionMap = {
      'regenerate': 'regenerate',
      'leftover-transformation': 'leftover-transformation',
      'adjust-spice': 'adjust-spice',
      'cultural-adaptation': 'cultural-adaptation',
      'adjust-time': 'adjust-time',
      'change-method': 'change-method',
      'adjust-complexity': 'adjust-complexity',
      'boost-nutrition': 'boost-nutrition',
      'batch-cooking': 'batch-cooking'
    };

    const mappedAction = actionMap[action] || action;
    
    if (onCustomize) {
      onCustomize(mappedAction, mealId, options);
    }
  };

  // Parse nutritional values for visual display
  const nutritionData = recipe.nutritionalValues ? Object.entries(recipe.nutritionalValues).map(([key, value]) => ({
    name: key,
    value: value,
    icon: {
      'Calories': '🔥',
      'Protein': '💪',
      'Carbohydrates': '🌾',
      'Fat': '🥑',
      'Fiber': '🥦',
      'Calcium': '🦴',
      'Iron': '🩸'
    }[key] || '📊'
  })) : [];

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl max-w-6xl mx-auto my-8 overflow-hidden"
      >
        {/* Hero Section with Recipe Title */}
        <div className="relative h-64 bg-gradient-to-br from-teal-400 via-blue-500 to-purple-600 p-8">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-bold text-white mb-2"
              >
                {recipe.title}
              </motion.h1>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-4 text-white/90"
              >
                {recipe.cooking_time && (
                  <span className="flex items-center gap-1">
                    <span>⏱️</span> {recipe.cooking_time}
                  </span>
                )}
                {recipe.difficulty_level && (
                  <span className="flex items-center gap-1">
                    <span>👩‍🍳</span> {recipe.difficulty_level}
                  </span>
                )}
                {recipe.spice_level && (
                  <span className="flex items-center gap-1">
                    <span>🌶️</span> {recipe.spice_level}
                  </span>
                )}
              </motion.div>
            </div>
            
            {/* Floating Action Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCustomizationPanel(true)}
              className="self-end bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-full font-medium hover:bg-white/30 transition-all flex items-center gap-2"
            >
              <span>✨</span> Customize Recipe
            </motion.button>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="bg-gray-50 px-8 py-4 flex flex-wrap gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRegenerateClick}
            className="px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2"
          >
            <span>🔄</span> Regenerate
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEditIngredientsClick}
            className="px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2"
          >
            <span>✏️</span> Edit Ingredients
          </motion.button>

          <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm px-4 py-2">
            <span>🍽️</span>
            <button 
              onClick={() => setServingsCount(Math.max(1, servingsCount - 1))}
              className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
            >
              -
            </button>
            <span className="font-medium w-8 text-center">{servingsCount}</span>
            <button 
              onClick={() => setServingsCount(servingsCount + 1)}
              className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
            >
              +
            </button>
            <button
              onClick={handleAdjustPortionsClick}
              className="ml-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              Update
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex">
            {['ingredients', 'instructions', 'nutrition', 'notes'].map((section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`px-6 py-3 font-medium capitalize transition-all relative ${
                  activeSection === section
                    ? 'text-teal-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {section}
                {activeSection === section && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            {activeSection === 'ingredients' && (
              <motion.div
                key="ingredients"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-semibold mb-4">Ingredients</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {recipe.ingredients && recipe.ingredients.map((ingredient, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <span className="text-lg">🥄</span>
                      <span className="text-gray-700">{ingredient}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeSection === 'instructions' && (
              <motion.div
                key="instructions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-semibold mb-4">Instructions</h3>
                <div className="space-y-3">
                  {recipe.instructions.split(/\d+\./).filter(Boolean).map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex gap-4"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 leading-relaxed">{step.trim()}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeSection === 'nutrition' && (
              <motion.div
                key="nutrition"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-semibold mb-4">Nutritional Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {nutritionData.map((nutrient, index) => (
                    <motion.div
                      key={nutrient.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 text-center"
                    >
                      <div className="text-3xl mb-2">{nutrient.icon}</div>
                      <div className="font-semibold text-gray-800">{nutrient.name}</div>
                      <div className="text-gray-600 text-sm">{nutrient.value}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeSection === 'notes' && (
              <motion.div
                key="notes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <span>✅</span> Pregnancy-Safe Notes
                  </h4>
                  <div className="text-green-700">
                    {recipe["Pregnancy-Safe Notes"] && recipe["Pregnancy-Safe Notes"].split('\n').filter(note => note.trim()).map((note, index) => (
                      <div key={index} className="mb-2 flex items-center gap-2">
                        <span className="text-green-600 flex-shrink-0">•</span>
                        <span>{note.replace(/^[•\-*]\s*/, '').trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <span>💡</span> Substitution Options
                  </h4>
                  <div className="text-blue-700">
                    {recipe["Substitution Options"] && recipe["Substitution Options"].split('\n').filter(option => option.trim()).map((option, index) => (
                      <div key={index} className="mb-2 flex items-center gap-2">
                        <span className="text-blue-600 flex-shrink-0">•</span>
                        <span>{option.replace(/^[•\-*]\s*/, '').trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Action Bar */}
        <div className="bg-gray-50 px-8 py-4 flex justify-center gap-4 border-t">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition flex items-center gap-2"
          >
            <span>💾</span> Save Recipe
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition flex items-center gap-2"
          >
            <span>🖨️</span> Print
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition flex items-center gap-2"
          >
            <span>📤</span> Share
          </motion.button>
        </div>
      </motion.div>

      {/* Customization Panel */}
      {showCustomizationPanel && (
        <RecipeCustomizationPanel
          recipe={recipe}
          mealId={mealId}
          onCustomize={handleCustomizationPanelAction}
          onClose={() => setShowCustomizationPanel(false)}
        />
      )}
    </>
  );
};

export default RecipeDisplayComponent;