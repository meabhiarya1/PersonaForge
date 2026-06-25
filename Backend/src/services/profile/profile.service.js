import { randomUUID } from 'crypto';
import { query } from '../../config/db.js';
import {
  CREATOR_PROFILE_COLUMNS,
  CREATOR_PROFILE_TABLE
} from '../../models/CreatorProfile.model.js';
import AppError from '../../utils/AppError.js';

const profileColumnMap = {
  name: CREATOR_PROFILE_COLUMNS.NAME,
  language: CREATOR_PROFILE_COLUMNS.LANGUAGE,
  targetAudience: CREATOR_PROFILE_COLUMNS.TARGET_AUDIENCE,
  style: CREATOR_PROFILE_COLUMNS.STYLE,
  duration: CREATOR_PROFILE_COLUMNS.DURATION,
  avatarId: CREATOR_PROFILE_COLUMNS.AVATAR_ID,
  voiceId: CREATOR_PROFILE_COLUMNS.VOICE_ID,
  toneNotes: CREATOR_PROFILE_COLUMNS.TONE_NOTES,
  commonPhrases: CREATOR_PROFILE_COLUMNS.COMMON_PHRASES,
  teachingStyle: CREATOR_PROFILE_COLUMNS.TEACHING_STYLE,
  hookStyle: CREATOR_PROFILE_COLUMNS.HOOK_STYLE
};

const mapProfileRow = (row) => {
  if (!row) return null;

  return {
    id: row[CREATOR_PROFILE_COLUMNS.ID],
    name: row[CREATOR_PROFILE_COLUMNS.NAME],
    language: row[CREATOR_PROFILE_COLUMNS.LANGUAGE],
    targetAudience: row[CREATOR_PROFILE_COLUMNS.TARGET_AUDIENCE],
    style: row[CREATOR_PROFILE_COLUMNS.STYLE],
    duration: row[CREATOR_PROFILE_COLUMNS.DURATION],
    avatarId: row[CREATOR_PROFILE_COLUMNS.AVATAR_ID],
    voiceId: row[CREATOR_PROFILE_COLUMNS.VOICE_ID],
    toneNotes: row[CREATOR_PROFILE_COLUMNS.TONE_NOTES],
    commonPhrases: row[CREATOR_PROFILE_COLUMNS.COMMON_PHRASES],
    teachingStyle: row[CREATOR_PROFILE_COLUMNS.TEACHING_STYLE],
    hookStyle: row[CREATOR_PROFILE_COLUMNS.HOOK_STYLE],
    createdAt: row[CREATOR_PROFILE_COLUMNS.CREATED_AT],
    updatedAt: row[CREATOR_PROFILE_COLUMNS.UPDATED_AT]
  };
};

const buildUpdate = (data) => {
  const assignments = [];
  const params = {};

  Object.entries(data)
    .filter(([key]) => Object.hasOwn(profileColumnMap, key))
    .forEach(([key, value], index) => {
      const paramName = `value${index}`;
      assignments.push(`${profileColumnMap[key]} = :${paramName}`);
      params[paramName] = value ?? null;
    });

  return { assignments, params };
};

export const createCreatorProfile = async (input) => {
  const profileId = randomUUID();

  await query(
    `INSERT INTO ${CREATOR_PROFILE_TABLE} (
      ${CREATOR_PROFILE_COLUMNS.ID},
      ${CREATOR_PROFILE_COLUMNS.NAME},
      ${CREATOR_PROFILE_COLUMNS.LANGUAGE},
      ${CREATOR_PROFILE_COLUMNS.TARGET_AUDIENCE},
      ${CREATOR_PROFILE_COLUMNS.STYLE},
      ${CREATOR_PROFILE_COLUMNS.DURATION},
      ${CREATOR_PROFILE_COLUMNS.AVATAR_ID},
      ${CREATOR_PROFILE_COLUMNS.VOICE_ID},
      ${CREATOR_PROFILE_COLUMNS.TONE_NOTES},
      ${CREATOR_PROFILE_COLUMNS.COMMON_PHRASES},
      ${CREATOR_PROFILE_COLUMNS.TEACHING_STYLE},
      ${CREATOR_PROFILE_COLUMNS.HOOK_STYLE}
    ) VALUES (
      :id,
      :name,
      :language,
      :targetAudience,
      :style,
      :duration,
      :avatarId,
      :voiceId,
      :toneNotes,
      :commonPhrases,
      :teachingStyle,
      :hookStyle
    )`,
    {
      id: profileId,
      name: input.name,
      language: input.language,
      targetAudience: input.targetAudience,
      style: input.style,
      duration: input.duration,
      avatarId: input.avatarId,
      voiceId: input.voiceId || null,
      toneNotes: input.toneNotes || null,
      commonPhrases: input.commonPhrases || null,
      teachingStyle: input.teachingStyle || null,
      hookStyle: input.hookStyle || null
    }
  );

  return getCreatorProfileById(profileId);
};

export const listCreatorProfiles = async () => {
  const rows = await query(
    `SELECT * FROM ${CREATOR_PROFILE_TABLE}
     ORDER BY ${CREATOR_PROFILE_COLUMNS.CREATED_AT} DESC`
  );

  return rows.map(mapProfileRow);
};

export const getCreatorProfileById = async (profileId) => {
  const rows = await query(
    `SELECT * FROM ${CREATOR_PROFILE_TABLE}
     WHERE ${CREATOR_PROFILE_COLUMNS.ID} = :profileId
     LIMIT 1`,
    { profileId }
  );
  const profile = mapProfileRow(rows[0]);

  if (!profile) throw new AppError('Creator profile not found', 404);
  return profile;
};

export const updateCreatorProfile = async (profileId, input) => {
  await getCreatorProfileById(profileId);

  const { assignments, params } = buildUpdate(input);
  if (!assignments.length) return getCreatorProfileById(profileId);

  await query(
    `UPDATE ${CREATOR_PROFILE_TABLE}
     SET ${assignments.join(', ')}
     WHERE ${CREATOR_PROFILE_COLUMNS.ID} = :profileId`,
    { ...params, profileId }
  );

  return getCreatorProfileById(profileId);
};

export const deleteCreatorProfile = async (profileId) => {
  await getCreatorProfileById(profileId);

  await query(
    `DELETE FROM ${CREATOR_PROFILE_TABLE}
     WHERE ${CREATOR_PROFILE_COLUMNS.ID} = :profileId`,
    { profileId }
  );

  return { id: profileId };
};
