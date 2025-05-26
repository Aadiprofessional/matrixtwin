import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconContext } from 'react-icons';
import {
  RiAddLine,
  RiFileAddLine,
  RiCheckLine,
  RiFilePaperLine,
  RiCloseLine,
  RiUserAddLine,
  RiUserSearchLine,
  RiFileChartLine,
  RiSendPlaneLine,
  RiFileEditLine,
  RiBuildingLine,
  RiTaskLine,
  RiAlarmLine,
  RiListCheck2,
  RiSearchLine,
  RiFilterLine
} from 'react-icons/ri';
import { useAuth } from '../../contexts/AuthContext';

// Category types for grouping
type CategoryType = 'project' | 'forms' | 'tasks' | 'team' | 'reports';

interface QuickActionItemProps {
  icon: React.ReactNode;
  title: string;
  to: string;
  description: string;
  requiredRoles?: string[];
  category: CategoryType;
  onClick?: () => void;
}

const QuickActionItem: React.FC<QuickActionItemProps> = ({ 
  icon, 
  title, 
  to, 
  description,
  requiredRoles,
  category,
  onClick
}) => {
  const { hasPermission } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  
  if (requiredRoles && !hasPermission(requiredRoles as any)) {
    return null;
  }

  // Get background gradient based on category
  const getGradient = () => {
    switch(category) {
      case 'project':
        return 'from-blue-600/10 to-blue-800/10 hover:from-blue-600/20 hover:to-blue-800/20 border-blue-500/20';
      case 'forms':
        return 'from-purple-600/10 to-purple-800/10 hover:from-purple-600/20 hover:to-purple-800/20 border-purple-500/20';
      case 'tasks':
        return 'from-green-600/10 to-green-800/10 hover:from-green-600/20 hover:to-green-800/20 border-green-500/20';
      case 'team':
        return 'from-orange-600/10 to-orange-800/10 hover:from-orange-600/20 hover:to-orange-800/20 border-orange-500/20';
      case 'reports':
        return 'from-teal-600/10 to-teal-800/10 hover:from-teal-600/20 hover:to-teal-800/20 border-teal-500/20';
      default:
        return 'from-gray-600/10 to-gray-800/10 hover:from-gray-600/20 hover:to-gray-800/20 border-gray-500/20';
    }
  };

  // Get icon color based on category
  const getIconColor = () => {
    switch(category) {
      case 'project': return 'text-blue-400';
      case 'forms': return 'text-purple-400';
      case 'tasks': return 'text-green-400';
      case 'team': return 'text-orange-400';
      case 'reports': return 'text-teal-400';
      default: return 'text-gray-400';
    }
  };
  
  return (
    <Link to={to} onClick={onClick}>
      <motion.div
        className={`bg-gradient-to-br ${getGradient()} backdrop-blur-sm border p-4 rounded-xl flex items-start gap-4 transition-all duration-200 relative overflow-hidden`}
        whileHover={{ 
          scale: 1.02, 
          y: -2,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        whileTap={{ scale: 0.98 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        {/* Background shine effect on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              className="absolute inset-0 bg-white/5 z-0"
              initial={{ x: '-100%', opacity: 0.5 }}
              animate={{ x: '200%', opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
            />
          )}
        </AnimatePresence>

        <div className={`mt-1 ${getIconColor()} text-2xl relative z-10`}>
          {icon}
        </div>
        <div className="relative z-10">
          <h3 className="font-bold text-white">{title}</h3>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
      </motion.div>
    </Link>
  );
};

interface QuickActionsProps {
  onClose: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryType | 'all'>('all');
  
  // Define the quick actions based on user role
  const allQuickActions: QuickActionItemProps[] = [
    // Project Actions
    {
      icon: <RiAddLine />,
      title: 'New Project',
      to: '/projects?new=true',
      description: 'Create a new construction project',
      requiredRoles: ['admin', 'projectManager'],
      category: 'project'
    },
    {
      icon: <RiBuildingLine />,
      title: 'Join Project',
      to: '/projects?join=true',
      description: 'Apply to join an existing project',
      requiredRoles: ['worker', 'contractor'],
      category: 'project'
    },
    // Form Actions
    {
      icon: <RiFileAddLine />,
      title: 'New RFI',
      to: '/rfi/new',
      description: 'Create a new request for information',
      category: 'forms'
    },
    {
      icon: <RiFilePaperLine />,
      title: 'Daily Report',
      to: '/diary/new',
      description: 'Submit a new daily site report',
      category: 'forms'
    },
    // Task Management
    {
      icon: <RiTaskLine />,
      title: 'Create Task',
      to: '/tasks/new',
      description: 'Create a new task or assignment',
      requiredRoles: ['admin', 'projectManager', 'siteInspector'],
      category: 'tasks'
    },
    {
      icon: <RiAlarmLine />,
      title: 'Schedule Inspection',
      to: '/safety/inspection/new',
      description: 'Schedule a new safety inspection',
      requiredRoles: ['admin', 'projectManager', 'siteInspector'],
      category: 'tasks'
    },
    // Team Management
    {
      icon: <RiUserAddLine />,
      title: 'Add Team Member',
      to: '/team/new',
      description: 'Invite a new member to your team',
      requiredRoles: ['admin', 'projectManager'],
      category: 'team'
    },
    {
      icon: <RiUserSearchLine />,
      title: 'Worker Applications',
      to: '/team/applications',
      description: 'Review pending worker applications',
      requiredRoles: ['admin', 'projectManager'],
      category: 'team'
    },
    // Reports & Documents
    {
      icon: <RiFileChartLine />,
      title: 'Generate Report',
      to: '/reports/new',
      description: 'Create a custom project report',
      requiredRoles: ['admin', 'projectManager', 'siteInspector'],
      category: 'reports'
    },
    {
      icon: <RiSendPlaneLine />,
      title: 'Submit for Approval',
      to: '/forms/approval',
      description: 'Submit documents for approval',
      category: 'forms'
    },
    {
      icon: <RiFileEditLine />,
      title: 'Edit Form Template',
      to: '/forms/templates',
      description: 'Modify existing form templates',
      requiredRoles: ['admin', 'projectManager'],
      category: 'forms'
    },
    {
      icon: <RiListCheck2 />,
      title: 'My Pending Tasks',
      to: '/tasks?filter=pending',
      description: 'View tasks assigned to you',
      category: 'tasks'
    }
  ];

  // Filter actions based on search term and category
  const filteredActions = allQuickActions.filter(action => {
    const matchesSearch = 
      action.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      action.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeCategory === 'all' || action.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Category filters
  const categories = [
    { id: 'all', label: 'All' },
    { id: 'project', label: 'Projects' },
    { id: 'forms', label: 'Forms' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'team', label: 'Team' },
    { id: 'reports', label: 'Reports' }
  ];
  
  return (
    <motion.div
      className="fixed top-16 right-0 bottom-0 w-full sm:w-96 bg-dark-900/95 backdrop-blur-md border-l border-dark-800 shadow-xl z-40 overflow-auto"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Decorative gradient elements */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-blue-600/10 via-purple-600/5 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-ai-purple/10 via-blue-600/5 to-transparent pointer-events-none"></div>
      
      <div className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center">
            <div className="bg-ai-blue/20 p-1.5 rounded-md mr-2">
              <RiListCheck2 className="text-ai-blue" />
            </div>
            Quick Actions
          </h2>
          <motion.button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-dark-800 text-gray-400 hover:text-white"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <IconContext.Provider value={{ className: "text-xl" }}>
              <RiCloseLine />
            </IconContext.Provider>
          </motion.button>
        </div>

        {/* Search input */}
        <div className="relative mb-4">
          <input 
            type="text"
            placeholder="Search actions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-800/50 border border-dark-700 text-white placeholder-gray-500 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-ai-blue/50"
          />
          <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-thin scrollbar-thumb-dark-700 scrollbar-track-transparent">
          {categories.map(category => (
            <motion.button
              key={category.id}
              onClick={() => setActiveCategory(category.id as CategoryType | 'all')}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                activeCategory === category.id
                  ? 'bg-ai-blue text-white'
                  : 'bg-dark-800 text-gray-400 hover:bg-dark-700 hover:text-white'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {category.label}
            </motion.button>
          ))}
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {filteredActions.length > 0 ? (
              filteredActions.map((action, index) => (
                <motion.div
                  key={`${action.title}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <QuickActionItem
                    icon={
                      <IconContext.Provider value={{ className: "text-2xl" }}>
                        {action.icon}
                      </IconContext.Provider>
                    }
                    title={action.title}
                    to={action.to}
                    description={action.description}
                    requiredRoles={action.requiredRoles}
                    category={action.category}
                    onClick={onClose}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8 text-center"
              >
                <div className="bg-dark-800/60 rounded-full p-4 inline-flex mb-4">
                  <RiFilterLine className="text-3xl text-gray-500" />
                </div>
                <h3 className="text-white font-medium mb-2">No actions found</h3>
                <p className="text-gray-400 text-sm">Try a different search term or category</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}; 