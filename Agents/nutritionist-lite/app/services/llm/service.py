## nutritionist-lite/app/services/llm/service.py

import logging
import os
from typing import Optional
from anthropic import Anthropic
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class LLMService:
    """Service for interacting with Claude API"""
    
    def __init__(self):
        self.client = None
        self.model = os.getenv("CLAUDE_MODEL", "claude-3-haiku-20240307")
        self.api_key = os.getenv("ANTHROPIC_API_KEY")
        
    async def initialize(self):
        """Initialize the Claude client"""
        try:
            if not self.api_key:
                raise ValueError("ANTHROPIC_API_KEY not found in environment variables")
                
            self.client = Anthropic(api_key=self.api_key)
            logger.info(f"Claude LLM service initialized successfully with model: {self.model}")
            return True
        except Exception as e:
            logger.error(f"Error initializing Claude LLM service: {str(e)}")
            raise
    
    async def generate_text(self, prompt: str, temperature: float = 0.3, max_tokens: int = 2400) -> str:
        """
        Generate text using Claude API
        """
        if not self.client:
            await self.initialize()
            
        try:
            api_start = time.time()
            
            logger.info(f"Sending prompt to Claude model: {self.model}")
            logger.info(f"⏱️ Prompt details - Length: {len(prompt)} chars, Max tokens: {max_tokens}, Temperature: {temperature}")
            logger.debug(f"Prompt preview: {prompt[:200]}...")
            
            # Time the actual API call
            api_call_start = time.time()
            
            response = self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                temperature=temperature,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            api_call_time = time.time() - api_call_start
            
            generated_text = response.content[0].text
            total_time = time.time() - api_start
            
            logger.info(f"⏱️ Claude API call took: {api_call_time:.2f} seconds")
            logger.info(f"⏱️ Total LLM processing took: {total_time:.2f} seconds")
            logger.info(f"Successfully generated text with {len(generated_text)} characters")
            logger.debug(f"Response preview: {generated_text[:200]}...")
            
            return generated_text
            
        except Exception as e:
            logger.error(f"Error generating text with Claude: {str(e)}")
            raise ValueError(f"Failed to generate text: {str(e)}")

# Create singleton instance
llm_service = LLMService()
