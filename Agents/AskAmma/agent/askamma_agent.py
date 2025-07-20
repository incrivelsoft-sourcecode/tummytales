# agent/askamma_agent.py
from dotenv import load_dotenv
from langchain.memory import ConversationSummaryBufferMemory
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage
import os, traceback, warnings, requests, json, time
from typing import Dict, Any

from context.mcp_context import MCPContext
from services.prompt_builder import PromptBuilder

warnings.filterwarnings("ignore", category=DeprecationWarning)
load_dotenv()

class DrAmmaAgent:
    """Dr. Amma Pregnancy Advisor Agent using MCP context and LangChain"""

    def __init__(self):
        self.llm = None
        self.memory_llm = None
        self.memory = None
        self.prompt_builder = PromptBuilder()
        self._initialize_llms()
        self._initialize_memory()

    def _initialize_llms(self):
        try:
            # Validate API key first
            api_key = os.getenv("OPENROUTER_API_KEY")
            if not api_key or not api_key.startswith('sk-or-v1-'):
                print("❌ [ERROR] Invalid OpenRouter API key format. Should start with 'sk-or-v1-'")
                raise Exception("Invalid OpenRouter API key format")

            self.llm = ChatOpenAI(
                api_key=api_key,
                base_url="https://openrouter.ai/api/v1",  # Correct API base URL
                model=os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.1-8b-instruct:free"),  # Updated model
                temperature=0.3,
                max_tokens=800,
                timeout=60,
                max_retries=3,
                request_timeout=60,
                streaming=False,
                model_kwargs={"stream": False}
            )

            self.memory_llm = ChatOpenAI(
                api_key=api_key,
                base_url="https://openrouter.ai/api/v1",
                model=os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.1-8b-instruct:free"),
                temperature=0.1,
                max_tokens=200,
                timeout=30,
                max_retries=2,
                streaming=False,
                model_kwargs={"stream": False}
            )
        except Exception as e:
            print(f"❌ [ERROR] Failed to initialize LLMs: {e}")
            raise

    def _initialize_memory(self):
        try:
            self.memory = ConversationSummaryBufferMemory(
                llm=self.memory_llm,
                return_messages=True,
                max_token_limit=1024
            )
        except Exception:
            self.memory = None

    def validate_api_key(self) -> bool:
        """Validate API key format and presence"""
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            print("❌ [ERROR] OPENROUTER_API_KEY environment variable not set")
            return False
        
        if not api_key.startswith('sk-or-v1-'):
            print(f"❌ [ERROR] Invalid API key format. Expected format: sk-or-v1-... Got: {api_key[:10]}...")
            return False
        
        print("✅ [DEBUG] API key format validation passed")
        return True

    def test_connection(self) -> bool:
        """Test API connection with proper error handling"""
        try:
            print("🔄 [DEBUG] Testing API connection...")
            
            if not self.validate_api_key():
                return False

            # Use the correct API endpoint
            headers = {
                "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:8000",  # Your app's URL
                "X-Title": "Dr. Amma Pregnancy Advisor"
            }

            # Try a simpler, more reliable model first
            test_models = [
                "meta-llama/llama-3.1-8b-instruct:free",
                "microsoft/phi-3-medium-4k-instruct:free",
                "google/gemma-2-9b-it:free"
            ]

            for model in test_models:
                payload = {
                    "model": model,
                    "messages": [{"role": "user", "content": "Hello, please respond with 'Connection test successful'"}],
                    "max_tokens": 50,
                    "temperature": 0.1,
                    "stream": False
                }

                print(f"🔍 [DEBUG] Testing model: {model}")
                
                try:
                    response = requests.post(
                        "https://openrouter.ai/api/v1/chat/completions",  # Correct endpoint
                        headers=headers,
                        json=payload,
                        timeout=30
                    )
                    
                    print(f"🔍 [DEBUG] Response status: {response.status_code}")
                    print(f"🔍 [DEBUG] Response content-type: {response.headers.get('content-type', 'N/A')}")
                    
                    # Check if we're getting HTML instead of JSON
                    if response.headers.get('content-type', '').startswith('text/html'):
                        print("❌ [DEBUG] Received HTML response instead of JSON - check API endpoint and key")
                        continue
                    
                    if response.status_code == 200:
                        try:
                            result = response.json()
                            if "choices" in result and len(result["choices"]) > 0:
                                message_content = result["choices"][0]["message"]["content"]
                                print(f"✅ [DEBUG] API connection test successful with model: {model}")
                                print(f"🔍 [DEBUG] Test response: {message_content}")
                                
                                # Update the working model
                                os.environ["OPENROUTER_MODEL"] = model
                                return True
                            else:
                                print(f"❌ [DEBUG] No choices in response for {model}: {result}")
                        except json.JSONDecodeError as e:
                            print(f"❌ [DEBUG] JSON decode error for {model}: {e}")
                            print(f"🔍 [DEBUG] Raw response: {response.text[:500]}")
                    
                    elif response.status_code == 401:
                        print("❌ [DEBUG] Authentication failed - check your API key")
                        return False
                    elif response.status_code == 429:
                        print("⚠️ [DEBUG] Rate limited, waiting before next attempt...")
                        time.sleep(2)
                        continue
                    else:
                        print(f"❌ [DEBUG] API test failed for {model} with status {response.status_code}: {response.text[:200]}")
                        
                except requests.exceptions.RequestException as e:
                    print(f"❌ [DEBUG] Request failed for {model}: {e}")
                    continue
                
            print("❌ [DEBUG] All models failed connection test")
            return False
                
        except Exception as e:
            print(f"❌ [ERROR] Connection test failed: {e}")
            traceback.print_exc()
            return False

    def _direct_api_call(self, context: MCPContext) -> str:
        """Direct API call to OpenRouter with enhanced error handling"""
        try:
            system_prompt = self.prompt_builder.build_system_prompt(context)
            user_prompt = self.prompt_builder.build_user_prompt(context)

            # Truncate prompts if too long to avoid token limits
            max_system_chars = 3000
            max_user_chars = 1500
            
            if len(system_prompt) > max_system_chars:
                system_prompt = system_prompt[:max_system_chars] + "..."
                print("⚠️ [DEBUG] System prompt truncated due to length")
                
            if len(user_prompt) > max_user_chars:
                user_prompt = user_prompt[:max_user_chars] + "..."
                print("⚠️ [DEBUG] User prompt truncated due to length")

            headers = {
                "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:8000",
                "X-Title": "Dr. Amma Pregnancy Advisor"
            }

            # Use the working model from connection test
            model = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.1-8b-instruct:free")
            
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 600,  # Reduced to ensure response fits
                "stream": False,
                "top_p": 1,
                "frequency_penalty": 0,
                "presence_penalty": 0
            }

            print(f"🔄 [DEBUG] Making API call with model: {model}")
            print(f"🔍 [DEBUG] Payload size: {len(json.dumps(payload))} characters")
            
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=60
            )

            print(f"🔍 [DEBUG] API Response status: {response.status_code}")
            
            # Check content type first
            content_type = response.headers.get('content-type', '')
            if content_type.startswith('text/html'):
                print("❌ [DEBUG] Received HTML response - API endpoint or authentication issue")
                raise Exception("Received HTML response instead of JSON - check API configuration")
            
            if response.status_code == 200:
                try:
                    result = response.json()
                    
                    if "error" in result:
                        error_msg = result["error"].get("message", "Unknown API error")
                        print(f"❌ [DEBUG] API returned error: {error_msg}")
                        raise Exception(f"API error: {error_msg}")
                    
                    if "choices" in result and len(result["choices"]) > 0:
                        content = result["choices"][0]["message"]["content"]
                        
                        # Check for usage info
                        if "usage" in result:
                            usage = result["usage"]
                            print(f"🔍 [DEBUG] Token usage - Prompt: {usage.get('prompt_tokens')}, Completion: {usage.get('completion_tokens')}")
                        
                        print("✅ [DEBUG] Direct API call successful")
                        return content.strip()
                    else:
                        print(f"❌ [DEBUG] No choices in API response: {result}")
                        raise Exception("No response content generated")
                        
                except json.JSONDecodeError as e:
                    print(f"❌ [DEBUG] JSON decode error: {e}")
                    print(f"🔍 [DEBUG] Raw response: {response.text[:500]}")
                    raise Exception(f"Invalid JSON response: {e}")
                    
            elif response.status_code == 429:
                print("❌ [DEBUG] Rate limit exceeded")
                raise Exception("Rate limit exceeded. Please try again later.")
            elif response.status_code == 401:
                print("❌ [DEBUG] Authentication failed")
                raise Exception("Authentication failed. Check your API key.")
            elif response.status_code == 400:
                try:
                    error_detail = response.json()
                    print(f"❌ [DEBUG] Bad request: {error_detail}")
                except:
                    print(f"❌ [DEBUG] Bad request: {response.text}")
                raise Exception(f"Bad request - check your input parameters")
            else:
                print(f"❌ [DEBUG] API call failed with status {response.status_code}: {response.text}")
                raise Exception(f"API call failed with status {response.status_code}")

        except Exception as e:
            print(f"❌ [ERROR] Direct API call failed: {e}")
            raise



    def generate_response(self, input_dict: Dict[str, Any]) -> str:
        try:
            print("🔄 [DEBUG] Starting response generation...")
            context = MCPContext(input_dict)

            print(f"🔍 [DEBUG] Context created. Category: {context.category}")
            print(f"🔍 [DEBUG] Priority: {context.get_priority_level()}")

            # Validate API key
            if not self.validate_api_key():
                print("❌ [ERROR] API key validation failed")
                return "Error: OpenRouter API key not configured properly. Please check your API key format."

            # Test connection
            if not self.test_connection():
                print("❌ [ERROR] API connection test failed")
                return "I'm experiencing technical difficulties connecting to the AI service. Please try again in a few minutes or consult your healthcare provider directly."

            # Try direct API call
            try:
                result = self._direct_api_call(context)
                print("✅ [DEBUG] Direct API approach succeeded")
                return result
            except Exception as e:
                print(f"❌ [DEBUG] Direct API approach failed: {e}")
                return "I apologize for the technical difficulty. Please try again or consult your healthcare provider for personalized pregnancy advice."

        except Exception as e:
            print(f"❌ [ERROR] Final failure in generate_response: {e}")
            traceback.print_exc()
            return "I apologize for the technical difficulty. Please consult your healthcare provider for personalized pregnancy advice."

    def clear_memory(self):
        try:
            if self.memory:
                self.memory.clear()
                return True
        except Exception:
            pass
        return False

    def get_context_info(self, input_dict: Dict[str, Any]) -> Dict[str, Any]:
        try:
            context = MCPContext(input_dict)
            return context.to_dict()
        except Exception as e:
            return {"error": str(e)}