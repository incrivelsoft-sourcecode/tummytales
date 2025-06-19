from dotenv import load_dotenv
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationSummaryBufferMemory
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage
import os, traceback, json
import warnings
from typing import Dict, Any, List
import asyncio
from datetime import datetime

# Suppress deprecation warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)

# Load env vars
load_dotenv()

class DrAmmaAgent:
    """Dr. Amma Pregnancy Advisor Agent with multiple execution strategies"""
    
    def __init__(self):
        self.llm = None
        self.memory_llm = None
        self.memory = None
        self.crew_available = True
        self._initialize_llms()
        self._initialize_memory()
        
    def _initialize_llms(self):
        """Initialize LLM instances with error handling"""
        try:
            # Main LLM for responses
            self.llm = ChatOpenAI(
                api_key=os.getenv("OPENROUTER_API_KEY"),
                base_url="https://openrouter.ai/api/v1",
                model=os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-8b-instruct:free"),
                temperature=0.3,
                max_tokens=800,
                timeout=60,
                max_retries=3,
                request_timeout=60
            )
            
            # Memory LLM (lighter configuration)
            self.memory_llm = ChatOpenAI(
                api_key=os.getenv("OPENROUTER_API_KEY"),
                base_url="https://openrouter.ai/api/v1",
                model=os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-8b-instruct:free"),
                temperature=0.1,
                max_tokens=200,
                timeout=30,
                max_retries=2
            )
            
            print("✅ [INIT] LLM instances initialized successfully")
            
        except Exception as e:
            print(f"❌ [ERROR] Failed to initialize LLMs: {e}")
            raise
    
    def _initialize_memory(self):
        """Initialize conversation memory"""
        try:
            self.memory = ConversationSummaryBufferMemory(
                llm=self.memory_llm,
                return_messages=True,
                max_token_limit=1024
            )
            print("✅ [INIT] Memory initialized successfully")
        except Exception as e:
            print(f"❌ [ERROR] Failed to initialize memory: {e}")
            self.memory = None
    
    def test_connection(self) -> bool:
        """Test if OpenRouter API is working correctly"""
        try:
            response = self.llm.invoke("Hello, can you respond with 'API connection successful'?")
            print(f"✅ [TEST] OpenRouter connection successful: {response.content}")
            return True
        except Exception as e:
            print(f"❌ [TEST] OpenRouter connection failed: {e}")
            return False
    
    def _create_system_prompt(self, input_dict: Dict[str, Any]) -> str:
        """Create a comprehensive system prompt for Dr. Amma"""
        
        # Extract patient information
        age = self._clean_value(input_dict.get("age"))
        weight = self._clean_value(input_dict.get("weight"))
        height_ft = self._clean_value(input_dict.get("height_ft"))
        height_in = self._clean_value(input_dict.get("height_in"))
        gestational_age = self._clean_value(input_dict.get("gestational_age"))
        symptoms = self._clean_value(input_dict.get("symptoms"))
        allergies = self._clean_value(input_dict.get("allergies"))
        medications = self._clean_value(input_dict.get("medications"))
        blood_test = self._clean_value(input_dict.get("blood_test"))
        urine_test = self._clean_value(input_dict.get("urine_test"))
        diabetes_test = self._clean_value(input_dict.get("diabetes_test"))
        culture = self._clean_value(input_dict.get("culture"))
        location = self._clean_value(input_dict.get("location"))
        
        system_prompt = f"""You are Dr. Amma, a compassionate and experienced obstetrician-gynecologist with over 15 years of practice. You specialize in providing culturally sensitive pregnancy care and have extensive experience working with diverse populations, particularly South Asian communities.

PATIENT PROFILE:
- Age: {age}
- Weight: {weight} lb  
- Height: {height_ft}'{height_in}"
- Gestational Age: {gestational_age}
- Location: {location}
- Cultural Background: {culture}
- Current Symptoms: {symptoms}
- Allergies: {allergies}
- Current Medications: {medications}
- Recent Tests: Blood ({blood_test}), Urine ({urine_test}), Diabetes ({diabetes_test})

YOUR APPROACH:
- Be warm, empathetic, and reassuring while being medically accurate
- Consider cultural sensitivities and practices relevant to the patient's background
- Provide practical, actionable advice
- Always emphasize the importance of consulting healthcare providers for serious concerns
- Use clear, non-technical language while maintaining medical accuracy
- Address the specific question asked without overwhelming with unnecessary information

RESPONSE FORMAT:
Provide a response that directly addresses the patient's question with empathy and medical accuracy."""

        return system_prompt
    
    def _clean_value(self, value) -> str:
        """Clean and standardize input values"""
        if value is None or value == "" or value == "null":
            return "not specified"
        if isinstance(value, (list, dict)):
            return str(value) if value else "not specified"
        return str(value).strip()
    
    def _format_chat_history(self, chat_history) -> str:
        """Format chat history for context"""
        if not chat_history or not isinstance(chat_history, list):
            return "This is our first interaction."
        
        formatted_history = []
        # Take only the last 2-3 exchanges to avoid token overflow
        recent_messages = chat_history[-4:] if len(chat_history) > 4 else chat_history
        
        for msg in recent_messages:
            if isinstance(msg, dict) and "role" in msg and "content" in msg:
                role = msg["role"].title()
                content = msg["content"][:200]  # Limit content length
                formatted_history.append(f"{role}: {content}")
        
        return "\n".join(formatted_history) if formatted_history else "This is our first interaction."
    
    def _try_crewai_approach(self, input_dict: Dict[str, Any]) -> str:
        """Attempt to use CrewAI (if available and working)"""
        try:
            # Import CrewAI components only when needed
            from crewai import Agent, Task, Crew, Process
            
            # Create a simple, focused prompt for CrewAI
            question = input_dict.get("question", "No question provided")
            culture = self._clean_value(input_dict.get("culture"))
            location = self._clean_value(input_dict.get("location"))
            gestational_age = self._clean_value(input_dict.get("gestational_age"))
            
            # Simplified task description for CrewAI
            task_description = f"""As Dr. Amma, a pregnancy advisor, please answer this patient's question:

Patient Question: {question}
Patient Background: {culture} culture, located in {location}
Gestational Age: {gestational_age}

Provide a warm, medically accurate response that addresses their specific concern and mentions when to consult healthcare providers."""
            
            # Create agent with minimal configuration
            agent = Agent(
                role="Pregnancy Advisor",
                goal="Provide accurate pregnancy guidance",
                backstory="Dr. Amma is an experienced obstetrician providing compassionate care",
                llm=self.llm,
                verbose=False,  # Reduce verbosity
                allow_delegation=False,
                max_execution_time=60
            )
            
            # Create task
            task = Task(
                description=task_description,
                expected_output="A compassionate, medically accurate response in 2-3 paragraphs",
                agent=agent
            )
            
            # Create and run crew
            crew = Crew(
                agents=[agent],
                tasks=[task],
                verbose=False,  # Reduce verbosity
                process=Process.sequential,
                max_execution_time=90
            )
            
            print("🚀 [DEBUG] Attempting CrewAI execution...")
            
            try:
                result = crew.kickoff()
            except Exception as e:
                print(f"❌ [CrewAI] kickoff() failed: {str(e)}")
                traceback.print_exc()
            
            if result and hasattr(result, 'raw') and result.raw:
                response_text = str(result.raw).strip()
                if len(response_text) > 20:  # Basic validation
                    print("✅ [DEBUG] CrewAI execution successful")
                    return response_text
            
            raise Exception("CrewAI returned invalid result")
            
        except Exception as e:
            print(f"❌ [DEBUG] CrewAI approach failed: {str(e)}")
            self.crew_available = False  # Disable CrewAI for subsequent calls
            return None
    
    def _direct_llm_approach(self, input_dict: Dict[str, Any]) -> str:
        """Direct LLM approach using LangChain with structured prompting"""
        try:
            # Create system and user messages
            system_prompt = self._create_system_prompt(input_dict)
            
            # Format the user question with context
            question = input_dict.get("question", "No question provided")
            chat_history = self._format_chat_history(input_dict.get("chat_history"))
            
            user_message = f"""Previous conversation context:
{chat_history}

Current question: {question}

Please provide your response as Dr. Amma, keeping in mind my medical profile and cultural background mentioned in your system instructions."""
            
            # Create message chain
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_message)
            ]
            
            print("🔄 [DEBUG] Using direct LLM approach...")
            print("\n📝 [PROMPT] Final rendered prompt:\n")
            print(f"SYSTEM:\n{system_prompt}\n")
            print(f"USER:\n{user_message}\n")

            response = self.llm.invoke(messages)
            
            if response and response.content:
                print("✅ [DEBUG] Direct LLM approach successful")
                return response.content.strip()
            else:
                raise Exception("LLM returned empty response")
                
        except Exception as e:
            print(f"❌ [ERROR] Direct LLM approach failed: {e}")
            raise
    
    def _simple_fallback(self, question: str) -> str:
        """Simple fallback for when all else fails"""
        try:
            simple_prompt = f"""As Dr. Amma, a pregnancy advisor, please briefly answer: {question}

Keep your response compassionate and medically accurate, and mention consulting healthcare providers."""
            
            response = self.llm.invoke(simple_prompt)
            return response.content.strip() if response and response.content else None
        except:
            return None
    
    def generate_response(self, input_dict: Dict[str, Any]) -> str:
        """Main response generation method with multiple fallback strategies"""
        try:
            print("🔍 [DEBUG] Starting response generation...")
            print("🔍 [DEBUG] Available input keys:", list(input_dict.keys()))
            
            # Validate API key
            if not os.getenv("OPENROUTER_API_KEY"):
                return "Error: OpenRouter API key not configured."
            
            # Strategy 1: Try CrewAI (if available and not previously failed)
            if self.crew_available:
                try:
                    crewai_result = self._try_crewai_approach(input_dict)
                    if crewai_result:
                        return crewai_result
                except Exception as e:
                    print(f"❌ [DEBUG] CrewAI strategy failed: {e}")
                    self.crew_available = False
            
            # Strategy 2: Direct LLM approach with structured prompting
            try:
                return self._direct_llm_approach(input_dict)
            except Exception as e:
                print(f"❌ [DEBUG] Direct LLM approach failed: {e}")
            
            # Strategy 3: Simple fallback
            question = input_dict.get("question", "No question provided")
            fallback_result = self._simple_fallback(question)
            if fallback_result:
                print("⚠️ [DEBUG] Using simple fallback response")
                return fallback_result
            
            # Strategy 4: Last resort
            return "I apologize for the technical difficulty. Please consult your healthcare provider for personalized pregnancy advice regarding your specific concerns."
            
        except Exception as e:
            print(f"❌ [ERROR] All response generation strategies failed: {e}")
            traceback.print_exc()
            return "I apologize for the technical difficulty. Please consult your healthcare provider for personalized pregnancy advice."
    
    def clear_memory(self):
        """Clear conversation memory"""
        try:
            if self.memory:
                self.memory.clear()
                print("✅ [MEMORY] Conversation history cleared")
                return True
        except Exception as e:
            print(f"❌ [ERROR] Failed to clear memory: {e}")
        return False