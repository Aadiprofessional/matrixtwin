import React, { useState } from 'react';
import { RfiFormTemplate } from '../RfiFormTemplate';
import { RiRulerLine } from 'react-icons/ri';
import { IconWrapper } from '../../ui/IconWrapper';
import { generateFormPdf } from '../../../utils/pdfUtils';
import { useAuth } from '../../../contexts/AuthContext';
import { useProjects } from '../../../contexts/ProjectContext';
import { UserSelectionModal } from '../../modals/UserSelectionModal';
import { createForm } from '../../../api/forms';

interface FormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  [key: string]: any;
}

const SurveyCheckForm: React.FC<{ onCancel: () => void; onSubmit: (data: FormData) => void }> = ({ onCancel, onSubmit }) => {
  const { user } = useAuth();
  const { selectedProject } = useProjects();
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showUserSelection, setShowUserSelection] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [generatedPdf, setGeneratedPdf] = useState<File | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      if (!user?.id) return;

      const response = await fetch(`https://matrixbim-server.onrender.com/api/auth/users/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

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
      label: 'Survey Location',
      placeholder: 'Specify the exact location to be surveyed',
      required: true,
      value: '',
      page: 1
    },
    {
      id: 'surveyType',
      type: 'select' as const,
      label: 'Type of Survey',
      options: [
        'Topographic Survey',
        'Boundary Survey',
        'As-Built Survey',
        'Construction Layout',
        'Site Planning',
        'Elevation Certificate',
        'Foundation Survey',
        'ALTA/NSPS Survey',
        'Subdivision Survey',
        'Other'
      ],
      required: true,
      value: '',
      page: 1
    },
    {
      id: 'siteAccess',
      type: 'checkbox' as const,
      label: 'I confirm that the site is accessible and ready for survey',
      required: true,
      value: false,
      page: 1
    },
    {
      id: 'safetyMeasures',
      type: 'checkbox' as const,
      label: 'Required safety measures are in place',
      required: true,
      value: false,
      page: 1
    },
    {
      id: 'preferredDate',
      type: 'date' as const,
      label: 'Preferred Survey Date',
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
      label: 'Alternate Survey Date',
      required: true,
      value: '',
      page: 2
    },
    {
      id: 'specificRequirements',
      type: 'textarea' as const,
      label: 'Survey Requirements',
      placeholder: 'Include any specific measurements, features, or areas that need special attention',
      required: false,
      value: '',
      page: 2
    },
    {
      id: 'contactPerson',
      type: 'text' as const,
      label: 'On-site Contact Person',
      placeholder: 'Name of person who will meet the surveyor',
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
      id: 'existingData',
      type: 'radio' as const,
      label: 'Are there existing survey records or data available?',
      options: ['Yes', 'No', 'Unsure'],
      required: true,
      value: 'No',
      page: 2
    }
  ];

  const handleSubmit = async (data: FormData) => {
    try {
      // Generate PDF from form data
      const formFields = Object.entries(data)
        .filter(([key]) => key !== 'attachments')
        .map(([key, value]) => {
          const field = fields.find(f => f.id === key);
          return {
            label: field?.label || key,
            value: value as string | string[] | boolean
          };
        });

      // Add attachments information
      if (attachments.length > 0) {
        formFields.push({
          label: 'Attachments',
          value: attachments.map(file => file.name).join(', ')
        });
      }

      const pdf = await generateFormPdf(
        'Survey Check Request',
        'Request for survey verification',
        formFields,
        selectedProject?.name,
        user?.name
      );

      // Store form data and PDF for user selection
      setFormData({
        ...data,
        title: 'Survey Check Request',
        description: data.location || 'Request for survey verification',
        priority: 'high'
      });
      setGeneratedPdf(pdf);

      // Fetch users and show selection modal
      await fetchUsers();
      setShowUserSelection(true);
    } catch (error) {
      console.error('Error preparing form submission:', error);
    }
  };

  const handleUserSelection = async (selectedUserIds: string[]) => {
    try {
      if (!generatedPdf || !formData || !user || !selectedProject) return;

      await createForm(
        generatedPdf,
        user.id,
        formData.title,
        formData.description,
        selectedUserIds,
        selectedProject.id,
        formData.priority,
        'rfi'
      );

      // Reset state
      setGeneratedPdf(null);
      setFormData(null);
      setShowUserSelection(false);
      setAttachments([]);

      // Call parent onSubmit
      onSubmit(formData);
    } catch (error) {
      console.error('Error creating form:', error);
    }
  };

  const handleFileChange = (files: File[]) => {
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <RfiFormTemplate<FormData>
        title="Survey Check Request"
        description="Request for survey verification and measurements"
        icon={<div><IconWrapper icon="RiRulerLine" /></div>}
        fields={fields}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        pages={2}
        onFileChange={handleFileChange}
        onFileRemove={removeAttachment}
        attachments={attachments}
      />

      <UserSelectionModal
        isOpen={showUserSelection}
        onClose={() => setShowUserSelection(false)}
        onSubmit={handleUserSelection}
        users={users}
        title="Assign Survey Check Request"
        description="Select users to assign this survey request to"
      />
    </>
  );
};

export default SurveyCheckForm; 