"""
LLM Client for generating quiz questions and flashcards using Anthropic Claude.
"""

import os
import json
import time
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from config.logger import get_logger
from utils.xml_helpers import validate_quiz_xml, validate_flashcard_xml

logger = get_logger(__name__)


@dataclass
class LLMResponse:
    """Response wrapper for LLM operations."""
    content: str
    usage_tokens: int = 0
    response_time: float = 0.0


class LLMClient:
    """
    Client for interacting with Anthropic Claude API to generate educational content.
    """
    
    def __init__(self, api_key: str, debug_mode: bool = False):
        """
        Initialize LLM client.
        
        Args:
            api_key: Anthropic API key
            debug_mode: Enable debug logging of prompts and responses
        """
        self.api_key = api_key
        self.debug_mode = debug_mode
        self.max_retries = 3
        self.base_delay = 1.0  # Base delay for exponential backoff
        
        # Import anthropic client
        try:
            import anthropic
            # Initialize with only required parameters to avoid compatibility issues
            self.client = anthropic.Anthropic(api_key=api_key)
            logger.info("LLM client initialized successfully", extra={
                "extra_fields": {
                    "debug_mode": debug_mode,
                    "max_retries": self.max_retries,
                    "anthropic_version": anthropic.__version__
                }
            })
        except ImportError as e:
            logger.error("Failed to import anthropic package", extra={
                "extra_fields": {
                    "error": str(e)
                }
            })
            raise ImportError("anthropic package is required. Install with: pip install anthropic>=0.3.0")
        except Exception as e:
            logger.error("Failed to initialize LLM client", extra={
                "extra_fields": {
                    "error": str(e)
                }
            })
            raise

    def generate_quiz(
        self, 
        user_profile: dict, 
        rag_contexts: List[dict], 
        difficulty: str, 
        num_questions: int = 3
    ) -> str:
        """
        Generate quiz questions based on user profile and RAG contexts.
        
        Args:
            user_profile: User profile data containing pregnancy details
            rag_contexts: List of RAG context documents
            difficulty: Quiz difficulty level (easy, medium, hard)
            num_questions: Number of questions to generate (default: 3)
            
        Returns:
            str: Raw XML text containing quiz questions
            
        Raises:
            ValueError: If generation fails or XML is invalid
            Exception: For network or API errors
        """
        correlation_id = f"quiz_{int(time.time())}"
        
        logger.info("Starting quiz generation", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "difficulty": difficulty,
                "num_questions": num_questions,
                "user_profile_keys": list(user_profile.keys()) if user_profile else [],
                "rag_contexts_count": len(rag_contexts) if rag_contexts else 0
            }
        })
        
        try:
            # Load prompt template
            prompt = self._load_quiz_prompt_template(
                user_profile=user_profile,
                rag_contexts=rag_contexts,
                difficulty=difficulty,
                num_questions=num_questions
            )
            
            # Generate content with retries
            response = self._make_llm_request_with_retry(
                prompt=prompt,
                correlation_id=correlation_id,
                operation_type="quiz_generation"
            )
            
            # Validate XML structure
            try:
                validate_quiz_xml(response.content, min_questions=num_questions)
                logger.info("Quiz XML validation passed", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "response_tokens": response.usage_tokens,
                        "response_time_ms": response.response_time * 1000
                    }
                })
            except ValueError as e:
                logger.error("Quiz XML validation failed", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "validation_error": str(e)
                    }
                })
                raise ValueError(f"Generated quiz XML is invalid: {str(e)}")
            
            return response.content
            
        except Exception as e:
            logger.error("Quiz generation failed", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "error": str(e),
                    "error_type": type(e).__name__
                }
            })
            raise

    def generate_flashcards(
        self, 
        user_profile: dict, 
        rag_contexts: List[dict], 
        num_cards: int = 3
    ) -> str:
        """
        Generate flashcards based on user profile and RAG contexts.
        
        Args:
            user_profile: User profile data containing pregnancy details
            rag_contexts: List of RAG context documents
            num_cards: Number of flashcards to generate (default: 3)
            
        Returns:
            str: Raw XML text containing flashcards
            
        Raises:
            ValueError: If generation fails or XML is invalid
            Exception: For network or API errors
        """
        correlation_id = f"flashcards_{int(time.time())}"
        
        logger.info("Starting flashcard generation", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "num_cards": num_cards,
                "user_profile_keys": list(user_profile.keys()) if user_profile else [],
                "rag_contexts_count": len(rag_contexts) if rag_contexts else 0
            }
        })
        
        try:
            # Load prompt template
            prompt = self._load_flashcard_prompt_template(
                user_profile=user_profile,
                rag_contexts=rag_contexts,
                num_cards=num_cards
            )
            
            # Generate content with retries
            response = self._make_llm_request_with_retry(
                prompt=prompt,
                correlation_id=correlation_id,
                operation_type="flashcard_generation"
            )
            
            # Validate XML structure
            try:
                validate_flashcard_xml(response.content)
                logger.info("Flashcard XML validation passed", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "response_tokens": response.usage_tokens,
                        "response_time_ms": response.response_time * 1000
                    }
                })
            except ValueError as e:
                logger.error("Flashcard XML validation failed", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "validation_error": str(e)
                    }
                })
                raise ValueError(f"Generated flashcard XML is invalid: {str(e)}")
            
            return response.content
            
        except Exception as e:
            logger.error("Flashcard generation failed", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "error": str(e),
                    "error_type": type(e).__name__
                }
            })
            raise

    def _load_quiz_prompt_template(
        self, 
        user_profile: dict, 
        rag_contexts: List[dict], 
        difficulty: str, 
        num_questions: int
    ) -> str:
        """Load and format quiz prompt template."""
        template_path = os.path.join("prompt_llm", "quiz_prompt.txt")
        try:
            # Load template from file
            with open(template_path, 'r', encoding='utf-8') as f:
                template = f.read()
            
            # Format user profile
            user_profile_json = self._format_user_profile(user_profile)
            
            # Format RAG contexts
            rag_contexts_text = self._format_rag_contexts(rag_contexts)
            
            # Extract pregnancy week for specific formatting
            pregnancy_week = user_profile.get('pregnancy_week', 'unknown')
            
            # Format comprehensive profile
            comprehensive_profile = self._format_comprehensive_profile(user_profile)
            
            # Get flashcard content if available (for quiz context)
            flashcard_content = user_profile.get('flashcard_content', 'No flashcard content available')
            
            # Format template
            formatted_prompt = template.format(
                user_profile_json=user_profile_json,
                rag_contexts_text=rag_contexts_text,
                difficulty=difficulty,
                num_questions=num_questions,
                pregnancy_week=pregnancy_week,
                comprehensive_profile=comprehensive_profile,
                flashcard_content=flashcard_content,
                rag_context=rag_contexts_text
            )
            
            if self.debug_mode:
                logger.debug("Quiz prompt template loaded and formatted", extra={
                    "extra_fields": {
                        "template_length": len(formatted_prompt),
                        "pregnancy_week": pregnancy_week,
                        "difficulty": difficulty
                    }
                })
            
            return formatted_prompt
            
        except FileNotFoundError:
            logger.error("Quiz prompt template file not found", extra={
                "extra_fields": {
                    "template_path": template_path
                }
            })
            raise ValueError("Quiz prompt template file not found")
        except Exception as e:
            logger.error("Failed to load quiz prompt template", extra={
                "extra_fields": {
                    "error": str(e)
                }
            })
            raise

    def _load_flashcard_prompt_template(
        self, 
        user_profile: dict, 
        rag_contexts: List[dict], 
        num_cards: int
    ) -> str:
        """Load and format flashcard prompt template."""
        template_path = os.path.join("prompt_llm", "flashcard_prompt.txt")
        try:
            # Load template from file
            with open(template_path, 'r', encoding='utf-8') as f:
                template = f.read()
            
            # Format user profile components
            pregnancy_week = user_profile.get('pregnancy_week', 'unknown')
            age = user_profile.get('age', 'unknown')
            location = user_profile.get('location', 'unknown')
            country = user_profile.get('country', 'unknown')
            cultural_background = user_profile.get('cultural_background', 'unknown')
            dietary_preferences = user_profile.get('dietary_preferences', 'unknown')
            physical_activity = user_profile.get('physical_activity', 'unknown')
            pregnancy_status = user_profile.get('pregnancy_status', 'unknown')
            estimated_due_date = user_profile.get('estimated_due_date', 'unknown')
            medications_str = self._format_medications(user_profile.get('medications', []))
            substance_use = user_profile.get('substance_use', 'unknown')
            
            # Format RAG contexts
            rag_context = self._format_rag_contexts(rag_contexts)
            
            # Format template
            formatted_prompt = template.format(
                pregnancy_week=pregnancy_week,
                age=age,
                location=location,
                country=country,
                cultural_background=cultural_background,
                dietary_preferences=dietary_preferences,
                physical_activity=physical_activity,
                pregnancy_status=pregnancy_status,
                estimated_due_date=estimated_due_date,
                medications_str=medications_str,
                substance_use=substance_use,
                rag_context=rag_context,
                num_cards=num_cards
            )
            
            if self.debug_mode:
                logger.debug("Flashcard prompt template loaded and formatted", extra={
                    "extra_fields": {
                        "template_length": len(formatted_prompt),
                        "pregnancy_week": pregnancy_week,
                        "num_cards": num_cards
                    }
                })
            
            return formatted_prompt
            
        except FileNotFoundError:
            logger.error("Flashcard prompt template file not found", extra={
                "extra_fields": {
                    "template_path": template_path
                }
            })
            raise ValueError("Flashcard prompt template file not found")
        except Exception as e:
            logger.error("Failed to load flashcard prompt template", extra={
                "extra_fields": {
                    "error": str(e)
                }
            })
            raise

    def _make_llm_request_with_retry(
        self, 
        prompt: str, 
        correlation_id: str, 
        operation_type: str
    ) -> LLMResponse:
        """
        Make LLM request with exponential backoff retry logic.
        
        Args:
            prompt: The formatted prompt to send
            correlation_id: Unique ID for tracking this request
            operation_type: Type of operation for logging
            
        Returns:
            LLMResponse: Response from the LLM
            
        Raises:
            Exception: After all retries are exhausted
        """
        last_exception = None
        
        for attempt in range(self.max_retries):
            try:
                start_time = time.time()
                
                if self.debug_mode:
                    # Log prompt (scrubbed of sensitive data)
                    scrubbed_prompt = self._scrub_sensitive_data(prompt)
                    logger.debug("Making LLM request", extra={
                        "extra_fields": {
                            "correlation_id": correlation_id,
                            "attempt": attempt + 1,
                            "operation_type": operation_type,
                            "prompt_preview": scrubbed_prompt[:500] + "..." if len(scrubbed_prompt) > 500 else scrubbed_prompt
                        }
                    })
                
                # Make API call
                response = self.client.messages.create(
                    model="claude-3-haiku-20240307",
                    max_tokens=4096,
                    temperature=0.1,  # Low temperature for consistent, factual content
                    messages=[{
                        "role": "user",
                        "content": prompt
                    }]
                )
                
                end_time = time.time()
                response_time = end_time - start_time
                
                # Extract content and usage
                content = response.content[0].text.strip()
                usage_tokens = response.usage.input_tokens + response.usage.output_tokens
                
                if self.debug_mode:
                    # Log response (scrubbed of sensitive data)
                    scrubbed_content = self._scrub_sensitive_data(content)
                    logger.debug("LLM request successful", extra={
                        "extra_fields": {
                            "correlation_id": correlation_id,
                            "attempt": attempt + 1,
                            "response_time_ms": response_time * 1000,
                            "usage_tokens": usage_tokens,
                            "response_preview": scrubbed_content[:500] + "..." if len(scrubbed_content) > 500 else scrubbed_content
                        }
                    })
                
                return LLMResponse(
                    content=content,
                    usage_tokens=usage_tokens,
                    response_time=response_time
                )
                
            except Exception as e:
                last_exception = e
                attempt_number = attempt + 1
                
                logger.warning("LLM request failed", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "attempt": attempt_number,
                        "operation_type": operation_type,
                        "error": str(e),
                        "error_type": type(e).__name__
                    }
                })
                
                # If this is the last attempt, don't wait
                if attempt_number >= self.max_retries:
                    break
                
                # Exponential backoff
                delay = self.base_delay * (2 ** attempt)
                logger.info("Retrying LLM request after delay", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "attempt": attempt_number,
                        "delay_seconds": delay,
                        "next_attempt": attempt_number + 1
                    }
                })
                time.sleep(delay)
        
        # All retries exhausted
        error_msg = f"LLM request failed after {self.max_retries} retries"
        if last_exception:
            error_msg += f": {str(last_exception)}"
            
        logger.error("LLM request failed after all retries", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "operation_type": operation_type,
                "max_retries": self.max_retries,
                "final_error": str(last_exception) if last_exception else "No exception details"
            }
        })
        
        if last_exception:
            raise last_exception
        else:
            raise Exception(error_msg)

    def _format_user_profile(self, user_profile: dict) -> str:
        """Format user profile as JSON string."""
        try:
            return json.dumps(user_profile, indent=2, default=str)
        except Exception:
            return str(user_profile)

    def _format_rag_contexts(self, rag_contexts: List[dict]) -> str:
        """Format RAG contexts as readable text."""
        if not rag_contexts:
            return "No relevant context found."
        
        formatted_contexts = []
        for i, context in enumerate(rag_contexts, 1):
            content = context.get('content', '')
            source = context.get('source', 'Unknown')
            formatted_contexts.append(f"Context {i} (Source: {source}):\n{content}")
        
        return "\n\n".join(formatted_contexts)

    def _format_comprehensive_profile(self, user_profile: dict) -> str:
        """Format comprehensive user profile for quiz context."""
        pregnancy_week = user_profile.get('pregnancy_week', 'unknown')
        age = user_profile.get('age', 'unknown')
        location = user_profile.get('location', 'unknown')
        country = user_profile.get('country', 'unknown')
        cultural_background = user_profile.get('cultural_background', 'unknown')
        dietary_preferences = user_profile.get('dietary_preferences', 'unknown')
        physical_activity = user_profile.get('physical_activity', 'unknown')
        pregnancy_status = user_profile.get('pregnancy_status', 'unknown')
        estimated_due_date = user_profile.get('estimated_due_date', 'unknown')
        medications_str = self._format_medications(user_profile.get('medications', []))
        substance_use = user_profile.get('substance_use', 'unknown')
        
        return f"""<user>
Current pregnancy week: {pregnancy_week}
Age: {age}
Location: {location}
Country: {country}
Cultural background: {cultural_background}
Dietary preferences: {dietary_preferences}
Physical activity: {physical_activity}
Pregnancy status: {pregnancy_status}
Due date: {estimated_due_date}
Medications: {medications_str}
Substance use: {substance_use}
</user>"""

    def _format_medications(self, medications: List) -> str:
        """Format medications list as string."""
        if not medications:
            return "None"
        if isinstance(medications, list):
            return ", ".join(str(med) for med in medications)
        return str(medications)

    def _scrub_sensitive_data(self, text: str) -> str:
        """
        Scrub sensitive data from text for logging.
        
        Args:
            text: Text that may contain sensitive information
            
        Returns:
            str: Text with sensitive data replaced with placeholders
        """
        if not text:
            return text
        
        # Replace potential API keys, personal information, etc.
        scrubbed = text
        
        # Replace long alphanumeric strings that might be keys
        import re
        scrubbed = re.sub(r'\b[A-Za-z0-9]{32,}\b', '[REDACTED_KEY]', scrubbed)
        
        # Replace email patterns
        scrubbed = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[REDACTED_EMAIL]', scrubbed)
        
        # Replace phone number patterns
        scrubbed = re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '[REDACTED_PHONE]', scrubbed)
        
        return scrubbed

    def generate_quiz_with_regeneration_context(
        self, 
        user_profile: dict, 
        rag_contexts: List[dict], 
        difficulty: str, 
        num_questions: int = 3,
        previous_rejections: Optional[List[str]] = None
    ) -> str:
        """
        Generate quiz questions with context about previous duplicate rejections.
        
        Args:
            user_profile: User profile data containing pregnancy details
            rag_contexts: List of RAG context documents
            difficulty: Quiz difficulty level (easy, medium, hard)
            num_questions: Number of questions to generate (default: 3)
            previous_rejections: List of rejection reasons from previous attempts
            
        Returns:
            str: Raw XML text containing quiz questions
            
        Raises:
            ValueError: If generation fails or XML is invalid
            Exception: For network or API errors
        """
        correlation_id = f"quiz_regen_{int(time.time())}"
        
        logger.info("Starting quiz regeneration with context", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "difficulty": difficulty,
                "num_questions": num_questions,
                "previous_rejections_count": len(previous_rejections) if previous_rejections else 0
            }
        })
        
        try:
            # Load prompt template with regeneration context
            prompt = self._load_quiz_regeneration_prompt_template(
                user_profile=user_profile,
                rag_contexts=rag_contexts,
                difficulty=difficulty,
                num_questions=num_questions,
                previous_rejections=previous_rejections or []
            )
            
            # Generate content with retries
            response = self._make_llm_request_with_retry(
                prompt=prompt,
                correlation_id=correlation_id,
                operation_type="quiz_regeneration"
            )
            
            # Validate XML structure
            try:
                validate_quiz_xml(response.content, min_questions=num_questions)
                logger.info("Quiz regeneration XML validation passed", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "response_tokens": response.usage_tokens,
                        "response_time_ms": response.response_time * 1000
                    }
                })
            except ValueError as e:
                logger.error("Quiz regeneration XML validation failed", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "validation_error": str(e)
                    }
                })
                raise ValueError(f"Generated quiz XML is invalid: {str(e)}")
            
            return response.content
            
        except Exception as e:
            logger.error("Quiz regeneration failed", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "error": str(e),
                    "error_type": type(e).__name__
                }
            })
            raise

    def generate_flashcards_with_regeneration_context(
        self, 
        user_profile: dict, 
        rag_contexts: List[dict], 
        num_cards: int = 3,
        previous_rejections: Optional[List[str]] = None
    ) -> str:
        """
        Generate flashcards with context about previous duplicate rejections.
        
        Args:
            user_profile: User profile data containing pregnancy details
            rag_contexts: List of RAG context documents
            num_cards: Number of flashcards to generate (default: 3)
            previous_rejections: List of rejection reasons from previous attempts
            
        Returns:
            str: Raw XML text containing flashcards
            
        Raises:
            ValueError: If generation fails or XML is invalid
            Exception: For network or API errors
        """
        correlation_id = f"flashcards_regen_{int(time.time())}"
        
        logger.info("Starting flashcard regeneration with context", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "num_cards": num_cards,
                "previous_rejections_count": len(previous_rejections) if previous_rejections else 0
            }
        })
        
        try:
            # Load prompt template with regeneration context
            prompt = self._load_flashcard_regeneration_prompt_template(
                user_profile=user_profile,
                rag_contexts=rag_contexts,
                num_cards=num_cards,
                previous_rejections=previous_rejections or []
            )
            
            # Generate content with retries
            response = self._make_llm_request_with_retry(
                prompt=prompt,
                correlation_id=correlation_id,
                operation_type="flashcard_regeneration"
            )
            
            # Validate XML structure
            try:
                validate_flashcard_xml(response.content)
                logger.info("Flashcard regeneration XML validation passed", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "response_tokens": response.usage_tokens,
                        "response_time_ms": response.response_time * 1000
                    }
                })
            except ValueError as e:
                logger.error("Flashcard regeneration XML validation failed", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "validation_error": str(e)
                    }
                })
                raise ValueError(f"Generated flashcard XML is invalid: {str(e)}")
            
            return response.content
            
        except Exception as e:
            logger.error("Flashcard regeneration failed", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "error": str(e),
                    "error_type": type(e).__name__
                }
            })
            raise

    def _load_quiz_regeneration_prompt_template(
        self, 
        user_profile: dict, 
        rag_contexts: List[dict], 
        difficulty: str, 
        num_questions: int,
        previous_rejections: List[str]
    ) -> str:
        """
        Load and format quiz regeneration prompt template with duplicate rejection context.
        
        Args:
            user_profile: User profile data
            rag_contexts: RAG context documents
            difficulty: Difficulty level
            num_questions: Number of questions to generate
            previous_rejections: List of rejection reasons
            
        Returns:
            str: Formatted prompt with regeneration context
        """
        # Load base prompt template
        base_prompt = self._load_quiz_prompt_template(
            user_profile=user_profile,
            rag_contexts=rag_contexts,
            difficulty=difficulty,
            num_questions=num_questions
        )
        
        # Add regeneration context
        if previous_rejections:
            regeneration_context = "\n\nIMPORTANT REGENERATION INSTRUCTIONS:\n"
            regeneration_context += "Your previous attempts were rejected for the following reasons:\n"
            for i, rejection in enumerate(previous_rejections, 1):
                regeneration_context += f"{i}. {rejection}\n"
            regeneration_context += "\nPlease generate completely different questions that avoid these issues. "
            regeneration_context += "Ensure the new questions cover different topics, use different phrasing, "
            regeneration_context += "and are not similar to your previous attempts.\n"
            
            return base_prompt + regeneration_context
        
        return base_prompt

    def _load_flashcard_regeneration_prompt_template(
        self, 
        user_profile: dict, 
        rag_contexts: List[dict], 
        num_cards: int,
        previous_rejections: List[str]
    ) -> str:
        """
        Load and format flashcard regeneration prompt template with duplicate rejection context.
        
        Args:
            user_profile: User profile data
            rag_contexts: RAG context documents
            num_cards: Number of cards to generate
            previous_rejections: List of rejection reasons
            
        Returns:
            str: Formatted prompt with regeneration context
        """
        # Load base prompt template
        base_prompt = self._load_flashcard_prompt_template(
            user_profile=user_profile,
            rag_contexts=rag_contexts,
            num_cards=num_cards
        )
        
        # Add regeneration context
        if previous_rejections:
            regeneration_context = "\n\nIMPORTANT REGENERATION INSTRUCTIONS:\n"
            regeneration_context += "Your previous attempts were rejected for the following reasons:\n"
            for i, rejection in enumerate(previous_rejections, 1):
                regeneration_context += f"{i}. {rejection}\n"
            regeneration_context += "\nPlease generate completely different flashcards that avoid these issues. "
            regeneration_context += "Ensure the new flashcards cover different topics, use different phrasing, "
            regeneration_context += "and are not similar to your previous attempts.\n"
            
            return base_prompt + regeneration_context
        
        return base_prompt
