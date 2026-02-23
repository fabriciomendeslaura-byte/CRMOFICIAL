-- CORRECTED RLS POLICIES FOR EXISTING SCHEMA (crm_* tables) --
-- Run this in your Supabase SQL Editor to fix the "relation does not exist" error --

-- 1. Enable RLS on Existing Tables
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_companies ENABLE ROW LEVEL SECURITY;

-- 2. Policies for 'crm_leads'
-- Policy: View leads (Owners + Admins)
DROP POLICY IF EXISTS "Leads Access" ON crm_leads;
CREATE POLICY "Leads Access"
ON crm_leads FOR ALL
USING (
  (auth.uid() IN (SELECT auth_user_id FROM crm_users WHERE id = responsavel_id)) OR 
  exists (select 1 from crm_users where auth_user_id = auth.uid() and papel = 'admin')
);

-- 3. Policies for 'crm_chat_history'
-- Policy: Private chat
DROP POLICY IF EXISTS "Chat Private" ON crm_chat_history;
CREATE POLICY "Chat Private" ON crm_chat_history FOR ALL
USING (auth.uid() = user_id);

-- 4. Policies for 'crm_meetings'
-- Policy: View meetings (Own or related to own leads)
DROP POLICY IF EXISTS "Meetings Access" ON crm_meetings;
CREATE POLICY "Meetings Access" ON crm_meetings FOR ALL
USING (
  (auth.uid() IN (SELECT auth_user_id FROM crm_users WHERE id = user_id)) OR
  exists (
    select 1 from crm_leads 
    where crm_leads.id = crm_meetings.lead_id 
    and (
       (auth.uid() IN (SELECT auth_user_id FROM crm_users WHERE id = crm_leads.responsavel_id))
    )
  )
);

-- 5. Policies for 'crm_users' (Profiles)
-- Policy: Read own profile
DROP POLICY IF EXISTS "Profiles Read" ON crm_users;
CREATE POLICY "Profiles Read" ON crm_users FOR SELECT
USING (auth.uid() = auth_user_id);

-- 6. Trigger for New Users (Sync Auth -> crm_users)
create or replace function public.handle_new_crm_user()
returns trigger as $$
begin
  insert into public.crm_users (auth_user_id, nome, email, papel, company_id, is_active)
  values (new.id, new.email, 'vendedor', 1, true)
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Re-create trigger safely
drop trigger if exists on_auth_user_created_crm on auth.users;
create trigger on_auth_user_created_crm
  after insert on auth.users
  for each row execute procedure public.handle_new_crm_user();
