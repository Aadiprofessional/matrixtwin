import React, { useState } from 'react';
import { TranslationConfig } from '../utils/bimfaceApi';
import { RiSettings3Line, RiCloseLine, RiInformationLine } from 'react-icons/ri';

interface TranslationConfigFormProps {
  onChange: (config: TranslationConfig) => void;
  fileExtension: string; // To determine which options to show based on file type
}

const TranslationConfigForm: React.FC<TranslationConfigFormProps> = ({ onChange, fileExtension }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  
  // Main configuration state
  const [config, setConfig] = useState<TranslationConfig>({
    displayMode: 'colored',
    renderViews: false,
    exportSchedules: false,
    customView: '',
    customComponentTree: false,
    objectData: [],
    enableGIS: false,
    mainFileName: ''
  });
  
  // Function to update config and notify parent
  const updateConfig = (updates: Partial<TranslationConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onChange(newConfig);
  };
  
  // Helper to show/hide RVT-specific options
  const isRvtFile = fileExtension.toLowerCase() === '.rvt';
  
  // Toggle expansion of the form
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Tooltip display function
  const displayTooltip = (key: string) => {
    setShowTooltip(key);
  };
  
  const hideTooltip = () => {
    setShowTooltip(null);
  };
  
  // Generate tooltip content based on key
  const getTooltipContent = (key: string): string => {
    const tooltips: Record<string, string> = {
      displayMode: 'Choose between color-based display or texture-based display for more realistic appearance.',
      renderViews: 'Extract 2D views (plans, elevations, sections) from the model for later use.',
      exportSchedules: 'Extract schedules and tables from the model.',
      customView: 'Specify a custom view name to load instead of the default 3D view.',
      customComponentTree: 'Use custom component tree based on object data attributes.',
      objectData: 'Specify which object attributes to use for organizing the component tree.',
      mainFileName: 'When uploading a ZIP file with textures, specify the main model file name.',
      enableGIS: 'Configure GIS coordinates for placing the model in geographic context.'
    };
    
    return tooltips[key] || 'No description available';
  };
  
  return (
    <div className="mt-6 border border-dark-700 rounded-lg overflow-hidden">
      {/* Header */}
      <button 
        onClick={toggleExpanded}
        className="w-full flex justify-between items-center bg-dark-700 px-4 py-3 text-left"
      >
        <div className="flex items-center">
          <RiSettings3Line className="text-gray-400 mr-2" />
          <h3 className="text-white font-medium">Advanced Translation Options</h3>
        </div>
        <span className="text-gray-400">
          {isExpanded ? '−' : '+'}
        </span>
      </button>
      
      {/* Form */}
      {isExpanded && (
        <div className="p-4 space-y-4 bg-dark-800">
          {/* Display Mode */}
          <div className="relative">
            <div className="flex items-center">
              <label className="block text-white text-sm w-40">Display Mode</label>
              <select
                value={config.displayMode}
                onChange={(e) => updateConfig({ displayMode: e.target.value as 'texture' | 'colored' })}
                className="bg-dark-700 border border-dark-600 rounded px-3 py-2 text-white text-sm focus:border-ai-blue focus:outline-none"
              >
                <option value="colored">Colored Mode</option>
                <option value="texture">Texture Mode (Realistic)</option>
              </select>
              <button 
                className="ml-2 text-gray-400 hover:text-white"
                onMouseEnter={() => displayTooltip('displayMode')}
                onMouseLeave={hideTooltip}
              >
                <RiInformationLine />
              </button>
            </div>
            {showTooltip === 'displayMode' && (
              <div className="absolute right-0 mt-1 bg-dark-600 text-white text-xs p-2 rounded shadow-lg z-10 w-64">
                {getTooltipContent('displayMode')}
              </div>
            )}
          </div>
          
          {/* RVT-specific options */}
          {isRvtFile && (
            <>
              {/* 2D Views */}
              <div className="relative">
                <div className="flex items-center">
                  <label className="block text-white text-sm w-40">Extract 2D Views</label>
                  <input
                    type="checkbox"
                    checked={config.renderViews}
                    onChange={(e) => updateConfig({ renderViews: e.target.checked })}
                    className="form-checkbox bg-dark-700 rounded text-ai-blue focus:ring-ai-blue focus:ring-offset-dark-900"
                  />
                  <button 
                    className="ml-2 text-gray-400 hover:text-white"
                    onMouseEnter={() => displayTooltip('renderViews')}
                    onMouseLeave={hideTooltip}
                  >
                    <RiInformationLine />
                  </button>
                </div>
                {showTooltip === 'renderViews' && (
                  <div className="absolute right-0 mt-1 bg-dark-600 text-white text-xs p-2 rounded shadow-lg z-10 w-64">
                    {getTooltipContent('renderViews')}
                  </div>
                )}
              </div>
              
              {/* Export Schedules */}
              <div className="relative">
                <div className="flex items-center">
                  <label className="block text-white text-sm w-40">Export Schedules</label>
                  <input
                    type="checkbox"
                    checked={config.exportSchedules}
                    onChange={(e) => updateConfig({ exportSchedules: e.target.checked })}
                    className="form-checkbox bg-dark-700 rounded text-ai-blue focus:ring-ai-blue focus:ring-offset-dark-900"
                  />
                  <button 
                    className="ml-2 text-gray-400 hover:text-white"
                    onMouseEnter={() => displayTooltip('exportSchedules')}
                    onMouseLeave={hideTooltip}
                  >
                    <RiInformationLine />
                  </button>
                </div>
                {showTooltip === 'exportSchedules' && (
                  <div className="absolute right-0 mt-1 bg-dark-600 text-white text-xs p-2 rounded shadow-lg z-10 w-64">
                    {getTooltipContent('exportSchedules')}
                  </div>
                )}
              </div>
              
              {/* Custom View */}
              <div className="relative">
                <div className="flex items-center">
                  <label className="block text-white text-sm w-40">Custom View Name</label>
                  <input
                    type="text"
                    value={config.customView || ''}
                    onChange={(e) => updateConfig({ customView: e.target.value })}
                    placeholder="Default: {3D} or {三维}"
                    className="bg-dark-700 border border-dark-600 rounded px-3 py-2 text-white text-sm focus:border-ai-blue focus:outline-none"
                  />
                  <button 
                    className="ml-2 text-gray-400 hover:text-white"
                    onMouseEnter={() => displayTooltip('customView')}
                    onMouseLeave={hideTooltip}
                  >
                    <RiInformationLine />
                  </button>
                </div>
                {showTooltip === 'customView' && (
                  <div className="absolute right-0 mt-1 bg-dark-600 text-white text-xs p-2 rounded shadow-lg z-10 w-64">
                    {getTooltipContent('customView')}
                  </div>
                )}
              </div>
            </>
          )}
          
          {/* ZIP files with textures */}
          <div className="relative">
            <div className="flex items-center">
              <label className="block text-white text-sm w-40">Main File Name</label>
              <input
                type="text"
                value={config.mainFileName || ''}
                onChange={(e) => updateConfig({ mainFileName: e.target.value })}
                placeholder="For ZIP files with textures"
                className="bg-dark-700 border border-dark-600 rounded px-3 py-2 text-white text-sm focus:border-ai-blue focus:outline-none"
              />
              <button 
                className="ml-2 text-gray-400 hover:text-white"
                onMouseEnter={() => displayTooltip('mainFileName')}
                onMouseLeave={hideTooltip}
              >
                <RiInformationLine />
              </button>
            </div>
            {showTooltip === 'mainFileName' && (
              <div className="absolute right-0 mt-1 bg-dark-600 text-white text-xs p-2 rounded shadow-lg z-10 w-64">
                {getTooltipContent('mainFileName')}
              </div>
            )}
          </div>
          
          {/* Enable GIS coordinates */}
          <div className="relative">
            <div className="flex items-center">
              <label className="block text-white text-sm w-40">Enable GIS Coordinates</label>
              <input
                type="checkbox"
                checked={config.enableGIS}
                onChange={(e) => updateConfig({ enableGIS: e.target.checked })}
                className="form-checkbox bg-dark-700 rounded text-ai-blue focus:ring-ai-blue focus:ring-offset-dark-900"
              />
              <button 
                className="ml-2 text-gray-400 hover:text-white"
                onMouseEnter={() => displayTooltip('enableGIS')}
                onMouseLeave={hideTooltip}
              >
                <RiInformationLine />
              </button>
            </div>
            {showTooltip === 'enableGIS' && (
              <div className="absolute right-0 mt-1 bg-dark-600 text-white text-xs p-2 rounded shadow-lg z-10 w-64">
                {getTooltipContent('enableGIS')}
              </div>
            )}
          </div>
          
          {/* GIS coordinate settings (if enabled) */}
          {config.enableGIS && (
            <div className="pl-10 border-l border-dark-700 mt-2 space-y-3">
              <p className="text-gray-400 text-xs">
                GIS configuration requires detailed setup that is typically handled by GIS specialists.
                Please contact your GIS team for proper configuration values.
              </p>
              <p className="text-yellow-400 text-xs">
                Note: Improper GIS settings may cause model placement issues. Default values are recommended for most users.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TranslationConfigForm; 