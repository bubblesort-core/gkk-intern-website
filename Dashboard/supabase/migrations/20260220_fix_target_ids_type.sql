
-- Fix target_ids column type mismatch (json string vs json array)
-- This updates rows where target_ids is stored as a stringified JSON array
-- Example: "[\"id1\", \"id2\"]" -> ["id1", "id2"]

UPDATE announcements
SET target_ids = (target_ids #>> '{}')::jsonb
WHERE jsonb_typeof(target_ids) = 'string';
