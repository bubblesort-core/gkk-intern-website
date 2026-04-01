-- FINAL PANDAA USAGE FIX --
-- Run this whole script in your Supabase SQL Editor

-- 1. Ensure columns exist (especially cycle_start)
alter table public.pandaa_usage add column if not exists cycle_start timestamp with time zone default now();
alter table public.pandaa_usage add column if not exists last_active timestamp with time zone default now();

-- 2. RESET RLS (This is likely why it's empty)
alter table public.pandaa_usage disable row level security;
alter table public.pandaa_usage enable row level security;

-- Delete old policies to avoid duplicates
drop policy if exists "PANDAA: Anyone can manage their usage via IP" on public.pandaa_usage;
drop policy if exists "PANDAA: Public access" on public.pandaa_usage;

-- Create a fresh, permissive policy
create policy "PANDAA: Public access"
    on public.pandaa_usage for all
    using (true) with check (true);

-- 3. Grant permissions to anonymous role
grant all on table public.pandaa_usage to anon;
grant all on table public.pandaa_usage to authenticated;
grant all on table public.pandaa_usage to service_role;

-- 4. Verify index
create unique index if not exists idx_pandaa_usage_ip_unique on public.pandaa_usage (ip_address);
