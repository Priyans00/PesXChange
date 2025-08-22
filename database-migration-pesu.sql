-- UPDATED DATABASE SCHEMA FOR PESU AUTH
-- Run these commands to modify your existing Supabase database

-- Step 1: Create a backup of existing user_profiles data
CREATE TEMP TABLE temp_user_profiles_backup AS 
SELECT * FROM user_profiles;

-- Step 2: Create the new user_profiles table structure
-- First, drop foreign key constraints to avoid cascade issues
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_seller_id_fkey;
ALTER TABLE item_likes DROP CONSTRAINT IF EXISTS item_likes_user_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_user1_id_fkey;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_user2_id_fkey;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_reviewer_id_fkey;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_reviewee_id_fkey;
ALTER TABLE bookmarks DROP CONSTRAINT IF EXISTS bookmarks_user_id_fkey;
ALTER TABLE item_reports DROP CONSTRAINT IF EXISTS item_reports_reporter_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- Now drop the old user_profiles table
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create the new user_profiles table
CREATE TABLE user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  srn TEXT UNIQUE, -- Make it nullable initially for migration
  prn TEXT, -- PESU Registration Number
  name TEXT,
  email TEXT,
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  
  -- PESU-specific fields from PESU Auth API
  program TEXT, -- Bachelor of Technology, etc.
  branch TEXT, -- Computer Science and Engineering, etc.
  semester TEXT, -- Current semester
  section TEXT, -- Section
  campus_code INTEGER, -- 1 for RR, 2 for EC
  campus TEXT, -- RR or EC
  
  -- App-specific fields
  rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  verified BOOLEAN DEFAULT TRUE, -- All PESU students are verified
  location TEXT DEFAULT 'PES University, Bangalore',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Migrate existing user data
-- Insert existing users with their original IDs to maintain relationships
INSERT INTO user_profiles (
  id, name, phone, bio, avatar_url, rating, location, created_at, updated_at,
  srn -- Will be null for existing users until they login with PESU auth
)
SELECT 
  id, name, phone, bio, avatar_url, rating, location, created_at, updated_at,
  srn
FROM temp_user_profiles_backup;

-- Step 4: Handle existing auth.users that don't have profiles
-- Create placeholder profiles for any items that reference missing users
INSERT INTO user_profiles (id, name, email, location)
SELECT DISTINCT 
  i.seller_id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email, 'Legacy User'),
  au.email,
  'PES University, Bangalore'
FROM items i
LEFT JOIN user_profiles up ON i.seller_id = up.id
LEFT JOIN auth.users au ON i.seller_id = au.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Also handle other tables that might reference missing users
INSERT INTO user_profiles (id, name, email, location)
SELECT DISTINCT 
  il.user_id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email, 'Legacy User'),
  au.email,
  'PES University, Bangalore'
FROM item_likes il
LEFT JOIN user_profiles up ON il.user_id = up.id
LEFT JOIN auth.users au ON il.user_id = au.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Handle messages table
INSERT INTO user_profiles (id, name, email, location)
SELECT DISTINCT 
  m.sender_id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email, 'Legacy User'),
  au.email,
  'PES University, Bangalore'
FROM messages m
LEFT JOIN user_profiles up ON m.sender_id = up.id
LEFT JOIN auth.users au ON m.sender_id = au.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (id, name, email, location)
SELECT DISTINCT 
  m.receiver_id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email, 'Legacy User'),
  au.email,
  'PES University, Bangalore'
