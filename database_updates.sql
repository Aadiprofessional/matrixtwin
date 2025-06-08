-- Add columns to track node completion history and prevent infinite loops
-- This will help track when nodes have been completed before and limit re-editing

-- Add completion tracking to workflow nodes tables
ALTER TABLE diary_workflow_nodes 
ADD COLUMN completion_count INTEGER DEFAULT 0,
ADD COLUMN last_completed_at TIMESTAMP,
ADD COLUMN can_re_edit BOOLEAN DEFAULT true,
ADD COLUMN max_completions INTEGER DEFAULT 2; -- Allow max 2 completions per node

ALTER TABLE cleansing_workflow_nodes 
ADD COLUMN completion_count INTEGER DEFAULT 0,
ADD COLUMN last_completed_at TIMESTAMP,
ADD COLUMN can_re_edit BOOLEAN DEFAULT true,
ADD COLUMN max_completions INTEGER DEFAULT 2;

ALTER TABLE safety_workflow_nodes 
ADD COLUMN completion_count INTEGER DEFAULT 0,
ADD COLUMN last_completed_at TIMESTAMP,
ADD COLUMN can_re_edit BOOLEAN DEFAULT true,
ADD COLUMN max_completions INTEGER DEFAULT 2;

ALTER TABLE labour_workflow_nodes 
ADD COLUMN completion_count INTEGER DEFAULT 0,
ADD COLUMN last_completed_at TIMESTAMP,
ADD COLUMN can_re_edit BOOLEAN DEFAULT true,
ADD COLUMN max_completions INTEGER DEFAULT 2;

-- Add workflow history tracking tables
CREATE TABLE IF NOT EXISTS diary_workflow_history (
    id SERIAL PRIMARY KEY,
    diary_id VARCHAR(255) NOT NULL,
    node_id VARCHAR(255) NOT NULL,
    node_order INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'completed', 'rejected', 'sent_back'
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (diary_id) REFERENCES diary_entries(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cleansing_workflow_history (
    id SERIAL PRIMARY KEY,
    cleansing_id VARCHAR(255) NOT NULL,
    node_id VARCHAR(255) NOT NULL,
    node_order INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cleansing_id) REFERENCES cleansing_entries(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS safety_workflow_history (
    id SERIAL PRIMARY KEY,
    safety_id VARCHAR(255) NOT NULL,
    node_id VARCHAR(255) NOT NULL,
    node_order INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (safety_id) REFERENCES safety_entries(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS labour_workflow_history (
    id SERIAL PRIMARY KEY,
    labour_id VARCHAR(255) NOT NULL,
    node_id VARCHAR(255) NOT NULL,
    node_order INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (labour_id) REFERENCES labour_entries(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_diary_workflow_history_diary_id ON diary_workflow_history(diary_id);
CREATE INDEX idx_cleansing_workflow_history_cleansing_id ON cleansing_workflow_history(cleansing_id);
CREATE INDEX idx_safety_workflow_history_safety_id ON safety_workflow_history(safety_id);
CREATE INDEX idx_labour_workflow_history_labour_id ON labour_workflow_history(labour_id); 