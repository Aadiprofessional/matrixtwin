import React from 'react';
import { RfiFormTemplate } from '../RfiFormTemplate';
import { RiTimeLine } from 'react-icons/ri';
import { IconWrapper } from '../../ui/IconWrapper';

const DelayNotification: React.FC<{ onCancel: () => void; onSubmit: (data: any) => void }> = ({ onCancel, onSubmit }) => {
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
      id: 'contractorName',
      type: 'text' as const,
      label: 'Contractor/Subcontractor Name',
      placeholder: 'Enter your company name',
      required: true,
      value: ''
    },
    {
      id: 'notificationDate',
      type: 'date' as const,
      label: 'Notification Date',
      required: true,
      value: new Date().toISOString().split('T')[0]
    },
    {
      id: 'workPackage',
      type: 'text' as const,
      label: 'Work Package/Activity',
      placeholder: 'Enter the work package or activity that is delayed',
      required: true,
      value: ''
    },
    {
      id: 'location',
      type: 'text' as const,
      label: 'Location on Site',
      placeholder: 'Specify the location affected by the delay',
      required: true,
      value: ''
    },
    {
      id: 'originalStartDate',
      type: 'date' as const,
      label: 'Original Start Date',
      required: true,
      value: ''
    },
    {
      id: 'originalEndDate',
      type: 'date' as const,
      label: 'Original Completion Date',
      required: true,
      value: ''
    },
    {
      id: 'revisedStartDate',
      type: 'date' as const,
      label: 'Revised Start Date (if applicable)',
      required: false,
      value: ''
    },
    {
      id: 'revisedEndDate',
      type: 'date' as const,
      label: 'Revised Completion Date',
      required: true,
      value: ''
    },
    {
      id: 'delayDuration',
      type: 'text' as const,
      label: 'Estimated Delay Duration (days)',
      placeholder: 'Enter the number of days',
      required: true,
      value: ''
    },
    {
      id: 'delayReason',
      type: 'select' as const,
      label: 'Primary Reason for Delay',
      options: [
        'Weather Conditions',
        'Material Delivery Delay',
        'Labor Shortage',
        'Equipment Failure',
        'Design Change',
        'Site Access Issue',
        'Permit Delay',
        'Unforeseen Site Condition',
        'Preceding Work Incomplete',
        'COVID-19 Related',
        'Other'
      ],
      required: true,
      value: ''
    },
    {
      id: 'delayDescription',
      type: 'textarea' as const,
      label: 'Detailed Description of Delay',
      placeholder: 'Provide a detailed explanation of the circumstances causing the delay',
      required: true,
      value: ''
    },
    {
      id: 'impactDescription',
      type: 'textarea' as const,
      label: 'Impact on Project Schedule',
      placeholder: 'Describe how this delay will impact the overall project schedule',
      required: true,
      value: ''
    },
    {
      id: 'criticalPath',
      type: 'radio' as const,
      label: 'Does this delay affect the critical path?',
      options: ['Yes', 'No', 'Unknown'],
      required: true,
      value: 'Unknown'
    },
    {
      id: 'mitigation',
      type: 'textarea' as const,
      label: 'Mitigation Measures',
      placeholder: 'Describe what measures will be taken to minimize this delay',
      required: true,
      value: ''
    },
    {
      id: 'additionalResources',
      type: 'textarea' as const,
      label: 'Additional Resources Required',
      placeholder: 'List any additional resources needed to mitigate this delay',
      required: false,
      value: ''
    },
    {
      id: 'costImpact',
      type: 'radio' as const,
      label: 'Will this delay result in additional costs?',
      options: ['Yes', 'No', 'Unknown at this time'],
      required: true,
      value: 'Unknown at this time'
    },
    {
      id: 'thirdPartyDelay',
      type: 'checkbox' as const,
      label: 'This delay is caused by factors outside our control',
      required: false,
      value: false
    },
    {
      id: 'timeExtensionRequest',
      type: 'checkbox' as const,
      label: 'We formally request an extension of time due to this delay',
      required: false,
      value: false
    }
  ];

  return (
    <RfiFormTemplate
      title="Delay Notification"
      description="Notify project management of delays affecting the schedule"
      icon={<div><IconWrapper icon="RiTimeLine" /></div>}
      fields={fields}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
};

export default DelayNotification; 