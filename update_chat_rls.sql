-- Update RLS policies to allow public access (since authentication is handled by custom backend, not Supabase Auth)

-- Option 1: Disable RLS completely (simplest for this use case)
ALTER TABLE chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- Option 2: If you prefer to keep RLS enabled but allow public access, run these instead:
/*
-- Drop existing strict policies
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can insert their own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can update their own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can delete their own chat sessions" ON chat_sessions;

DROP POLICY IF EXISTS "Users can view messages from their own sessions" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages to their own sessions" ON chat_messages;

-- Create permissive policies
CREATE POLICY "Allow public access to chat_sessions" 
  ON chat_sessions FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow public access to chat_messages" 
  ON chat_messages FOR ALL 
  USING (true) 
  WITH CHECK (true);
*/
