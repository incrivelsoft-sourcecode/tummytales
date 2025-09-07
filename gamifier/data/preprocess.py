#!/usr/bin/env python3
"""
Data preprocessing script for RAG ingestion.
Reads CSV data, chunks text, embeds chunks, and upserts to Pinecone.

Usage:
    python data/preprocess.py --index-name gamifier-chunks --batch-size 50 --dry-run
    python data/preprocess.py --help
"""

import os
import sys
import csv
import argparse
import time
from typing import List, Dict, Any, Optional
from pathlib import Path

# Add project root to Python path for imports
project_root = Path(__file__).parent.parent.absolute()
sys.path.insert(0, str(project_root))

from config.logger import get_logger
from config.env_loader import get_config
from services.embeddings import EmbeddingService
from services.rag_service import RAGService
from utils.chunkers import SmartChunker, chunk_csv_row

logger = get_logger(__name__)


class RAGPreprocessor:
    """
    Main preprocessing class for RAG data ingestion.
    Handles CSV reading, chunking, embedding, and Pinecone upsert operations.
    """
    
    def __init__(self, 
                 index_name: Optional[str] = None,
                 batch_size: int = 50,
                 dry_run: bool = False):
        """
        Initialize the RAG preprocessor.
        
        Args:
            index_name: Pinecone index name (defaults to config)
            batch_size: Number of chunks to process in each batch
            dry_run: If True, don't actually upsert to Pinecone
        """
        self.batch_size = batch_size
        self.dry_run = dry_run
        
        # Load configuration
        self.config = get_config()
        
        # Initialize services
        logger.info(
            "Initializing RAG preprocessor",
            extra={
                "extra_fields": {
                    "index_name": index_name or self.config.PINECONE_INDEX_NAME,
                    "batch_size": batch_size,
                    "dry_run": dry_run,
                    "embedding_model": self.config.EMBEDDING_MODEL
                }
            }
        )
        
        # Initialize embedding service
        self.embedding_service = EmbeddingService(model_name=self.config.EMBEDDING_MODEL)
        
        # Initialize RAG service (only if not dry run)
        if not dry_run:
            self.rag_service = RAGService(
                api_key=self.config.PINECONE_API_KEY,
                env=self.config.PINECONE_ENV,
                index_name=index_name or self.config.PINECONE_INDEX_NAME
            )
            
            # Initialize index
            if not self.rag_service.init_index():
                raise RuntimeError("Failed to initialize Pinecone index")
        else:
            self.rag_service = None
            logger.info("Running in dry-run mode - Pinecone operations will be skipped")
        
        # Initialize chunker
        self.chunker = SmartChunker(
            max_chunk_size=512,
            min_chunk_size=100,
            overlap_size=50,
            preserve_sentences=True
        )
        
        # Statistics tracking
        self.stats = {
            'rows_processed': 0,
            'chunks_created': 0,
            'chunks_embedded': 0,
            'chunks_upserted': 0,
            'processing_time': 0.0,
            'errors': 0
        }
    
    def read_csv_data(self, csv_path: str) -> List[Dict[str, Any]]:
        """
        Read and validate CSV data.
        
        Args:
            csv_path: Path to the CSV file
            
        Returns:
            List of dictionaries containing row data
            
        Raises:
            FileNotFoundError: If CSV file doesn't exist
            ValueError: If CSV format is invalid
        """
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"CSV file not found: {csv_path}")
        
        logger.info(
            "Reading CSV data",
            extra={"extra_fields": {"csv_path": csv_path}}
        )
        
        rows = []
        
        try:
            with open(csv_path, 'r', encoding='utf-8') as file:
                # Detect delimiter
                sample = file.read(1024)
                file.seek(0)
                
                delimiter = ','
                if '\t' in sample and sample.count('\t') > sample.count(','):
                    delimiter = '\t'
                
                reader = csv.DictReader(file, delimiter=delimiter)
                
                # Validate headers
                required_columns = ['week', 'section']
                text_columns = ['text', 'Details']  # Accept either column name
                
                headers = reader.fieldnames or []
                logger.info(
                    "CSV headers detected",
                    extra={"extra_fields": {"headers": headers}}
                )
                
                # Check required columns
                for col in required_columns:
                    if col not in headers:
                        raise ValueError(f"Required column '{col}' not found in CSV headers: {headers}")
                
                # Check for text column
                text_col_found = any(col in headers for col in text_columns)
                if not text_col_found:
                    raise ValueError(f"No text column found. Expected one of: {text_columns}")
                
                # Read all rows
                for row_num, row in enumerate(reader, start=2):  # Start at 2 since headers are row 1
                    try:
                        # Validate row has required data
                        if not row.get('week') or not row.get('section'):
                            logger.warning(
                                f"Row {row_num} missing required data",
                                extra={"extra_fields": {"row": row_num, "data": row}}
                            )
                            continue
                        
                        # Get text content (try both column names)
                        text_content = row.get('text', row.get('Details', ''))
                        if not text_content or not text_content.strip():
                            logger.warning(
                                f"Row {row_num} has empty text content",
                                extra={"extra_fields": {"row": row_num}}
                            )
                            continue
                        
                        # Normalize the row data
                        normalized_row = {
                            'week': row['week'].strip(),
                            'section': row['section'].strip(),
                            'text': text_content.strip(),
                            'source_id': row.get('source_id', '').strip(),
                            'row_number': row_num
                        }
                        
                        rows.append(normalized_row)
                        
                    except Exception as e:
                        logger.error(
                            f"Error processing row {row_num}",
                            extra={
                                "extra_fields": {
                                    "row": row_num,
                                    "error": str(e),
                                    "data": row
                                }
                            }
                        )
                        self.stats['errors'] += 1
                        continue
        
        except Exception as e:
            logger.error(
                "Failed to read CSV file",
                extra={
                    "extra_fields": {
                        "csv_path": csv_path,
                        "error": str(e)
                    }
                }
            )
            raise
        
        logger.info(
            "CSV data loaded successfully",
            extra={
                "extra_fields": {
                    "total_rows": len(rows),
                    "csv_path": csv_path
                }
            }
        )
        
        return rows
    
    def process_rows_to_chunks(self, rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Process CSV rows into text chunks.
        
        Args:
            rows: List of CSV row dictionaries
            
        Returns:
            List of chunk dictionaries
        """
        logger.info(
            "Processing rows to chunks",
            extra={"extra_fields": {"row_count": len(rows)}}
        )
        
        all_chunks = []
        
        for row in rows:
            try:
                self.stats['rows_processed'] += 1
                
                # Create chunks for this row
                chunks = chunk_csv_row(row, self.chunker)
                
                if chunks:
                    all_chunks.extend(chunks)
                    self.stats['chunks_created'] += len(chunks)
                    
                    logger.debug(
                        f"Created {len(chunks)} chunks for row",
                        extra={
                            "extra_fields": {
                                "row_number": row.get('row_number', 'unknown'),
                                "week": row.get('week'),
                                "section": row.get('section'),
                                "chunks_count": len(chunks)
                            }
                        }
                    )
                else:
                    logger.warning(
                        "No chunks created for row",
                        extra={
                            "extra_fields": {
                                "row_number": row.get('row_number', 'unknown'),
                                "week": row.get('week'),
                                "section": row.get('section')
                            }
                        }
                    )
                
            except Exception as e:
                logger.error(
                    "Error processing row to chunks",
                    extra={
                        "extra_fields": {
                            "row_number": row.get('row_number', 'unknown'),
                            "error": str(e),
                            "row_data": row
                        }
                    }
                )
                self.stats['errors'] += 1
                continue
        
        logger.info(
            "Chunk creation completed",
            extra={
                "extra_fields": {
                    "total_chunks": len(all_chunks),
                    "processed_rows": self.stats['rows_processed']
                }
            }
        )
        
        return all_chunks
    
    def embed_chunks(self, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Generate embeddings for chunks.
        
        Args:
            chunks: List of chunk dictionaries
            
        Returns:
            List of chunks with embedding vectors added
        """
        if not chunks:
            return []
        
        logger.info(
            "Generating embeddings for chunks",
            extra={"extra_fields": {"chunk_count": len(chunks)}}
        )
        
        # Extract texts for batch embedding
        texts = [chunk['text'] for chunk in chunks]
        
        try:
            # Generate embeddings in batch
            embeddings = self.embedding_service.embed_batch(texts)
            
            # Add embeddings to chunks
            embedded_chunks = []
            for chunk, embedding in zip(chunks, embeddings):
                chunk_with_embedding = chunk.copy()
                chunk_with_embedding['embedding_vector'] = embedding
                embedded_chunks.append(chunk_with_embedding)
            
            self.stats['chunks_embedded'] = len(embedded_chunks)
            
            logger.info(
                "Embeddings generated successfully",
                extra={
                    "extra_fields": {
                        "chunks_embedded": len(embedded_chunks),
                        "embedding_dimension": len(embeddings[0]) if embeddings else 0
                    }
                }
            )
            
            return embedded_chunks
            
        except Exception as e:
            logger.error(
                "Failed to generate embeddings",
                extra={
                    "extra_fields": {
                        "chunk_count": len(chunks),
                        "error": str(e)
                    }
                }
            )
            raise
    
    def upsert_chunks_to_pinecone(self, chunks: List[Dict[str, Any]]) -> bool:
        """
        Upsert embedded chunks to Pinecone in batches.
        
        Args:
            chunks: List of chunks with embeddings
            
        Returns:
            True if successful, False otherwise
        """
        if self.dry_run:
            logger.info(
                "DRY RUN: Would upsert chunks to Pinecone",
                extra={"extra_fields": {"chunk_count": len(chunks)}}
            )
            self.stats['chunks_upserted'] = len(chunks)
            return True
        
        if not chunks:
            return True
        
        logger.info(
            "Upserting chunks to Pinecone",
            extra={
                "extra_fields": {
                    "chunk_count": len(chunks),
                    "batch_size": self.batch_size
                }
            }
        )
        
        # Process in batches
        for i in range(0, len(chunks), self.batch_size):
            batch = chunks[i:i + self.batch_size]
            batch_num = i // self.batch_size + 1
            total_batches = (len(chunks) + self.batch_size - 1) // self.batch_size
            
            logger.info(
                f"Processing batch {batch_num}/{total_batches}",
                extra={
                    "extra_fields": {
                        "batch_num": batch_num,
                        "total_batches": total_batches,
                        "batch_size": len(batch)
                    }
                }
            )
            
            try:
                if self.rag_service:  # Type guard for mypy
                    success = self.rag_service.upsert_chunks(batch)
                else:
                    success = False
                
                if success:
                    self.stats['chunks_upserted'] += len(batch)
                    logger.info(
                        f"Batch {batch_num} upserted successfully",
                        extra={
                            "extra_fields": {
                                "batch_num": batch_num,
                                "chunks_in_batch": len(batch)
                            }
                        }
                    )
                else:
                    logger.error(
                        f"Failed to upsert batch {batch_num}",
                        extra={"extra_fields": {"batch_num": batch_num}}
                    )
                    return False
                
                # Brief pause between batches to avoid rate limits
                if i + self.batch_size < len(chunks):
                    time.sleep(0.1)
                    
            except Exception as e:
                logger.error(
                    f"Error upserting batch {batch_num}",
                    extra={
                        "extra_fields": {
                            "batch_num": batch_num,
                            "error": str(e)
                        }
                    }
                )
                return False
        
        return True
    
    def process_csv_file(self, csv_path: str) -> bool:
        """
        Complete preprocessing pipeline for a CSV file.
        
        Args:
            csv_path: Path to the CSV file
            
        Returns:
            True if successful, False otherwise
        """
        start_time = time.time()
        
        logger.info(
            "Starting RAG preprocessing pipeline",
            extra={
                "extra_fields": {
                    "csv_path": csv_path,
                    "batch_size": self.batch_size,
                    "dry_run": self.dry_run
                }
            }
        )
        
        try:
            # Step 1: Read CSV data
            rows = self.read_csv_data(csv_path)
            if not rows:
                logger.warning("No valid rows found in CSV file")
                return False
            
            # Step 2: Process to chunks
            chunks = self.process_rows_to_chunks(rows)
            if not chunks:
                logger.warning("No chunks created from CSV data")
                return False
            
            # Step 3: Generate embeddings
            embedded_chunks = self.embed_chunks(chunks)
            if not embedded_chunks:
                logger.error("Failed to generate embeddings")
                return False
            
            # Step 4: Upsert to Pinecone
            success = self.upsert_chunks_to_pinecone(embedded_chunks)
            
            # Record processing time
            self.stats['processing_time'] = time.time() - start_time
            
            # Log final statistics
            logger.info(
                "RAG preprocessing completed",
                extra={
                    "extra_fields": {
                        "success": success,
                        "statistics": self.stats
                    }
                }
            )
            
            return success
            
        except Exception as e:
            self.stats['processing_time'] = time.time() - start_time
            logger.error(
                "RAG preprocessing failed",
                extra={
                    "extra_fields": {
                        "error": str(e),
                        "statistics": self.stats
                    }
                }
            )
            return False
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get processing statistics."""
        return self.stats.copy()


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Preprocess CSV data for RAG ingestion",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Basic preprocessing with default settings
    python data/preprocess.py
    
    # Custom index and batch size
    python data/preprocess.py --index-name my-index --batch-size 100
    
    # Dry run to test without upserting
    python data/preprocess.py --dry-run
    
    # Process specific CSV file
    python data/preprocess.py --csv-file /path/to/data.csv
        """
    )
    
    parser.add_argument(
        '--csv-file',
        type=str,
        default='data/data.csv',
        help='Path to CSV file (default: data/data.csv)'
    )
    
    parser.add_argument(
        '--index-name',
        type=str,
        help='Pinecone index name (defaults to config value)'
    )
    
    parser.add_argument(
        '--batch-size',
        type=int,
        default=50,
        help='Batch size for processing chunks (default: 50)'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Run without actually upserting to Pinecone'
    )
    
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose logging'
    )
    
    args = parser.parse_args()
    
    # Set log level
    if args.verbose:
        import logging
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Validate CSV file
    csv_path = args.csv_file
    if not os.path.isabs(csv_path):
        csv_path = os.path.join(project_root, csv_path)
    
    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found: {csv_path}")
        sys.exit(1)
    
    try:
        # Initialize preprocessor
        preprocessor = RAGPreprocessor(
            index_name=args.index_name,
            batch_size=args.batch_size,
            dry_run=args.dry_run
        )
        
        # Run preprocessing
        success = preprocessor.process_csv_file(csv_path)
        
        # Print summary
        stats = preprocessor.get_statistics()
        print("\n" + "="*50)
        print("PREPROCESSING SUMMARY")
        print("="*50)
        print(f"CSV File: {csv_path}")
        print(f"Rows Processed: {stats['rows_processed']}")
        print(f"Chunks Created: {stats['chunks_created']}")
        print(f"Chunks Embedded: {stats['chunks_embedded']}")
        print(f"Chunks Upserted: {stats['chunks_upserted']}")
        print(f"Processing Time: {stats['processing_time']:.2f} seconds")
        print(f"Errors: {stats['errors']}")
        print(f"Success: {'Yes' if success else 'No'}")
        
        if args.dry_run:
            print("\nNOTE: This was a dry run. No data was actually upserted to Pinecone.")
        
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\nProcessing interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
