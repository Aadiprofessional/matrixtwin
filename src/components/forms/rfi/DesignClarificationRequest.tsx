import React from 'react';
import { RfiFormTemplate } from '../RfiFormTemplate';
import { Icons } from '../../../utils/iconUtils';

const DesignClarificationRequest: React.FC<{ onCancel: () => void; onSubmit: (data: any) => void }> = ({ onCancel, onSubmit }) => {
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
      id: 'documentReference',
      type: 'text' as const,
      label: 'Document Reference',
      placeholder: 'Enter document identifier as per CDE naming convention',
      required: true,
      value: ''
    },
    {
      id: 'informationContainer',
      type: 'select' as const,
      label: 'Information Container Type',
      options: ['Model', 'Drawing', 'Schedule', 'Specification', 'Report', 'Visualization', 'Animation', 'Other'],
      required: true,
      value: ''
    },
    {
      id: 'informationStatus',
      type: 'select' as const,
      label: 'Current Information Status',
      options: ['Work in Progress', 'Shared', 'Published', 'Archived'],
      required: true,
      value: ''
    },
    {
      id: 'discipline',
      type: 'select' as const,
      label: 'Discipline',
      options: ['Architectural', 'Structural', 'MEP', 'Civil', 'Landscape', 'Interior', 'Geotechnical', 'Fire Safety', 'Other'],
      required: true,
      value: ''
    },
    {
      id: 'requestType',
      type: 'select' as const,
      label: 'Request Type',
      options: ['Information Request', 'Clarification', 'Coordination Issue', 'Technical Query', 'Design Development'],
      required: true,
      value: ''
    },
    {
      id: 'clarificationNeeded',
      type: 'textarea' as const,
      label: 'Information Requested',
      placeholder: 'Clearly describe what information is needed in accordance with DWSS requirements',
      required: true,
      value: ''
    },
    {
      id: 'requiredDate',
      type: 'date' as const,
      label: 'Information Required By',
      required: true,
      value: ''
    },
    {
      id: 'impactIfDelayed',
      type: 'textarea' as const,
      label: 'Impact if Response Delayed',
      placeholder: 'Describe the impact on the project if this information is delayed',
      required: true,
      value: ''
    },
    {
      id: 'distributionList',
      type: 'text' as const,
      label: 'Distribution List (Comma Separated)',
      placeholder: 'Enter names/roles of people who should receive this request',
      required: true,
      value: ''
    }
  ];

  return (
    <RfiFormTemplate
      title="Information Exchange Request"
      description="Request information in compliance with ISO19650 DWSS standards for Hong Kong projects"
      icon={<Icons.RiExchangeLine />}
      fields={fields}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
};

export default DesignClarificationRequest; 