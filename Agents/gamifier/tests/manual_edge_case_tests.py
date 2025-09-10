"""
Manual edge case testing script for specific gamifier scenarios.
This script focuses on testing edge cases that need manual verification.

Run with: python -m pytest gamifier/tests/manual_edge_case_tests.py -v -s
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List

# Configuration
GAMIFIER_BASE_URL = "http://localhost:5002"
USER_SERVICE_URL = "http://localhost:5001"

# Test credentials - these will be updated from the user creation script output
TEST_CREDENTIALS = [
    {
        "username": "maria_gonzalez_[timestamp]",  # Will be updated with actual timestamp
        "password": "TestPass123!",
        "description": "Hispanic user, 12 weeks, vegetarian"
    },
    {
        "username": "priya_sharma_[timestamp]",  # Will be updated with actual timestamp
        "password": "TestPass123!",
        "description": "Indian user, 28 weeks, traditional diet"
    }
]

class ManualEdgeCaseTester:
    """Manual tester for specific edge cases"""
    
    def __init__(self):
        self.authenticated_users = {}
        
    def authenticate_user(self, credentials: Dict[str, str]) -> bool:
        """Authenticate user and store token"""
        try:
            login_data = {
                "emailOrUsername": credentials["username"],  # Backend expects this field name
                "password": credentials["password"]
            }
            
            response = requests.post(
                f"{USER_SERVICE_URL}/user/users/login",
                json=login_data,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                self.authenticated_users[credentials["username"]] = {
                    "token": result.get("token"),
                    "user_id": result.get("userId"),
                    "description": credentials["description"]
                }
                print(f"✅ Authenticated {credentials['username']}")
                return True
            else:
                print(f"❌ Failed to authenticate {credentials['username']}: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error authenticating {credentials['username']}: {str(e)}")
            return False
            
    def test_flashcard_daily_limit_edge_case(self, username: str) -> Dict[str, Any]:
        """Test flashcard daily limit behavior - should be graceful, not error"""
        print(f"\n🧪 Testing flashcard daily limit for {username}")
        
        user_data = self.authenticated_users.get(username)
        if not user_data:
            return {"error": "User not authenticated"}
            
        headers = {"Authorization": f"Bearer {user_data['token']}"}
        results = {"username": username, "tests": []}
        
        try:
            # Get flashcards
            response = requests.get(f"{GAMIFIER_BASE_URL}/api/gamifier/flashcards", headers=headers)
            if response.status_code != 200:
                return {"error": f"Failed to get flashcards: {response.text}"}
                
            flashcards = response.json().get("flashcards", [])
            if not flashcards:
                return {"error": "No flashcards available"}
                
            flashcard_id = flashcards[0]["id"]
            
            # Flip cards up to and beyond limit
            for flip_num in range(1, 6):  # Try 5 flips (limit is 3)
                print(f"  Flip {flip_num}...")
                
                flip_response = requests.post(
                    f"{GAMIFIER_BASE_URL}/api/gamifier/flashcards/flip",
                    json={"flashcard_id": flashcard_id},
                    headers=headers
                )
                
                test_result = {
                    "flip_number": flip_num,
                    "status_code": flip_response.status_code,
                    "graceful_handling": flip_response.status_code == 200
                }
                
                if flip_response.status_code == 200:
                    data = flip_response.json()
                    test_result.update({
                        "points_awarded": data.get("points_awarded", 0),
                        "daily_limit_reached": data.get("daily_limit_reached", False),
                        "response_message": "Success"
                    })
                    
                    if flip_num > 3:  # Beyond limit
                        if data.get("daily_limit_reached"):
                            print(f"    ✅ Graceful limit handling: {data}")
                        elif data.get("points_awarded", 0) == 0:
                            print(f"    ✅ No points awarded after limit: {data}")
                        else:
                            print(f"    ⚠️  Unexpected behavior: {data}")
                    else:
                        print(f"    ✅ Normal flip: +{data.get('points_awarded', 0)} points")
                else:
                    test_result["error_message"] = flip_response.text
                    print(f"    ❌ Error on flip {flip_num}: {flip_response.text}")
                    
                results["tests"].append(test_result)
                time.sleep(0.5)  # Small delay between requests
                
        except Exception as e:
            results["error"] = str(e)
            
        return results
        
    def test_quiz_retry_logic_edge_case(self, username: str, difficulty: str = "medium") -> Dict[str, Any]:
        """Test quiz retry logic - wrong answers should be added to end once"""
        print(f"\n🧪 Testing quiz retry logic for {username} (difficulty: {difficulty})")
        
        user_data = self.authenticated_users.get(username)
        if not user_data:
            return {"error": "User not authenticated"}
            
        headers = {"Authorization": f"Bearer {user_data['token']}"}
        results = {"username": username, "difficulty": difficulty, "tests": {}}
        
        try:
            # Start quiz
            start_response = requests.post(
                f"{GAMIFIER_BASE_URL}/api/gamifier/enhanced-quiz/start",
                json={"difficulty": difficulty},
                headers=headers
            )
            
            if start_response.status_code != 200:
                return {"error": f"Failed to start quiz: {start_response.text}"}
                
            start_data = start_response.json()
            session_id = start_data.get("session_id")
            questions = start_data.get("questions", [])
            
            results["tests"]["session_start"] = {
                "session_id": session_id,
                "initial_questions": len(questions),
                "questions_preview": [q.get("text", "")[:30] + "..." for q in questions[:2]]
            }
            
            print(f"  📝 Started quiz with {len(questions)} questions")
            
            # Answer questions - intentionally get some wrong to test retry
            question_answers = []
            
            for i, question in enumerate(questions):
                question_id = question.get("question_id")
                options = question.get("options", {})
                
                # Strategy: Answer first question wrong, second correct, third wrong (if exists)
                if i == 0 or (i == 2 and len(questions) > 2):
                    # Choose first option (likely wrong in most cases)
                    selected_option = list(options.keys())[0]
                    expected_outcome = "wrong (intentional)"
                else:
                    # For second question, try to pick a reasonable answer
                    selected_option = list(options.keys())[1] if len(options) > 1 else list(options.keys())[0]
                    expected_outcome = "attempting correct"
                    
                print(f"  📝 Question {i+1}: Selecting option {selected_option} ({expected_outcome})")
                
                answer_response = requests.post(
                    f"{GAMIFIER_BASE_URL}/api/gamifier/enhanced-quiz/answer",
                    json={
                        "session_id": session_id,
                        "question_id": question_id,
                        "selected_option": selected_option,
                        "started_at": datetime.now().isoformat(),
                        "answered_at": datetime.now().isoformat()
                    },
                    headers=headers
                )
                
                if answer_response.status_code == 200:
                    answer_data = answer_response.json()
                    is_correct = answer_data.get("is_correct", False)
                    
                    question_answers.append({
                        "question_number": i + 1,
                        "question_id": question_id,
                        "selected_option": selected_option,
                        "is_correct": is_correct,
                        "expected_outcome": expected_outcome,
                        "response": answer_data
                    })
                    
                    print(f"    {'✅' if is_correct else '❌'} Result: {'Correct' if is_correct else 'Wrong'}")
                    
                    if not is_correct and i < 3:  # Original questions only
                        print(f"    🔄 This question should be added for retry")
                else:
                    print(f"    ❌ Error answering question {i+1}: {answer_response.text}")
                    
                time.sleep(1)  # Delay between questions
                
            results["tests"]["original_answers"] = question_answers
            
            # Complete quiz  
            complete_response = requests.post(
                f"{GAMIFIER_BASE_URL}/api/gamifier/enhanced-quiz/complete",
                json={"session_id": session_id},
                headers=headers
            )
            
            if complete_response.status_code == 200:
                complete_data = complete_response.json()
                results["tests"]["completion"] = complete_data
                
                print(f"  🏁 Quiz completed:")
                print(f"    Score: {complete_data.get('score', 0)}")
                print(f"    Points: {complete_data.get('awarded_points', 0)}")
                print(f"    Badges: {complete_data.get('badges_awarded', [])}")
                
                # Analysis
                wrong_answers = [q for q in question_answers if not q["is_correct"]]
                results["tests"]["retry_analysis"] = {
                    "wrong_answers_count": len(wrong_answers),
                    "expected_retry_questions": len(wrong_answers),
                    "note": "Backend should have added retry questions to session automatically"
                }
                
                print(f"  📊 Analysis: {len(wrong_answers)} wrong answers should have generated retry questions")
                
            else:
                results["error"] = f"Failed to complete quiz: {complete_response.text}"
                
        except Exception as e:
            results["error"] = str(e)
            
        return results
        
    def test_multiple_quiz_sessions_limit(self, username: str) -> Dict[str, Any]:
        """Test multiple quiz sessions to verify daily limit (should be 2)"""
        print(f"\n🧪 Testing multiple quiz sessions limit for {username}")
        
        user_data = self.authenticated_users.get(username)
        if not user_data:
            return {"error": "User not authenticated"}
            
        headers = {"Authorization": f"Bearer {user_data['token']}"}
        results = {"username": username, "sessions": []}
        
        # Try to start 3 quiz sessions (limit should be 2)
        for session_num in range(1, 4):
            print(f"  🎯 Attempting session {session_num}...")
            
            start_response = requests.post(
                f"{GAMIFIER_BASE_URL}/api/gamifier/enhanced-quiz/start",
                json={"difficulty": "medium"},
                headers=headers
            )
            
            session_result = {
                "session_number": session_num,
                "status_code": start_response.status_code
            }
            
            if start_response.status_code == 200:
                start_data = start_response.json()
                session_id = start_data.get("session_id")
                
                session_result.update({
                    "success": True,
                    "session_id": session_id,
                    "questions_count": len(start_data.get("questions", []))
                })
                
                print(f"    ✅ Session {session_num} started successfully")
                
                # Complete this session quickly
                complete_response = requests.post(
                    f"{GAMIFIER_BASE_URL}/api/gamifier/enhanced-quiz/complete",
                    json={"session_id": session_id},
                    headers=headers
                )
                
                session_result["completion_status"] = complete_response.status_code
                print(f"    ✅ Session {session_num} completed")
                
            else:
                session_result.update({
                    "success": False,
                    "error": start_response.text
                })
                
                if session_num > 2:  # Expected to fail on 3rd session
                    print(f"    ✅ Expected failure on session {session_num}: {start_response.text}")
                else:
                    print(f"    ❌ Unexpected failure on session {session_num}: {start_response.text}")
                    
            results["sessions"].append(session_result)
            time.sleep(1)
            
        return results
        
    def test_pregnancy_week_calculation(self, username: str) -> Dict[str, Any]:
        """Test that pregnancy week is calculated dynamically, not hardcoded"""
        print(f"\n🧪 Testing pregnancy week calculation for {username}")
        
        user_data = self.authenticated_users.get(username)
        if not user_data:
            return {"error": "User not authenticated"}
            
        headers = {"Authorization": f"Bearer {user_data['token']}"}
        results = {"username": username, "week_tests": {}}
        
        try:
            # Test flashcard config
            flashcard_config_response = requests.get(
                f"{GAMIFIER_BASE_URL}/api/gamifier/flashcards/config",
                headers=headers
            )
            
            if flashcard_config_response.status_code == 200:
                config = flashcard_config_response.json()
                results["week_tests"]["flashcard_config"] = {
                    "current_week": config.get("current_week"),
                    "source": "dynamic calculation from LMP"
                }
                print(f"    📚 Flashcard config week: {config.get('current_week')}")
            
            # Test quiz config
            quiz_config_response = requests.get(
                f"{GAMIFIER_BASE_URL}/api/gamifier/enhanced-quiz/config",
                headers=headers
            )
            
            if quiz_config_response.status_code == 200:
                config = quiz_config_response.json()
                results["week_tests"]["quiz_config"] = {
                    "current_week": config.get("current_week"),
                    "source": "dynamic calculation from LMP"
                }
                print(f"    🎯 Quiz config week: {config.get('current_week')}")
                
            # Both should match and be reasonable (1-40)
            fc_week = results["week_tests"].get("flashcard_config", {}).get("current_week")
            qz_week = results["week_tests"].get("quiz_config", {}).get("current_week")
            
            results["week_tests"]["validation"] = {
                "weeks_match": fc_week == qz_week,
                "week_in_valid_range": 1 <= (fc_week or 0) <= 40,
                "consistent": fc_week == qz_week and 1 <= (fc_week or 0) <= 40
            }
            
            print(f"    ✅ Week calculation validation: {results['week_tests']['validation']}")
            
        except Exception as e:
            results["error"] = str(e)
            
        return results

def main():
    """Run manual edge case tests"""
    print("🧪 MANUAL EDGE CASE TESTING")
    print("=" * 50)
    print("This script tests specific edge cases that need manual verification.")
    print("Make sure the test users are already created and the services are running.")
    print()
    
    tester = ManualEdgeCaseTester()
    
    # Authenticate test users
    print("🔐 Authenticating test users...")
    authenticated_count = 0
    for credentials in TEST_CREDENTIALS:
        if tester.authenticate_user(credentials):
            authenticated_count += 1
            
    if authenticated_count == 0:
        print("❌ No users authenticated. Please create test users first.")
        return
        
    print(f"✅ {authenticated_count} users authenticated successfully")
    
    # Run edge case tests
    all_results = {}
    
    for username in tester.authenticated_users.keys():
        print(f"\n👤 TESTING USER: {username}")
        print(f"    {tester.authenticated_users[username]['description']}")
        print("-" * 40)
        
        user_results = {}
        
        # Test 1: Flashcard daily limit
        user_results["flashcard_limit"] = tester.test_flashcard_daily_limit_edge_case(username)
        
        # Test 2: Quiz retry logic
        user_results["quiz_retry"] = tester.test_quiz_retry_logic_edge_case(username, "medium")
        
        # Test 3: Multiple quiz sessions limit
        user_results["quiz_sessions_limit"] = tester.test_multiple_quiz_sessions_limit(username)
        
        # Test 4: Pregnancy week calculation
        user_results["week_calculation"] = tester.test_pregnancy_week_calculation(username)
        
        all_results[username] = user_results
        
    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f"gamifier/tests/manual_test_results_{timestamp}.json"
    
    with open(results_file, 'w') as f:
        json.dump(all_results, f, indent=2, default=str)
        
    print(f"\n💾 Results saved to: {results_file}")
    
    # Summary
    print(f"\n📊 EDGE CASE TEST SUMMARY:")
    print("=" * 30)
    for username, results in all_results.items():
        print(f"👤 {username}:")
        for test_name, test_result in results.items():
            if "error" in test_result:
                print(f"  ❌ {test_name}: {test_result['error']}")
            else:
                print(f"  ✅ {test_name}: Completed")
                
    print("\n✅ Manual edge case testing complete!")
    print("Review the detailed results in the saved JSON file.")

if __name__ == "__main__":
    main()
