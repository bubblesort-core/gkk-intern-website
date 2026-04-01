-- PANDAA Chatbot V1.3 - Usage Tracking & Rate Limiting
-- Run this in Supabase SQL Editor

-- 1. Create Usage Table (using user's schema + cycle_start)
create table if not exists public.pandaa_usage (
  id uuid not null default gen_random_uuid (),
  ip_address text not null,
  user_name text null,
  last_name_change timestamp with time zone null default now(),
  ai_message_count integer null default 0,
  contact_refine_count integer null default 0,
  is_blocked boolean null default false,
  cycle_start timestamp with time zone null default now(), -- The start of the 24h window
  last_active timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  constraint pandaa_usage_pkey primary key (id),
  constraint pandaa_usage_ip_address_key unique (ip_address)
) TABLESPACE pg_default;

create index IF not exists idx_pandaa_usage_ip on public.pandaa_usage using btree (ip_address) TABLESPACE pg_default;

-- 2. RLS Policies
alter table public.pandaa_usage enable row level security;

-- Allow public to select/update their own record via IP (simplified for no-auth dashboard)
create policy "PANDAA: Anyone can manage their usage via IP"
    on public.pandaa_usage for all
    using (true) with check (true);
