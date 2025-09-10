"""
Text chunking utilities for RAG preprocessing.
Provides smart chunking strategies for maternal health content.
"""

import re
import hashlib
from typing import List, Dict, Any, Optional, Tuple
from config.logger import get_logger

logger = get_logger(__name__)


class SmartChunker:
    """
    Smart text chunker that respects sentence boundaries and logical content structure.
    Optimized for maternal health educational content.
    """
    
    def __init__(self, 
                 max_chunk_size: int = 512,
                 min_chunk_size: int = 100,
                 overlap_size: int = 50,
                 preserve_sentences: bool = True):
        """
        Initialize the smart chunker.
        
        Args:
            max_chunk_size: Maximum characters per chunk
            min_chunk_size: Minimum characters per chunk
            overlap_size: Number of characters to overlap between chunks
            preserve_sentences: Whether to preserve sentence boundaries
        """
        self.max_chunk_size = max_chunk_size
        self.min_chunk_size = min_chunk_size
        self.overlap_size = overlap_size
        self.preserve_sentences = preserve_sentences
        
        # Sentence boundary patterns for maternal health content
        self.sentence_patterns = [
            r'[.!?]\s+',  # Standard sentence endings
            r'[.!?]"?\s+',  # With optional quotes
            r';\s+',  # Semicolon boundaries for medical lists
        ]
        
        logger.info(
            "Initialized SmartChunker",
            extra={
                "extra_fields": {
                    "max_chunk_size": max_chunk_size,
                    "min_chunk_size": min_chunk_size,
                    "overlap_size": overlap_size,
                    "preserve_sentences": preserve_sentences
                }
            }
        )
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """
        Split text into sentences using multiple patterns.
        
        Args:
            text: Input text to split
            
        Returns:
            List of sentences
        """
        # Clean text
        text = text.strip()
        if not text:
            return []
        
        # Try each pattern and use the one that gives the most sensible splits
        best_split = [text]
        
        for pattern in self.sentence_patterns:
            try:
                sentences = re.split(pattern, text)
                # Filter out empty sentences and clean
                sentences = [s.strip() for s in sentences if s.strip()]
                
                # Prefer splits that create reasonable sentence lengths
                if len(sentences) > 1:
                    avg_length = sum(len(s) for s in sentences) / len(sentences)
                    if 20 <= avg_length <= 300:  # Reasonable sentence length
                        best_split = sentences
                        break
            except Exception as e:
                logger.warning(
                    f"Error with sentence pattern {pattern}: {e}",
                    extra={"extra_fields": {"pattern": pattern, "error": str(e)}}
                )
                continue
        
        return best_split
    
    def _create_chunk_overlap(self, previous_chunk: str, current_text: str) -> str:
        """
        Create overlap between chunks by taking the end of the previous chunk.
        
        Args:
            previous_chunk: Previous chunk text
            current_text: Current text to prepend overlap to
            
        Returns:
            Text with overlap prepended
        """
        if not previous_chunk or len(previous_chunk) <= self.overlap_size:
            return current_text
        
        # Take the last overlap_size characters, try to find sentence boundary
        overlap_text = previous_chunk[-self.overlap_size:]
        
        if self.preserve_sentences:
            # Try to find sentence start in overlap
            sentences = self._split_into_sentences(overlap_text)
            if len(sentences) > 1:
                overlap_text = sentences[-1]  # Use last complete sentence
        
        return f"{overlap_text.strip()} {current_text.strip()}"
    
    def chunk_text(self, text: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Chunk text into smaller pieces with smart boundary detection.
        
        Args:
            text: Input text to chunk
            metadata: Base metadata to attach to each chunk
            
        Returns:
            List of chunk dictionaries with text and metadata
        """
        if not text or not text.strip():
            logger.warning("Empty text provided for chunking")
            return []
        
        text = text.strip()
        logger.info(
            "Chunking text",
            extra={
                "extra_fields": {
                    "text_length": len(text),
                    "metadata": metadata
                }
            }
        )
        
        # If text is smaller than min_chunk_size, return as single chunk
        if len(text) <= self.max_chunk_size:
            chunk_id = self._generate_chunk_id(text, metadata)
            return [{
                'id': chunk_id,
                'text': text,
                'week': metadata.get('week'),
                'section': metadata.get('section'),
                'metadata': metadata,
                'char_count': len(text)
            }]
        
        chunks = []
        
        if self.preserve_sentences:
            chunks = self._chunk_by_sentences(text, metadata)
        else:
            chunks = self._chunk_by_characters(text, metadata)
        
        logger.info(
            "Text chunking completed",
            extra={
                "extra_fields": {
                    "original_length": len(text),
                    "chunk_count": len(chunks),
                    "avg_chunk_size": sum(c['char_count'] for c in chunks) / len(chunks) if chunks else 0
                }
            }
        )
        
        return chunks
    
    def _chunk_by_sentences(self, text: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Chunk text by preserving sentence boundaries.
        
        Args:
            text: Input text
            metadata: Base metadata
            
        Returns:
            List of chunks
        """
        sentences = self._split_into_sentences(text)
        if not sentences:
            return []
        
        chunks = []
        current_chunk = ""
        previous_chunk = ""
        
        for sentence in sentences:
            # Check if adding this sentence would exceed max size
            potential_chunk = f"{current_chunk} {sentence}".strip()
            
            if len(potential_chunk) <= self.max_chunk_size:
                current_chunk = potential_chunk
            else:
                # Save current chunk if it meets minimum size
                if current_chunk and len(current_chunk) >= self.min_chunk_size:
                    chunk_text = self._create_chunk_overlap(previous_chunk, current_chunk) if previous_chunk else current_chunk
                    chunk_id = self._generate_chunk_id(chunk_text, metadata)
                    
                    chunks.append({
                        'id': chunk_id,
                        'text': chunk_text,
                        'week': metadata.get('week'),
                        'section': metadata.get('section'),
                        'metadata': metadata.copy(),
                        'char_count': len(chunk_text)
                    })
                    
                    previous_chunk = current_chunk
                
                # Start new chunk with current sentence
                current_chunk = sentence
        
        # Add final chunk
        if current_chunk and len(current_chunk) >= self.min_chunk_size:
            chunk_text = self._create_chunk_overlap(previous_chunk, current_chunk) if previous_chunk else current_chunk
            chunk_id = self._generate_chunk_id(chunk_text, metadata)
            
            chunks.append({
                'id': chunk_id,
                'text': chunk_text,
                'week': metadata.get('week'),
                'section': metadata.get('section'),
                'metadata': metadata.copy(),
                'char_count': len(chunk_text)
            })
        
        return chunks
    
    def _chunk_by_characters(self, text: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Chunk text by character count with overlap.
        
        Args:
            text: Input text
            metadata: Base metadata
            
        Returns:
            List of chunks
        """
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + self.max_chunk_size
            
            # If this isn't the last chunk, try to find a good break point
            if end < len(text):
                # Look for whitespace near the end
                for i in range(end, max(start + self.min_chunk_size, end - 50), -1):
                    if text[i].isspace():
                        end = i
                        break
            
            chunk_text = text[start:end].strip()
            
            if chunk_text and len(chunk_text) >= self.min_chunk_size:
                chunk_id = self._generate_chunk_id(chunk_text, metadata)
                
                chunks.append({
                    'id': chunk_id,
                    'text': chunk_text,
                    'week': metadata.get('week'),
                    'section': metadata.get('section'),
                    'metadata': metadata.copy(),
                    'char_count': len(chunk_text)
                })
            
            # Move start position with overlap
            start = max(start + self.max_chunk_size - self.overlap_size, end)
        
        return chunks
    
    def _generate_chunk_id(self, text: str, metadata: Dict[str, Any]) -> str:
        """
        Generate a unique ID for a chunk based on content and metadata.
        Ensures ASCII-only characters for Pinecone compatibility.
        
        Args:
            text: Chunk text
            metadata: Chunk metadata
            
        Returns:
            Unique chunk ID (ASCII only)
        """
        # Create a hash of the text content
        text_hash = hashlib.sha1(text.encode('utf-8')).hexdigest()[:8]
        
        # Include week and section in ID for better organization
        week = metadata.get('week', 'unknown')
        section = metadata.get('section', 'general')
        
        # Clean week string - convert Unicode to ASCII
        week_clean = str(week).replace('–', '-').replace('—', '-')  # Replace em/en dashes
        week_clean = re.sub(r'[^a-zA-Z0-9\-]', '', week_clean)  # Keep only ASCII alphanumeric and hyphens
        
        # Clean section name for ID
        section_clean = re.sub(r'[^a-zA-Z0-9]', '', section.lower())[:10]
        
        return f"week{week_clean}-{section_clean}-{text_hash}"


def chunk_csv_row(row_data: Dict[str, Any], chunker: SmartChunker) -> List[Dict[str, Any]]:
    """
    Process a single CSV row and create chunks.
    
    Args:
        row_data: Dictionary containing CSV row data
        chunker: SmartChunker instance
        
    Returns:
        List of chunk dictionaries ready for embedding
    """
    # Extract required fields
    week = row_data.get('week', '')
    section = row_data.get('section', '')
    text = row_data.get('text', row_data.get('Details', ''))  # Handle both column names
    source_id = row_data.get('source_id', '')
    
    if not text or not text.strip():
        logger.warning(
            "Empty text field in CSV row",
            extra={"extra_fields": {"week": week, "section": section}}
        )
        return []
    
    # Prepare metadata
    metadata = {
        'week': week,
        'section': section,
        'source_id': source_id,
        'content_type': 'maternal_health',
        'created_at': None  # Will be set during upsert
    }
    
    # Remove empty metadata fields
    metadata = {k: v for k, v in metadata.items() if v}
    
    logger.debug(
        "Processing CSV row for chunking",
        extra={
            "extra_fields": {
                "week": week,
                "section": section,
                "text_length": len(text),
                "source_id": source_id
            }
        }
    )
    
    # Create chunks
    chunks = chunker.chunk_text(text, metadata)
    
    return chunks
