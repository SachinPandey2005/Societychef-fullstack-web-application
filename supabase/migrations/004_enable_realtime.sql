-- Enable Realtime replication for chat_messages and orders tables
alter publication supabase_realtime add table chat_messages;
alter publication supabase_realtime add table orders;
