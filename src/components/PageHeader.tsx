import React from 'react';
import { Link } from 'react-router-dom';
import { RiArrowGoBackLine } from 'react-icons/ri';

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  backLink?: string;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  icon, 
  title, 
  description, 
  backLink = "/digital-twins",
  actions 
}) => {
  return (
    <div className="page-header mb-6">
      <div className="page-header-title flex items-center mb-4">
        {backLink && (
          <Link to={backLink} className="page-back-button text-gray-400 hover:text-white mr-4">
            <RiArrowGoBackLine className="text-xl" />
          </Link>
        )}
        <div className="page-header-icon text-ai-blue text-3xl mr-3">
          {icon}
        </div>
        <h1 className="page-title text-2xl font-bold text-white">
          {title}
        </h1>
        {actions && (
          <div className="page-actions ml-4">
            {actions}
          </div>
        )}
      </div>
      {description && (
        <p className="page-description text-gray-400 max-w-3xl">
          {description}
        </p>
      )}
    </div>
  );
};

export default PageHeader; 