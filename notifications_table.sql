-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
    form_type VARCHAR(50), -- diary, safety, cleansing, labour
    form_id VARCHAR(255),
    project_id VARCHAR(255),
    action_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_form ON notifications(form_type, form_id);
CREATE INDEX IF NOT EXISTS idx_notifications_project ON notifications(project_id);

-- Create a composite index for efficient querying
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications(user_id, read, created_at DESC);

-- Add foreign key constraint to users table (if it exists)
-- ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user_id 
-- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- Add RLS (Row Level Security) policies if needed
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own notifications
-- CREATE POLICY notifications_user_policy ON notifications
--     FOR ALL USING (user_id = auth.uid());

-- Insert some sample notifications for testing (optional)
-- INSERT INTO notifications (id, user_id, title, message, type, form_type, form_id, project_id, action_url, metadata) VALUES
-- ('notif_sample_1', 'sample-user-id', 'New Diary Entry Assigned', 'A new diary entry for Project Alpha has been assigned to you for review.', 'info', 'diary', 'diary_123', 'project_456', '/diary', '{"role": "executor", "action": "created"}'),
-- ('notif_sample_2', 'sample-user-id', 'Safety Report Approved', 'Your safety report for Project Beta has been approved.', 'success', 'safety', 'safety_789', 'project_101', '/safety', '{"role": "creator", "action": "approved"}'),
-- ('notif_sample_3', 'sample-user-id', 'Cleansing Record Rejected', 'Your cleansing record has been rejected and requires revision.', 'error', 'cleansing', 'cleansing_456', 'project_789', '/cleansing', '{"role": "creator", "action": "rejected", "comment": "Please provide more details"}');

COMMENT ON TABLE notifications IS 'Stores user notifications for form assignments and workflow updates';
COMMENT ON COLUMN notifications.id IS 'Unique identifier for the notification';
COMMENT ON COLUMN notifications.user_id IS 'ID of the user who should receive this notification';
COMMENT ON COLUMN notifications.title IS 'Short title/subject of the notification';
COMMENT ON COLUMN notifications.message IS 'Detailed message content of the notification';
COMMENT ON COLUMN notifications.type IS 'Type of notification: info, warning, success, error';
COMMENT ON COLUMN notifications.form_type IS 'Type of form this notification relates to';
COMMENT ON COLUMN notifications.form_id IS 'ID of the specific form this notification relates to';
COMMENT ON COLUMN notifications.project_id IS 'ID of the project this notification relates to';
COMMENT ON COLUMN notifications.action_url IS 'URL to navigate to when notification is clicked';
COMMENT ON COLUMN notifications.metadata IS 'Additional metadata about the notification in JSON format';
COMMENT ON COLUMN notifications.read IS 'Whether the notification has been read by the user';
COMMENT ON COLUMN notifications.read_at IS 'Timestamp when the notification was marked as read';
COMMENT ON COLUMN notifications.created_at IS 'Timestamp when the notification was created';
COMMENT ON COLUMN notifications.updated_at IS 'Timestamp when the notification was last updated'; 