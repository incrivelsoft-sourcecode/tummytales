import React, { useState, useEffect, useCallback } from 'react';

const RecipeHistoryComponent = ({ onSelectRecipe, userID = 'test_user' }) => {
 const [history, setHistory] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);

 const fetchHistory = useCallback(async () => {
   try {
     setLoading(true);
     const response = await fetch(`http://localhost:5001/api/meal/history?user_id=${userID}&limit=20`);
     
     if (!response.ok) {
       throw new Error('Failed to fetch history');
     }
     
     const data = await response.json();
     setHistory(data.data || []);
     setError(null);
   } catch (err) {
     console.error('Error fetching history:', err);
     setError(err.message);
   } finally {
     setLoading(false);
   }
 }, [userID]);

 useEffect(() => {
   fetchHistory();
 }, [fetchHistory]);

 const formatDate = (dateString) => {
   if (!dateString) return 'Unknown date';
   try {
     return new Date(dateString).toLocaleDateString('en-US', {
       month: 'short',
       day: 'numeric',
       hour: '2-digit',
       minute: '2-digit'
     });
   } catch {
     return 'Unknown date';
   }
 };

 const getMealTypeIcon = (mealType) => {
   const icons = {
     breakfast: '🌅',
     lunch: '☀️',
     dinner: '🌙',
     snack: '🍎',
     dessert: '🍰'
   };
   return icons[mealType?.toLowerCase()] || '🍽️';
 };

 const getMealTypeColor = (mealType) => {
   const colors = {
     breakfast: 'from-yellow-400 to-orange-500',
     lunch: 'from-green-400 to-emerald-500',
     dinner: 'from-purple-500 to-indigo-600',
     snack: 'from-pink-400 to-rose-500',
     dessert: 'from-indigo-400 to-purple-500'
   };
   return colors[mealType?.toLowerCase()] || 'from-gray-400 to-gray-500';
 };

 if (loading) {
   return (
     <div className="flex items-center justify-center py-12">
       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
       <span className="ml-3 text-gray-600">Loading your recipe history...</span>
     </div>
   );
 }

 if (error) {
   return (
     <div className="text-center py-12">
       <div className="text-red-500 mb-4">
         <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
         </svg>
         <p className="text-lg font-semibold">Unable to load recipe history</p>
         <p className="text-sm text-gray-500 mt-2">{error}</p>
       </div>
       <button
         onClick={fetchHistory}
         className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
       >
         Try Again
       </button>
     </div>
   );
 }

 if (history.length === 0) {
   return (
     <div className="text-center py-12">
       <div className="text-gray-500 mb-4">
         <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
         </svg>
         <h3 className="text-xl font-semibold text-gray-700 mb-2">No Recipe History Yet</h3>
         <p className="text-gray-500">Start generating recipes to build your personal collection!</p>
       </div>
     </div>
   );
 }

 return (
   <div className="space-y-4">
     <div className="flex items-center justify-between mb-6">
       <h3 className="text-lg font-semibold text-gray-800">
         Your Recipe History ({history.length} recipes)
       </h3>
       <button
         onClick={fetchHistory}
         className="text-teal-600 hover:text-teal-700 text-sm font-medium"
       >
         Refresh
       </button>
     </div>

     <div className="grid gap-4 max-h-96 overflow-y-auto">
       {history.map((item) => (
         <div
           key={item._id}
           onClick={() => onSelectRecipe(item)}
           className="group bg-white border border-gray-200 rounded-xl p-4 hover:border-teal-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
         >
           <div className="flex items-start space-x-4">
             {/* Meal Type Icon */}
             <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${getMealTypeColor(item.meal_type)} rounded-lg flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform`}>
               {getMealTypeIcon(item.meal_type)}
             </div>

             {/* Recipe Details */}
             <div className="flex-1 min-w-0">
               <h4 className="font-semibold text-gray-900 truncate group-hover:text-teal-600 transition-colors">
                 {item.meal?.title || 'Untitled Recipe'}
               </h4>
               
               <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                 <span className="capitalize">{item.meal_type || 'General'}</span>
                 <span>•</span>
                 <span>{item.meal?.servings || 2} servings</span>
                 <span>•</span>
                 <span>{formatDate(item.created_at)}</span>
               </div>

               {/* Quick nutrition preview */}
               {item.meal?.nutritionalValues && (
                 <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                   <span>{item.meal.nutritionalValues.Calories || 'Unknown'} cal</span>
                   <span>{item.meal.nutritionalValues.Protein || 'Unknown'} protein</span>
                 </div>
               )}
             </div>

             {/* Trimester Badge */}
             <div className="flex-shrink-0">
               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                 {item.trimester || 'Second'} Trimester
               </span>
             </div>
           </div>
         </div>
       ))}
     </div>
   </div>
 );
};

export default RecipeHistoryComponent;