import React, { useState, useEffect } from 'react';

const IngredientEditModal = ({ isOpen, onClose, ingredients, onSubmit }) => {
  const [selectedIngredients, setSelectedIngredients] = useState({});
  const [replacements, setReplacements] = useState({});
  const [replacementModes, setReplacementModes] = useState({}); // 'manual' or 'ai'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedIngredients({});
      setReplacements({});
      setReplacementModes({});
      setSearchTerm('');
    }
  }, [isOpen]);

  const handleIngredientToggle = (ingredient) => {
    setSelectedIngredients(prev => ({
      ...prev,
      [ingredient]: !prev[ingredient]
    }));
    
    // If unchecking, remove from replacements and modes
    if (selectedIngredients[ingredient]) {
      setReplacements(prev => {
        const newReplacements = { ...prev };
        delete newReplacements[ingredient];
        return newReplacements;
      });
      setReplacementModes(prev => {
        const newModes = { ...prev };
        delete newModes[ingredient];
        return newModes;
      });
    } else {
      // Default to AI mode when selecting
      setReplacementModes(prev => ({
        ...prev,
        [ingredient]: 'ai'
      }));
    }
  };

  const handleReplacementModeChange = (ingredient, mode) => {
    setReplacementModes(prev => ({
      ...prev,
      [ingredient]: mode
    }));
    
    // Clear manual replacement if switching to AI
    if (mode === 'ai') {
      setReplacements(prev => ({
        ...prev,
        [ingredient]: ''
      }));
    }
  };

  const handleReplacementChange = (ingredient, replacement) => {
    setReplacements(prev => ({
      ...prev,
      [ingredient]: replacement
    }));
  };

  const handleSubmit = () => {
    // Build replacements object based on selected ingredients and their modes
    const finalReplacements = {};
    const aiReplacements = [];
    
    Object.keys(selectedIngredients).forEach(ingredient => {
      if (selectedIngredients[ingredient]) {
        const mode = replacementModes[ingredient];
        
        if (mode === 'ai') {
          aiReplacements.push(ingredient);
        } else if (mode === 'manual' && replacements[ingredient]?.trim()) {
          finalReplacements[ingredient] = replacements[ingredient].trim();
        }
      }
    });

    if (Object.keys(finalReplacements).length === 0 && aiReplacements.length === 0) {
      alert('Please select ingredients to replace and specify how to replace them.');
      return;
    }

    // Check if manual replacements are specified when needed
    const manualIngredientsWithoutReplacement = Object.keys(selectedIngredients).filter(ingredient => 
      selectedIngredients[ingredient] && 
      replacementModes[ingredient] === 'manual' && 
      !replacements[ingredient]?.trim()
    );

    if (manualIngredientsWithoutReplacement.length > 0) {
      alert(`Please specify replacements for: ${manualIngredientsWithoutReplacement.join(', ')}`);
      return;
    }

    onSubmit({ 
      replacements: finalReplacements,
      aiReplacements: aiReplacements
    });
  };

  const filteredIngredients = ingredients.filter(ingredient =>
    ingredient.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const commonReplacements = {
    'chicken': ['tofu', 'tempeh', 'lentils', 'chickpeas', 'turkey'],
    'beef': ['lentils', 'mushrooms', 'tofu', 'tempeh', 'turkey'],
    'milk': ['almond milk', 'coconut milk', 'oat milk', 'soy milk'],
    'butter': ['olive oil', 'coconut oil', 'avocado oil', 'vegan butter'],
    'wheat flour': ['almond flour', 'coconut flour', 'rice flour', 'oat flour'],
    'sugar': ['honey', 'maple syrup', 'stevia', 'monk fruit sweetener'],
    'eggs': ['flax eggs', 'chia eggs', 'aquafaba', 'banana'],
    'cheese': ['nutritional yeast', 'cashew cheese', 'vegan cheese', 'tahini']
  };

  const getSuggestions = (ingredient) => {
    const lowerIngredient = ingredient.toLowerCase();
    for (const [key, suggestions] of Object.entries(commonReplacements)) {
      if (lowerIngredient.includes(key)) {
        return suggestions;
      }
    }
    return [];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Edit Ingredients</h2>
              <p className="text-teal-100">Select ingredients to replace and choose how to replace them</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search ingredients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Ingredients List */}
          <div className="space-y-4">
            {filteredIngredients.map((ingredient, index) => {
              const isSelected = selectedIngredients[ingredient];
              const mode = replacementModes[ingredient] || 'ai';
              const suggestions = getSuggestions(ingredient);
              
              return (
                <div
                  key={index}
                  className={`border rounded-xl p-4 transition-all duration-200 ${
                    isSelected ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Ingredient Selection */}
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id={`ingredient-${index}`}
                      checked={isSelected}
                      onChange={() => handleIngredientToggle(ingredient)}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <label
                      htmlFor={`ingredient-${index}`}
                      className="ml-3 text-gray-700 font-medium cursor-pointer flex-1"
                    >
                      {ingredient}
                    </label>
                  </div>

                  {/* Replacement Options */}
                  {isSelected && (
                    <div className="ml-7 space-y-4">
                      {/* Mode Selection */}
                      <div className="flex gap-4">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`mode-${index}`}
                            value="ai"
                            checked={mode === 'ai'}
                            onChange={() => handleReplacementModeChange(ingredient, 'ai')}
                            className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 flex items-center">
                            <span className="text-lg mr-1">🤖</span>
                            Let AI choose replacement
                          </span>
                        </label>
                        
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`mode-${index}`}
                            value="manual"
                            checked={mode === 'manual'}
                            onChange={() => handleReplacementModeChange(ingredient, 'manual')}
                            className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 flex items-center">
                            <span className="text-lg mr-1">✏️</span>
                            I'll specify replacement
                          </span>
                        </label>
                      </div>

                      {/* AI Mode Info */}
                      {mode === 'ai' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center">
                            <span className="text-blue-600 text-sm">🤖</span>
                            <span className="ml-2 text-sm text-blue-700">
                              AI will choose a pregnancy-safe, nutritionally similar replacement
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Manual Replacement Input */}
                      {mode === 'manual' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Replace with:
                            </label>
                            <input
                              type="text"
                              placeholder="Enter replacement ingredient..."
                              value={replacements[ingredient] || ''}
                              onChange={(e) => handleReplacementChange(ingredient, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                          </div>

                          {/* Suggestions */}
                          {suggestions.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-600 mb-2">Quick suggestions:</p>
                              <div className="flex flex-wrap gap-2">
                                {suggestions.map((suggestion, suggestionIndex) => (
                                  <button
                                    key={suggestionIndex}
                                    onClick={() => handleReplacementChange(ingredient, suggestion)}
                                    className="px-3 py-1 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded-full text-sm transition-colors"
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredIngredients.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p>No ingredients found matching "{searchTerm}"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {Object.keys(selectedIngredients).filter(key => selectedIngredients[key]).length} ingredients selected
              {Object.keys(selectedIngredients).filter(key => selectedIngredients[key] && replacementModes[key] === 'ai').length > 0 && (
                <span className="ml-2 text-blue-600">
                  ({Object.keys(selectedIngredients).filter(key => selectedIngredients[key] && replacementModes[key] === 'ai').length} AI replacements)
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={Object.keys(selectedIngredients).filter(key => selectedIngredients[key]).length === 0}
                className="px-6 py-2 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Update Recipe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IngredientEditModal;