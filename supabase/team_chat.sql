-- ============================================
-- TEAM CHAT SYSTEM SCHEMA
-- ============================================

-- Create team_messages table
CREATE TABLE IF NOT EXISTS team_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user_name TEXT NOT NULL,
    message TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create team_typing table for typing indicators
CREATE TABLE IF NOT EXISTS team_typing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user_name TEXT NOT NULL,
    is_typing BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_messages_team_id ON team_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_created_at ON team_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_team_typing_team_id ON team_typing(team_id);

-- Enable Row Level Security
ALTER TABLE team_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_typing ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_messages

-- Users can view messages from their team
CREATE POLICY "Users can view team messages" ON team_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = team_messages.team_id
            AND team_members.user_id = auth.uid()
        )
    );

-- Users can insert messages to their team
CREATE POLICY "Users can send team messages" ON team_messages
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = team_messages.team_id
            AND team_members.user_id = auth.uid()
        )
    );

-- Users can soft-delete (update is_deleted) their own messages
CREATE POLICY "Users can delete own messages" ON team_messages
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- RLS Policies for team_typing

-- Users can view typing status from their team
CREATE POLICY "Users can view typing status" ON team_typing
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = team_typing.team_id
            AND team_members.user_id = auth.uid()
        )
    );

-- Users can insert/update their own typing status
CREATE POLICY "Users can update typing status" ON team_typing
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can modify own typing status" ON team_typing
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own typing status" ON team_typing
    FOR DELETE
    USING (user_id = auth.uid());

-- Enable Realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE team_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE team_typing;

-- Function to auto-cleanup old typing indicators (older than 10 seconds)
CREATE OR REPLACE FUNCTION cleanup_old_typing()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM team_typing 
    WHERE updated_at < NOW() - INTERVAL '10 seconds';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to cleanup on new typing insert
DROP TRIGGER IF EXISTS trigger_cleanup_typing ON team_typing;
CREATE TRIGGER trigger_cleanup_typing
    AFTER INSERT ON team_typing
    FOR EACH STATEMENT
    EXECUTE FUNCTION cleanup_old_typing();

-- Grant permissions
GRANT ALL ON team_messages TO authenticated;
GRANT ALL ON team_typing TO authenticated;
