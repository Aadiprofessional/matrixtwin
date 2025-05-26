-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to sign up (insert)
CREATE POLICY insert_policy ON users FOR INSERT WITH CHECK (true);

-- Create policy to allow users to read only their own data
CREATE POLICY read_own_data ON users FOR SELECT USING (auth.uid() = id);

-- Create policy to allow users to update only their own data
CREATE POLICY update_own_data ON users FOR UPDATE USING (auth.uid() = id);

-- Create policy to allow admins to read all users data
CREATE POLICY admin_read_all ON users FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create policy to allow admins to update verification status
CREATE POLICY admin_update_verification ON users FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
); 