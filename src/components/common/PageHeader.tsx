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
    <div className="page-header mb-5 sm:mb-6">
      <div className="page-header-title flex flex-wrap items-center gap-y-2 mb-3 sm:mb-4">
        {backLink && (
          <Link to={backLink} className="page-back-button text-gray-400 hover:text-white mr-3 sm:mr-4">
            <RiArrowGoBackLine className="text-xl" />
          </Link>
        )}
        <div className="page-header-icon text-ai-blue text-2xl sm:text-3xl mr-2 sm:mr-3">
          {icon}
        </div>
        <h1 className="page-title text-xl sm:text-2xl font-bold text-white break-words">
          {title}
        </h1>
        {actions && (
          <div className="page-actions w-full sm:w-auto sm:ml-4">
            {actions}
          </div>
        )}
      </div>
      {description && (
        <p className="page-description text-sm sm:text-base text-gray-400 max-w-3xl">
          {description}
        </p>
      )}
    </div>
  );
};

export default PageHeader; 
