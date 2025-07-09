// src/components/RecipeCustomizationTest.js
import React, { useState, useEffect } from 'react';
import RecipeService from '../services/recipeService';
import { useRecipeCustomization } from '../hooks/useRecipeCustomization';

const RecipeCustomizationTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [testing, setTesting] = useState(false);
  const { customizationOptions, loadCustomizationOptions } = useRecipeCustomization();
  
  // Test meal data
  const testMeal = {
    _id: 'test_meal_123',
    aiGeneratedMeal: {
      title: 'Test Recipe',
      servings: 2,
      ingredients: ['* 1 cup rice', '* 2 cups water'],
      instructions: 'Test instructions',
      nutritionalValues: {
        Calories: '300 kcal',
        Protein: '10g'
      }
    }
  };

  useEffect(() => {
    loadCustomizationOptions();
  }, [loadCustomizationOptions]);

  const runAllTests = async () => {
    setTesting(true);
    setTestResults([]);
    
    const tests = [
      { name: 'Spice Level Adjustment', type: 'adjust-spice', options: { spice_level: 'medium' } },
      { name: 'Cultural Adaptation', type: 'cultural-adaptation', options: { target_cuisine: 'Italian' } },
      { name: 'Cooking Time', type: 'adjust-time', options: { max_time: 30 } },
      { name: 'Cooking Method', type: 'change-method', options: { method: 'pressure_cooker' } },
      { name: 'Complexity', type: 'adjust-complexity', options: { complexity: 'simple' } },
      { name: 'Nutrition Boost', type: 'boost-nutrition', options: { boost_nutrients: ['iron', 'calcium'] } },
      { name: 'Batch Cooking', type: 'batch-cooking', options: { days: 3, portions_per_day: 2 } },
      { name: 'Leftover Transform', type: 'leftover-transformation', options: {} }
    ];

    for (const test of tests) {
      try {
        console.log(`Running test: ${test.name}`);
        const result = await RecipeService[test.type.replace(/-/g, '')](testMeal._id, ...Object.values(test.options));
        setTestResults(prev => [...prev, { ...test, status: 'success', result }]);
      } catch (error) {
        setTestResults(prev => [...prev, { ...test, status: 'error', error: error.message }]);
      }
    }
    
    setTesting(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Recipe Customization Test Suite</h2>
      
      {/* Customization Options Display */}
      {customizationOptions && (
        <div className="mb-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Available Customization Options:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(customizationOptions, null, 2)}
          </pre>
        </div>
      )}
      
      {/* Test Button */}
      <button
        onClick={runAllTests}
        disabled={testing}
        className="mb-6 px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:bg-gray-400"
      >
        {testing ? 'Running Tests...' : 'Run All Customization Tests'}
      </button>
      
      {/* Test Results */}
      <div className="space-y-4">
        {testResults.map((result, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${
              result.status === 'success' ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold">{result.name}</span>
              <span className={`text-sm ${
                result.status === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {result.status === 'success' ? '✓ Success' : '✗ Failed'}
              </span>
            </div>
            {result.error && (
              <p className="text-sm text-red-600 mt-2">Error: {result.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecipeCustomizationTest;