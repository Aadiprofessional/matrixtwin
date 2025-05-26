import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import * as RiIcons from 'react-icons/ri';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar_url?: string;
}

interface UserSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (selectedUsers: string[]) => void;
  users: User[];
  title?: string;
  description?: string;
}

export const UserSelectionModal: React.FC<UserSelectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  users,
  title = 'Select Users',
  description = 'Choose users to assign this form to'
}) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSelectedUsers([]);
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = () => {
    onSubmit(selectedUsers);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            onClick={e => e.stopPropagation()}
          >
            <Card variant="ai" className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{title}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {description}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <RiIcons.RiCloseLine className="text-xl" />
                </button>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <RiIcons.RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="input-ai pl-10 w-full"
                  />
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedUsers.includes(user.id)
                        ? 'bg-ai-blue/10 border border-ai-blue/20'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => handleUserToggle(user.id)}
                  >
                    <div className="flex-shrink-0">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-ai-blue/20 flex items-center justify-center">
                          <span className="text-ai-blue text-lg font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex-grow">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {selectedUsers.includes(user.id) ? (
                        <RiIcons.RiCheckboxCircleFill className="text-ai-blue text-xl" />
                      ) : (
                        <RiIcons.RiCheckboxBlankCircleLine className="text-gray-400 text-xl" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="ai"
                  onClick={handleSubmit}
                  disabled={selectedUsers.length === 0}
                >
                  Assign Users ({selectedUsers.length})
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}; 