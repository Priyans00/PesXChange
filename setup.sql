-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.bookmarks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  item_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bookmarks_pkey PRIMARY KEY (id),
  CONSTRAINT bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id),
  CONSTRAINT bookmarks_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  description text,
  icon text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user1_id uuid NOT NULL,
  user2_id uuid NOT NULL,
  last_message_id uuid,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_user2_id_fkey FOREIGN KEY (user2_id) REFERENCES public.user_profiles(id),
  CONSTRAINT conversations_user1_id_fkey FOREIGN KEY (user1_id) REFERENCES public.user_profiles(id),
  CONSTRAINT conversations_last_message_id_fkey FOREIGN KEY (last_message_id) REFERENCES public.messages(id)
);
CREATE TABLE public.item_likes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  item_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT item_likes_pkey PRIMARY KEY (id),
  CONSTRAINT item_likes_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id),
  CONSTRAINT item_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id)
);
CREATE TABLE public.item_reports (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  reporter_id uuid NOT NULL,
  item_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'reviewed'::text, 'resolved'::text, 'dismissed'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT item_reports_pkey PRIMARY KEY (id),
  CONSTRAINT item_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.user_profiles(id),
  CONSTRAINT item_reports_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id)
);
CREATE TABLE public.items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0::numeric),
  location text NOT NULL DEFAULT 'PES University, Bangalore'::text,
  year integer CHECK (year >= 1900 AND year::numeric <= EXTRACT(year FROM now())),
  condition text NOT NULL CHECK (condition = ANY (ARRAY['New'::text, 'Like New'::text, 'Good'::text, 'Fair'::text, 'Poor'::text])),
  category_id uuid,
  images ARRAY DEFAULT '{}'::text[],
  views integer DEFAULT 0,
  is_available boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  seller_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  category text,
  CONSTRAINT items_pkey PRIMARY KEY (id),
  CONSTRAINT items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT items_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.user_profiles(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.user_profiles(id),
  CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.user_profiles(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['message'::text, 'like'::text, 'review'::text, 'item_sold'::text, 'item_expired'::text])),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  reviewer_id uuid NOT NULL,
  reviewee_id uuid NOT NULL,
  item_id uuid,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_reviewee_id_fkey FOREIGN KEY (reviewee_id) REFERENCES public.user_profiles(id),
  CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.user_profiles(id),
  CONSTRAINT reviews_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id)
);
CREATE TABLE public.user_profiles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  srn text UNIQUE,
  prn text,
  name text,
  email text,
  phone text,
  bio text,
  avatar_url text,
  program text,
  branch text,
  semester text,
  section text,
  campus_code integer,
  campus text,
  rating numeric DEFAULT 0.0 CHECK (rating >= 0::numeric AND rating <= 5::numeric),
  verified boolean DEFAULT true,
  location text DEFAULT 'PES University, Bangalore'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_login timestamp with time zone DEFAULT now(),
  nickname text CHECK (nickname IS NULL OR length(nickname) >= 2 AND length(nickname) <= 50),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id)
);