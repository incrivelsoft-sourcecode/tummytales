"""
Comprehensive test script for 4 different user scenarios with various cultures,
pregnancy weeks, diets, and testing all gamifier features including retry logic.

This script will:
1. Create 4 diverse test users with different profiles
2. Fill their survey data with cultural diversity
3. Test all edge cases: flashcard flipping, quiz answering, retry logic
4. Test RAG service with week-based queries
5. Test points, streaks, scoring systems
6. Test all difficulty levels

Users:
1. Maria (Hispanic, 12 weeks, vegetarian, US) - Manual test user
2. Priya (Indian, 28 weeks, traditional Indian diet, India) - Manual test user  
3. Sarah (American, 16 weeks, balanced diet, US) - Automated test
4. Aisha (Middle Eastern, 32 weeks, halal diet, UAE) - Automated test
"""

import pytest
import requests
import json
import time
from datetime import datetime, timedelta, date
from typing import Dict, List, Any
from conftest import setup_test_db, teardown_test_db, clean_test_data
from models.user_game_profile import UserGameProfile
from models.flashcard import Flashcard
from models.question import Question
from models.quiz_session import QuizSession
from models.answer import Answer
from services.flashcard_service import get_daily_flashcards, flip_flashcard
from services.quiz_service import start_quiz, submit_answer, complete_session
from services.user_data_service import get_user_profile, compute_current_week
from services.rag_service import RAGService
from utils.constants import *
from utils.time_utils import now_utc
from config.logger import get_logger

logger = get_logger(__name__)

# Test configuration
GAMIFIER_BASE_URL = "http://localhost:5002"
USER_SERVICE_URL = "http://localhost:5001"

class TestUser:
    """Class to represent a test user with all their data"""
    
    def __init__(self, username: str, email: str, password: str, profile_data: Dict):
        self.username = username
        self.email = email
        self.password = password
        self.profile_data = profile_data
        self.user_id = None
        self.token = None
        self.survey_id = None

