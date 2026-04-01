-- SCHEMA FOR PANDAA KNOWLEDGE BASE (PHASE 11)
-- This table stores the instruction-response pairs from bubblesort_dataset.csv

CREATE TABLE IF NOT EXISTS pandaa_knowledge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instruction TEXT NOT NULL,
    response TEXT NOT NULL,
    category TEXT,
    project TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pandaa_knowledge ENABLE ROW LEVEL SECURITY;

-- Allow public read access (as it's general knowledge)
CREATE POLICY "Public Read Access" ON pandaa_knowledge
    FOR SELECT USING (true);

-- SEARCH FUNCTION: Finds the best matching instruction based on keywords
CREATE OR REPLACE FUNCTION search_pandaa_knowledge(p_query TEXT)
RETURNS TABLE (
    instruction TEXT,
    response TEXT,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pk.instruction, 
        pk.response,
        ts_rank_cd(to_tsvector('english', pk.instruction), plainto_tsquery('english', p_query)) AS rank
    FROM pandaa_knowledge pk
    WHERE to_tsvector('english', pk.instruction) @@ plainto_tsquery('english', p_query)
    ORDER BY rank DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- INSERT EXAMPLES (Execute these after creating the table)
-- You can use a CSV importer in Supabase UI or run inserts like this:
-- INSERT INTO pandaa_knowledge (instruction, response, category, project) VALUES 
-- ('How do I apply for GKKIntern right now?', 'Apply through the GKKIntern internal portal...', 'Recruitment', 'GKKIntern');
