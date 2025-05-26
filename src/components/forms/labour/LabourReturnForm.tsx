import React from 'react';
import { RiGroupLine, RiFileList3Line, RiTimeLine } from 'react-icons/ri';
import { ISO19650FormTemplate } from '../ISO19650FormTemplate';

interface LabourReturnFormProps {
  onCancel: () => void;
  onSubmit: (data: any) => void;
}

const LabourReturnForm: React.FC<LabourReturnFormProps> = ({ onCancel, onSubmit }) => {
  const fields = [
    // Section 1: General Information
    {
      id: 'projectId',
      type: 'text' as const,
      label: 'Project ID',
      placeholder: 'Enter project identifier',
      required: true,
      value: '',
      section: 'General Information',
      info: 'Project ID as per ISO19650 naming convention',
    },
    {
      id: 'contractRefNum',
      type: 'text' as const,
      label: 'Contract Reference Number',
      placeholder: 'Enter contract reference number',
      required: true,
      value: '',
      section: 'General Information',
    },
    {
      id: 'returningCompany',
      type: 'text' as const,
      label: 'Returning Company',
      placeholder: 'Company name submitting this return',
      required: true,
      value: '',
      section: 'General Information',
    },
    {
      id: 'returnDate',
      type: 'date' as const,
      label: 'Return Date',
      required: true,
      value: new Date().toISOString().split('T')[0],
      section: 'General Information',
    },
    
    // Section 2: Labour Details
    {
      id: 'workArea',
      type: 'select' as const,
      label: 'Work Area',
      options: ['Ground Floor', 'Level 1', 'Level 2', 'Level 3', 'Roof', 'External', 'Site-wide'],
      required: true,
      value: '',
      section: 'Labour Details',
    },
    {
      id: 'workPackage',
      type: 'select' as const,
      label: 'Work Package',
      options: ['Groundworks', 'Structural', 'Envelope', 'MEP', 'Finishes', 'External Works', 'Other'],
      required: true,
      value: '',
      section: 'Labour Details',
    },
    {
      id: 'laborCategory',
      type: 'select' as const,
      label: 'Labour Category',
      options: [
        'General Labour', 
        'Skilled Trade', 
        'Technical', 
        'Supervision', 
        'Management'
      ],
      required: true,
      value: '',
      section: 'Labour Details',
    },
    {
      id: 'numberOfWorkers',
      type: 'text' as const,
      label: 'Number of Workers',
      placeholder: 'Enter number of workers',
      required: true,
      value: '',
      section: 'Labour Details',
      validation: /^[0-9]+$/,
    },
    {
      id: 'hoursWorked',
      type: 'text' as const,
      label: 'Total Hours Worked',
      placeholder: 'Enter total hours worked',
      required: true,
      value: '',
      section: 'Labour Details',
      validation: /^[0-9]+$/,
    },
    
    // Section 3: Additional Information
    {
      id: 'startTime',
      type: 'time' as const,
      label: 'Start Time',
      required: true,
      value: '08:00',
      section: 'Additional Information',
    },
    {
      id: 'endTime',
      type: 'time' as const,
      label: 'End Time',
      required: true,
      value: '17:00',
      section: 'Additional Information',
    },
    {
      id: 'reportedDelays',
      type: 'textarea' as const,
      label: 'Reported Delays',
      placeholder: 'Enter any delays encountered',
      required: false,
      value: '',
      section: 'Additional Information',
    },
    {
      id: 'weatherConditions',
      type: 'select' as const,
      label: 'Weather Conditions',
      options: ['Clear', 'Cloudy', 'Rain', 'Heavy Rain', 'Wind', 'Snow', 'Fog'],
      required: true,
      value: '',
      section: 'Additional Information',
    },
    
    // Section 4: Compliance Declaration
    {
      id: 'hasHealthSafetyIncidents',
      type: 'radio' as const,
      label: 'Were there any health and safety incidents?',
      options: ['Yes', 'No'],
      required: true,
      value: 'No',
      section: 'Compliance Declaration',
    },
    {
      id: 'incidentDetails',
      type: 'textarea' as const,
      label: 'Incident Details (if applicable)',
      placeholder: 'Provide details of any health and safety incidents',
      required: false,
      value: '',
      section: 'Compliance Declaration',
    },
    {
      id: 'complianceConfirmation',
      type: 'checkbox' as const,
      label: 'I confirm all workers had valid site inductions and appropriate PPE',
      required: true,
      value: false,
      section: 'Compliance Declaration',
    },
    {
      id: 'dataConfirmation',
      type: 'checkbox' as const,
      label: 'I confirm that the information provided is accurate and complies with ISO19650 requirements',
      required: true,
      value: false,
      section: 'Compliance Declaration',
    },
  ];

  return (
    <ISO19650FormTemplate
      title="Labour Return Form"
      description="Record daily labour activities in compliance with ISO19650 standards"
      icon={<RiGroupLine />}
      fields={fields}
      onSubmit={onSubmit}
      onCancel={onCancel}
      formType="labour"
    />
  );
};

export default LabourReturnForm; 