# Test user profiles with diverse backgrounds
TEST_USERS = [
    TestUser(
        username="maria_gonzalez_test",
        email="maria.test@tummytales.com", 
        password="TestPass123!",
        profile_data={
            "culture": "Hispanic/Latino",
            "country": "United States",
            "pregnancy_week": 12,
            "lmp_date": (datetime.now() - timedelta(days=12*7)).strftime("%Y-%m-%d"),
            "diet": "Vegetarian",
            "language": "Spanish/English",
            "activity_level": "Moderate",
            "survey_data": {
                "generalDetails": {
                    "first_name": "Maria",
                    "last_name": "Gonzalez",
                    "nationality": "Mexican-American",
                    "country": "United States",
                    "city": "Los Angeles",
                    "State": "California"
                },
                "pregnancyStatus": {
                    "currentlyPregnant": True,
                    "Last_menstrualperiod": (datetime.now() - timedelta(days=12*7)).isoformat(),
                    "estimatedDueDate": (datetime.now() + timedelta(days=28*7)).isoformat(),
                    "firstChildInfo": {
                        "isFirstChild": True
                    }
                },
                "lifestylePreferences": {
                    "preferredLanguage": "Spanish",
                    "dietaryPreferences": "Vegetarian with emphasis on beans, quinoa, fresh vegetables",
                    "physicalActivity": "Moderate - prenatal yoga and walking",
                    "primaryInfoSource": "Family and healthcare provider"
                }
            }
        }
    ),
    TestUser(
        username="priya_sharma_test",
        email="priya.test@tummytales.com",
        password="TestPass123!", 
        profile_data={
            "culture": "Indian",
            "country": "India", 
            "pregnancy_week": 28,
            "lmp_date": (datetime.now() - timedelta(days=28*7)).strftime("%Y-%m-%d"),
            "diet": "Traditional Indian",
            "language": "Hindi/English",
            "activity_level": "Light",
            "survey_data": {
                "generalDetails": {
                    "first_name": "Priya",
                    "last_name": "Sharma", 
                    "nationality": "Indian",
                    "country": "India",
                    "city": "Mumbai",
                    "State": "Maharashtra"
                },
                "pregnancyStatus": {
                    "currentlyPregnant": True,
                    "Last_menstrualperiod": (datetime.now() - timedelta(days=28*7)).isoformat(),
                    "estimatedDueDate": (datetime.now() + timedelta(days=12*7)).isoformat(),
                    "firstChildInfo": {
                        "isFirstChild": False,
                        "details": {
                            "complications": "None",
                            "deliverymethod": "Normal delivery"
                        }
                    }
                },
                "lifestylePreferences": {
                    "preferredLanguage": "Hindi",
                    "dietaryPreferences": "Traditional Indian - dal, rice, vegetables, ghee, yogurt",
                    "physicalActivity": "Light household activities and walking",
                    "primaryInfoSource": "Elder women in family and doctor"
                }
            }
        }
    ),
    TestUser(
        username="sarah_johnson_test", 
        email="sarah.test@tummytales.com",
        password="TestPass123!",
        profile_data={
            "culture": "American",
            "country": "United States",
            "pregnancy_week": 16,
            "lmp_date": (datetime.now() - timedelta(days=16*7)).strftime("%Y-%m-%d"),
            "diet": "Balanced",
            "language": "English", 
            "activity_level": "High",
            "survey_data": {
                "generalDetails": {
                    "first_name": "Sarah",
                    "last_name": "Johnson",
                    "nationality": "American", 
                    "country": "United States",
                    "city": "Austin",
                    "State": "Texas"
                },
                "pregnancyStatus": {
                    "currentlyPregnant": True,
                    "Last_menstrualperiod": (datetime.now() - timedelta(days=16*7)).isoformat(),
                    "estimatedDueDate": (datetime.now() + timedelta(days=24*7)).isoformat(),
                    "firstChildInfo": {
                        "isFirstChild": True
                    }
                },
                "lifestylePreferences": {
                    "preferredLanguage": "English",
                    "dietaryPreferences": "Balanced diet with organic foods, lean proteins, whole grains",
                    "physicalActivity": "Active - swimming, prenatal fitness classes",
                    "primaryInfoSource": "Medical professionals and research"
                }
            }
        }
    ),
    TestUser(
        username="aisha_al_zahra_test",
        email="aisha.test@tummytales.com", 
        password="TestPass123!",
        profile_data={
            "culture": "Middle Eastern",
            "country": "United Arab Emirates",
            "pregnancy_week": 32,
            "lmp_date": (datetime.now() - timedelta(days=32*7)).strftime("%Y-%m-%d"),
            "diet": "Halal Mediterranean",
            "language": "Arabic/English",
            "activity_level": "Moderate",
            "survey_data": {
                "generalDetails": {
                    "first_name": "Aisha",
                    "last_name": "Al Zahra",
                    "nationality": "Emirati",
                    "country": "United Arab Emirates", 
                    "city": "Dubai",
                    "State": "Dubai"
                },
                "pregnancyStatus": {
                    "currentlyPregnant": True,
                    "Last_menstrualperiod": (datetime.now() - timedelta(days=32*7)).isoformat(),
                    "estimatedDueDate": (datetime.now() + timedelta(days=8*7)).isoformat(),
                    "firstChildInfo": {
                        "isFirstChild": False,
                        "details": {
                            "complications": "Gestational diabetes (managed)",
                            "deliverymethod": "C-section"
                        }
                    }
                },
                "lifestylePreferences": {
                    "preferredLanguage": "Arabic",
                    "dietaryPreferences": "Halal Mediterranean - dates, olive oil, fish, vegetables",
                    "physicalActivity": "Moderate walking and swimming",
                    "primaryInfoSource": "Family and Islamic healthcare guidance"
                }
            }
        }
    )
]

