#!/usr/bin/env python3
"""
TummyTales Integration Test Runner
Standalone script to run comprehensive integration tests with real APIs.

Run with: python run_integration_tests.py

This will:
1. Start services if needed
2. Create test users with diverse pregnancy profiles 
3. Test all API endpoints with real data
4. Report comprehensive results
"""

import sys
import os
import subprocess
import time
import signal

# Add current directory to Python path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from test_integration_comprehensive import IntegrationTestSuite, main as run_tests
except ImportError as e:
    print(f"❌ Could not import test suite: {e}")
    print("Make sure you're running from the tests directory")
    sys.exit(1)

def check_service_health(url: str, service_name: str, timeout: int = 30) -> bool:
    """Check if a service is healthy and ready."""
    import requests
    
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            # Different health endpoints for different services
            if "5001" in url:
                # User service - just check a simple endpoint
                response = requests.get(f"{url}/user/users/all", timeout=5)
            else:
                # Gamifier service - use the health endpoint
                response = requests.get(f"{url}/api/gamifier/health", timeout=5)
                
            if response.status_code == 200:
                print(f"✅ {service_name} is healthy")
                return True
        except Exception:
            pass
        
        print(f"⏳ Waiting for {service_name} to be ready...")
        time.sleep(2)
    
    print(f"❌ {service_name} is not responding after {timeout}s")
    return False

def start_gamifier_service():
    """Start the gamifier service if not running."""
    gamifier_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Check if already running
    if check_service_health("http://localhost:5002", "Gamifier Service", timeout=5):
        return None
    
    print("🚀 Starting Gamifier service...")
    
    # Start the service
    try:
        env = os.environ.copy()
        env['FLASK_ENV'] = 'development'
        env['FLASK_APP'] = 'app.py'
        
        process = subprocess.Popen(
            [sys.executable, "app.py"],
            cwd=gamifier_dir,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Give it time to start
        time.sleep(5)
        
        # Check if it started successfully
        if check_service_health("http://localhost:5002", "Gamifier Service", timeout=30):
            return process
        else:
            print("❌ Failed to start Gamifier service")
            if process.poll() is None:
                process.terminate()
            return None
            
    except Exception as e:
        print(f"❌ Error starting Gamifier service: {e}")
        return None

def check_user_service():
    """Check if user management service is running."""
    return check_service_health("http://localhost:5001", "User Management Service", timeout=5)

def print_banner():
    """Print test banner."""
    print("="*80)
    print("🧪 TUMMYTALES COMPREHENSIVE INTEGRATION TEST SUITE")
    print("="*80)
    print("This will test all APIs with real services:")
    print("• MongoDB database")
    print("• Pinecone vector database") 
    print("• Claude LLM API")
    print("• User Management Service")
    print("• Gamifier Service")
    print()
    print("Test scenario:")
    print("• Create 3 diverse pregnancy users")
    print("• Test complete user journey")
    print("• Validate all API endpoints")
    print("• Check rate limiting and error handling")
    print("="*80)
    print()

def print_prerequisites():
    """Print prerequisites for running tests."""
    print("📋 Prerequisites:")
    print("• MongoDB running on localhost:27017")
    print("• User Management Service on localhost:5001")
    print("• Valid API keys in environment:")
    print("  - CLAUDE_API_KEY")
    print("  - PINECONE_API_KEY")
    print("  - PINECONE_ENV")
    print("  - PINECONE_INDEX_NAME")
    print("• Internet connection for external APIs")
    print()

def main():
    """Main function to orchestrate integration tests."""
    print_banner()
    print_prerequisites()
    
    # Check if user wants to continue
    response = input("🤔 Continue with integration tests? (y/N): ").strip().lower()
    if response not in ['y', 'yes']:
        print("👋 Integration tests cancelled")
        return 0
    
    print("\n🔍 Checking service availability...")
    
    # Check user service
    if not check_user_service():
        print("❌ User Management Service is not running")
        print("Please start it first: cd user_management_service && npm start")
        return 1
    
    # Start gamifier service if needed
    gamifier_process = start_gamifier_service()
    
    try:
        # Run the comprehensive tests
        print("\n🧪 Starting comprehensive integration tests...")
        print("This may take several minutes as we test real APIs...")
        print()
        
        results = run_tests()
        
        # Determine exit code based on results
        if results.get("total_tests", 0) == 0:
            print("❌ No tests were executed")
            return 1
            
        success_rate = (results["passed"] / results["total_tests"] * 100) if results["total_tests"] > 0 else 0
        
        if success_rate >= 80:
            print(f"\n🎉 SUCCESS: {success_rate:.1f}% of tests passed")
            return 0
        elif success_rate >= 60:
            print(f"\n⚠️  PARTIAL: {success_rate:.1f}% of tests passed - some issues detected")
            return 1
        else:
            print(f"\n🚨 FAILURE: {success_rate:.1f}% of tests passed - critical issues detected")
            return 1
            
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        return 1
        
    except Exception as e:
        print(f"\n💥 Integration tests failed with exception: {e}")
        return 1
        
    finally:
        # Cleanup: stop gamifier service if we started it
        if gamifier_process and gamifier_process.poll() is None:
            print("\n🧹 Stopping Gamifier service...")
            gamifier_process.terminate()
            try:
                gamifier_process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                gamifier_process.kill()
            print("✅ Gamifier service stopped")

if __name__ == "__main__":
    sys.exit(main())
