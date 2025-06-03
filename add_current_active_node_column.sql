-- Add current_active_node column to diary_entries table
ALTER TABLE diary_entries 
ADD COLUMN current_active_node VARCHAR(255); 