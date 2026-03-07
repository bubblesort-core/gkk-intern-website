-- =============================================
-- Report Submission Links Table
-- Admin-managed Google Form links for project report submissions
-- =============================================

CREATE TABLE IF NOT EXISTS report_submission_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    form_url TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    target_type TEXT NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'batch', 'intern')),
    target_batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    target_intern_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_report_links_target_type ON report_submission_links(target_type);
CREATE INDEX IF NOT EXISTS idx_report_links_batch ON report_submission_links(target_batch_id) WHERE target_batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_report_links_intern ON report_submission_links(target_intern_id) WHERE target_intern_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_report_links_enabled ON report_submission_links(is_enabled);

-- Enable RLS
ALTER TABLE report_submission_links ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can do everything with report links"
ON report_submission_links
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.admin_credentials ac
        WHERE (ac.username = (select auth.jwt() ->> 'email') OR ac.auth_email = (select auth.jwt() ->> 'email'))
        AND ac.is_active = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.admin_credentials ac
        WHERE (ac.username = (select auth.jwt() ->> 'email') OR ac.auth_email = (select auth.jwt() ->> 'email'))
        AND ac.is_active = true
    )
);

-- Interns can read enabled links that target them
CREATE POLICY "Interns can view their report links"
ON report_submission_links
FOR SELECT
USING (
    is_enabled = true
    AND (
        target_type = 'all'
        OR (target_type = 'intern' AND target_intern_id = auth.uid())
        OR (target_type = 'batch' AND target_batch_id IN (
            SELECT t.batch_id FROM teams t
            INNER JOIN team_members tm ON tm.team_id = t.id
            WHERE tm.user_id = auth.uid()
        ))
    )
);
