-- Add edit_access column to diary_workflow_nodes table
ALTER TABLE diary_workflow_nodes 
ADD COLUMN edit_access BOOLEAN DEFAULT true; 