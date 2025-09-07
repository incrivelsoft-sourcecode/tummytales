"""
XML parsing and validation utilities for flashcards and quiz content.
"""

import xml.etree.ElementTree as ET
from typing import List, Dict, Any
import re
from config.logger import get_logger

logger = get_logger(__name__)


def parse_flashcards_xml(xml_string: str) -> List[Dict[str, str]]:
    """
    Parse XML string containing flashcard data.
    
    Args:
        xml_string: XML string with flashcard structure
        
    Returns:
        List[Dict]: List of flashcards, each with 'front' and 'back' keys
        
    Raises:
        ValueError: If XML is invalid or doesn't conform to expected schema
    """
    try:
        # Clean and validate XML string
        cleaned_xml = _clean_xml_string(xml_string)
        root = ET.fromstring(cleaned_xml)
        
        # Validate root element
        if root.tag != 'flashcards':
            raise ValueError("Root element must be 'flashcards'")
        
        flashcards = []
        for card_elem in root.findall('flashcard'):
            front_elem = card_elem.find('front')
            back_elem = card_elem.find('back')
            
            if front_elem is None or back_elem is None:
                raise ValueError("Each flashcard must have 'front' and 'back' elements")
            
            front_text = (front_elem.text or "").strip()
            back_text = (back_elem.text or "").strip()
            
            if not front_text or not back_text:
                raise ValueError("Flashcard front and back text cannot be empty")
            
            flashcards.append({
                'front': front_text,
                'back': back_text
            })
        
        if not flashcards:
            raise ValueError("At least one flashcard must be present")
        
        logger.debug(f"Successfully parsed {len(flashcards)} flashcards")
        return flashcards
        
    except ET.ParseError as e:
        logger.error(f"XML parsing error: {str(e)}")
        raise ValueError(f"Invalid XML format: {str(e)}")
    except Exception as e:
        logger.error(f"Flashcard parsing error: {str(e)}")
        raise ValueError(f"Flashcard parsing failed: {str(e)}")


def parse_quiz_xml(xml_string: str, min_questions: int = 3) -> List[Dict[str, Any]]:
    """
    Parse XML string containing quiz question data.
    
    Args:
        xml_string: XML string with quiz structure
        
    Returns:
        List[Dict]: List of questions with text, options, answer, explanation
        
    Raises:
        ValueError: If XML is invalid or doesn't conform to expected schema
    """
    try:
        # Clean and validate XML string
        cleaned_xml = _clean_xml_string(xml_string)
        root = ET.fromstring(cleaned_xml)
        
        # Validate root element
        if root.tag != 'quiz':
            raise ValueError("Root element must be 'quiz'")
        
        questions = []
        for question_elem in root.findall('question'):
            text_elem = question_elem.find('text')
            options_elem = question_elem.find('options')
            answer_elem = question_elem.find('answer')
            explanation_elem = question_elem.find('explanation')
            
            if any(elem is None for elem in [text_elem, options_elem, answer_elem]):
                raise ValueError("Each question must have 'text', 'options', and 'answer' elements")
            
            question_text = (text_elem.text or "").strip()
            answer = (answer_elem.text or "").strip().upper()
            explanation = (explanation_elem.text or "").strip() if explanation_elem is not None else ""
            
            if not question_text:
                raise ValueError("Question text cannot be empty")
            
            # Parse options
            options = {}
            for option in ['A', 'B', 'C', 'D']:
                option_elem = options_elem.find(option)
                if option_elem is None:
                    raise ValueError(f"Option {option} is required")
                
                option_text = (option_elem.text or "").strip()
                if not option_text:
                    raise ValueError(f"Option {option} text cannot be empty")
                
                options[option] = option_text
            
            # Validate answer
            if answer not in ['A', 'B', 'C', 'D']:
                raise ValueError("Answer must be one of A, B, C, or D")
            
            questions.append({
                'text': question_text,
                'options': options,
                'answer': answer,
                'explanation': explanation
            })
        
        if len(questions) < min_questions:
            raise ValueError(f"Quiz must have at least {min_questions} questions")

        logger.debug(f"Successfully parsed {len(questions)} quiz questions")
        return questions
        
    except ET.ParseError as e:
        logger.error(f"XML parsing error: {str(e)}")
        raise ValueError(f"Invalid XML format: {str(e)}")
    except Exception as e:
        logger.error(f"Quiz parsing error: {str(e)}")
        raise ValueError(f"Quiz parsing failed: {str(e)}")


def validate_flashcard_xml(xml_string: str) -> None:
    """
    Validate flashcard XML without parsing content.
    
    Args:
        xml_string: XML string to validate
        
    Raises:
        ValueError: If XML doesn't conform to flashcard schema
    """
    try:
        parse_flashcards_xml(xml_string)
        logger.debug("Flashcard XML validation passed")
    except ValueError as e:
        logger.error(f"Flashcard XML validation failed: {str(e)}")
        raise


