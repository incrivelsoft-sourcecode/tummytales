/*
 * QuizDemo Component - Integrated with Gamifier Service
 * 
 * This component provides a complete learning experience with flashcards and quizzes,
 * fully integrated with the TummyTales gamifier backend service.
 * 
 * Features:
 * - Real-time flashcard system with point tracking
 * - Interactive quiz sessions with progress tracking  
 * - Streak and achievement system
 * - Daily session limits and user statistics
 * - Pregnancy week calculation from LMP data
 * 
 * API Integration:
 * - Gamifier service (default: localhost:5002)
 * - JWT authentication via Bearer token
 * - Real-time stats and streak updates
 * - Points and badge system
 * 
 * Quiz Flow:
 * 1. Fetch flashcards and user stats on load
 * 2. User reviews flashcards (earns points on flip)
 * 3. Start quiz session (gets all questions at once)
 * 4. Display questions one by one with progress tracking
 * 5. Submit answers and show immediate feedback
 * 6. Complete session and update streaks/points
 */

import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const QuizDemo = () => {
  // Authentication and user data
  const userId = localStorage.getItem("userId") || "";
  const token = localStorage.getItem("token") || "";
  
  // Main state management
  const [phase, setPhase] = useState("flashcards"); // flashcards, quiz-ready, quiz-active, quiz-complete, daily-complete
  const [loading, setLoading] = useState(false);
  
  // User stats
  const [userStats, setUserStats] = useState({
    pregnancyWeek: 1,
    currentStreak: 0,
    longestStreak: 0,
    lastQuizDate: null,
    totalPoints: 0,
    todayPoints: 0,
    sessionsToday: 0,
    maxSessionsPerDay: 2
  });
  
  // Flashcard state
  const [flashcards, setFlashcards] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  
  // Quiz state
  const [allQuestions, setAllQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [quizSessionId, setQuizSessionId] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState("medium");
  
  // Config state
  const [flashcardConfig, setFlashcardConfig] = useState({
    current_week: 1,
    flashcards_per_session: 3,
    max_flips_per_day: 3,
    points_per_flip: 5,
    max_points_per_day: 15
  });
  const [quizConfig, setQuizConfig] = useState({
    current_week: 1,
    max_quizzes_per_day: 2,
    questions_per_session: 3,
    points_per_correct_answer: 10,
    difficulty_levels: ["easy", "medium", "hard"]
  });

  // API configuration - Gamifier service runs on port 5002
  const gamifierBaseUrl = process.env.REACT_APP_GAMIFIER_BACKEND_URL || "http://localhost:5002";
  
  const apiHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

    // Initialize component
  useEffect(() => {
    if (!userId || !token) {
      toast.error("Please log in to access the learning games.");
      return;
    }
    initializeGame();
  }, [userId, token]);

  const initializeGame = async () => {
    setLoading(true);
    try {
      // Fetch configurations first, then user stats, streak, and flashcards in parallel
      await Promise.all([
        fetchFlashcardConfig(),
        fetchQuizConfig()
      ]);
      
      await Promise.all([
        fetchUserStats(),
        fetchStreakData(),
        fetchFlashcards()
      ]);
    } catch (error) {
      console.error("Error initializing game:", error);
      // Fetch flashcards and streak separately if parallel fetch fails
      await Promise.all([
        fetchStreakData(),
        fetchFlashcards()
      ]);
    }
    setLoading(false);
  };

  const fetchFlashcardConfig = async () => {
    try {
      const response = await axios.get(
        `${gamifierBaseUrl}/api/gamifier/flashcards/config`,
        { headers: apiHeaders }
      );
      
      if (response.data) {
        setFlashcardConfig(response.data);
        
        // Update user stats with computed week
        setUserStats(prev => ({
          ...prev,
          pregnancyWeek: response.data.current_week
        }));
      }
    } catch (error) {
      console.error("Error fetching flashcard config:", error);
      // Keep default config if API fails
    }
  };

  const fetchQuizConfig = async () => {
    try {
      const response = await axios.get(
        `${gamifierBaseUrl}/api/gamifier/enhanced-quiz/config`,
        { headers: apiHeaders }
      );
      
      if (response.data) {
        setQuizConfig(response.data);
        
        // Update user stats with computed week from quiz config
        setUserStats(prev => ({
          ...prev,
          pregnancyWeek: response.data.current_week,
          maxSessionsPerDay: response.data.max_quizzes_per_day
        }));
      }
    } catch (error) {
      console.error("Error fetching quiz config:", error);
      // Keep default config if API fails
    }
  };

  const fetchUserStats = async () => {
    try {
      // Get quiz limits for session info
      const quizLimitsRes = await axios.get(
        `${gamifierBaseUrl}/api/gamifier/enhanced-quiz/limits`,
        { headers: apiHeaders }
      );
      
      // Get stats summary for points and other data
      const statsRes = await axios.get(
        `${gamifierBaseUrl}/api/gamifier/stats/summary?range=today`,
        { headers: apiHeaders }
      );

      const quizData = quizLimitsRes.data || {};
      const statsData = statsRes.data || {};
      
      // Update stats with correct field mapping
      setUserStats(prev => ({
        ...prev,
        sessionsToday: quizData.quizzes_today || 0,
        maxSessionsPerDay: quizData.max_quizzes_per_day || quizConfig.max_quizzes_per_day,
        totalPoints: quizData.points_lifetime || prev.totalPoints || 0, // Use points from quiz limits endpoint
        todayPoints: Math.max(statsData.points_earned || 0, quizData.points_today || 0) // Use max of both sources
      }));
      
      // Determine if user has completed their daily sessions
      const sessionsLeft = Math.max(0, (quizData.max_quizzes_per_day || quizConfig.max_quizzes_per_day) - (quizData.quizzes_today || 0));
      if (sessionsLeft === 0) {
        setPhase("daily-complete");
      }
      
    } catch (error) {
      console.error("Error fetching user stats:", error);
      // Set defaults if API fails
      setUserStats(prev => ({
        ...prev,
        sessionsToday: 0,
        maxSessionsPerDay: quizConfig.max_quizzes_per_day,
        totalPoints: 0,
        todayPoints: 0
      }));
    }
  };

  const fetchStreakData = async () => {
    try {
      const response = await axios.get(
        `${gamifierBaseUrl}/api/gamifier/streak`,
        { headers: apiHeaders }
      );
      
      const streakData = response.data || {};
      setUserStats(prev => ({
        ...prev,
        currentStreak: streakData.current_streak || 0,
        longestStreak: streakData.longest_streak || 0,
        lastQuizDate: streakData.last_quiz_date
      }));
      
    } catch (error) {
      console.error("Error fetching streak data:", error);
    }
  };

  const fetchFlashcards = async () => {
    try {
      const response = await axios.get(
        `${gamifierBaseUrl}/api/gamifier/flashcards?limit=${flashcardConfig.flashcards_per_session}&week=${flashcardConfig.current_week}`,
        { headers: apiHeaders }
      );
      
      if (response.data && response.data.flashcards) {
        const flashcardData = response.data.flashcards.map(fc => ({
          id: fc.id,
          front: fc.front_text,
          back: fc.back_text
        }));
        setFlashcards(flashcardData);
        
        // Set pregnancy week from response if available
        if (response.data.week) {
          setUserStats(prev => ({
            ...prev,
            pregnancyWeek: response.data.week
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching flashcards:", error);
      // Fallback flashcards for demo
      setFlashcards([
        {
          id: "demo1",
          front: "What vitamin is essential for bone development during pregnancy?",
          back: "Vitamin D - helps with calcium absorption and bone development for both mother and baby."
        },
        {
          id: "demo2", 
          front: "How much weight should you gain during pregnancy?",
          back: "It depends on your pre-pregnancy BMI. Generally 11-40 pounds, but consult your healthcare provider."
        },
        {
          id: "demo3",
          front: "What foods should be avoided during pregnancy?",
          back: "Raw fish, undercooked meat, unpasteurized dairy, high-mercury fish, and alcohol should be avoided."
        }
      ]);
    }
  };

  const handleFlashcardFlip = async () => {
    setFlipped(!flipped);
    
    // Track flip for points if not already flipped
    if (!flipped && flashcards[cardIndex]) {
      try {
        const response = await axios.post(
          `${gamifierBaseUrl}/api/gamifier/flashcards/flip`,
          {
            flashcard_id: flashcards[cardIndex].id
          },
          { headers: apiHeaders }
        );
        
        // Show toast notification based on points awarded
        if (response.data) {
          if (response.data.daily_limit_reached) {
            toast.info("Daily flashcard flip limit reached! Come back tomorrow for more points.");
          } else if (response.data.points_awarded > 0) {
            toast.success(`+${response.data.points_awarded} points!`);
          } else if (response.data.points_awarded === 0) {
            toast.info("Flashcard flipped! (Daily point limit reached)");
          } else {
            toast.info("Flashcard flipped!");
          }
        }
        
        // Refresh stats from database to get real-time totals
        await fetchUserStats();
      } catch (error) {
        console.error("Error tracking flashcard flip:", error);
        // For any errors, still show a basic notification
        toast.info("Flashcard flipped!");
      }
    }
  };

  const handleNextCard = () => {
    if (cardIndex < flashcards.length - 1) {
      setCardIndex(cardIndex + 1);
      setFlipped(false);
    }
  };

  const handlePrevCard = () => {
    if (cardIndex > 0) {
      setCardIndex(cardIndex - 1);
      setFlipped(false);
    }
  };

  const startQuiz = async () => {
    const sessionsLeft = Math.max(0, userStats.maxSessionsPerDay - userStats.sessionsToday);
    if (sessionsLeft <= 0) {
      setPhase("daily-complete");
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(
        `${gamifierBaseUrl}/api/gamifier/enhanced-quiz/start`,
        {
          difficulty: selectedDifficulty
        },
        { headers: apiHeaders }
      );
      
      if (response.data) {
        setQuizSessionId(response.data.session_id);
        setAllQuestions(response.data.questions || []);
        setCurrentQuestionIndex(0);
        setScore({ correct: 0, total: response.data.questions?.length || 0 });
        setSessionStartTime(new Date());
        setQuestionStartTime(new Date());
        setPhase("quiz-active");
      }
    } catch (error) {
      console.error("Error starting quiz:", error);
      if (error.response?.status === 429) {
        toast.error("You've reached your daily quiz limit. Come back tomorrow!");
        setPhase("daily-complete");
      } else {
        toast.error("Failed to start quiz");
      }
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (selected === null || !quizSessionId || !allQuestions[currentQuestionIndex]) return;
    
    const currentQuestion = allQuestions[currentQuestionIndex];
    const now = new Date();
    
    try {
      const response = await axios.post(
        `${gamifierBaseUrl}/api/gamifier/enhanced-quiz/answer`,
        {
          session_id: quizSessionId,
          question_id: currentQuestion.question_id,
          selected_option: Object.keys(currentQuestion.options)[selected],
          started_at: questionStartTime.toISOString(),
          answered_at: now.toISOString()
        },
        { headers: apiHeaders }
      );
      
      const result = response.data || {};
      const isCorrect = result.is_correct || false;
      setIsCorrect(isCorrect);
      setShowResult(true);
      
      // Handle updated questions if retry question was added
      if (result.updated_questions && result.total_questions) {
        setAllQuestions(result.updated_questions);
        setScore(prev => ({ ...prev, total: result.total_questions }));
        console.log("Updated questions received:", result.total_questions, "total questions");
      }
      
      // Show immediate feedback
      if (isCorrect) {
        setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
        toast.success("Correct! 🎉");
      } else {
        toast.error("Incorrect 😔");
        // If retry question was added, show notification
        if (result.updated_questions) {
          toast.info("Question added for retry at the end!");
        }
      }
      
      // Move to next question or complete quiz after showing result
      setTimeout(() => {
        if (currentQuestionIndex >= allQuestions.length - 1) {
          // Quiz complete
          completeQuiz();
        } else {
          // Next question
          setCurrentQuestionIndex(prev => prev + 1);
          setSelected(null);
          setShowResult(false);
          setQuestionStartTime(new Date());
        }
      }, 2000);
      
    } catch (error) {
      console.error("Error submitting answer:", error);
      toast.error("Failed to submit answer");
    }
  };

  const completeQuiz = async () => {
    try {
      // Complete the quiz session on the backend
      const response = await axios.post(
        `${gamifierBaseUrl}/api/gamifier/enhanced-quiz/complete`,
        {
          session_id: quizSessionId
        },
        { headers: apiHeaders }
      );
      
      const result = response.data || {};
      
        // Show points notification
        const pointsAwarded = result.awarded_points || 0;
        if (pointsAwarded > 0) {
          toast.success(`Quiz completed! +${pointsAwarded} points earned!`);
        }
        
        // Show any badges earned
        if (result.badges_awarded && result.badges_awarded.length > 0) {
          toast.success(`New badges earned: ${result.badges_awarded.join(', ')}`);
        }
        
        // Refresh all stats from server to get real-time totals from database
        await Promise.all([
          fetchUserStats(),
          fetchStreakData()
        ]);
      
      setPhase("quiz-complete");
      
    } catch (error) {
      console.error("Error completing quiz:", error);
      // Still show completion but refresh from database
      toast.success("Quiz completed!");
      
      // Try to refresh stats from database even if completion failed
      try {
        await Promise.all([
          fetchUserStats(),
          fetchStreakData()
        ]);
      } catch (refreshError) {
        console.error("Error refreshing stats after quiz completion:", refreshError);
      }
      
      setPhase("quiz-complete");
    }
  };

  const playAgain = () => {
    const sessionsLeft = Math.max(0, userStats.maxSessionsPerDay - userStats.sessionsToday);
    if (sessionsLeft > 0) {
      setPhase("quiz-ready");
      setSelected(null);
      setShowResult(false);
      setAllQuestions([]);
      setCurrentQuestionIndex(0);
      setQuizSessionId(null);
    } else {
      setPhase("daily-complete");
    }
  };

  // Helper function to get current question
  const getCurrentQuestion = () => {
    return allQuestions[currentQuestionIndex] || null;
  };

  // Helper function to calculate sessions left
  const getSessionsLeft = () => {
    return Math.max(0, userStats.maxSessionsPerDay - userStats.sessionsToday);
  };

  const pregnancyWeekDisplay = `🤰 Week ${userStats.pregnancyWeek}`;
  const streakDisplay = `🔥 ${userStats.currentStreak} / ${userStats.longestStreak}`;
  const todayCheckDisplay = userStats.lastQuizDate === new Date().toISOString().split('T')[0] ? "✅" : "○";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-2xl font-semibold text-gray-700">Loading your learning journey...</div>
          <div className="text-sm text-gray-500 mt-2">Connecting to gamifier service...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-lg p-8">
        
        {/* Persistent Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 text-center mb-4">Daily Learning Journey</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-lg">{pregnancyWeekDisplay}</span>
              <span className="text-lg">{streakDisplay}</span>
              <span className="text-lg">{todayCheckDisplay}</span>
            </div>
            <div className="text-right">
              <div className="text-lg">
                Total: {userStats.totalPoints} pts | Today: {userStats.todayPoints} pts
              </div>
              <div className="text-xs text-gray-600">
                Games {userStats.sessionsToday}/{userStats.maxSessionsPerDay}
              </div>
            </div>
          </div>
        </div>

        {/* Flashcards Phase */}
        {phase === "flashcards" && (
          <div className="text-center">
            <div 
              className="bg-white rounded-xl shadow-md p-8 mb-6 cursor-pointer min-h-[200px] flex items-center justify-center border-2 border-gray-200 hover:border-blue-300 transition-colors"
              onClick={handleFlashcardFlip}
            >
              <div className="text-lg text-gray-800">
                {flashcards.length > 0 ? (
                  flipped ? flashcards[cardIndex]?.back || flashcards[cardIndex]?.back_text : flashcards[cardIndex]?.front || flashcards[cardIndex]?.front_text
                ) : (
                  "Loading flashcards..."
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <button
                onClick={handlePrevCard}
                disabled={cardIndex === 0}
                className={`px-4 py-2 rounded-lg ${
                  cardIndex === 0 
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                Prev
              </button>
              
              <span className="text-sm text-gray-600">
                {cardIndex + 1} / {flashcards.length}
              </span>
              
              {cardIndex < flashcards.length - 1 ? (
                <button
                  onClick={handleNextCard}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={() => setPhase("quiz-ready")}
                  className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600"
                >
                  Start Quiz
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quiz Ready Phase */}
        {phase === "quiz-ready" && (
          <div className="text-center">
            <div className="text-6xl mb-4">🎮</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Test your knowledge</h2>
            <p className="text-lg text-gray-600 mb-6">
              You have {getSessionsLeft()} sessions left today.
            </p>
            
            {/* Difficulty Selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose Difficulty Level:
              </label>
              <div className="flex justify-center gap-4">
                {quizConfig.difficulty_levels.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedDifficulty(level)}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      selectedDifficulty === level
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Current: {selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)}
              </p>
            </div>
            
            <button
              onClick={startQuiz}
              disabled={getSessionsLeft() === 0 || loading}
              className={`px-8 py-3 rounded-lg text-white font-semibold ${
                getSessionsLeft() === 0 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {loading ? "Starting..." : "Start Game"}
            </button>
          </div>
        )}

        {/* Quiz Active Phase */}
        {phase === "quiz-active" && getCurrentQuestion() && (
          <div>
            {/* Progress Bar */}
            <div className="h-2 bg-gray-200 rounded-full mb-6">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / allQuestions.length) * 100}%` }}
              ></div>
            </div>
            
            {/* Question Counter */}
            <div className="text-center mb-4">
              <span className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {allQuestions.length}
              </span>
            </div>
            
            {/* Question Card */}
            <div className="bg-white shadow-lg rounded-xl p-8 mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                {getCurrentQuestion().text}
              </h3>
              
              <div className="space-y-3">
                {Object.entries(getCurrentQuestion().options || {}).map(([optionKey, optionText], index) => (
                  <button
                    key={optionKey}
                    onClick={() => !showResult && setSelected(index)}
                    disabled={showResult}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                      showResult
                        ? isCorrect && selected === index
                          ? "bg-green-100 border-green-500 text-green-700"
                          : !isCorrect && selected === index
                          ? "bg-red-100 border-red-500 text-red-700"
                          : "bg-gray-100 border-gray-300 text-gray-700"
                        : selected === index
                        ? "bg-blue-100 border-blue-500 text-blue-700"
                        : "bg-gray-50 border-gray-300 text-gray-700 hover:border-blue-400"
                    }`}
                  >
                    <span className="font-medium">{optionKey}.</span> {optionText}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Submit/Continue Section */}
            <div className="text-center">
              {!showResult ? (
                <button
                  onClick={submitAnswer}
                  disabled={selected === null}
                  className={`px-6 py-3 rounded-lg font-semibold ${
                    selected === null
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  Submit Answer
                </button>
              ) : (
                <div>
                  <div className={`text-2xl font-bold mb-4 ${
                    isCorrect ? "text-green-600" : "text-red-600"
                  }`}>
                    {isCorrect ? "Correct! 🎉" : "Incorrect 😔"}
                  </div>
                  {currentQuestionIndex >= allQuestions.length - 1 ? (
                    <p className="text-gray-600 mb-4">Quiz completing...</p>
                  ) : (
                    <p className="text-gray-600 mb-4">Moving to next question...</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quiz Complete Phase */}
        {phase === "quiz-complete" && (
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Quiz Complete! You answered {score.correct}/{score.total} correctly!
            </h2>
            
            {getSessionsLeft() > 0 ? (
              <button
                onClick={playAgain}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold"
              >
                Play Again ({getSessionsLeft()} left)
              </button>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">Great job! You've completed your daily sessions.</p>
                <button
                  onClick={() => setPhase("flashcards")}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold"
                >
                  Review Flashcards
                </button>
              </div>
            )}
          </div>
        )}

        {/* Daily Complete Phase */}
        {phase === "daily-complete" && (
          <div className="text-center">
            <div className="text-6xl mb-4">😴</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">All done for today!</h2>
            <p className="text-gray-600 mb-6">You've completed your daily quiz sessions. Come back tomorrow for more learning!</p>
            <button
              onClick={() => setPhase("flashcards")}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold"
            >
              Review Flashcards
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizDemo;
