export const REFERENCE_DOCUMENT_TABLE = 'reference_documents';
export const REFERENCE_CHUNK_TABLE = 'reference_chunks';

export const CREATE_REFERENCE_DOCUMENT_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS ${REFERENCE_DOCUMENT_TABLE} (
    id CHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) DEFAULT 'text',
    content MEDIUMTEXT NOT NULL,
    chunk_count INT NOT NULL DEFAULT 0,
    embedding_model VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_reference_documents_created_at (created_at)
  )
`;

export const CREATE_REFERENCE_CHUNK_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS ${REFERENCE_CHUNK_TABLE} (
    id CHAR(36) PRIMARY KEY,
    document_id CHAR(36) NOT NULL,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    embedding JSON NOT NULL,
    token_estimate INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_reference_chunk_position (document_id, chunk_index),
    INDEX idx_reference_chunks_document_id (document_id),
    CONSTRAINT fk_reference_chunks_document_id
      FOREIGN KEY (document_id) REFERENCES ${REFERENCE_DOCUMENT_TABLE}(id)
      ON DELETE CASCADE
  )
`;
