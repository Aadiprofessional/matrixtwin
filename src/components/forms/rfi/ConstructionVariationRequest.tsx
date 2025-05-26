import React from 'react';
import { RfiFormTemplate } from '../RfiFormTemplate';
import { RiExchangeLine } from 'react-icons/ri';
import { IconWrapper } from '../../ui/IconWrapper';

const ConstructionVariationRequest: React.FC<{ onCancel: () => void; onSubmit: (data: any) => void }> = ({ onCancel, onSubmit }) => {
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
      id: 'variationNumber',
      type: 'text' as const,
      label: 'Variation Request Number',
      placeholder: 'Enter a unique identifier for this variation',
      required: true,
      value: ''
    },
    {
      id: 'requestDate',
      type: 'date' as const,
      label: 'Request Date',
      required: true,
      value: new Date().toISOString().split('T')[0]
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
      id: 'location',
      type: 'text' as const,
      label: 'Location on Site',
      placeholder: 'Specify the location affected by this variation',
      required: true,
      value: ''
    },
    {
      id: 'drawingReference',
      type: 'text' as const,
      label: 'Drawing/Document Reference',
      placeholder: 'Enter relevant drawing numbers or document references',
      required: true,
      value: ''
    },
    {
      id: 'variationType',
      type: 'select' as const,
      label: 'Variation Type',
      options: [
        'Additional Work', 
        'Omission of Work', 
        'Substitution of Materials/Methods', 
        'Design Change', 
        'Unforeseen Condition', 
        'Client Request',
        'Regulatory Requirement',
        'Value Engineering',
        'Other'
      ],
      required: true,
      value: ''
    },
    {
      id: 'variationTitle',
      type: 'text' as const,
      label: 'Variation Title',
      placeholder: 'Enter a brief title for this variation',
      required: true,
      value: ''
    },
    {
      id: 'descriptionOfChange',
      type: 'textarea' as const,
      label: 'Description of Change',
      placeholder: 'Provide a detailed description of the proposed variation',
      required: true,
      value: ''
    },
    {
      id: 'reasonForChange',
      type: 'textarea' as const,
      label: 'Reason for Change',
      placeholder: 'Explain why this variation is necessary or beneficial',
      required: true,
      value: ''
    },
    {
      id: 'originalScope',
      type: 'textarea' as const,
      label: 'Original Scope/Specification',
      placeholder: 'Describe the original scope that is being varied',
      required: true,
      value: ''
    },
    {
      id: 'proposedScope',
      type: 'textarea' as const,
      label: 'Proposed Scope/Specification',
      placeholder: 'Describe the proposed revised scope',
      required: true,
      value: ''
    },
    {
      id: 'costImplication',
      type: 'radio' as const,
      label: 'Cost Implication',
      options: ['Cost Increase', 'Cost Decrease', 'No Cost Change', 'To Be Determined'],
      required: true,
      value: ''
    },
    {
      id: 'estimatedCost',
      type: 'text' as const,
      label: 'Estimated Cost Variation (HKD)',
      placeholder: 'Enter the estimated cost impact (if known)',
      required: false,
      value: ''
    },
    {
      id: 'scheduleImplication',
      type: 'radio' as const,
      label: 'Schedule Implication',
      options: ['Schedule Extension', 'Schedule Reduction', 'No Schedule Impact', 'To Be Determined'],
      required: true,
      value: ''
    },
    {
      id: 'estimatedTimeImpact',
      type: 'text' as const,
      label: 'Estimated Time Impact (days)',
      placeholder: 'Enter the estimated impact on schedule in days',
      required: false,
      value: ''
    },
    {
      id: 'qualityImpact',
      type: 'textarea' as const,
      label: 'Impact on Quality',
      placeholder: 'Describe any impact this variation may have on quality',
      required: false,
      value: ''
    },
    {
      id: 'otherTrades',
      type: 'textarea' as const,
      label: 'Impact on Other Trades',
      placeholder: 'Describe how this variation might affect other trades/contractors',
      required: false,
      value: ''
    },
    {
      id: 'designerApproval',
      type: 'checkbox' as const,
      label: 'This variation requires designer/engineer approval',
      required: false,
      value: true
    },
    {
      id: 'clientApproval',
      type: 'checkbox' as const,
      label: 'This variation requires client approval',
      required: false,
      value: true
    }
  ];

  return (
    <RfiFormTemplate
      title="Construction Variation Request"
      description="Request changes to contract scope, specifications, or requirements"
      icon={<div><IconWrapper icon="RiExchangeLine" /></div>}
      fields={fields}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
};

export default ConstructionVariationRequest; 