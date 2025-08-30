-- Add nickname field to user_profiles table for enhanced privacy
-- This allows users to display a nickname instead of their real name for security reasons

-- Add nickname column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN nickname TEXT;

-- Add a check constraint to ensure nickname length is reasonable
ALTER TABLE user_profiles 
ADD CONSTRAINT nickname_length_check 
CHECK (nickname IS NULL OR (LENGTH(nickname) >= 2 AND LENGTH(nickname) <= 50));

-- Create index on nickname for faster searches (optional but recommended)
CREATE INDEX idx_user_profiles_nickname ON user_profiles(nickname) WHERE nickname IS NOT NULL;

-- Update the updated_at trigger to handle nickname changes
-- (This assumes you have an updated_at trigger already set up)
-- If you don't have an updated_at trigger, you can add this:

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_profiles if it doesn't exist
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.nickname IS 'Optional display name for enhanced privacy - users can choose to show this instead of their real name';
