import { randomUUID } from 'crypto';
import { pool, query } from '../../config/db.js';
import env from '../../config/env.js';
import {
  REFERENCE_CHUNK_TABLE,
  REFERENCE_DOCUMENT_TABLE
} from '../../models/ReferenceMemory.model.js';
import AppError from '../../utils/AppError.js';
import { generateEmbeddings } from './embedding.service.js';
import { chunkText, cosineSimilarity } from './vectorMath.js';

const parseEmbedding = (value) => {
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
};

export const saveReferenceDocument = async ({ title, content, sourceType = 'text' }) => {
  const chunks = chunkText(content, {
    chunkSize: env.referenceChunkWords,
    overlap: env.referenceChunkOverlapWords
  });
  if (!chunks.length) throw new AppError('Reference content cannot be empty.', 400);
  if (chunks.length > 100) throw new AppError('Reference is too large. Maximum 100 chunks.', 400);

  const embeddings = await generateEmbeddings(chunks);
  const documentId = randomUUID();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO ${REFERENCE_DOCUMENT_TABLE}
       (id, title, source_type, content, chunk_count, embedding_model)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [documentId, title.trim(), sourceType, content.trim(), chunks.length, env.embeddingModel]
    );

    for (let index = 0; index < chunks.length; index += 1) {
      await connection.execute(
        `INSERT INTO ${REFERENCE_CHUNK_TABLE}
         (id, document_id, chunk_index, content, embedding, token_estimate)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [randomUUID(), documentId, index, chunks[index], JSON.stringify(embeddings[index]), Math.ceil(chunks[index].length / 4)]
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return { id: documentId, title: title.trim(), sourceType, chunkCount: chunks.length, embeddingModel: env.embeddingModel };
};

export const listReferenceDocuments = async () => query(
  `SELECT id, title, source_type AS sourceType, chunk_count AS chunkCount,
          embedding_model AS embeddingModel, created_at AS createdAt, updated_at AS updatedAt
   FROM ${REFERENCE_DOCUMENT_TABLE} ORDER BY created_at DESC`
);

export const deleteReferenceDocument = async (documentId) => {
  const result = await query(`DELETE FROM ${REFERENCE_DOCUMENT_TABLE} WHERE id = :documentId`, { documentId });
  if (!result.affectedRows) throw new AppError('Reference document not found.', 404);
  return { id: documentId };
};

export const searchReferenceMemory = async ({ searchText, limit = 5, documentId = null }) => {
  const [queryEmbedding] = await generateEmbeddings([searchText]);
  const params = {};
  let where = '';
  if (documentId) {
    where = 'WHERE c.document_id = :documentId';
    params.documentId = documentId;
  }

  const rows = await query(
    `SELECT c.id, c.document_id AS documentId, c.chunk_index AS chunkIndex,
            c.content, c.embedding, d.title, d.source_type AS sourceType
     FROM ${REFERENCE_CHUNK_TABLE} c
     JOIN ${REFERENCE_DOCUMENT_TABLE} d ON d.id = c.document_id
     ${where}`,
    params
  );

  return rows
    .map(({ embedding, ...row }) => ({ ...row, score: cosineSimilarity(queryEmbedding, parseEmbedding(embedding)) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((result) => ({ ...result, score: Number(result.score.toFixed(6)) }));
};
