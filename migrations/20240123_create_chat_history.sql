-- Create table for chat history
CREATE TABLE IF NOT EXISTS crm_chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  company_id BIGINT REFERENCES crm_companies(id)
);

-- Add RLS policies
ALTER TABLE crm_chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat history"
  ON crm_chat_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages"
  ON crm_chat_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);
