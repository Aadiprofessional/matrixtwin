interface EmailNotification {
  email: string;
  subject: string;
  text: string;
}

interface WorkflowEmailData {
  entryType: 'diary' | 'safety' | 'labour' | 'cleansing';
  entryId: string;
  projectName: string;
  action: 'created' | 'approved' | 'rejected' | 'assigned';
  executorName?: string;
  ccRecipients?: string[];
  formData?: any;
  currentNodeName?: string;
  comments?: string;
}

class EmailService {
  private readonly API_BASE_URL = 'https://matrixbim-server.onrender.com/api';

  async sendEmail(notification: EmailNotification): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Email sent successfully:', result);
        return true;
      } else {
        console.error('Failed to send email:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async sendWorkflowNotification(data: WorkflowEmailData): Promise<boolean> {
    const { entryType, entryId, projectName, action, executorName, ccRecipients = [], formData, currentNodeName, comments } = data;
    
    // Generate email content based on action and entry type
    const subject = this.generateSubject(entryType, projectName, action, currentNodeName);
    const emailText = this.generateEmailContent(data);

    // Send email to executor if specified
    if (executorName && action === 'assigned') {
      // We would need to get the executor's email from the user data
      // For now, we'll assume it's passed in the ccRecipients
    }

    // Send emails to all CC recipients
    const emailPromises = ccRecipients.map(email => 
      this.sendEmail({
        email,
        subject,
        text: emailText
      })
    );

    try {
      const results = await Promise.all(emailPromises);
      return results.every(result => result === true);
    } catch (error) {
      console.error('Error sending workflow notifications:', error);
      return false;
    }
  }

  private generateSubject(entryType: string, projectName: string, action: string, currentNodeName?: string): string {
    const entryTypeTitle = entryType.charAt(0).toUpperCase() + entryType.slice(1);
    
    switch (action) {
      case 'created':
        return `New ${entryTypeTitle} Entry Created - ${projectName}`;
      case 'assigned':
        return `${entryTypeTitle} Entry Assigned for ${currentNodeName} - ${projectName}`;
      case 'approved':
        return `${entryTypeTitle} Entry Approved - ${projectName}`;
      case 'rejected':
        return `${entryTypeTitle} Entry Rejected - ${projectName}`;
      default:
        return `${entryTypeTitle} Entry Update - ${projectName}`;
    }
  }

  private generateEmailContent(data: WorkflowEmailData): string {
    const { entryType, entryId, projectName, action, executorName, currentNodeName, comments, formData } = data;
    const entryTypeTitle = entryType.charAt(0).toUpperCase() + entryType.slice(1);
    
    let content = `Dear Team,\n\n`;
    
    switch (action) {
      case 'created':
        content += `A new ${entryTypeTitle.toLowerCase()} entry has been created for project "${projectName}".\n\n`;
        content += `Entry ID: ${entryId}\n`;
        content += `Project: ${projectName}\n`;
        if (formData?.date) content += `Date: ${formData.date}\n`;
        if (formData?.submitter || formData?.inspector || formData?.author) {
          content += `Submitted by: ${formData.submitter || formData.inspector || formData.author}\n`;
        }
        content += `\nPlease review and take appropriate action.\n`;
        break;
        
      case 'assigned':
        content += `A ${entryTypeTitle.toLowerCase()} entry has been assigned to you for "${currentNodeName}".\n\n`;
        content += `Entry ID: ${entryId}\n`;
        content += `Project: ${projectName}\n`;
        content += `Workflow Step: ${currentNodeName}\n`;
        if (executorName) content += `Assigned to: ${executorName}\n`;
        content += `\nPlease log in to the system to review and process this entry.\n`;
        break;
        
      case 'approved':
        content += `A ${entryTypeTitle.toLowerCase()} entry has been approved.\n\n`;
        content += `Entry ID: ${entryId}\n`;
        content += `Project: ${projectName}\n`;
        if (currentNodeName) content += `Workflow Step: ${currentNodeName}\n`;
        if (comments) content += `Comments: ${comments}\n`;
        content += `\nThe entry has been moved to the next step in the workflow.\n`;
        break;
        
      case 'rejected':
        content += `A ${entryTypeTitle.toLowerCase()} entry has been rejected.\n\n`;
        content += `Entry ID: ${entryId}\n`;
        content += `Project: ${projectName}\n`;
        if (currentNodeName) content += `Workflow Step: ${currentNodeName}\n`;
        if (comments) content += `Rejection Reason: ${comments}\n`;
        content += `\nPlease review the comments and make necessary corrections.\n`;
        break;
    }
    
    content += `\nAccess the MatrixTwin platform to view full details and take action.\n\n`;
    content += `Best regards,\n`;
    content += `MatrixTwin Notification System`;
    
    return content;
  }

  // Helper method to send notifications for diary entries
  async sendDiaryNotification(data: Omit<WorkflowEmailData, 'entryType'>): Promise<boolean> {
    return this.sendWorkflowNotification({ ...data, entryType: 'diary' });
  }

  // Helper method to send notifications for safety entries
  async sendSafetyNotification(data: Omit<WorkflowEmailData, 'entryType'>): Promise<boolean> {
    return this.sendWorkflowNotification({ ...data, entryType: 'safety' });
  }

  // Helper method to send notifications for labour entries
  async sendLabourNotification(data: Omit<WorkflowEmailData, 'entryType'>): Promise<boolean> {
    return this.sendWorkflowNotification({ ...data, entryType: 'labour' });
  }

  // Helper method to send notifications for cleansing entries
  async sendCleansingNotification(data: Omit<WorkflowEmailData, 'entryType'>): Promise<boolean> {
    return this.sendWorkflowNotification({ ...data, entryType: 'cleansing' });
  }
}

export const emailService = new EmailService();
export type { EmailNotification, WorkflowEmailData }; 