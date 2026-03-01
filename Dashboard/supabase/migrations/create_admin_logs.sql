-- Create Admin Logs Table
create table if not exists public.admin_logs (
    id uuid default gen_random_uuid() primary key,
    admin_name text not null,
    action text not null, -- 'Login', 'Logout', 'Update', etc.
    details jsonb default '{}'::jsonb, -- Store extra info like 'Updated Intern X'
    ip_address text,
    user_agent text,
    created_at timestamptz default now()
);

-- Enable RLS
alter table public.admin_logs enable row level security;

-- Policies
-- 1. Allow Insert for Authenticated Users (Admins)
create policy "Allow admin insert logs"
on public.admin_logs for insert
to authenticated
with check (true);

-- 2. Allow Select for Authenticated Users (Admins)
create policy "Allow admin view logs"
on public.admin_logs for select
to authenticated
using (true);

-- 3. Allow Public Insert (for initial login when auth might be flux, but let's stick to auth for now)
-- Actually, if we use the same 'gkk-admin-auth', they are authenticated.

-- Grant access
grant select, insert on public.admin_logs to authenticated;
grant select, insert on public.admin_logs to service_role;
