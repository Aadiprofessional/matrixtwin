import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import * as RiIcons from 'react-icons/ri';
import { IconContext } from 'react-icons';
import { Icons as IconUtils } from '../../utils/iconUtils';

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

interface RfiFormTemplateProps<T = Record<string, any>> {
  title: string;
  description: string;
  icon?: React.ReactNode;
  fields: FormField[];
  onSubmit: (formData: T) => void;
  onCancel: () => void;
  pages?: number;
  onFileChange?: (files: File[]) => void;
  onFileRemove?: (index: number) => void;
  attachments?: File[];
}

export const RfiFormTemplate = <T extends Record<string, any> = Record<string, any>>({
  title,
  description,
  icon = <RiIcons.RiFileList3Line />,
  fields,
  onSubmit,
  onCancel,
  pages = 1,
  onFileChange,
  onFileRemove,
  attachments = []
}: RfiFormTemplateProps<T>) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [formData, setFormData] = useState<Record<string, any>>(
    fields.reduce((acc, field) => {
      acc[field.id] = field.value;
      return acc;
    }, {} as Record<string, any>)
  );
  
  const handleChange = (id: string, value: string | string[] | boolean) => {
    setFormData({
      ...formData,
      [id]: value
    });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && onFileChange) {
      const newFiles = Array.from(e.target.files);
      onFileChange(newFiles);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as T);
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
    <Card variant="ai" className="p-6">
      <div className="flex items-center mb-4">
        {icon && <div className="text-2xl text-ai-blue mr-3">{icon}</div>}
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        </div>
      </div>
      
      {pages > 1 && (
        <div className="flex justify-center mb-6">
          <div className="flex space-x-2">
            {pageNumbers.map(number => (
              <button
                key={number}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentPage === number
                    ? 'bg-ai-blue text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}
                onClick={() => changePage(number)}
              >
                {number}
              </button>
            ))}
          </div>
        </div>
      )}
      
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
              
              {field.type === 'select' && field.options && (
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
                    {field.options.map((option) => (
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
                    required={field.required}
                    className="form-checkbox h-4 w-4 text-ai-blue border-gray-300 rounded"
                  />
                  <label htmlFor={field.id} className="ml-2 block text-sm text-gray-400">
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
                          onChange={(e) => handleChange(field.id, e.target.value)}
                          required={field.required}
                          className="form-radio h-4 w-4 text-ai-blue border-gray-300"
                        />
                        <label
                          htmlFor={`${field.id}-${option}`}
                          className="ml-2 block text-sm text-gray-400"
                        >
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
                      <RiIcons.RiUpload2Line className="text-2xl text-ai-blue/70 mb-2" />
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
                      accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
                    />
                  </label>
                </div>

                {attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-dark-700/50 rounded"
                      >
                        <div className="flex items-center">
                          <RiIcons.RiFileTextLine className="text-ai-blue mr-2" />
                          <span className="text-sm">{file.name}</span>
                        </div>
                        {onFileRemove && (
                          <button
                            type="button"
                            onClick={() => onFileRemove(index)}
                            className="text-gray-400 hover:text-error"
                          >
                            <RiIcons.RiCloseLine />
                          </button>
                        )}
                      </div>
                    ))}
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