FROM messages m
LEFT JOIN user_profiles up ON m.receiver_id = up.id
LEFT JOIN auth.users au ON m.receiver_id = au.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;
-- Step 5: Recreate foreign key constraints
-- Items table
ALTER TABLE items ADD CONSTRAINT items_seller_id_fkey 
  FOREIGN KEY (seller_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Item Likes table
ALTER TABLE item_likes ADD CONSTRAINT item_likes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Messages table
ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
ALTER TABLE messages ADD CONSTRAINT messages_receiver_id_fkey 
  FOREIGN KEY (receiver_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Conversations table
ALTER TABLE conversations ADD CONSTRAINT conversations_user1_id_fkey 
  FOREIGN KEY (user1_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD CONSTRAINT conversations_user2_id_fkey 
  FOREIGN KEY (user2_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Reviews table
ALTER TABLE reviews ADD CONSTRAINT reviews_reviewer_id_fkey 
  FOREIGN KEY (reviewer_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD CONSTRAINT reviews_reviewee_id_fkey 
  FOREIGN KEY (reviewee_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Bookmarks table
ALTER TABLE bookmarks ADD CONSTRAINT bookmarks_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Item Reports table
ALTER TABLE item_reports ADD CONSTRAINT item_reports_reporter_id_fkey 
  FOREIGN KEY (reporter_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Notifications table
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Step 6: Add indexes for the new structure
CREATE INDEX idx_user_profiles_srn ON user_profiles(srn);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_campus ON user_profiles(campus);
CREATE INDEX idx_user_profiles_branch ON user_profiles(branch);

-- Step 7: Create a function to automatically create/update user profile from PESU Auth data
CREATE OR REPLACE FUNCTION upsert_user_profile(
  p_srn TEXT,
  p_prn TEXT,
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_program TEXT,
  p_branch TEXT,
  p_semester TEXT,
  p_section TEXT,
  p_campus_code INTEGER,
  p_campus TEXT
) RETURNS UUID AS $$
DECLARE
  user_id UUID;
  existing_user_id UUID;
BEGIN
  -- First check if a user with this SRN already exists
  SELECT id INTO existing_user_id FROM user_profiles WHERE srn = p_srn;
  
  IF existing_user_id IS NOT NULL THEN
    -- Update existing user
    UPDATE user_profiles SET
      name = p_name,
      email = p_email,
      phone = p_phone,
      program = p_program,
      branch = p_branch,
      semester = p_semester,
      section = p_section,
      campus_code = p_campus_code,
      campus = p_campus,
      last_login = NOW(),
      updated_at = NOW()
    WHERE id = existing_user_id;
    
    RETURN existing_user_id;
  ELSE
    -- Check if there's a user with this email (legacy user)
    SELECT id INTO existing_user_id FROM user_profiles WHERE email = p_email AND srn IS NULL;
    
    IF existing_user_id IS NOT NULL THEN
      -- Update legacy user with PESU data
      UPDATE user_profiles SET
        srn = p_srn,
        prn = p_prn,
        name = p_name,
        phone = p_phone,
        program = p_program,
        branch = p_branch,
        semester = p_semester,
        section = p_section,
        campus_code = p_campus_code,
        campus = p_campus,
        verified = TRUE,
        last_login = NOW(),
        updated_at = NOW()
      WHERE id = existing_user_id;
      
      RETURN existing_user_id;
    ELSE
      -- Create new user
      INSERT INTO user_profiles (
        srn, prn, name, email, phone, program, branch, 
        semester, section, campus_code, campus, last_login
      ) VALUES (
        p_srn, p_prn, p_name, p_email, p_phone, p_program, p_branch,
        p_semester, p_section, p_campus_code, p_campus, NOW()
      )
      RETURNING id INTO user_id;
      
      RETURN user_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create a function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
RETURNS TABLE(
  items_listed BIGINT,
  items_sold BIGINT,
  total_views BIGINT,
  total_likes BIGINT,
  average_rating DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(COUNT(i.id), 0)::BIGINT as items_listed,
    COALESCE(COUNT(i.id) FILTER (WHERE i.is_available = FALSE), 0)::BIGINT as items_sold,
    COALESCE(SUM(i.views), 0)::BIGINT as total_views,
    COALESCE(COUNT(il.id), 0)::BIGINT as total_likes,
    COALESCE(AVG(r.rating), 0)::DECIMAL as average_rating
  FROM user_profiles up
  LEFT JOIN items i ON up.id = i.seller_id
  LEFT JOIN item_likes il ON i.id = il.item_id
  LEFT JOIN reviews r ON up.id = r.reviewee_id
  WHERE up.id = user_id
  GROUP BY up.id;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Clean up temporary table
DROP TABLE IF EXISTS temp_user_profiles_backup;
