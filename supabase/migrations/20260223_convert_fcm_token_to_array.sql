DO $$ 
BEGIN
    -- 0. Cleanup from any previous failed runs where fcm_token_old might exist incorrectly
    -- If fcm_token is already an array, we are done
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
          AND column_name = 'fcm_token' 
          AND data_type = 'ARRAY'
    ) THEN
        -- If old column still exists, drop it
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'fcm_token_old') THEN
            ALTER TABLE profiles DROP COLUMN fcm_token_old;
        END IF;
        RETURN;
    END IF;

    -- 1. Rename existing text column to fcm_token_old
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
          AND column_name = 'fcm_token' 
          AND data_type = 'text'
    ) THEN
        ALTER TABLE profiles RENAME COLUMN fcm_token TO fcm_token_old;
    END IF;

    -- 2. Add new array column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
          AND column_name = 'fcm_token'
    ) THEN
        ALTER TABLE profiles ADD COLUMN fcm_token TEXT[] DEFAULT '{}';
    END IF;

    -- 3. Migrate data from fcm_token_old to fcm_token
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
          AND column_name = 'fcm_token_old'
    ) THEN
        -- Use ::text cast to avoid type conflicts if fcm_token_old was somehow changed
        UPDATE profiles 
        SET fcm_token = ARRAY[fcm_token_old::text] 
        WHERE fcm_token_old::text IS NOT NULL 
          AND fcm_token_old::text != '';
        
        -- 4. Clean up old column
        ALTER TABLE profiles DROP COLUMN fcm_token_old;
    END IF;
END $$;

-- 5. Helper function to add/remove tokens (idempotent CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION add_fcm_token(user_id_param UUID, new_token TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET fcm_token = array_append(array_remove(fcm_token, new_token), new_token)
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION remove_fcm_token(user_id_param UUID, target_token TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET fcm_token = array_remove(fcm_token, target_token)
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
