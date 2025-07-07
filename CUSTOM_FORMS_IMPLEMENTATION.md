# Custom Forms Implementation

This implementation creates a complete custom forms system that mirrors the diary workflow functionality, allowing admins to create custom forms with widgets and assign them to users with the same approval workflow.

## Database Schema

### Tables Created

1. **form_templates** - Stores form structures created by admins
   - `id` - Unique template identifier
   - `name` - Template name
   - `description` - Template description
   - `form_structure` - JSONB containing form pages, fields, and workflow
   - `project_id` - Associated project
   - `created_by` - Admin who created the template
   - `is_active` - Whether template is active

2. **form_entries** - Stores actual form submissions
   - `id` - Unique entry identifier
   - `template_id` - Reference to form template
   - `template_name` - Template name for easy reference
   - `project_id` - Associated project
   - `form_data` - JSONB containing submitted form data
   - `status` - Current workflow status
   - `current_node_index` - Current workflow step
   - `current_active_node` - Current active workflow node
   - `created_by` - User who submitted the form

3. **form_workflow_nodes** - Workflow steps for each form entry
   - `form_entry_id` - Reference to form entry
   - `node_id` - Workflow node identifier
   - `node_type` - Type of node (start, node, end)
   - `node_name` - Display name of the node
   - `executor_id` - User assigned to execute this step
   - `node_order` - Order in workflow
   - `status` - Current status of this node
   - `completion_count` - Number of times completed
   - `can_re_edit` - Whether node can be re-edited

4. **form_assignments** - CC recipients for workflow nodes
   - `form_entry_id` - Reference to form entry
   - `user_id` - User assigned as CC
   - `role` - Role in workflow (executor, cc)
   - `node_id` - Associated workflow node

5. **form_comments** - Comments and workflow history
   - `form_entry_id` - Reference to form entry
   - `user_id` - User who made the comment
   - `comment` - Comment text
   - `action` - Associated action (approve, reject, back)

6. **form_workflow_history** - Detailed workflow tracking
   - `form_entry_id` - Reference to form entry
   - `node_id` - Workflow node
   - `action` - Action taken
   - `user_id` - User who took action
   - `comment` - Associated comment

## API Endpoints

### Form Templates

#### POST `/api/custom-forms/templates/create`
- **Access**: Admin only
- **Purpose**: Create new form template with workflow
- **Body**:
  ```json
  {
    "name": "Safety Inspection Form",
    "description": "Monthly safety inspection checklist",
    "formStructure": [
      {
        "id": "page_1",
        "fields": [
          {
            "id": "field_1",
            "type": "text",
            "label": "Inspector Name",
            "settings": { "required": true }
          }
        ]
      }
    ],
    "processNodes": [
      {
        "id": "node_1",
        "type": "start",
        "name": "Start"
      },
      {
        "id": "node_2",
        "type": "node",
        "name": "Safety Manager Review",
        "executorId": "user_123",
        "ccRecipients": [
          {
            "id": "user_456",
            "name": "John Doe",
            "email": "john@example.com"
          }
        ]
      }
    ],
    "projectId": "project_123"
  }
  ```

#### GET `/api/custom-forms/templates`
- **Access**: All users
- **Purpose**: Get all active form templates
- **Query Parameters**: `projectId` (optional)

### Form Entries

#### POST `/api/custom-forms/entries/create`
- **Access**: All users
- **Purpose**: Create new form submission
- **Body**:
  ```json
  {
    "templateId": "form_template_123",
    "formData": {
      "field_1": "John Smith",
      "field_2": "2024-01-15",
      "projectName": "Construction Project A"
    },
    "projectId": "project_123"
  }
  ```

#### GET `/api/custom-forms/entries/:userId`
- **Access**: Private
- **Purpose**: Get form entries for a user based on their role and permissions
- **Query Parameters**: `projectId` (optional)

#### GET `/api/custom-forms/entries/details/:entryId`
- **Access**: Private
- **Purpose**: Get specific form entry with full workflow details

#### PUT `/api/custom-forms/entries/:entryId/update`
- **Access**: Private
- **Purpose**: Update form entry and advance workflow
- **Body**:
  ```json
  {
    "formData": { "field_1": "Updated value" },
    "action": "approve", // or "reject", "back"
    "comment": "Looks good, approved",
    "userId": "user_123"
  }
  ```

## Workflow Features

### Same as Diary System
1. **Multi-step approval workflow**
2. **Node-specific CC recipients**
3. **Email notifications**
4. **In-app notifications**
5. **Completion limits and re-editing**
6. **Workflow history tracking**
7. **Role-based access control**

### Workflow Actions
- **approve** - Move to next workflow step
- **reject** - Send back to first editable node or mark as permanently rejected
- **back** - Send to previous editable node

### Permission System
- **Admin**: Can create templates, see all entries
- **Assigned Users**: Can see entries they're assigned to (as executor or CC)
- **Creators**: Can see entries they created
- **Executors**: Can see entries where they're assigned as executor

## Email Notifications

The system sends consolidated emails for:
- **Form Created**: Notifies first executor and CCs
- **Form Approved**: Notifies next executor and CCs
- **Form Rejected**: Notifies admin/creator
- **Form Sent Back**: Notifies previous executor

## Integration with Frontend

### Form Builder Integration
The system integrates with the existing FormsPage.tsx widget system:

1. **Form Creation Flow**: Admin uses FormCreationFlow component to:
   - Design form with widgets (text, checkbox, date, signature, etc.)
   - Set up workflow nodes with executors and CCs
   - Save as template

2. **Form Submission**: Users can:
   - Select from available templates
   - Fill out forms using the widget system
   - Submit for workflow processing

3. **Form Management**: Users can:
   - View assigned forms
   - Approve/reject/send back forms
   - Add comments
   - Track workflow progress

### Widget Types Supported
All existing widget types from FormsPage.tsx:
- Text fields
- Number inputs
- Date fields
- Dropdowns
- Checkboxes
- Multiple choice
- Images
- Attachments
- Signatures
- Annotations
- Tables
- Approval kits
- And more...

## Setup Instructions

1. **Run SQL Script**: Execute `custom_forms_tables.sql` in Supabase
2. **Add API Routes**: Include `customForms.js` in your Express server
3. **Update Frontend**: Integrate with existing FormsPage component
4. **Configure Notifications**: Ensure Resend API key is configured

## Usage Flow

1. **Admin Creates Template**:
   - Uses form builder to design form
   - Sets up workflow with executors and CCs
   - Saves template

2. **User Submits Form**:
   - Selects template from available forms
   - Fills out form data
   - Submits for processing

3. **Workflow Processing**:
   - First executor receives notification
   - Executor reviews and approves/rejects/sends back
   - Process continues through workflow nodes
   - All stakeholders receive appropriate notifications

4. **Completion**:
   - Form marked as completed when all nodes approved
   - Full audit trail maintained
   - Email and in-app notifications sent

This implementation provides a complete custom forms system with the same robust workflow capabilities as the diary system, allowing for flexible form creation and management across projects. 