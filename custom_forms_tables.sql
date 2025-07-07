-- Drop existing custom forms tables and constraints if they exist
DROP TABLE IF EXISTS form_workflow_history CASCADE;
DROP TABLE IF EXISTS form_comments CASCADE;
DROP TABLE IF EXISTS form_assignments CASCADE;
DROP TABLE IF EXISTS form_workflow_nodes CASCADE;
DROP TABLE IF EXISTS form_entries CASCADE;
DROP TABLE IF EXISTS form_templates CASCADE;

-- Drop any remaining constraints that might exist
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT constraint_name, table_name FROM information_schema.table_constraints 
              WHERE constraint_name LIKE '%form_%' AND constraint_type = 'FOREIGN KEY') 
    LOOP
        EXECUTE 'ALTER TABLE ' || r.table_name || ' DROP CONSTRAINT IF EXISTS ' || r.constraint_name || ' CASCADE';
    END LOOP;
END $$;

-- Custom Forms Tables for Supabase
-- Simplified structure without complex RLS policies

-- 1. Form Templates Table (stores the form structure created by admin)
CREATE TABLE form_templates (
  id TEXT PRIMARY KEY DEFAULT ('form_template_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 8)),
  name TEXT NOT NULL,
  description TEXT,
  form_structure JSONB NOT NULL, -- Stores the form pages and fields structure
  project_id TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- 2. Form Entries Table (stores actual form submissions)
CREATE TABLE form_entries (
  id TEXT PRIMARY KEY DEFAULT ('form_entry_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 8)),
  template_id TEXT NOT NULL,
  template_name TEXT NOT NULL,
  project_id TEXT,
  project_name TEXT,
  form_data JSONB NOT NULL, -- Stores the actual form field values
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'permanently_rejected')),
  current_node_index INTEGER DEFAULT 1,
  current_active_node TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Form Workflow Nodes Table (stores workflow steps for each form entry)
CREATE TABLE form_workflow_nodes (
  id SERIAL PRIMARY KEY,
  form_entry_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  node_type TEXT NOT NULL CHECK (node_type IN ('start', 'node', 'end')),
  node_name TEXT NOT NULL,
  executor_id UUID,
  executor_name TEXT,
  node_order INTEGER NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'pending', 'completed', 'rejected', 'sent_back')),
  edit_access BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  expire_time TIMESTAMP WITH TIME ZONE,
  expire_duration INTEGER, -- in hours
  completed_by UUID,
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_count INTEGER DEFAULT 0,
  max_completions INTEGER DEFAULT 2,
  can_re_edit BOOLEAN DEFAULT true,
  last_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Form Assignments Table (stores CC recipients for each workflow node)
CREATE TABLE form_assignments (
  id SERIAL PRIMARY KEY,
  form_entry_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  role TEXT DEFAULT 'cc' CHECK (role IN ('executor', 'cc')),
  node_id TEXT,
  node_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Form Comments Table (stores comments and workflow history)
CREATE TABLE form_comments (
  id SERIAL PRIMARY KEY,
  form_entry_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  comment TEXT NOT NULL,
  action TEXT, -- 'approve', 'reject', 'back', 'comment'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Form Workflow History Table (detailed workflow tracking)
CREATE TABLE form_workflow_history (
  id SERIAL PRIMARY KEY,
  form_entry_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  node_order INTEGER NOT NULL,
  action TEXT NOT NULL, -- 'approve', 'reject', 'back', 'complete'
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  comment TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add only internal foreign key constraints (not to users table)
ALTER TABLE form_entries ADD CONSTRAINT form_entries_template_id_fkey 
  FOREIGN KEY (template_id) REFERENCES form_templates(id);

ALTER TABLE form_workflow_nodes ADD CONSTRAINT form_workflow_nodes_form_entry_id_fkey 
  FOREIGN KEY (form_entry_id) REFERENCES form_entries(id) ON DELETE CASCADE;

ALTER TABLE form_assignments ADD CONSTRAINT form_assignments_form_entry_id_fkey 
  FOREIGN KEY (form_entry_id) REFERENCES form_entries(id) ON DELETE CASCADE;

ALTER TABLE form_comments ADD CONSTRAINT form_comments_form_entry_id_fkey 
  FOREIGN KEY (form_entry_id) REFERENCES form_entries(id) ON DELETE CASCADE;

ALTER TABLE form_workflow_history ADD CONSTRAINT form_workflow_history_form_entry_id_fkey 
  FOREIGN KEY (form_entry_id) REFERENCES form_entries(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_form_templates_created_by ON form_templates(created_by);
CREATE INDEX idx_form_templates_project_id ON form_templates(project_id);
CREATE INDEX idx_form_templates_is_active ON form_templates(is_active);

CREATE INDEX idx_form_entries_template_id ON form_entries(template_id);
CREATE INDEX idx_form_entries_created_by ON form_entries(created_by);
CREATE INDEX idx_form_entries_project_id ON form_entries(project_id);
CREATE INDEX idx_form_entries_status ON form_entries(status);
CREATE INDEX idx_form_entries_created_at ON form_entries(created_at);

CREATE INDEX idx_form_workflow_nodes_form_entry_id ON form_workflow_nodes(form_entry_id);
CREATE INDEX idx_form_workflow_nodes_executor_id ON form_workflow_nodes(executor_id);
CREATE INDEX idx_form_workflow_nodes_status ON form_workflow_nodes(status);
CREATE INDEX idx_form_workflow_nodes_node_order ON form_workflow_nodes(node_order);

CREATE INDEX idx_form_assignments_form_entry_id ON form_assignments(form_entry_id);
CREATE INDEX idx_form_assignments_user_id ON form_assignments(user_id);
CREATE INDEX idx_form_assignments_node_id ON form_assignments(node_id);

CREATE INDEX idx_form_comments_form_entry_id ON form_comments(form_entry_id);
CREATE INDEX idx_form_comments_user_id ON form_comments(user_id);
CREATE INDEX idx_form_comments_created_at ON form_comments(created_at);

CREATE INDEX idx_form_workflow_history_form_entry_id ON form_workflow_history(form_entry_id);
CREATE INDEX idx_form_workflow_history_user_id ON form_workflow_history(user_id);
CREATE INDEX idx_form_workflow_history_created_at ON form_workflow_history(created_at);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_workflow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_workflow_history ENABLE ROW LEVEL SECURITY;

-- Very simple RLS Policies (no complex joins to avoid type issues)
-- Form Templates policies
CREATE POLICY "Allow all operations on form_templates" ON form_templates FOR ALL USING (true);

-- Form Entries policies  
CREATE POLICY "Allow all operations on form_entries" ON form_entries FOR ALL USING (true);

-- Workflow nodes policies
CREATE POLICY "Allow all operations on form_workflow_nodes" ON form_workflow_nodes FOR ALL USING (true);

-- Assignments policies
CREATE POLICY "Allow all operations on form_assignments" ON form_assignments FOR ALL USING (true);

-- Comments policies
CREATE POLICY "Allow all operations on form_comments" ON form_comments FOR ALL USING (true);

-- Workflow history policies
CREATE POLICY "Allow all operations on form_workflow_history" ON form_workflow_history FOR ALL USING (true); 