// src/components/LiveGenerationComponent.js
import React, { useState, useEffect, useCallback } from 'react';

const LiveGenerationComponent = ({ mealId, onGenerationComplete }) => {
  const [status, setStatus] = useState('generating');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [recipe, setRecipe] = useState(null);
  
  // Polling interval in milliseconds
  const POLLING_INTERVAL = 2000;
  // Messages to show during generation
  const generationMessages = [
    "Finding nutritious ingredients...",
    "Considering pregnancy safety...",
    "Balancing nutritional values...",
    "Creating delicious combinations...",
    "Preparing recipe instructions...",
    "Adding pregnancy-specific information...",
    "Almost there..."
  ];
  const [messageIndex, setMessageIndex] = useState(0);

  // Use useCallback to memoize the function
  const checkGenerationStatus = useCallback(async () => {
    try {
      // Get the user name from local storage or state management
      const user_name = localStorage.getItem('user_name') || 'test_user';
      
      const response = await fetch(`http://localhost:6001/ai/meal/status/${mealId}?user_name=${user_name}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'completed' && data.data && data.data.aiGeneratedMeal) {
        setStatus('completed');
        setProgress(100);
        setRecipe(data.data.aiGeneratedMeal);
        // Notify parent component that generation is complete
        if (onGenerationComplete) {
          onGenerationComplete(data.data);
        }
      } else if (data.status === 'error') {
        setStatus('error');
        setError(data.error || 'An error occurred during generation');
      }
    } catch (error) {
      console.error('Error checking generation status:', error);
      setError('Failed to check recipe status. Please try again.');
    }
  }, [mealId, onGenerationComplete]);

  useEffect(() => {
    // Only poll if we're still generating and have a meal ID
    if (status === 'generating' && mealId) {
      const intervalId = setInterval(() => {
        // Rotate through messages
        setMessageIndex((prevIndex) => (prevIndex + 1) % generationMessages.length);
        // Increment progress
        setProgress((prevProgress) => Math.min(prevProgress + 10, 90));
        
        // Poll for status
        checkGenerationStatus();
      }, POLLING_INTERVAL);
      
      return () => clearInterval(intervalId);
    }
  }, [status, mealId, checkGenerationStatus, generationMessages.length]);

  if (status === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto my-8">
        <h3 className="text-red-600 text-xl font-semibold mb-2">Generation Error</h3>
        <p className="text-red-500">{error || 'An unexpected error occurred. Please try again.'}</p>
        <button 
          className="mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (status === 'completed' && recipe) {
    // Recipe display is handled by parent component via onGenerationComplete
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-2xl mx-auto my-8 shadow-lg">
      <h3 className="text-xl font-semibold mb-4 text-center">Creating Your Personalized Recipe</h3>
      
      <div className="mb-6">
        <div className="relative pt-1">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-teal-600 bg-teal-200">
                {progress}% Complete
              </span>
            </div>
          </div>
          <div className="flex h-2 mb-4 overflow-hidden text-xs rounded bg-teal-200">
            <div 
              style={{ width: `${progress}%` }} 
              className="flex flex-col whitespace-nowrap text-white justify-center bg-teal-500 transition-all duration-500 ease-in-out"
            ></div>
          </div>
        </div>
      </div>
      
      <div className="text-center text-gray-700 italic mb-4">
        {generationMessages[messageIndex]}
      </div>
      
      <div className="flex justify-center mt-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
      
      <p className="text-center text-gray-500 text-sm mt-6">
        Our AI is carefully crafting a pregnancy-safe recipe just for you...
      </p>
    </div>
  );
};

export default LiveGenerationComponent;