import React from 'react';
import { RfiFormTemplate } from '../RfiFormTemplate';
import { RiAlarmWarningLine } from 'react-icons/ri';
import { IconWrapper } from '../../ui/IconWrapper';

const SiteIssueReport: React.FC<{ onCancel: () => void; onSubmit: (data: any) => void }> = ({ onCancel, onSubmit }) => {
  const fields = [
    {
      id: 'projectReference',
      type: 'text' as const,
      label: 'Project Reference',
      placeholder: 'Enter project reference code',
      required: true,
      value: ''
    },
    {
      id: 'issueDate',
      type: 'date' as const,
      label: 'Date Issue Discovered',
      required: true,
      value: new Date().toISOString().split('T')[0]
    },
    {
      id: 'location',
      type: 'text' as const,
      label: 'Location on Site',
      placeholder: 'Specify the exact location of the issue',
      required: true,
      value: ''
    },
    {
      id: 'issueCategory',
      type: 'select' as const,
      label: 'Issue Category',
      options: [
        'Structural Issue', 
        'Safety Hazard', 
        'Quality Concern', 
        'Construction Defect', 
        'Material Failure', 
        'Site Condition', 
        'Utility Problem',
        'Weather Damage',
        'Equipment Failure',
        'Other'
      ],
      required: true,
      value: ''
    },
    {
      id: 'severity',
      type: 'select' as const,
      label: 'Severity Level',
      options: ['Low - No immediate action required', 'Medium - Requires attention within the week', 'High - Requires prompt attention (24-48 hours)', 'Critical - Requires immediate action'],
      required: true,
      value: ''
    },
    {
      id: 'issueDescription',
      type: 'textarea' as const,
      label: 'Issue Description',
      placeholder: 'Provide a detailed description of the issue',
      required: true,
      value: ''
    },
    {
      id: 'potentialImpact',
      type: 'textarea' as const,
      label: 'Potential Impact',
      placeholder: 'Describe how this issue might impact the project (schedule, cost, quality, safety)',
      required: true,
      value: ''
    },
    {
      id: 'rootCause',
      type: 'textarea' as const,
      label: 'Possible Root Cause',
      placeholder: 'If known, describe what you believe caused this issue',
      required: false,
      value: ''
    },
    {
      id: 'recommendedAction',
      type: 'textarea' as const,
      label: 'Recommended Action',
      placeholder: 'Suggest what actions should be taken to address this issue',
      required: false,
      value: ''
    },
    {
      id: 'temporaryMeasures',
      type: 'textarea' as const,
      label: 'Temporary Measures Taken',
      placeholder: 'Describe any immediate actions that have already been taken',
      required: false,
      value: ''
    },
    {
      id: 'affectedTrades',
      type: 'text' as const,
      label: 'Affected Trades/Contractors',
      placeholder: 'List any trades or contractors affected by or involved with this issue',
      required: true,
      value: ''
    },
    {
      id: 'workStopped',
      type: 'radio' as const,
      label: 'Has work been stopped due to this issue?',
      options: ['Yes', 'No', 'Partially'],
      required: true,
      value: 'No'
    },
    {
      id: 'safetyImpact',
      type: 'checkbox' as const,
      label: 'This issue has safety implications that require immediate attention',
      required: false,
      value: false
    }
  ];

  return (
    <RfiFormTemplate
      title="Site Issue Report"
      description="Report issues, defects, or concerns discovered on site"
      icon={<div><IconWrapper icon="RiAlarmWarningLine" /></div>}
      fields={fields}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
};

export default SiteIssueReport; 