// src/components/RecipeCustomizationPanel.js
import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './RecipeCustomizationPanel.css';

const RecipeCustomizationPanel = ({ recipe, mealId, onCustomize, onClose }) => {
  const [activeTab, setActiveTab] = useState('quick');
  const [customizing, setCustomizing] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [customizationLoading, setCustomizationLoading] = useState({});

  // Customization categories with icons and descriptions
  const customizationCategories = {
    quick: {
      title: "Quick Actions",
      icon: "⚡",
      color: "from-purple-500 to-pink-500",
      options: [
        {
          id: 'regenerate',
          title: 'Regenerate Recipe',
          icon: '🔄',
          description: 'Get a completely new recipe with same preferences',
          action: 'regenerate'
        },
        {
          id: 'leftover',
          title: 'Leftover Magic',
          icon: '✨',
          description: 'Transform this into tomorrow\'s meal',
          action: 'leftover-transformation'
        }
      ]
    },
    taste: {
      title: "Taste & Flavor",
      icon: "🌶️",
      color: "from-red-500 to-orange-500",
      options: [
        {
          id: 'spice',
          title: 'Spice Level',
          icon: '🔥',
          description: 'Adjust the heat to your comfort',
          type: 'select',
          choices: [
            { value: 'none', label: 'No Spice', emoji: '🥛' },
            { value: 'mild', label: 'Mild', emoji: '🌶️' },
            { value: 'medium', label: 'Medium', emoji: '🌶️🌶️' },
            { value: 'hot', label: 'Hot', emoji: '🌶️🌶️🌶️' }
          ]
        },
        {
          id: 'culture',
          title: 'Cultural Style',
          icon: '🌍',
          description: 'Transform to different cuisine',
          type: 'select',
          choices: [
            { value: 'Indian', label: 'Indian', flag: '🇮🇳' },
            { value: 'Chinese', label: 'Chinese', flag: '🇨🇳' },
            { value: 'Italian', label: 'Italian', flag: '🇮🇹' },
            { value: 'Mexican', label: 'Mexican', flag: '🇲🇽' },
            { value: 'Thai', label: 'Thai', flag: '🇹🇭' },
            { value: 'Mediterranean', label: 'Mediterranean', flag: '🇬🇷' }
          ]
        }
      ]
    },
    time: {
      title: "Time & Effort",
      icon: "⏰",
      color: "from-blue-500 to-cyan-500",
      options: [
        {
          id: 'cookingTime',
          title: 'Cooking Time',
          icon: '⏱️',
          description: 'How much time do you have?',
          type: 'slider',
          min: 15,
          max: 120,
          step: 15,
          unit: 'minutes',
          presets: [
            { value: 15, label: 'Quick' },
            { value: 30, label: 'Standard' },
            { value: 60, label: 'Relaxed' }
          ]
        },
        {
          id: 'complexity',
          title: 'Complexity',
          icon: '👩‍🍳',
          description: 'Match your cooking mood',
          type: 'cards',
          choices: [
            { 
              value: 'simple', 
              label: 'Simple', 
              emoji: '🥄',
              details: '5-7 ingredients, minimal prep'
            },
            { 
              value: 'moderate', 
              label: 'Moderate', 
              emoji: '🍳',
              details: 'Standard cooking, some technique'
            },
            { 
              value: 'elaborate', 
              label: 'Elaborate', 
              emoji: '👨‍🍳',
              details: 'Complex, impressive results'
            }
          ]
        }
      ]
    },
    method: {
      title: "Cooking Method",
      icon: "🔥",
      color: "from-amber-500 to-yellow-500",
      options: [
        {
          id: 'cookingMethod',
          title: 'How to Cook',
          icon: '🍳',
          description: 'Choose your preferred equipment',
          type: 'grid',
          choices: [
            { value: 'stovetop', label: 'Stovetop', icon: '🔥', color: 'bg-orange-100' },
            { value: 'oven', label: 'Oven', icon: '🥘', color: 'bg-red-100' },
            { value: 'pressure_cooker', label: 'Instant Pot', icon: '🏺', color: 'bg-purple-100' },
            { value: 'microwave', label: 'Microwave', icon: '📡', color: 'bg-blue-100' },
            { value: 'no_cook', label: 'No Cook', icon: '🥗', color: 'bg-green-100' }
          ]
        }
      ]
    },
    nutrition: {
      title: "Nutrition Boost",
      icon: "💪",
      color: "from-green-500 to-emerald-500",
      options: [
        {
          id: 'nutritionBoost',
          title: 'Boost Nutrients',
          icon: '🥬',
          description: 'Maximize specific nutrients for pregnancy',
          type: 'multiselect',
          choices: [
            { value: 'iron', label: 'Iron', icon: '🩸', benefit: 'Prevents anemia' },
            { value: 'calcium', label: 'Calcium', icon: '🦴', benefit: 'Bone development' },
            { value: 'protein', label: 'Protein', icon: '💪', benefit: 'Baby growth' },
            { value: 'folate', label: 'Folate', icon: '🌿', benefit: 'Neural development' },
            { value: 'fiber', label: 'Fiber', icon: '🌾', benefit: 'Digestive health' }
          ]
        },
        {
          id: 'batchCooking',
          title: 'Meal Prep Mode',
          icon: '📦',
          description: 'Cook once, eat multiple times',
          type: 'custom',
          component: 'BatchCookingSelector'
        }
      ]
    }
  };

  // Track which customization is loading
  const handleCustomization = async (action, options = {}) => {
    setCustomizing(true);
    setCustomizationLoading({ ...customizationLoading, [action]: true });
    try {
      await onCustomize(action, mealId, options);
      // Close the panel after successful customization
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Customization error:', error);
    } finally {
      setCustomizing(false);
      setCustomizationLoading({ ...customizationLoading, [action]: false });
    }
  };

  const renderOption = (option) => {
    const isLoading = customizationLoading[option.id || option.action];
    
    switch (option.type) {
      case 'select':
        return (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {option.choices.map((choice) => (
                <motion.button
                  key={choice.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isLoading}
                  onClick={() => {
                    setSelectedOptions({ ...selectedOptions, [option.id]: choice.value });
                    handleCustomization(option.id === 'spice' ? 'adjust-spice' : 'cultural-adaptation', {
                      [option.id === 'spice' ? 'spice_level' : 'target_cuisine']: choice.value,
                      meal_id: mealId
                    });
                  }}
                  className={`px-4 py-2 rounded-full flex items-center gap-2 transition-all ${
                    selectedOptions[option.id] === choice.value
                      ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 hover:bg-gray-200'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="text-lg">{choice.emoji || choice.flag}</span>
                  <span className="font-medium">{choice.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 'slider':
        const sliderValue = selectedOptions[option.id] || option.min;
        return (
          <div className="space-y-4">
            <div className="relative pt-8">
              <input
                type="range"
                min={option.min}
                max={option.max}
                step={option.step}
                value={sliderValue}
                onChange={(e) => setSelectedOptions({ ...selectedOptions, [option.id]: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${
                    ((sliderValue - option.min) / (option.max - option.min)) * 100
                  }%, #e5e7eb ${
                    ((sliderValue - option.min) / (option.max - option.min)) * 100
                  }%, #e5e7eb 100%)`
                }}
              />
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-sm">
                {sliderValue} {option.unit}
              </div>
            </div>
            <div className="flex justify-between">
              {option.presets.map((preset) => (
                <button
                  key={preset.value}
                  disabled={isLoading}
                  onClick={() => {
                    setSelectedOptions({ ...selectedOptions, [option.id]: preset.value });
                    handleCustomization('adjust-time', { max_time: preset.value, meal_id: mealId });
                  }}
                  className={`text-sm text-gray-600 hover:text-teal-600 transition ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'cards':
        return (
          <div className="grid grid-cols-3 gap-3">
            {option.choices.map((choice) => (
              <motion.div
                key={choice.value}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (!isLoading) {
                    setSelectedOptions({ ...selectedOptions, [option.id]: choice.value });
                    handleCustomization('adjust-complexity', { complexity: choice.value, meal_id: mealId });
                  }
                }}
                className={`p-4 rounded-xl cursor-pointer transition-all ${
                  selectedOptions[option.id] === choice.value
                    ? 'bg-gradient-to-br from-teal-500 to-blue-500 text-white shadow-lg'
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-3xl mb-2 text-center">{choice.emoji}</div>
                <div className="font-semibold text-center">{choice.label}</div>
                <div className="text-xs mt-1 opacity-80 text-center">{choice.details}</div>
              </motion.div>
            ))}
          </div>
        );

      case 'grid':
        return (
          <div className="grid grid-cols-3 gap-3">
            {option.choices.map((choice) => (
              <motion.button
                key={choice.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isLoading}
                onClick={() => {
                  setSelectedOptions({ ...selectedOptions, [option.id]: choice.value });
                  handleCustomization('change-method', { method: choice.value, meal_id: mealId });
                }}
                className={`p-4 rounded-lg transition-all ${
                  selectedOptions[option.id] === choice.value
                    ? 'ring-2 ring-teal-500 shadow-md'
                    : ''
                } ${choice.color} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-2xl mb-1">{choice.icon}</div>
                <div className="text-sm font-medium">{choice.label}</div>
              </motion.button>
            ))}
          </div>
        );

      case 'multiselect':
        const selected = selectedOptions[option.id] || [];
        return (
          <div className="space-y-2">
            {option.choices.map((choice) => (
              <motion.div
                key={choice.value}
                whileHover={{ x: 5 }}
                onClick={() => {
                  if (!isLoading) {
                    const newSelected = selected.includes(choice.value)
                      ? selected.filter(v => v !== choice.value)
                      : [...selected, choice.value];
                    setSelectedOptions({ ...selectedOptions, [option.id]: newSelected });
                  }
                }}
                className={`p-3 rounded-lg cursor-pointer flex items-center justify-between transition-all ${
                  selected.includes(choice.value)
                    ? 'bg-teal-50 border-2 border-teal-500'
                    : 'bg-gray-50 border-2 border-transparent hover:border-gray-300'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{choice.icon}</span>
                  <div>
                    <div className="font-medium">{choice.label}</div>
                    <div className="text-xs text-gray-600">{choice.benefit}</div>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  selected.includes(choice.value)
                    ? 'bg-teal-500 border-teal-500'
                    : 'border-gray-300'
                }`}>
                  {selected.includes(choice.value) && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </motion.div>
            ))}
            {selected.length > 0 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                disabled={isLoading}
                onClick={() => handleCustomization('boost-nutrition', { boost_nutrients: selected, meal_id: mealId })}
                className={`w-full mt-3 py-2 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg transition ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Boosting Nutrients...' : 'Boost Selected Nutrients'}
              </motion.button>
            )}
          </div>
        );

      case 'custom':
        if (option.component === 'BatchCookingSelector') {
          return <BatchCookingSelector mealId={mealId} onCustomize={handleCustomization} />;
        }
        return null;

      default:
        return (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isLoading}
            onClick={() => handleCustomization(option.action, { meal_id: mealId })}
            className={`w-full py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg transition ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Processing...' : option.title}
          </motion.button>
        );
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500 to-blue-500 p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold mb-2">Customize Your Recipe</h2>
                <p className="text-teal-100">{recipe?.title || 'Personalize this meal to your taste'}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex overflow-x-auto bg-gray-50 px-4 py-2 gap-2">
            {Object.entries(customizationCategories).map(([key, category]) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  activeTab === key
                    ? 'bg-white shadow-md text-gray-800'
                    : 'text-gray-600 hover:bg-white hover:shadow-sm'
                }`}
              >
                <span className="text-lg">{category.icon}</span>
                <span className="font-medium">{category.title}</span>
              </motion.button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {customizing ? (
              <div className="flex flex-col items-center justify-center py-20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full"
                />
                <p className="mt-4 text-gray-600">Customizing your recipe...</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {customizationCategories[activeTab].options.map((option) => (
                    <motion.div
                      key={option.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-50 rounded-xl p-5"
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <span className="text-3xl">{option.icon}</span>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{option.title}</h3>
                          <p className="text-gray-600 text-sm">{option.description}</p>
                        </div>
                      </div>
                      {renderOption(option)}
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Batch Cooking Selector Component
const BatchCookingSelector = ({ mealId, onCustomize }) => {
  const [days, setDays] = useState(3);
  const [portions, setPortions] = useState(2);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Days to Prep</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDays(Math.max(1, days - 1))}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
            >
              -
            </button>
            <span className="text-2xl font-bold w-8 text-center">{days}</span>
            <button
              onClick={() => setDays(Math.min(7, days + 1))}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Portions/Day</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPortions(Math.max(1, portions - 1))}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
            >
              -
            </button>
            <span className="text-2xl font-bold w-8 text-center">{portions}</span>
            <button
              onClick={() => setPortions(Math.min(4, portions + 1))}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>
      </div>
      <div className="bg-teal-50 p-3 rounded-lg">
        <p className="text-sm text-teal-800">
          Total: <span className="font-bold">{days * portions} portions</span> for {days} days
        </p>
      </div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onCustomize('batch-cooking', { days, portions_per_day: portions, meal_id: mealId })}
        className="w-full py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg transition"
      >
        Scale Recipe for Meal Prep
      </motion.button>
    </div>
  );
};

export default memo(RecipeCustomizationPanel);