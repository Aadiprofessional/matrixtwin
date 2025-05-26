import React from 'react';
import { RfiFormTemplate } from '../RfiFormTemplate';
import { RiCheckboxMultipleLine } from 'react-icons/ri';
import { IconWrapper } from '../../ui/IconWrapper';

const InspectionRequest: React.FC<{ onCancel: () => void; onSubmit: (data: any) => void }> = ({ onCancel, onSubmit }) => {
  const fields = [
    {
      id: 'projectReference',
      type: 'text' as const,
      label: 'Project Reference',
      placeholder: 'Enter project reference code',
      required: true,
      value: '',
      page: 1
    },
    {
      id: 'location',
      type: 'text' as const,
      label: 'Location on Site',
      placeholder: 'Specify the exact location to be inspected',
      required: true,
      value: '',
      page: 1
    },
    {
      id: 'inspectionType',
      type: 'select' as const,
      label: 'Type of Inspection',
      options: [
        'Foundation', 
        'Framing', 
        'Electrical', 
        'Plumbing', 
        'Mechanical', 
        'Insulation', 
        'Drywall', 
        'Roofing', 
        'Final Building', 
        'Fire Safety',
        'Structural Steel',
        'Concrete Pour',
        'Waterproofing',
        'Site Drainage',
        'Other'
      ],
      required: true,
      value: '',
      page: 1
    },
    {
      id: 'workCompleted',
      type: 'checkbox' as const,
      label: 'I confirm that all work to be inspected has been completed according to specifications',
      required: true,
      value: false,
      page: 1
    },
    {
      id: 'siteReady',
      type: 'checkbox' as const,
      label: 'I confirm that the site is clean, accessible, and ready for inspection',
      required: true,
      value: false,
      page: 1
    },
    {
      id: 'preferredDate',
      type: 'date' as const,
      label: 'Preferred Inspection Date',
      required: true,
      value: '',
      page: 2
    },
    {
      id: 'preferredTime',
      type: 'select' as const,
      label: 'Preferred Time',
      options: ['Morning (8:00 AM - 12:00 PM)', 'Afternoon (12:00 PM - 5:00 PM)'],
      required: true,
      value: '',
      page: 2
    },
    {
      id: 'alternateDate',
      type: 'date' as const,
      label: 'Alternate Inspection Date',
      required: true,
      value: '',
      page: 2
    },
    {
      id: 'specificRequirements',
      type: 'textarea' as const,
      label: 'Specific Requirements or Notes',
      placeholder: 'Include any special instructions or information for the inspector',
      required: false,
      value: '',
      page: 2
    },
    {
      id: 'contactPerson',
      type: 'text' as const,
      label: 'On-site Contact Person',
      placeholder: 'Name of person who will meet the inspector',
      required: true,
      value: '',
      page: 2
    },
    {
      id: 'contactPhone',
      type: 'text' as const,
      label: 'Contact Phone Number',
      placeholder: 'Phone number of on-site contact',
      required: true,
      value: '',
      page: 2
    },
    {
      id: 'previouslyFailed',
      type: 'radio' as const,
      label: 'Is this a re-inspection of previously failed work?',
      options: ['Yes', 'No'],
      required: true,
      value: 'No',
      page: 2
    }
  ];

  return (
    <RfiFormTemplate
      title="Inspection Request"
      description="Request for inspector to review completed work"
      icon={<div><IconWrapper icon="RiCheckboxMultipleLine" /></div>}
      fields={fields}
      onSubmit={onSubmit}
      onCancel={onCancel}
      pages={2}
    />
  );
};

export default InspectionRequest; 