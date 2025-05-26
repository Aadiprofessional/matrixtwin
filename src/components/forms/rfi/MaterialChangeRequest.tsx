import React from 'react';
import { RfiFormTemplate } from '../RfiFormTemplate';
import { RiSwapBoxLine } from 'react-icons/ri';
import { IconWrapper } from '../../ui/IconWrapper';

const MaterialChangeRequest: React.FC<{ onCancel: () => void; onSubmit: (data: any) => void }> = ({ onCancel, onSubmit }) => {
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
      id: 'location',
      type: 'text' as const,
      label: 'Location on Site',
      placeholder: 'Specify the location where the material will be used',
      required: true,
      value: ''
    },
    {
      id: 'originalMaterial',
      type: 'text' as const,
      label: 'Original Material Specified',
      placeholder: 'Enter the originally specified material',
      required: true,
      value: ''
    },
    {
      id: 'proposedMaterial',
      type: 'text' as const,
      label: 'Proposed Material',
      placeholder: 'Enter the proposed replacement material',
      required: true,
      value: ''
    },
    {
      id: 'reasonForChange',
      type: 'textarea' as const,
      label: 'Reason for Change',
      placeholder: 'Explain why the material change is necessary',
      required: true,
      value: ''
    },
    {
      id: 'costImplication',
      type: 'select' as const,
      label: 'Cost Implication',
      options: ['Cost Increase', 'Cost Decrease', 'No Cost Change', 'To Be Determined'],
      required: true,
      value: ''
    },
    {
      id: 'timelineImpact',
      type: 'textarea' as const,
      label: 'Impact on Project Timeline',
      placeholder: 'Describe how this change might affect the project timeline',
      required: true,
      value: ''
    },
    {
      id: 'technicalSpecifications',
      type: 'textarea' as const,
      label: 'Technical Specifications',
      placeholder: 'Provide technical details of the proposed material',
      required: false,
      value: ''
    },
    {
      id: 'complianceStatement',
      type: 'checkbox' as const,
      label: 'I confirm that the proposed material meets all required building codes and standards',
      required: true,
      value: false
    },
    {
      id: 'requestDate',
      type: 'date' as const,
      label: 'Request Date',
      required: true,
      value: new Date().toISOString().split('T')[0]
    }
  ];

  return (
    <RfiFormTemplate
      title="Material Change Request"
      description="Request approval to substitute specified materials with alternatives"
      icon={<div><IconWrapper icon="RiSwapBoxLine" /></div>}
      fields={fields}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
};

export default MaterialChangeRequest; 