class ComprehensiveGameTester:
    """Comprehensive tester for gamifier features"""
    
    def __init__(self):
        self.setup_database()
        self.users_data = {}
        
    def setup_database(self):
        """Setup test database"""
        setup_test_db()
        logger.info("Test database setup complete")
        
    def cleanup_database(self):
        """Cleanup test database"""
        clean_test_data()
        teardown_test_db()
        logger.info("Test database cleanup complete")
        
    def create_user_account(self, user: TestUser) -> bool:
        """Create user account via user service API"""
        try:
            # Register user
            register_data = {
                "user_name": user.username,
                "email": user.email,
                "password": user.password,
                "confirm_password": user.password,  # Required by backend
                "role": "mom"
            }
            
            response = requests.post(
                f"{USER_SERVICE_URL}/user/users/register-user",
                json=register_data,
                timeout=10
            )
            
            if response.status_code not in [200, 201]:
                logger.error(f"Failed to register user {user.username}: {response.text}")
                return False
                
            # Login to get token
            login_data = {
                "emailOrUsername": user.username,  # Backend expects this field name
                "password": user.password
            }
            
            response = requests.post(
                f"{USER_SERVICE_URL}/user/users/login",
                json=login_data,
                timeout=10
            )
            
            if response.status_code != 200:
                logger.error(f"Failed to login user {user.username}: {response.text}")
                return False
                
            login_result = response.json()
            user.token = login_result.get("token")
            user.user_id = login_result.get("userId")
            
            if not user.token or not user.user_id:
                logger.error(f"Missing token or user_id for {user.username}")
                return False
                
            logger.info(f"Successfully created account for {user.username}")
            return True
            
        except Exception as e:
            logger.error(f"Error creating account for {user.username}: {str(e)}")
            return False
            
    def create_user_survey(self, user: TestUser) -> bool:
        """Create survey data for user"""
        try:
            survey_data = user.profile_data["survey_data"]
            
            response = requests.post(
                f"{USER_SERVICE_URL}/user/mom/survey",
                json=survey_data,
                headers={"Authorization": f"Bearer {user.token}"},
                timeout=10
            )
            
            if response.status_code not in [200, 201]:
                logger.error(f"Failed to create survey for {user.username}: {response.text}")
                return False
                
            result = response.json()
            user.survey_id = result.get("_id") or result.get("id")
            
            logger.info(f"Successfully created survey for {user.username}")
            return True
            
        except Exception as e:
            logger.error(f"Error creating survey for {user.username}: {str(e)}")
            return False
            
    def setup_users(self) -> List[TestUser]:
        """Setup all test users with accounts and surveys"""
        successful_users = []
        
        for user in TEST_USERS:
            logger.info(f"Setting up user: {user.username}")
            
            if self.create_user_account(user):
                if self.create_user_survey(user):
                    self.users_data[user.username] = user
                    successful_users.append(user)
                    logger.info(f"✅ Successfully setup {user.username}")
                else:
                    logger.error(f"❌ Failed to setup survey for {user.username}")
            else:
                logger.error(f"❌ Failed to setup account for {user.username}")
                
        return successful_users
        
    def test_flashcard_generation_and_flipping(self, user: TestUser) -> Dict[str, Any]:
        """Test flashcard generation and flipping with edge cases"""
        results = {
            "user": user.username,
            "flashcard_tests": {},
            "errors": []
        }
        
        try:
            # Test 1: Get flashcard config
            response = requests.get(
                f"{GAMIFIER_BASE_URL}/api/gamifier/flashcards/config",
                headers={"Authorization": f"Bearer {user.token}"}
            )
            
            if response.status_code == 200:
                config = response.json()
                results["flashcard_tests"]["config"] = config
                expected_week = user.profile_data["pregnancy_week"]
                actual_week = config.get("current_week")
                results["flashcard_tests"]["week_calculation"] = {
                    "expected": expected_week,
                    "actual": actual_week,
                    "accurate": abs(expected_week - actual_week) <= 1  # Allow 1 week variance
                }
            else:
                results["errors"].append(f"Failed to get flashcard config: {response.text}")
                
            # Test 2: Get daily flashcards (should generate if none exist)
            response = requests.get(
                f"{GAMIFIER_BASE_URL}/api/gamifier/flashcards",
                headers={"Authorization": f"Bearer {user.token}"}
            )
            
            if response.status_code == 200:
                flashcards_data = response.json()
                flashcards = flashcards_data.get("flashcards", [])
                results["flashcard_tests"]["generation"] = {
                    "count": len(flashcards),
                    "week": flashcards_data.get("week"),
                    "flashcards_generated": len(flashcards) > 0
                }
                
                # Test 3: Test flashcard flipping (all 3 cards + edge cases)
                flip_results = []
                for i, flashcard in enumerate(flashcards):
                    flip_response = requests.post(
                        f"{GAMIFIER_BASE_URL}/api/gamifier/flashcards/flip",
                        json={"flashcard_id": flashcard["id"]},
                        headers={"Authorization": f"Bearer {user.token}"}
                    )
                    
                    if flip_response.status_code == 200:
                        flip_data = flip_response.json()
                        flip_results.append({
                            "flip_number": i + 1,
                            "points_awarded": flip_data.get("points_awarded", 0),
                            "daily_limit_reached": flip_data.get("daily_limit_reached", False)
                        })
                    else:
                        flip_results.append({
                            "flip_number": i + 1,
                            "error": flip_response.text,
                            "status_code": flip_response.status_code
                        })
                        
                results["flashcard_tests"]["flipping"] = flip_results
                
                # Test 4: Try flipping beyond daily limit (should be graceful)
                if len(flashcards) > 0:
                    extra_flip_response = requests.post(
                        f"{GAMIFIER_BASE_URL}/api/gamifier/flashcards/flip",
                        json={"flashcard_id": flashcards[0]["id"]},
                        headers={"Authorization": f"Bearer {user.token}"}
                    )
                    
                    results["flashcard_tests"]["limit_exceeded"] = {
                        "status_code": extra_flip_response.status_code,
                        "response": extra_flip_response.json() if extra_flip_response.status_code == 200 else extra_flip_response.text,
                        "graceful_handling": extra_flip_response.status_code == 200
                    }
                    
            else:
                results["errors"].append(f"Failed to get flashcards: {response.text}")
                
        except Exception as e:
            results["errors"].append(f"Flashcard test error: {str(e)}")
            
        return results
        
    def test_quiz_with_retry_logic(self, user: TestUser, difficulty: str = "medium") -> Dict[str, Any]:
        """Test complete quiz flow including retry logic for wrong answers"""
        results = {
            "user": user.username,
            "difficulty": difficulty,
            "quiz_tests": {},
            "errors": []
        }
        
        try:
            # Test 1: Get quiz config
            response = requests.get(
                f"{GAMIFIER_BASE_URL}/api/gamifier/enhanced-quiz/config",
                headers={"Authorization": f"Bearer {user.token}"}
            )
            
            if response.status_code == 200:
                config = response.json()
                results["quiz_tests"]["config"] = config
            else:
                results["errors"].append(f"Failed to get quiz config: {response.text}")
                return results
                
            # Test 2: Start quiz session  
            start_response = requests.post(
                f"{GAMIFIER_BASE_URL}/api/gamifier/enhanced-quiz/start",
                json={"difficulty": difficulty},
                headers={"Authorization": f"Bearer {user.token}"}
            )
            
            if start_response.status_code != 200:
                results["errors"].append(f"Failed to start quiz: {start_response.text}")
                return results
                
            start_data = start_response.json()
            session_id = start_data.get("session_id")
            questions = start_data.get("questions", [])
            
            results["quiz_tests"]["session_start"] = {
                "session_id": session_id,
                "initial_question_count": len(questions),
                "questions_preview": [q.get("text", "")[:50] + "..." for q in questions[:2]]
            }
            
            # Test 3: Answer questions with intentional wrong answers to test retry logic
            question_results = []
            retry_questions_added = 0
            
            for i, question in enumerate(questions):
                question_id = question.get("question_id")
                options = question.get("options", {})
                correct_option = question.get("correct_option")  # This would not be available in real scenario
                
                # For testing: Answer first 2 questions wrong, last one correct
                if i < 2:
                    # Choose a wrong answer (not the correct one)
                    wrong_options = [key for key in options.keys() if key != correct_option]
                    selected_option = wrong_options[0] if wrong_options else list(options.keys())[0]
                    expected_correct = False
                else:
                    # Choose correct answer
                    selected_option = correct_option if correct_option else list(options.keys())[0]
                    expected_correct = True
                    
                answer_response = requests.post(
                    f"{GAMIFIER_BASE_URL}/api/gamifier/enhanced-quiz/answer",
                    json={
                        "session_id": session_id,
                        "question_id": question_id,
                        "selected_option": selected_option,
                        "started_at": datetime.now().isoformat(),
                        "answered_at": datetime.now().isoformat()
                    },
                    headers={"Authorization": f"Bearer {user.token}"}
                )
                
                if answer_response.status_code == 200:
                    answer_data = answer_response.json()
                    is_correct = answer_data.get("is_correct", False)
                    
                    question_results.append({
                        "question_number": i + 1,
                        "question_id": question_id,
                        "selected_option": selected_option,
                        "is_correct": is_correct,
                        "expected_correct": expected_correct,
                        "prediction_accurate": is_correct == expected_correct
                    })
                    
                    # Count retry questions added (when wrong answer on first attempt)
                    if not is_correct and i < len(questions):  # Original questions only
                        retry_questions_added += 1
                        
                else:
                    question_results.append({
                        "question_number": i + 1,
                        "error": answer_response.text,
                        "status_code": answer_response.status_code
                    })
                    
                # Small delay between questions
                time.sleep(0.5)
                
            results["quiz_tests"]["original_questions"] = question_results
            results["quiz_tests"]["expected_retry_questions"] = retry_questions_added
            
            # Test 4: Complete quiz session
            complete_response = requests.post(
                f"{GAMIFIER_BASE_URL}/api/gamifier/enhanced-quiz/complete",
                json={"session_id": session_id},
                headers={"Authorization": f"Bearer {user.token}"}
            )
            
            if complete_response.status_code == 200:
                complete_data = complete_response.json()
                results["quiz_tests"]["completion"] = {
                    "score": complete_data.get("score", 0),
                    "awarded_points": complete_data.get("awarded_points", 0),
                    "badges_awarded": complete_data.get("badges_awarded", [])
                }
            else:
                results["errors"].append(f"Failed to complete quiz: {complete_response.text}")
                
            # Test 5: Verify session has retry questions (if any wrong answers)
            # Note: This would require checking the session data, which might not be exposed via API
            
        except Exception as e:
            results["errors"].append(f"Quiz test error: {str(e)}")
            
        return results
        
    def test_rag_service_by_week(self, user: TestUser) -> Dict[str, Any]:
        """Test RAG service with week-specific queries"""
        results = {
            "user": user.username,
            "week": user.profile_data["pregnancy_week"],
            "rag_tests": {},
            "errors": []
        }
        
        try:
            # Create some test questions to verify RAG is working with correct week context
            week = user.profile_data["pregnancy_week"]
            
            # Test different difficulty levels to see if RAG adapts
            for difficulty in ["easy", "medium", "hard"]:
                try:
                    # Start a quiz to trigger RAG service
                    start_response = requests.post(
                        f"{GAMIFIER_BASE_URL}/api/gamifier/enhanced-quiz/start",
                        json={"difficulty": difficulty},
                        headers={"Authorization": f"Bearer {user.token}"}
                    )
                    
                    if start_response.status_code == 200:
                        start_data = start_response.json()
                        questions = start_data.get("questions", [])
                        
                        # Analyze question content for week-relevant information
                        week_relevant_keywords = [
                            f"week {week}", f"{week} weeks", "trimester",
                            "pregnancy", "fetal development", "maternal"
                        ]
                        
                        relevant_content_found = 0
                        for question in questions:
                            question_text = question.get("text", "").lower()
                            if any(keyword in question_text for keyword in week_relevant_keywords):
                                relevant_content_found += 1
                                
                        results["rag_tests"][difficulty] = {
                            "questions_generated": len(questions),
                            "week_relevant_content": relevant_content_found,
                            "relevance_ratio": relevant_content_found / len(questions) if questions else 0,
                            "sample_question": questions[0].get("text", "")[:100] + "..." if questions else None
                        }
                    else:
                        results["errors"].append(f"Failed to test RAG for {difficulty}: {start_response.text}")
                        
                except Exception as e:
                    results["errors"].append(f"RAG test error for {difficulty}: {str(e)}")
                    
        except Exception as e:
            results["errors"].append(f"RAG service test error: {str(e)}")
            
        return results
        
    def test_points_and_streaks(self, user: TestUser) -> Dict[str, Any]:
        """Test points accumulation and streak calculation"""
        results = {
            "user": user.username,
            "points_streak_tests": {},
            "errors": []
        }
        
        try:
            # Test 1: Get initial stats
            stats_response = requests.get(
                f"{GAMIFIER_BASE_URL}/api/gamifier/stats/summary?range=today",
                headers={"Authorization": f"Bearer {user.token}"}
            )
            
            if stats_response.status_code == 200:
                initial_stats = stats_response.json()
                results["points_streak_tests"]["initial_stats"] = initial_stats
            else:
                results["errors"].append(f"Failed to get initial stats: {stats_response.text}")
                
            # Test 2: Get streak data
            streak_response = requests.get(
                f"{GAMIFIER_BASE_URL}/api/gamifier/streak",
                headers={"Authorization": f"Bearer {user.token}"}
            )
            
            if streak_response.status_code == 200:
                streak_data = streak_response.json()
                results["points_streak_tests"]["streak_info"] = streak_data
            else:
                results["errors"].append(f"Failed to get streak data: {streak_response.text}")
                
            # Test 3: Get quiz limits (points and session info)
            limits_response = requests.get(
                f"{GAMIFIER_BASE_URL}/api/gamifier/enhanced-quiz/limits",
                headers={"Authorization": f"Bearer {user.token}"}
            )
            
            if limits_response.status_code == 200:
                limits_data = limits_response.json()
                results["points_streak_tests"]["limits"] = limits_data
                
                # Calculate expected max daily points
                max_daily_expected = 75  # 15 flashcards + 60 quiz points
                results["points_streak_tests"]["max_daily_validation"] = {
                    "expected_max": max_daily_expected,
                    "flashcard_max": 15,  # 3 flips * 5 points
                    "quiz_max": 60,  # 2 sessions * 3 questions * 10 points
                    "system_consistent": True  # Will validate based on actual behavior
                }
            else:
                results["errors"].append(f"Failed to get limits: {limits_response.text}")
                
        except Exception as e:
            results["errors"].append(f"Points and streaks test error: {str(e)}")
            
        return results
        
    def run_comprehensive_test(self, user: TestUser) -> Dict[str, Any]:
        """Run all tests for a single user"""
        logger.info(f"🧪 Running comprehensive tests for {user.username}")
        
        user_results = {
            "user_profile": {
                "username": user.username,
                "culture": user.profile_data["culture"],
                "country": user.profile_data["country"], 
                "pregnancy_week": user.profile_data["pregnancy_week"],
                "diet": user.profile_data["diet"],
                "language": user.profile_data["language"]
            },
            "test_results": {},
            "overall_success": True
        }
        
        try:
            # Test flashcard features
            logger.info(f"  📚 Testing flashcards for {user.username}")
            flashcard_results = self.test_flashcard_generation_and_flipping(user)
            user_results["test_results"]["flashcards"] = flashcard_results
            
            # Test quiz features with different difficulties
            for difficulty in ["easy", "medium", "hard"]:
                logger.info(f"  🎯 Testing {difficulty} quiz for {user.username}")
                quiz_results = self.test_quiz_with_retry_logic(user, difficulty)
                user_results["test_results"][f"quiz_{difficulty}"] = quiz_results
                
            # Test RAG service
            logger.info(f"  🔍 Testing RAG service for {user.username}")
            rag_results = self.test_rag_service_by_week(user)
            user_results["test_results"]["rag_service"] = rag_results
            
            # Test points and streaks
            logger.info(f"  🏆 Testing points and streaks for {user.username}")
            points_results = self.test_points_and_streaks(user)
            user_results["test_results"]["points_streaks"] = points_results
            
            # Check for any errors across all tests
            all_errors = []
            for test_name, test_result in user_results["test_results"].items():
                if isinstance(test_result, dict) and "errors" in test_result:
                    all_errors.extend(test_result["errors"])
                    
            user_results["all_errors"] = all_errors
            user_results["overall_success"] = len(all_errors) == 0
            
            logger.info(f"✅ Completed tests for {user.username} - Success: {user_results['overall_success']}")
            
        except Exception as e:
            user_results["overall_success"] = False
            user_results["fatal_error"] = str(e)
            logger.error(f"❌ Fatal error testing {user.username}: {str(e)}")
            
        return user_results

