import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { IconContext } from 'react-icons';
import { Icons } from '../../utils/iconUtils';

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'file' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  value: string | string[] | boolean;
  page?: number;
}

interface RfiFormTemplateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  fields: FormField[];
  onSubmit: (formData: Record<string, any>) => void;
  onCancel: () => void;
  pages?: number;
}

export const RfiFormTemplate: React.FC<RfiFormTemplateProps> = ({
  title,
  description,
  icon = <Icons.RiFileList3Line />,
  fields,
  onSubmit,
  onCancel,
  pages = 1
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [formData, setFormData] = useState<Record<string, any>>(
    fields.reduce((acc, field) => {
      acc[field.id] = field.value;
      return acc;
    }, {} as Record<string, any>)
  );
  
  const [attachments, setAttachments] = useState<File[]>([]);
  
  const handleChange = (id: string, value: string | string[] | boolean) => {
    setFormData({
      ...formData,
      [id]: value
    });
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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      attachments
    });
  };
  
  const changePage = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= pages) {
      setCurrentPage(pageNumber);
    }
  };
  
  const filteredFields = fields.filter(field => 
    !field.page || field.page === currentPage
  );
  
  const pageNumbers = Array.from({ length: pages }, (_, i) => i + 1);
  
  return (
    <Card variant="ai-dark" className="p-6 border border-ai-blue/20 shadow-ai-glow">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <div className="h-12 w-12 rounded-full bg-ai-blue/10 text-ai-blue flex items-center justify-center mr-4">
            <IconContext.Provider value={{ className: "text-2xl" }}>
              {icon}
            </IconContext.Provider>
          </div>
          <div>
            <h2 className="text-xl font-display font-semibold">{title}</h2>
            <p className="text-secondary-400 text-sm">{description}</p>
          </div>
        </div>
        {pages > 1 && (
          <div className="flex gap-2">
            {pageNumbers.map(page => (
              <button
                key={`page-${page}`}
                className={`w-8 h-8 rounded-full flex items-center justify-center
                  ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-[#334155] text-gray-200 hover:bg-[#475569]'}`}
                onClick={() => changePage(page)}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {filteredFields.map((field) => (
            <div key={field.id}>
              {field.type === 'text' && (
                <Input
                  label={field.label}
                  placeholder={field.placeholder}
                  required={field.required}
                  value={formData[field.id] as string}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                />
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
                    className="input-ai bg-dark-800/50 border-ai-blue/30 text-white w-full"
                  />
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
                    className="input-ai bg-dark-800/50 border-ai-blue/30 text-white w-full"
                  >
                    <option value="">Select an option</option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
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
                    className="input-ai bg-dark-800/50 border-ai-blue/30 text-white w-full"
                  />
                </div>
              )}
              
              {field.type === 'checkbox' && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={field.id}
                    checked={formData[field.id] as boolean}
                    onChange={(e) => handleChange(field.id, e.target.checked)}
                    className="form-checkbox h-4 w-4 text-ai-blue rounded border-ai-blue/50 focus:ring-ai-blue/30 bg-dark-800"
                  />
                  <label htmlFor={field.id} className="text-sm text-gray-400 ml-2">
                    {field.label}
                  </label>
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
                          className="form-radio h-4 w-4 text-ai-blue border-ai-blue/50 focus:ring-ai-blue/30 bg-dark-800"
                        />
                        <label htmlFor={`${field.id}-${option}`} className="text-sm text-gray-400 ml-2">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {currentPage === pages && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Attachments
              </label>
              <div className="mt-2 border border-ai-blue/20 rounded-md p-4 bg-dark-800/50">
                <div className="flex items-center justify-center w-full">
                  <label className="w-full flex flex-col items-center justify-center h-32 border-2 border-dashed border-ai-blue/20 rounded-lg cursor-pointer hover:border-ai-blue/40 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Icons.RiUpload2Line className="text-2xl text-ai-blue/70 mb-2" />
                      <p className="mb-2 text-sm text-secondary-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-secondary-500">
                        PDF, DOCX, XLSX, PNG, JPG (MAX. 10MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      multiple
                    />
                  </label>
                </div>
                
                {attachments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-secondary-400 mb-2">Attached Files:</h4>
                    <ul className="space-y-2">
                      {attachments.map((file, index) => (
                        <li key={index} className="flex items-center justify-between p-2 bg-dark-900/50 rounded">
                          <div className="flex items-center">
                            <Icons.RiFileList3Line className="text-ai-blue/70 mr-2" />
                            <span className="text-sm text-secondary-300">{file.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-secondary-500 hover:text-error"
                          >
                            <Icons.RiCloseLine />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-between mt-8">
          <Button
            variant="secondary"
            onClick={onCancel}
            size="md"
            className="opacity-80 hover:opacity-100"
          >
            Cancel
          </Button>
          
          <div className="flex gap-2">
            {currentPage < pages ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => changePage(currentPage + 1)}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                type="submit"
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