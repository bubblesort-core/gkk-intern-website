-- Assign the two specific older candidates to Batch 2
UPDATE "public"."applications"
SET "batch_number" = 'Batch 2'
WHERE "id" IN (
    '5f65710c-067b-4776-a940-bbb257ed428c',
    'f0e94f02-2517-4950-a18b-ec94c015a61d'
);

-- Ensure all other existing candidates that don't have a batch number are set to Batch 1 
-- (This is just a fallback, as the previous schema migration set the default to 'Batch 1')
UPDATE "public"."applications"
SET "batch_number" = 'Batch 1'
WHERE "batch_number" IS NULL OR "batch_number" = '';