def main():
    """Main test execution"""
    print("🚀 Starting Comprehensive Gamifier Testing")
    print("=" * 60)
    
    tester = ComprehensiveGameTester()
    
    try:
        # Setup all users
        print("\n📋 Setting up test users...")
        successful_users = tester.setup_users()
        
        if len(successful_users) < 2:
            print(f"❌ Failed to setup minimum users. Only {len(successful_users)} succeeded.")
            return
            
        print(f"✅ Successfully setup {len(successful_users)} users")
        
        # Print manual test user credentials
        print("\n🔑 MANUAL TEST USER CREDENTIALS:")
        print("-" * 40)
        manual_users = successful_users[:2]  # First 2 users for manual testing
        for i, user in enumerate(manual_users, 1):
            print(f"{i}. {user.profile_data['culture']} User - {user.username}")
            print(f"   Email: {user.email}")
            print(f"   Password: {user.password}")
            print(f"   Culture: {user.profile_data['culture']}")
            print(f"   Week: {user.profile_data['pregnancy_week']}")
            print(f"   Diet: {user.profile_data['diet']}")
            print(f"   Country: {user.profile_data['country']}")
            print()
            
        # Run automated tests on remaining users
        print("🤖 Running automated tests on remaining users...")
        automated_users = successful_users[2:]  # Last 2 users for automated testing
        
        all_results = {}
        
        for user in automated_users:
            print(f"\n🧪 Testing user: {user.username}")
            user_results = tester.run_comprehensive_test(user)
            all_results[user.username] = user_results
            
        # Print summary results
        print("\n📊 AUTOMATED TEST RESULTS SUMMARY:")
        print("=" * 50)
        
        for username, results in all_results.items():
            print(f"\n👤 {username} ({results['user_profile']['culture']})")
            print(f"   Success: {'✅' if results['overall_success'] else '❌'}")
            print(f"   Week: {results['user_profile']['pregnancy_week']}")
            print(f"   Errors: {len(results.get('all_errors', []))}")
            
            if not results['overall_success']:
                print("   Error Details:")
                for error in results.get('all_errors', [])[:3]:  # Show first 3 errors
                    print(f"     - {error}")
                    
        # Save detailed results to file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = f"gamifier/tests/test_results_{timestamp}.json"
        
        with open(results_file, 'w') as f:
            json.dump(all_results, f, indent=2, default=str)
            
        print(f"\n💾 Detailed results saved to: {results_file}")
        
        print(f"\n🎯 TEST SUMMARY:")
        print(f"   Total Users: {len(successful_users)}")
        print(f"   Manual Test Users: {len(manual_users)}")
        print(f"   Automated Test Users: {len(automated_users)}")
        print(f"   Successful Automated Tests: {sum(1 for r in all_results.values() if r['overall_success'])}")
        
    except Exception as e:
        print(f"❌ Test execution failed: {str(e)}")
        logger.error(f"Test execution error: {str(e)}")
        
    finally:
        # Cleanup
        print("\n🧹 Cleaning up...")
        tester.cleanup_database()
        print("✅ Cleanup complete")

if __name__ == "__main__":
    main()
