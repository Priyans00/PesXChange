-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. User Profiles Table (extends auth.users)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  verified BOOLEAN DEFAULT FALSE,
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  location TEXT DEFAULT 'PES University, Bangalore',
  year_of_study INTEGER CHECK (year_of_study >= 1 AND year_of_study <= 4),
  branch TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Categories Table
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Phones, laptops, gadgets and electronic accessories'),
('Books', 'Textbooks, novels, reference books and study materials'),
('Clothing', 'Clothes, shoes, accessories and fashion items'),
('Furniture', 'Study tables, chairs, beds and room furniture'),
('Sports', 'Sports equipment, gym gear and fitness accessories'),
('Vehicles', 'Bikes, cycles and other vehicles'),
('Others', 'Miscellaneous items not covered in other categories');

-- 3. Items Table
CREATE TABLE items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  location TEXT NOT NULL DEFAULT 'PES University, Bangalore',
  year INTEGER CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM NOW())),
  condition TEXT NOT NULL CHECK (condition IN ('New', 'Like New', 'Good', 'Fair')),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  images TEXT[] DEFAULT '{}',
  views INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Item Likes Table
CREATE TABLE item_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- 5. Messages Table (for chat functionality)
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Conversations Table (to track chat conversations)
CREATE TABLE conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  last_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id) -- Ensure consistent ordering
);

-- 7. Reviews Table (for seller ratings)
CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reviewer_id, reviewee_id, item_id)
);

-- 8. Bookmarks/Saved Items Table
CREATE TABLE bookmarks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- 9. Item Reports Table (for reporting inappropriate content)
CREATE TABLE item_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Notifications Table
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('message', 'like', 'review', 'item_sold', 'item_expired')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional data related to the notification
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for better performance
CREATE INDEX idx_items_seller_id ON items(seller_id);
CREATE INDEX idx_items_category_id ON items(category_id);
CREATE INDEX idx_items_condition ON items(condition);
CREATE INDEX idx_items_price ON items(price);
CREATE INDEX idx_items_created_at ON items(created_at DESC);
CREATE INDEX idx_items_is_available ON items(is_available);
CREATE INDEX idx_items_location ON items(location);

CREATE INDEX idx_item_likes_user_id ON item_likes(user_id);
CREATE INDEX idx_item_likes_item_id ON item_likes(item_id);

CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

CREATE INDEX idx_conversations_user1_id ON conversations(user1_id);
CREATE INDEX idx_conversations_user2_id ON conversations(user2_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX idx_reviews_item_id ON reviews(item_id);

CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_item_id ON bookmarks(item_id);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Profiles are viewable by everyone" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for categories
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

-- RLS Policies for items
CREATE POLICY "Items are viewable by everyone" ON items
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own items" ON items
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update their own items" ON items
  FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Users can delete their own items" ON items
  FOR DELETE USING (auth.uid() = seller_id);

-- RLS Policies for item_likes
CREATE POLICY "Likes are viewable by everyone" ON item_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" ON item_likes
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS Policies for reviews
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);

-- RLS Policies for bookmarks
CREATE POLICY "Users can view their own bookmarks" ON bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own bookmarks" ON bookmarks
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for item_reports
CREATE POLICY "Users can view their own reports" ON item_reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports" ON item_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Functions and Triggers

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update user rating based on reviews
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles 
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews 
    WHERE reviewee_id = NEW.reviewee_id
  )
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update rating when new review is added
CREATE TRIGGER on_review_created
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_user_rating();

-- Function to increment item views
CREATE OR REPLACE FUNCTION increment_item_views(item_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE items SET views = views + 1 WHERE id = item_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to update conversation timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure user1_id is always the smaller UUID
  INSERT INTO conversations (user1_id, user2_id, last_message_id, updated_at)
  VALUES (
    LEAST(NEW.sender_id, NEW.receiver_id),
    GREATEST(NEW.sender_id, NEW.receiver_id),
    NEW.id,
    NEW.created_at
  )
  ON CONFLICT (user1_id, user2_id) 
  DO UPDATE SET 
    last_message_id = NEW.id,
    updated_at = NEW.created_at;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation on new message
CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update updated_at on relevant tables
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();