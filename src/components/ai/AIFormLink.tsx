import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RiFileListLine, RiShieldCheckLine, RiSurveyLine, RiToolsLine, RiArrowRightLine } from 'react-icons/ri';

interface AIFormLinkProps {
  forms: Array<{
    id: string;
    module: string;
    label: string;
    project_id: string;
  }>;
}

export const AIFormLink: React.FC<AIFormLinkProps> = ({ forms }) => {
  const navigate = useNavigate();

  const handleClick = (form: any) => {
    const { id, module, project_id } = form;
    let finalType = module;
    if (finalType === 'inspection' || finalType === 'survey') {
      finalType = 'rfi';
    }
    navigate(`/dashboard/${project_id}/${finalType}?id=${id}`);
  };

  const getIcon = (module: string) => {
    switch (module) {
      case 'diary': return <RiFileListLine className="text-xl" />;
      case 'safety': return <RiShieldCheckLine className="text-xl" />;
      case 'survey': return <RiSurveyLine className="text-xl" />;
      default: return <RiToolsLine className="text-xl" />;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
      {forms.map((form) => (
        <div 
          key={form.id}
          onClick={() => handleClick(form)}
          className="flex items-center p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer transition-all duration-200 group hover:border-portfolio-orange/30"
        >
          <div className="p-2 rounded-md bg-portfolio-orange/10 text-portfolio-orange group-hover:bg-portfolio-orange/20 transition-colors mr-3">
            {getIcon(form.module)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors truncate">
              {form.label}
            </h4>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5 truncate">ID: {form.id}</p>
          </div>
          <div className="text-gray-600 group-hover:text-portfolio-orange transition-colors ml-2">
            <RiArrowRightLine />
          </div>
        </div>
      ))}
    </div>
  );
};
