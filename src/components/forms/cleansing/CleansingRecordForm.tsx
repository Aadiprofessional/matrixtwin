import React from 'react';
import { RiBrushLine } from 'react-icons/ri';
import { ISO19650FormTemplate } from '../ISO19650FormTemplate';

interface CleansingRecordFormProps {
  onCancel: () => void;
  onSubmit: (data: any) => void;
}

const CleansingRecordForm: React.FC<CleansingRecordFormProps> = ({ onCancel, onSubmit }) => {
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
      id: 'recordRefNum',
      type: 'text' as const,
      label: 'Record Reference Number',
      placeholder: 'Enter cleansing record reference number',
      required: true,
      value: '',
      section: 'General Information',
      info: 'Format: CR-YYYY-MM-DD-###',
    },
    {
      id: 'cleaningCompany',
      type: 'text' as const,
      label: 'Cleaning Company',
      placeholder: 'Company conducting the cleansing',
      required: true,
      value: '',
      section: 'General Information',
    },
    {
      id: 'cleaningDate',
      type: 'date' as const,
      label: 'Cleaning Date',
      required: true,
      value: new Date().toISOString().split('T')[0],
      section: 'General Information',
    },
    {
      id: 'completedBy',
      type: 'text' as const,
      label: 'Completed By',
      placeholder: 'Name of person completing this record',
      required: true,
      value: '',
      section: 'General Information',
    },
    
    // Section 2: Area Information
    {
      id: 'cleaningArea',
      type: 'select' as const,
      label: 'Cleaning Area',
      options: ['Ground Floor', 'Level 1', 'Level 2', 'Level 3', 'Roof', 'External', 'Site-wide'],
      required: true,
      value: '',
      section: 'Area Information',
    },
    {
      id: 'specificLocation',
      type: 'text' as const,
      label: 'Specific Location',
      placeholder: 'Provide specific location details',
      required: true,
      value: '',
      section: 'Area Information',
    },
    {
      id: 'areaSize',
      type: 'text' as const,
      label: 'Area Size (m²)',
      placeholder: 'Enter approximate area size',
      required: true,
      value: '',
      section: 'Area Information',
      validation: /^[0-9]+(\.[0-9]+)?$/,
    },
    {
      id: 'surfaceType',
      type: 'select' as const,
      label: 'Surface Type',
      options: ['Concrete', 'Tile', 'Carpet', 'Wood', 'Metal', 'Glass', 'Composite', 'Multiple'],
      required: true,
      value: '',
      section: 'Area Information',
    },
    {
      id: 'accessRestrictions',
      type: 'textarea' as const,
      label: 'Access Restrictions',
      placeholder: 'Describe any access restrictions',
      required: false,
      value: '',
      section: 'Area Information',
    },
    
    // Section 3: Cleansing Details
    {
      id: 'cleaningType',
      type: 'select' as const,
      label: 'Cleaning Type',
      options: [
        'General Cleaning',
        'Deep Cleaning',
        'Sanitization',
        'Waste Removal',
        'Construction Debris Removal',
        'Hazardous Material Cleaning',
        'Post-Construction Cleaning'
      ],
      required: true,
      value: '',
      section: 'Cleansing Details',
    },
    {
      id: 'cleaningMethods',
      type: 'select' as const,
      label: 'Cleaning Methods',
      options: [
        'Manual Cleaning',
        'Pressure Washing',
        'Steam Cleaning',
        'Vacuum Cleaning',
        'Chemical Cleaning',
        'Mechanical Sweeping',
        'Combination'
      ],
      required: true,
      value: '',
      section: 'Cleansing Details',
    },
    {
      id: 'startTime',
      type: 'time' as const,
      label: 'Start Time',
      required: true,
      value: '08:00',
      section: 'Cleansing Details',
    },
    {
      id: 'endTime',
      type: 'time' as const,
      label: 'End Time',
      required: true,
      value: '17:00',
      section: 'Cleansing Details',
    },
    {
      id: 'cleaningAgents',
      type: 'textarea' as const,
      label: 'Cleaning Agents Used',
      placeholder: 'List all cleaning chemicals and products used',
      required: true,
      value: '',
      section: 'Cleansing Details',
    },
    {
      id: 'equipmentUsed',
      type: 'textarea' as const,
      label: 'Equipment Used',
      placeholder: 'List all equipment used',
      required: true,
      value: '',
      section: 'Cleansing Details',
    },
    {
      id: 'wasteGenerated',
      type: 'textarea' as const,
      label: 'Waste Generated',
      placeholder: 'Describe waste types and approximate volumes',
      required: false,
      value: '',
      section: 'Cleansing Details',
    },
    
    // Section 4: Inspection and Compliance
    {
      id: 'cleanlinessLevel',
      type: 'select' as const,
      label: 'Cleanliness Level Achieved',
      options: ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement', 'Unsatisfactory'],
      required: true,
      value: '',
      section: 'Inspection and Compliance',
    },
    {
      id: 'inspected',
      type: 'radio' as const,
      label: 'Has the area been inspected after cleaning?',
      options: ['Yes', 'No'],
      required: true,
      value: 'No',
      section: 'Inspection and Compliance',
    },
    {
      id: 'inspectedBy',
      type: 'text' as const,
      label: 'Inspected By (if applicable)',
      placeholder: 'Name of inspector',
      required: false,
      value: '',
      section: 'Inspection and Compliance',
    },
    {
      id: 'issues',
      type: 'textarea' as const,
      label: 'Issues Identified',
      placeholder: 'Describe any issues found during inspection',
      required: false,
      value: '',
      section: 'Inspection and Compliance',
    },
    {
      id: 'nextScheduledCleaning',
      type: 'date' as const,
      label: 'Next Scheduled Cleaning',
      required: false,
      value: '',
      section: 'Inspection and Compliance',
    },
    
    // Section 5: Environment and Safety
    {
      id: 'environmentalMeasures',
      type: 'textarea' as const,
      label: 'Environmental Protection Measures',
      placeholder: 'Describe measures taken to protect the environment',
      required: false,
      value: '',
      section: 'Environment and Safety',
    },
    {
      id: 'safetyMeasures',
      type: 'textarea' as const,
      label: 'Safety Measures Implemented',
      placeholder: 'Describe safety measures followed during cleaning',
      required: false,
      value: '',
      section: 'Environment and Safety',
    },
    {
      id: 'hazardousWasteHandling',
      type: 'radio' as const,
      label: 'Was hazardous waste encountered?',
      options: ['Yes', 'No'],
      required: true,
      value: 'No',
      section: 'Environment and Safety',
    },
    {
      id: 'hazardousWasteDetails',
      type: 'textarea' as const,
      label: 'Hazardous Waste Handling Details (if applicable)',
      placeholder: 'Explain how hazardous waste was managed',
      required: false,
      value: '',
      section: 'Environment and Safety',
    },
    
    // Section 6: Declaration
    {
      id: 'satisfaction',
      type: 'radio' as const,
      label: 'Is the cleansing result satisfactory?',
      options: ['Yes', 'No', 'Partially'],
      required: true,
      value: '',
      section: 'Declaration',
    },
    {
      id: 'followUpRequired',
      type: 'radio' as const,
      label: 'Is follow-up cleaning required?',
      options: ['Yes', 'No'],
      required: true,
      value: '',
      section: 'Declaration',
    },
    {
      id: 'followUpDate',
      type: 'date' as const,
      label: 'Follow-up Date (if required)',
      required: false,
      value: '',
      section: 'Declaration',
    },
    {
      id: 'safetyCompliance',
      type: 'checkbox' as const,
      label: 'I confirm all cleaning was conducted in accordance with health and safety requirements',
      required: true,
      value: false,
      section: 'Declaration',
    },
    {
      id: 'dataConfirmation',
      type: 'checkbox' as const,
      label: 'I confirm that the information provided is accurate and complies with ISO19650 requirements',
      required: true,
      value: false,
      section: 'Declaration',
    },
  ];

  return (
    <ISO19650FormTemplate
      title="Cleansing Record Form"
      description="Document cleansing activities in compliance with ISO19650 standards"
      icon={<RiBrushLine />}
      fields={fields}
      onSubmit={onSubmit}
      onCancel={onCancel}
      formType="cleansing"
    />
  );
};

export default CleansingRecordForm; 