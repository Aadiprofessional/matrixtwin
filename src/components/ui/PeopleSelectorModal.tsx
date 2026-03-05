import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RiUserLine, RiSearchLine, RiLoader4Line, RiCloseLine } from 'react-icons/ri';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface PeopleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (user: User) => void;
  title: string;
  users: User[];
  loading: boolean;
}

export const PeopleSelectorModal: React.FC<PeopleSelectorModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  title, 
  users, 
  loading 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter users based on search
  const filteredUsers = searchQuery 
    ? users.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md max-h-[80vh] bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border border-white/10 rounded-xl shadow-xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-secondary-200 dark:border-dark-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center text-secondary-900 dark:text-white">
            <RiUserLine className="mr-2" />
            {title}
          </h3>
          <button 
            className="text-secondary-400 hover:text-secondary-600 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={onClose}
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>
        
        <div className="p-4 border-b border-secondary-200 dark:border-dark-700">
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, role, or email..."
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-y-auto max-h-[400px] p-2">
          {loading ? (
            <div className="p-4 text-center text-gray-600 dark:text-gray-400">
              <RiLoader4Line className="animate-spin text-2xl mx-auto mb-2" />
              Loading users...
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {filteredUsers.map(user => (
                <div 
                  key={user.id}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer transition-colors flex items-center"
                  onClick={() => {
                    onSelect(user);
                    onClose();
                  }}
                >
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 flex items-center justify-center font-medium mr-3">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                  )}
                  <div className="flex-grow">
                    <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{user.role}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">{user.email}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No users found matching "{searchQuery}"
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
