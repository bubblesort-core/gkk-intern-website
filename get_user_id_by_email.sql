-- Create a function to get user ID by email from auth.users
-- This is required because we cannot directly query auth.users from the client
-- SECURITY DEFINER allows this function to run with the privileges of the creator (postgres/admin)

create or replace function get_user_id_by_email(email_input text)
returns uuid
language plpgsql
security definer
as $$
declare
  found_id uuid;
begin
  select id into found_id
  from auth.users
  where email = email_input;
  
  return found_id;
end;
$$;

-- Grant access to service_role (used by Edge Functions)
grant execute on function get_user_id_by_email to service_role;

-- Optional: Revoke from public/anon to be safe
revoke execute on function get_user_id_by_email from public;
revoke execute on function get_user_id_by_email from anon;
revoke execute on function get_user_id_by_email from authenticated;
