-- 1. Enable the pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Create the Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_application_email()
RETURNS trigger AS $$
DECLARE
    -- CREDENTIALS FROM .env
    project_url TEXT := 'https://hjpsyxqakzrhvzegehtm.supabase.co/functions/v1/send-email';
    anon_key    TEXT := 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqcHN5eHFha3pyaHZ6ZWdlaHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NTI5NjMsImV4cCI6MjA4NDMyODk2M30.nfBtyd_doPQBkBfzHYtQ2q0yl1vf5y0QZPRrkHCOwAU';
    
    request_body JSONB;
BEGIN
    -- Construct the email body
    request_body := json_build_object(
        'to', NEW.email,
        'subject', 'Application Confirmation: ' || NEW.full_name,
        'text', 'Dear ' || NEW.full_name || E',\n\nThank you for applying to GKK Hire. We have received your application and will review it shortly.\n\nBest regards,\nGKK Team',
        'html', '<p>Dear ' || NEW.full_name || ',</p><p>Thank you for applying to <strong>GKK Hire</strong>. We have received your application and will review it shortly.</p><p>Best regards,<br>GKK Team</p>'
    );

    -- Send the request using pg_net (Corrected function name: net.http_post)
    PERFORM net.http_post(
        url := project_url,
        headers := json_build_object(
            'Content-Type', 'application/json',
            'Authorization', anon_key
        )::jsonb,
        body := request_body
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the Trigger
DROP TRIGGER IF EXISTS on_application_submit ON public.applications;

CREATE TRIGGER on_application_submit
AFTER INSERT ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_application_email();
