import os
import json
import logging
import csv
from typing import List, Dict, Any, Optional
from app.core.knowledge.document_store import Document, document_store

logger = logging.getLogger(__name__)

class KnowledgeBaseLoader:
    """Loader for nutrition knowledge data"""
    
    def __init__(self):
        self.data_path = os.path.join('app', 'data', 'nutrition')
    
    async def load_all(self) -> int:
        """
        Load all nutritional knowledge data into the document store
        
        Returns:
            int: Number of documents loaded
        """
        total_docs = 0
        
        # Load JSON nutrition data
        json_count = await self.load_json_data()
        total_docs += json_count
        
        # Load CSV nutrition data (if available)
        csv_count = await self.load_csv_data()
        total_docs += csv_count
        
        # Load text-based nutrition guidelines (if available)
        text_count = await self.load_text_guidelines()
        total_docs += text_count
        
        logger.info(f"Loaded {total_docs} total nutrition documents")
        return total_docs
    
    async def load_json_data(self) -> int:
        """
        Load nutrition data from JSON files
        
        Returns:
            int: Number of documents loaded
        """
        count = 0
        json_path = os.path.join(self.data_path, 'pregnancy_nutrition.json')
        
        try:
            if os.path.exists(json_path):
                with open(json_path, 'r', encoding='utf-8') as f:
                    nutrition_data = json.load(f)
                
                for entry in nutrition_data:
                    if 'text' in entry:
                        doc = Document(
                            text=entry['text'],
                            metadata=entry.get('metadata', {})
                        )
                        await document_store.add_document(doc)
                        count += 1
                
                logger.info(f"Loaded {count} documents from JSON")
            else:
                logger.warning(f"Nutrition JSON file not found at {json_path}")
        except Exception as e:
            logger.error(f"Error loading JSON data: {str(e)}")
        
        return count
    
    async def load_csv_data(self) -> int:
        """
        Load nutrition data from CSV files
        
        Returns:
            int: Number of documents loaded
        """
        count = 0
        csv_path = os.path.join(self.data_path, 'food_nutrients.csv')
        
        try:
            if os.path.exists(csv_path):
                with open(csv_path, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    
                    for row in reader:
                        if not row:
                            continue
                            
                        # Convert CSV row to a meaningful text entry
                        food_name = row.get('Food', '')
                        if not food_name:
                            continue
                            
                        # Create a structured text from the CSV data
                        text_parts = [f"{food_name} contains:"]
                        
                        # Add nutrient information
                        for key, value in row.items():
                            if key != 'Food' and value and value.strip():
                                text_parts.append(f"- {key}: {value}")
                        
                        text = "\n".join(text_parts)
                        
                        # Create metadata
                        metadata = {
                            "source": "food_nutrients.csv",
                            "food_name": food_name,
                            "food_type": row.get('Type', ''),
                        }
                        
                        # Add document to store
                        doc = Document(
                            text=text,
                            metadata=metadata
                        )
                        await document_store.add_document(doc)
                        count += 1
                
                logger.info(f"Loaded {count} documents from CSV")
            else:
                logger.info(f"Nutrition CSV file not found at {csv_path}")
        except Exception as e:
            logger.error(f"Error loading CSV data: {str(e)}")
        
        return count
    
    async def load_text_guidelines(self) -> int:
        """
        Load nutrition guidelines from text files
        
        Returns:
            int: Number of documents loaded
        """
        count = 0
        guidelines_dir = os.path.join(self.data_path, 'guidelines')
        
        try:
            if os.path.exists(guidelines_dir):
                for filename in os.listdir(guidelines_dir):
                    if filename.endswith('.txt'):
                        file_path = os.path.join(guidelines_dir, filename)
                        
                        try:
                            with open(file_path, 'r', encoding='utf-8') as f:
                                content = f.read()
                            
                            # Split text into manageable chunks (paragraphs)
                            paragraphs = content.split('\n\n')
                            
                            for i, paragraph in enumerate(paragraphs):
                                paragraph = paragraph.strip()
                                if not paragraph:
                                    continue
                                
                                # Create metadata
                                metadata = {
                                    "source": filename,
                                    "chunk": i,
                                    "total_chunks": len(paragraphs)
                                }
                                
                                # Extract trimester from filename if possible
                                if 'first' in filename.lower():
                                    metadata['trimester'] = 'first'
                                elif 'second' in filename.lower():
                                    metadata['trimester'] = 'second'
                                elif 'third' in filename.lower():
                                    metadata['trimester'] = 'third'
                                else:
                                    metadata['trimester'] = 'all'
                                
                                # Add document to store
                                doc = Document(
                                    text=paragraph,
                                    metadata=metadata
                                )
                                await document_store.add_document(doc)
                                count += 1
                        except Exception as e:
                            logger.error(f"Error loading file {filename}: {str(e)}")
                
                logger.info(f"Loaded {count} documents from text guidelines")
            else:
                logger.info(f"Guidelines directory not found at {guidelines_dir}")
        except Exception as e:
            logger.error(f"Error loading text guidelines: {str(e)}")
        
        return count

# Create singleton instance
knowledge_loader = KnowledgeBaseLoader()