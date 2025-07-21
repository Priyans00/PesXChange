-- create messages table
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users(id),
  receiver_id uuid references auth.users(id),
  message text not null,
  created_at timestamp with time zone default now()
);