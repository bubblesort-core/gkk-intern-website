-- ============================================
-- SLOT BOOKINGS TABLE + MAX PER SLOT SETTING
-- Creates a booking tracking system for interview slots
-- with temporary hold support (movie-booking style)
-- ============================================

-- 1. New table to track individual slot bookings + holds
CREATE TABLE IF NOT EXISTS slot_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_date TEXT NOT NULL,          -- e.g. "March 5, 2026" (matches form display format)
    booking_time TEXT NOT NULL,          -- e.g. "6:00 PM" (12h format, matches form display)
    applicant_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'held', -- 'held' or 'confirmed'
    held_until TIMESTAMPTZ,             -- When the hold expires (NULL = permanent/confirmed)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: public read + insert + update (form is anonymous/public)
ALTER TABLE slot_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bookings" 
    ON slot_bookings FOR SELECT 
    USING (true);

CREATE POLICY "Anyone can insert bookings" 
    ON slot_bookings FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Anyone can update bookings"
    ON slot_bookings FOR UPDATE
    USING (true);

CREATE POLICY "Anyone can delete bookings"
    ON slot_bookings FOR DELETE
    USING (true);

-- Enable Realtime on slot_bookings for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE slot_bookings;

-- 2. Add max_per_slot setting to existing form_settings table
ALTER TABLE form_settings 
    ADD COLUMN IF NOT EXISTS max_per_slot INTEGER DEFAULT 1;
