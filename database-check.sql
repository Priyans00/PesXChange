-- DATABASE HEALTH CHECK
-- Run this in Supabase SQL Editor to check your database state

-- Check if user_profiles table exists and its structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- Check if the upsert function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'upsert_user_profile';

-- Check sample data in user_profiles (first 5 rows)
SELECT id, srn, name, email, campus 
FROM user_profiles 
LIMIT 5;

-- Check messages table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;

-- Check foreign key constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('messages', 'items', 'item_likes');
