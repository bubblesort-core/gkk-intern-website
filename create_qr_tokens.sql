-- ============================================
-- INTERN QR TOKENS TABLE
-- Stores unique tokens for QR code-based profile access
-- ============================================

-- Create the table
CREATE TABLE IF NOT EXISTS intern_qr_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    id_card_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

-- Index for fast token lookups (the primary access pattern)
CREATE INDEX IF NOT EXISTS idx_intern_qr_tokens_token ON intern_qr_tokens(token);

-- Index for admin lookups by application
CREATE INDEX IF NOT EXISTS idx_intern_qr_tokens_app_id ON intern_qr_tokens(application_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE intern_qr_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can SELECT by token (needed for the public profile page)
CREATE POLICY "Allow public read by token"
    ON intern_qr_tokens
    FOR SELECT
    USING (true);

-- Policy: Only authenticated users (admins) can INSERT/UPDATE/DELETE
CREATE POLICY "Allow admin insert"
    ON intern_qr_tokens
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow admin update"
    ON intern_qr_tokens
    FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin delete"
    ON intern_qr_tokens
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- ============================================
-- STORAGE BUCKET FOR ID CARDS
-- ============================================

-- Create a storage bucket for intern ID card images
INSERT INTO storage.buckets (id, name, public)
VALUES ('intern-id-cards', 'intern-id-cards', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload to the bucket (admin page has its own auth guard)
CREATE POLICY "Allow upload to intern-id-cards"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'intern-id-cards');

-- Allow public read from the bucket (so the profile page can display the image)
CREATE POLICY "Allow public read from intern-id-cards"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'intern-id-cards');

-- Allow anyone to update in the bucket (for upsert/overwrite)
CREATE POLICY "Allow update in intern-id-cards"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'intern-id-cards');

-- Allow anyone to delete from the bucket
CREATE POLICY "Allow delete from intern-id-cards"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'intern-id-cards');
