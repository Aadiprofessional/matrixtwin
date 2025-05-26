import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { IconContext } from 'react-icons';
import { Icons } from '../../utils/iconUtils';
import { RiInformationLine, RiArrowLeftLine, RiArrowRightLine, RiCheckLine } from 'react-icons/ri';

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'time' | 'file' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  value: string | string[] | boolean;
  section?: string;
  info?: string;
  validation?: RegExp;
}

interface ISO19650FormTemplateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  fields: FormField[];
  onSubmit: (formData: Record<string, any>) => void;
  onCancel: () => void;
  color?: string;
  formType: 'labour' | 'safety' | 'cleansing';
}

export const ISO19650FormTemplate: React.FC<ISO19650FormTemplateProps> = ({
  title,
  description,
  icon,
  fields,
  onSubmit,
  onCancel,
  color = 'ai-blue',
  formType
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(
    fields.reduce((acc, field) => {
      acc[field.id] = field.value;
      return acc;
    }, {} as Record<string, any>)
  );
  
  const [attachments, setAttachments] = useState<File[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Group fields by section
  const sections = fields.reduce((acc, field) => {
    const section = field.section || 'General Information';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(field);
    return acc;
  }, {} as Record<string, FormField[]>);
  
  const sectionNames = Object.keys(sections);
  
  const handleChange = (id: string, value: string | string[] | boolean) => {
    setFormData({
      ...formData,
      [id]: value
    });
    
    // Clear validation error when field is changed
    if (validationErrors[id]) {
      const newErrors = { ...validationErrors };
      delete newErrors[id];
      setValidationErrors(newErrors);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments([...attachments, ...newFiles]);
    }
  };
  
  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };
  
  const validateCurrentStep = () => {
    const currentSectionFields = sections[sectionNames[currentStep]];
    const errors: Record<string, string> = {};
    
    currentSectionFields.forEach(field => {
      // Check required fields
      if (field.required) {
        if (
          formData[field.id] === '' || 
          formData[field.id] === undefined || 
          (Array.isArray(formData[field.id]) && formData[field.id].length === 0)
        ) {
          errors[field.id] = 'This field is required';
        }
      }
      
      // Check regex validation if provided
      if (field.validation && typeof formData[field.id] === 'string' && formData[field.id] !== '') {
        if (!field.validation.test(formData[field.id] as string)) {
          errors[field.id] = 'Invalid format';
        }
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, sectionNames.length - 1));
    }
  };
  
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep < sectionNames.length - 1) {
      nextStep();
    } else if (validateCurrentStep()) {
      // Add ISO19650 metadata
      const iso19650Data = {
        ...formData,
        attachments,
        iso19650Metadata: {
          formType,
          formIdentifier: `${formType.toUpperCase()}-${new Date().getTime()}`,
          submissionDate: new Date().toISOString(),
          standard: 'ISO 19650',
          version: '1.0',
          status: 'submitted'
        }
      };
      
      onSubmit(iso19650Data);
    }
  };
  
  // Generate form section colors
  const getFormColor = () => {
    switch (formType) {
      case 'labour':
        return 'blue';
      case 'safety':
        return 'red';
      case 'cleansing':
        return 'green';
      default:
        return 'blue';
    }
  };
  
  const formColor = getFormColor();
  
  return (
    <Card variant="ai-dark" className={`p-6 border border-${formColor}-500/20 shadow-ai-glow`}>
      <div className="mb-6 flex items-center">
        <div className={`h-12 w-12 rounded-full bg-${formColor}-500/10 text-${formColor}-500 flex items-center justify-center mr-4`}>
          <IconContext.Provider value={{ className: "text-2xl" }}>
            {icon}
          </IconContext.Provider>
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold">{title}</h2>
          <p className="text-secondary-400 text-sm">{description}</p>
        </div>
      </div>
      
      {/* Progress indicators */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">
            Section {currentStep + 1} of {sectionNames.length}
          </span>
          <span className="text-sm font-medium text-gray-300">
            {sectionNames[currentStep]}
          </span>
        </div>
        <div className="w-full bg-dark-800 rounded-full h-2 mb-1">
          <div 
            className={`h-2 rounded-full bg-${formColor}-500`} 
            style={{ width: `${((currentStep + 1) / sectionNames.length) * 100}%` }}
          ></div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {sections[sectionNames[currentStep]].map((field) => (
            <div key={field.id}>
              {field.type === 'text' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    {field.label} {field.required && <span className="text-error">*</span>}
                  </label>
                  <Input
                    placeholder={field.placeholder}
                    required={field.required}
                    value={formData[field.id] as string}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    className={`input-ai bg-dark-800/50 border-${formColor}-500/30 text-white`}
                  />
                  {field.info && (
                    <p className="mt-1 text-xs text-gray-500">{field.info}</p>
                  )}
                  {validationErrors[field.id] && (
                    <p className="mt-1 text-xs text-error">{validationErrors[field.id]}</p>
                  )}
                </div>
              )}
              
              {field.type === 'textarea' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    {field.label} {field.required && <span className="text-error">*</span>}
                  </label>
                  <textarea
                    placeholder={field.placeholder}
                    required={field.required}
                    value={formData[field.id] as string}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    rows={4}
                    className={`input-ai bg-dark-800/50 border-${formColor}-500/30 text-white w-full`}
                  />
                  {field.info && (
                    <p className="mt-1 text-xs text-gray-500">{field.info}</p>
                  )}
                  {validationErrors[field.id] && (
                    <p className="mt-1 text-xs text-error">{validationErrors[field.id]}</p>
                  )}
                </div>
              )}
              
              {field.type === 'select' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    {field.label} {field.required && <span className="text-error">*</span>}
                  </label>
                  <select
                    required={field.required}
                    value={formData[field.id] as string}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    className={`input-ai bg-dark-800/50 border-${formColor}-500/30 text-white w-full`}
                  >
                    <option value="">Select an option</option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {field.info && (
                    <p className="mt-1 text-xs text-gray-500">{field.info}</p>
                  )}
                  {validationErrors[field.id] && (
                    <p className="mt-1 text-xs text-error">{validationErrors[field.id]}</p>
                  )}
                </div>
              )}
              
              {field.type === 'date' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    {field.label} {field.required && <span className="text-error">*</span>}
                  </label>
                  <input
                    type="date"
                    required={field.required}
                    value={formData[field.id] as string}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    className={`input-ai bg-dark-800/50 border-${formColor}-500/30 text-white w-full`}
                  />
                  {field.info && (
                    <p className="mt-1 text-xs text-gray-500">{field.info}</p>
                  )}
                  {validationErrors[field.id] && (
                    <p className="mt-1 text-xs text-error">{validationErrors[field.id]}</p>
                  )}
                </div>
              )}
              
              {field.type === 'time' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    {field.label} {field.required && <span className="text-error">*</span>}
                  </label>
                  <input
                    type="time"
                    required={field.required}
                    value={formData[field.id] as string}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    className={`input-ai bg-dark-800/50 border-${formColor}-500/30 text-white w-full`}
                  />
                  {field.info && (
                    <p className="mt-1 text-xs text-gray-500">{field.info}</p>
                  )}
                  {validationErrors[field.id] && (
                    <p className="mt-1 text-xs text-error">{validationErrors[field.id]}</p>
                  )}
                </div>
              )}
              
              {field.type === 'checkbox' && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={field.id}
                    checked={formData[field.id] as boolean}
                    onChange={(e) => handleChange(field.id, e.target.checked)}
                    className={`form-checkbox h-4 w-4 text-${formColor}-500 rounded border-${formColor}-500/50 focus:ring-${formColor}-500/30 bg-dark-800`}
                  />
                  <label htmlFor={field.id} className="text-sm text-gray-400 ml-2">
                    {field.label} {field.required && <span className="text-error">*</span>}
                  </label>
                  {validationErrors[field.id] && (
                    <p className="ml-2 text-xs text-error">{validationErrors[field.id]}</p>
                  )}
                </div>
              )}
              
              {field.type === 'radio' && field.options && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    {field.label} {field.required && <span className="text-error">*</span>}
                  </label>
                  <div className="space-y-2">
                    {field.options.map((option) => (
                      <div key={option} className="flex items-center">
                        <input
                          type="radio"
                          id={`${field.id}-${option}`}
                          name={field.id}
                          value={option}
                          checked={formData[field.id] === option}
                          onChange={() => handleChange(field.id, option)}
                          className={`form-radio h-4 w-4 text-${formColor}-500 border-${formColor}-500/50 focus:ring-${formColor}-500/30 bg-dark-800`}
                        />
                        <label htmlFor={`${field.id}-${option}`} className="text-sm text-gray-400 ml-2">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                  {field.info && (
                    <p className="mt-1 text-xs text-gray-500">{field.info}</p>
                  )}
                  {validationErrors[field.id] && (
                    <p className="mt-1 text-xs text-error">{validationErrors[field.id]}</p>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {/* Attachments Section - only in the last step */}
          {currentStep === sectionNames.length - 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Attachments
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <label className={`cursor-pointer flex items-center justify-center px-4 py-2 bg-dark-800/80 text-white text-sm rounded-md border border-${formColor}-500/30 hover:bg-${formColor}-500/10`}>
                    <IconContext.Provider value={{ className: "mr-2" }}>
                      <Icons.RiUpload2Line />
                    </IconContext.Provider>
                    <span>Upload Files</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                
                {attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-dark-800/30 rounded-md">
                        <span className="text-sm text-gray-300 truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-gray-400 hover:text-error"
                        >
                          <IconContext.Provider value={{}}>
                            <Icons.RiCloseLine />
                          </IconContext.Provider>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* ISO19650 compliance notice */}
        <div className="mt-6 px-3 py-2 bg-dark-800/50 rounded border border-gray-700 text-xs text-gray-400">
          <p className="flex items-center">
            <IconContext.Provider value={{ className: "mr-2 text-gray-500" }}>
              <RiInformationLine />
            </IconContext.Provider>
            This form complies with ISO19650 information management standards for building information modeling
          </p>
        </div>
        
        <div className="flex gap-3 mt-6 justify-between">
          <div>
            {currentStep > 0 && (
              <Button
                variant="ai-secondary"
                onClick={prevStep}
                type="button"
                leftIcon={<RiArrowLeftLine />}
              >
                Previous
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              type="button"
              className="border-gray-700 text-gray-400 hover:bg-dark-800"
            >
              Cancel
            </Button>
            {currentStep < sectionNames.length - 1 ? (
              <Button
                variant="primary"
                onClick={nextStep}
                type="button"
                rightIcon={<RiArrowRightLine />}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="ai-gradient"
                type="submit"
                rightIcon={<RiCheckLine />}
              >
                Submit
              </Button>
            )}
          </div>
        </div>
      </form>
    </Card>
  );
}; 