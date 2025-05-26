import React from 'react';
import { RiShieldCheckLine } from 'react-icons/ri';
import { ISO19650FormTemplate } from '../ISO19650FormTemplate';

interface SafetyInspectionFormProps {
  onCancel: () => void;
  onSubmit: (data: any) => void;
}

const SafetyInspectionForm: React.FC<SafetyInspectionFormProps> = ({ onCancel, onSubmit }) => {
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
      id: 'inspectionRefNum',
      type: 'text' as const,
      label: 'Inspection Reference Number',
      placeholder: 'Enter inspection reference number',
      required: true,
      value: '',
      section: 'General Information',
      info: 'Format: SI-YYYY-MM-DD-###',
    },
    {
      id: 'inspectorName',
      type: 'text' as const,
      label: 'Inspector Name',
      placeholder: 'Name of person conducting inspection',
      required: true,
      value: '',
      section: 'General Information',
    },
    {
      id: 'inspectionDate',
      type: 'date' as const,
      label: 'Inspection Date',
      required: true,
      value: new Date().toISOString().split('T')[0],
      section: 'General Information',
    },
    {
      id: 'inspectionType',
      type: 'select' as const,
      label: 'Inspection Type',
      options: [
        'Daily Site Safety Check',
        'Weekly Safety Audit',
        'Monthly Comprehensive Inspection',
        'Fire Safety Inspection',
        'Working at Height Inspection',
        'Electrical Safety Inspection',
        'Equipment/Machinery Inspection',
        'Hazardous Materials Inspection',
        'PPE Compliance Check'
      ],
      required: true,
      value: '',
      section: 'General Information',
    },
    
    // Section 2: Inspection Area
    {
      id: 'inspectionArea',
      type: 'select' as const,
      label: 'Inspection Area',
      options: ['Ground Floor', 'Level 1', 'Level 2', 'Level 3', 'Roof', 'External', 'Site-wide'],
      required: true,
      value: '',
      section: 'Inspection Area',
    },
    {
      id: 'specificLocation',
      type: 'text' as const,
      label: 'Specific Location',
      placeholder: 'Provide specific location details',
      required: true,
      value: '',
      section: 'Inspection Area',
    },
    {
      id: 'workInProgress',
      type: 'textarea' as const,
      label: 'Work In Progress',
      placeholder: 'Describe work activities in the inspection area',
      required: true,
      value: '',
      section: 'Inspection Area',
    },
    
    // Section 3: Safety Inspection Checklist (based on ISO19650 information exchange requirements)
    {
      id: 'accessEgressClear',
      type: 'radio' as const,
      label: 'Access/egress routes are clear and properly marked',
      options: ['Compliant', 'Non-Compliant', 'Not Applicable'],
      required: true,
      value: '',
      section: 'Safety Inspection Checklist',
    },
    {
      id: 'fallingObjectProtection',
      type: 'radio' as const,
      label: 'Protection against falling objects is in place',
      options: ['Compliant', 'Non-Compliant', 'Not Applicable'],
      required: true,
      value: '',
      section: 'Safety Inspection Checklist',
    },
    {
      id: 'workingAtHeightMeasures',
      type: 'radio' as const,
      label: 'Working at height safety measures are in place',
      options: ['Compliant', 'Non-Compliant', 'Not Applicable'],
      required: true,
      value: '',
      section: 'Safety Inspection Checklist',
    },
    {
      id: 'electricalSafety',
      type: 'radio' as const,
      label: 'Electrical safety measures are in place',
      options: ['Compliant', 'Non-Compliant', 'Not Applicable'],
      required: true,
      value: '',
      section: 'Safety Inspection Checklist',
    },
    {
      id: 'firePreventionMeasures',
      type: 'radio' as const,
      label: 'Fire prevention/protection measures are in place',
      options: ['Compliant', 'Non-Compliant', 'Not Applicable'],
      required: true,
      value: '',
      section: 'Safety Inspection Checklist',
    },
    {
      id: 'scaffoldingInspected',
      type: 'radio' as const,
      label: 'Scaffolding has been inspected and tagged',
      options: ['Compliant', 'Non-Compliant', 'Not Applicable'],
      required: true,
      value: '',
      section: 'Safety Inspection Checklist',
    },
    {
      id: 'hoistingEquipmentCertified',
      type: 'radio' as const,
      label: 'Hoisting equipment is certified and properly maintained',
      options: ['Compliant', 'Non-Compliant', 'Not Applicable'],
      required: true,
      value: '',
      section: 'Safety Inspection Checklist',
    },
    {
      id: 'ppeCompliance',
      type: 'radio' as const,
      label: 'Workers are wearing appropriate PPE',
      options: ['Compliant', 'Non-Compliant', 'Not Applicable'],
      required: true,
      value: '',
      section: 'Safety Inspection Checklist',
    },
    {
      id: 'hazardousMaterialsManaged',
      type: 'radio' as const,
      label: 'Hazardous materials are properly stored and managed',
      options: ['Compliant', 'Non-Compliant', 'Not Applicable'],
      required: true,
      value: '',
      section: 'Safety Inspection Checklist',
    },
    {
      id: 'wasteManagement',
      type: 'radio' as const,
      label: 'Waste management processes are being followed',
      options: ['Compliant', 'Non-Compliant', 'Not Applicable'],
      required: true,
      value: '',
      section: 'Safety Inspection Checklist',
    },
    
    // Section 4: Findings and Actions
    {
      id: 'nonComplianceDetails',
      type: 'textarea' as const,
      label: 'Non-Compliance Details',
      placeholder: 'Provide details of any non-compliant items identified',
      required: false,
      value: '',
      section: 'Findings and Actions',
    },
    {
      id: 'immediateActions',
      type: 'textarea' as const,
      label: 'Immediate Actions Taken',
      placeholder: 'Describe any immediate actions taken during inspection',
      required: false,
      value: '',
      section: 'Findings and Actions',
    },
    {
      id: 'recommendedActions',
      type: 'textarea' as const,
      label: 'Recommended Actions',
      placeholder: 'Describe recommended actions to address findings',
      required: true,
      value: '',
      section: 'Findings and Actions',
    },
    {
      id: 'actionDeadline',
      type: 'date' as const,
      label: 'Action Deadline',
      required: false,
      value: '',
      section: 'Findings and Actions',
    },
    {
      id: 'responsible',
      type: 'text' as const,
      label: 'Responsible Person',
      placeholder: 'Person responsible for implementing actions',
      required: false,
      value: '',
      section: 'Findings and Actions',
    },
    
    // Section 5: Declaration
    {
      id: 'overallSafetyScore',
      type: 'select' as const,
      label: 'Overall Safety Score',
      options: ['100%', '95%', '90%', '85%', '80%', '75%', '70%', '65%', '60%', '55%', '50%', 'Less than 50%'],
      required: true,
      value: '',
      section: 'Declaration',
    },
    {
      id: 'requiresFollowUp',
      type: 'radio' as const,
      label: 'Does this inspection require follow-up?',
      options: ['Yes', 'No'],
      required: true,
      value: '',
      section: 'Declaration',
    },
    {
      id: 'followUpDate',
      type: 'date' as const,
      label: 'Follow-up Date (if applicable)',
      required: false,
      value: '',
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
      title="Safety Inspection Form"
      description="Conduct safety inspections in compliance with ISO19650 standards"
      icon={<RiShieldCheckLine />}
      fields={fields}
      onSubmit={onSubmit}
      onCancel={onCancel}
      formType="safety"
    />
  );
};

export default SafetyInspectionForm; 