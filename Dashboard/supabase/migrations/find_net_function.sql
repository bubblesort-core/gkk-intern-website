-- Check where the http_post function lives
SELECT 
    routine_schema, 
    routine_name,
    data_type
FROM 
    information_schema.routines
WHERE 
    routine_name LIKE '%http_post%';

-- Also check installed extensions
SELECT * FROM pg_extension WHERE extname = 'pg_net';