def validate_quiz_xml(xml_string: str, min_questions: int = 3) -> None:
    """
    Validate quiz XML without parsing content.
    
    Args:
        xml_string: XML string to validate
        min_questions: Minimum number of questions required (default: 3)
        
    Raises:
        ValueError: If XML doesn't conform to quiz schema
    """
    try:
        parse_quiz_xml(xml_string, min_questions)
        logger.debug("Quiz XML validation passed")
    except ValueError as e:
        logger.error(f"Quiz XML validation failed: {str(e)}")
        raise


def serialize_flashcards(flashcards: List[Dict[str, str]]) -> str:
    """
    Serialize flashcard data to XML format.
    
    Args:
        flashcards: List of flashcard dicts with 'front' and 'back' keys
        
    Returns:
        str: XML string representation
        
    Raises:
        ValueError: If flashcard data is invalid
    """
    try:
        if not flashcards:
            raise ValueError("Flashcards list cannot be empty")
        
        root = ET.Element('flashcards')
        
        for card in flashcards:
            if not isinstance(card, dict) or 'front' not in card or 'back' not in card:
                raise ValueError("Each flashcard must be a dict with 'front' and 'back' keys")
            
            front_text = str(card['front']).strip()
            back_text = str(card['back']).strip()
            
            if not front_text or not back_text:
                raise ValueError("Flashcard front and back text cannot be empty")
            
            card_elem = ET.SubElement(root, 'flashcard')
            front_elem = ET.SubElement(card_elem, 'front')
            back_elem = ET.SubElement(card_elem, 'back')
            
            front_elem.text = _escape_xml_text(front_text)
            back_elem.text = _escape_xml_text(back_text)
        
        xml_str = ET.tostring(root, encoding='unicode')
        logger.debug(f"Successfully serialized {len(flashcards)} flashcards to XML")
        return xml_str
        
    except Exception as e:
        logger.error(f"Flashcard serialization error: {str(e)}")
        raise ValueError(f"Flashcard serialization failed: {str(e)}")


def serialize_quiz(questions: List[Dict[str, Any]]) -> str:
    """
    Serialize quiz data to XML format.
    
    Args:
        questions: List of question dicts with text, options, answer, explanation
        
    Returns:
        str: XML string representation
        
    Raises:
        ValueError: If quiz data is invalid
    """
    try:
        if not questions or len(questions) < 3:
            raise ValueError("Quiz must have at least 3 questions")
        
        root = ET.Element('quiz')
        
        for question in questions:
            if not isinstance(question, dict):
                raise ValueError("Each question must be a dictionary")
            
            required_keys = ['text', 'options', 'answer']
            if not all(key in question for key in required_keys):
                raise ValueError("Each question must have 'text', 'options', and 'answer'")
            
            question_elem = ET.SubElement(root, 'question')
            
            # Add question text
            text_elem = ET.SubElement(question_elem, 'text')
            text_elem.text = _escape_xml_text(str(question['text']).strip())
            
            # Add options
            options_elem = ET.SubElement(question_elem, 'options')
            options = question['options']
            
            if not isinstance(options, dict):
                raise ValueError("Options must be a dictionary")
            
            for option in ['A', 'B', 'C', 'D']:
                if option not in options:
                    raise ValueError(f"Option {option} is required")
                
                option_elem = ET.SubElement(options_elem, option)
                option_elem.text = _escape_xml_text(str(options[option]).strip())
            
            # Add answer
            answer_elem = ET.SubElement(question_elem, 'answer')
            answer = str(question['answer']).strip().upper()
            
            if answer not in ['A', 'B', 'C', 'D']:
                raise ValueError("Answer must be one of A, B, C, or D")
            
            answer_elem.text = answer
            
            # Add explanation (optional)
            if 'explanation' in question and question['explanation']:
                explanation_elem = ET.SubElement(question_elem, 'explanation')
                explanation_elem.text = _escape_xml_text(str(question['explanation']).strip())
        
        xml_str = ET.tostring(root, encoding='unicode')
        logger.debug(f"Successfully serialized {len(questions)} questions to XML")
        return xml_str
        
    except Exception as e:
        logger.error(f"Quiz serialization error: {str(e)}")
        raise ValueError(f"Quiz serialization failed: {str(e)}")


def _clean_xml_string(xml_string: str) -> str:
    """
    Clean XML string by removing invalid characters and trimming whitespace.
    
    Args:
        xml_string: Raw XML string
        
    Returns:
        str: Cleaned XML string
    """
    if not xml_string or not isinstance(xml_string, str):
        raise ValueError("XML string cannot be empty or None")
    
    # Remove leading/trailing whitespace
    cleaned = xml_string.strip()
    
    # Remove invalid XML characters (control characters except tab, newline, carriage return)
    cleaned = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', cleaned)
    
    return cleaned


def _escape_xml_text(text: str) -> str:
    """
    Escape special XML characters in text content.
    
    Args:
        text: Text to escape
        
    Returns:
        str: Escaped text safe for XML
    """
    if not text:
        return ""
    
    # XML escape mapping
    escapes = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;'
    }
    
    for char, escape in escapes.items():
        text = text.replace(char, escape)
    
    return text
