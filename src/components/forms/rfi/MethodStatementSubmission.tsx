import React from 'react';
import { RfiFormTemplate } from '../RfiFormTemplate';
import { RiFileTextLine } from 'react-icons/ri';
import { IconWrapper } from '../../ui/IconWrapper';

const MethodStatementSubmission: React.FC<{ onCancel: () => void; onSubmit: (data: any) => void }> = ({ onCancel, onSubmit }) => {
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
      id: 'workActivity',
      type: 'text' as const,
      label: 'Work Activity',
      placeholder: 'Describe the specific work activity this method statement covers',
      required: true,
      value: ''
    },
    {
      id: 'location',
      type: 'text' as const,
      label: 'Location on Site',
      placeholder: 'Specify where this work will be carried out',
      required: true,
      value: ''
    },
    {
      id: 'contractorName',
      type: 'text' as const,
      label: 'Contractor/Subcontractor Name',
      placeholder: 'Enter the name of the contractor performing the work',
      required: true,
      value: ''
    },
    {
      id: 'supervisorName',
      type: 'text' as const,
      label: 'Work Supervisor Name',
      placeholder: 'Enter the name of the person who will supervise this work',
      required: true,
      value: ''
    },
    {
      id: 'supervisorContact',
      type: 'text' as const,
      label: 'Supervisor Contact Number',
      placeholder: 'Enter contact number for the supervisor',
      required: true,
      value: ''
    },
    {
      id: 'startDate',
      type: 'date' as const,
      label: 'Planned Start Date',
      required: true,
      value: ''
    },
    {
      id: 'endDate',
      type: 'date' as const,
      label: 'Planned Completion Date',
      required: true,
      value: ''
    },
    {
      id: 'workDescription',
      type: 'textarea' as const,
      label: 'Work Description',
      placeholder: 'Provide a detailed description of the work to be performed',
      required: true,
      value: ''
    },
    {
      id: 'sequenceOfWork',
      type: 'textarea' as const,
      label: 'Sequence of Work',
      placeholder: 'List the step-by-step sequence for performing this work',
      required: true,
      value: ''
    },
    {
      id: 'plantEquipment',
      type: 'textarea' as const,
      label: 'Plant & Equipment to be Used',
      placeholder: 'List all plant, tools, and equipment that will be used',
      required: true,
      value: ''
    },
    {
      id: 'materials',
      type: 'textarea' as const,
      label: 'Materials to be Used',
      placeholder: 'List all materials that will be used in this activity',
      required: true,
      value: ''
    },
    {
      id: 'laborRequirements',
      type: 'textarea' as const,
      label: 'Labor Requirements',
      placeholder: 'Describe the labor requirements (number of workers, skills needed)',
      required: true,
      value: ''
    },
    {
      id: 'safetyMeasures',
      type: 'textarea' as const,
      label: 'Safety Measures',
      placeholder: 'Describe the safety measures that will be implemented',
      required: true,
      value: ''
    },
    {
      id: 'ppe',
      type: 'textarea' as const,
      label: 'Personal Protective Equipment (PPE)',
      placeholder: 'List all PPE required for this work',
      required: true,
      value: ''
    },
    {
      id: 'qualityControls',
      type: 'textarea' as const,
      label: 'Quality Control Measures',
      placeholder: 'Describe the quality control measures that will be implemented',
      required: true,
      value: ''
    },
    {
      id: 'environmentalControls',
      type: 'textarea' as const,
      label: 'Environmental Control Measures',
      placeholder: 'Describe measures to control environmental impact',
      required: false,
      value: ''
    },
    {
      id: 'permitRequired',
      type: 'checkbox' as const,
      label: 'This work requires special permits or authorizations',
      required: false,
      value: false
    },
    {
      id: 'trainingRequired',
      type: 'checkbox' as const,
      label: 'Workers require specialized training or certification for this activity',
      required: false,
      value: false
    },
    {
      id: 'acknowledgement',
      type: 'checkbox' as const,
      label: 'I confirm that all workers will be briefed on this method statement before work begins',
      required: true,
      value: false
    }
  ];

  return (
    <RfiFormTemplate
      title="Method Statement Submission"
      description="Submit detailed method statements for construction activities"
      icon={<div><IconWrapper icon="RiFileTextLine" /></div>}
      fields={fields}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
};

export default MethodStatementSubmission; 