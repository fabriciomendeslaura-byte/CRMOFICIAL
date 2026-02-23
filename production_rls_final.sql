-- FINAL PRODUCTION RLS - CRM OMNI.IA --
-- This script hardens the database for production by:
-- 1. Ensuring RLS is enabled on all core tables.
-- 2. Granting full access to Admins across all tables.
-- 3. Fixing missing UPDATE policies for user profiles.
-- 4. Ensuring proper cross-table references for access control.

-- 1. Enable RLS
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_companies ENABLE ROW LEVEL SECURITY;

-- 2. Universal Admin Policy (Helps reduce performance bottleneck of subqueries)
-- We check for admin status once in a stable way
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM crm_users 
    WHERE auth_user_id = auth.uid() 
    AND papel = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. CRM LEADS
DROP POLICY IF EXISTS "Leads Access" ON crm_leads;
CREATE POLICY "Leads Access" ON crm_leads FOR ALL 
USING (
  (auth.uid() IN (SELECT auth_user_id FROM crm_users WHERE id = responsavel_id)) OR 
  is_admin()
)
WITH CHECK (
  (auth.uid() IN (SELECT auth_user_id FROM crm_users WHERE id = responsavel_id)) OR 
  is_admin()
);

-- 4. CRM CHAT HISTORY
DROP POLICY IF EXISTS "Chat Private" ON crm_chat_history;
CREATE POLICY "Chat Private" ON crm_chat_history FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. CRM MEETINGS
DROP POLICY IF EXISTS "Meetings Access" ON crm_meetings;
CREATE POLICY "Meetings Access" ON crm_meetings FOR ALL
USING (
  (auth.uid() IN (SELECT auth_user_id FROM crm_users WHERE id = user_id)) OR
  is_admin() OR
  EXISTS (
    SELECT 1 FROM crm_leads 
    WHERE crm_leads.id = crm_meetings.lead_id 
    AND auth.uid() IN (SELECT auth_user_id FROM crm_users WHERE id = crm_leads.responsavel_id)
  )
);

-- 6. CRM USERS (Profiles)
DROP POLICY IF EXISTS "Profiles Read" ON crm_users;
CREATE POLICY "Profiles Read" ON crm_users FOR SELECT
USING (auth.uid() = auth_user_id OR is_admin());

DROP POLICY IF EXISTS "Profiles Update Own" ON crm_users;
CREATE POLICY "Profiles Update Own" ON crm_users FOR UPDATE
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

-- 7. CRM COMPANIES
DROP POLICY IF EXISTS "Companies Access" ON crm_companies;
CREATE POLICY "Companies Access" ON crm_companies FOR ALL
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM crm_users 
    WHERE auth.uid() = auth_user_id 
    AND company_id = crm_companies.id
  )
);
