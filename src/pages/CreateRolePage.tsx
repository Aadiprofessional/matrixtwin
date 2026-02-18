import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { IconContext } from 'react-icons';
import {
  RiShieldUserLine,
  RiAddLine,
  RiSaveLine,
  RiArrowLeftLine,
  RiCheckLine,
  RiCloseLine,
  RiInformationLine,
  RiLockLine,
  RiEyeLine,
  RiEditLine,
  RiDeleteBinLine,
  RiStarLine,
  RiShieldCheckLine,
  RiUserSettingsLine,
  RiDashboardLine,
  RiToolsLine,
  RiFileTextLine,
  RiTeamLine,
  RiBarChartLine,
  RiSettings3Line,
  RiSearchLine,
  RiFilterLine
} from 'react-icons/ri';
import { roleService, Permission, RolePermission } from '../services/roleService';

interface PermissionLevel {
  level: number;
  name: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}

const permissionLevels: PermissionLevel[] = [
  {
    level: 1,
    name: 'Read Only',
    description: 'View access only',
    color: 'from-gray-600 to-gray-500',
    icon: <RiEyeLine />
  },
  {
    level: 2,
    name: 'Edit',
    description: 'View and modify',
    color: 'from-yellow-500 to-orange-500',
    icon: <RiEditLine />
  },
  {
    level: 3,
    name: 'Full Access',
    description: 'Complete control',
    color: 'from-green-500 to-emerald-500',
    icon: <RiShieldCheckLine />
  }
];

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'twin':
      return <RiSettings3Line />;
    case 'dashboard':
      return <RiDashboardLine />;
    case 'maximo':
      return <RiToolsLine />;
    case 'ibms':
      return <RiFileTextLine />;
    default:
      return <RiShieldUserLine />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'twin':
      return 'from-orange-600 to-orange-500';
    case 'dashboard':
      return 'from-gray-600 to-gray-500';
    case 'maximo':
      return 'from-orange-500 to-orange-600';
    case 'ibms':
      return 'from-green-500 to-green-600';
    default:
      return 'from-gray-500 to-gray-600';
  }
};

const CreateRolePage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPreview, setShowPreview] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    loadPermissions();
  }, [user, navigate]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading permissions...');
      const permissionsData = await roleService.getPermissions();
      console.log('Permissions loaded:', permissionsData);
      
      // Handle the case where API returns an object with categories as keys
      if (typeof permissionsData === 'object' && permissionsData !== null) {
        // If it's an object with category keys, flatten it to an array
        if (!Array.isArray(permissionsData)) {
          const flattenedPermissions: Permission[] = [];
          Object.values(permissionsData).forEach((categoryPermissions: any) => {
            if (Array.isArray(categoryPermissions)) {
              flattenedPermissions.push(...categoryPermissions);
            }
          });
          console.log('Flattened permissions:', flattenedPermissions);
          setPermissions(flattenedPermissions);
          return;
        }
        // If it's already an array, use it directly
        setPermissions(permissionsData);
      } else {
        console.error('Permissions data is not valid:', permissionsData);
        setPermissions([]);
        setError('Invalid permissions data received from server');
      }
    } catch (err) {
      console.error('Error loading permissions:', err);
      setError('Failed to load permissions. Please check your connection and try again.');
      setPermissions([]); // Ensure permissions is always an array
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionLevelChange = (permissionId: number, level: number) => {
    const newSelectedPermissions = new Map(selectedPermissions);
    if (level === 0) {
      newSelectedPermissions.delete(permissionId);
    } else {
      newSelectedPermissions.set(permissionId, level);
    }
    setSelectedPermissions(newSelectedPermissions);
  };

  const handleCreateRole = async () => {
    if (!roleName.trim()) {
      setError('Role name is required');
      return;
    }

    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const rolePermissions: RolePermission[] = Array.from(selectedPermissions.entries()).map(
        ([permissionId, level]) => ({
          permission_id: permissionId,
          level
        })
      );

      await roleService.createRole({
        admin_uid: user.id,
        role_name: roleName,
        description: roleDescription,
        permissions: rolePermissions
      });

      // Success - navigate back to team page
      navigate('/team', { 
        state: { 
          message: `Role "${roleName}" created successfully!`,
          type: 'success'
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role');
      console.error('Error creating role:', err);
    } finally {
      setSaving(false);
    }
  };

  const getFilteredPermissions = () => {
    return permissions.filter(permission => {
      const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           permission.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || permission.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  };

  const getCategories = () => {
    if (!permissions || !Array.isArray(permissions)) {
      return ['all'];
    }
    const categories = Array.from(new Set(permissions.map(p => p.category)));
    return ['all', ...categories];
  };

  const getSelectedPermissionsCount = () => {
    return selectedPermissions.size;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-portfolio-orange mx-auto mb-4"></div>
          <p className="text-gray-400">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-dark-900 to-dark-800 border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={() => navigate('/team')}
                className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RiArrowLeftLine className="text-xl" />
              </motion.button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-portfolio-orange to-orange-600 bg-clip-text">
                  Create New Role
                </h1>
                <p className="text-gray-400 mt-1">Define permissions and access levels for team members</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="border-portfolio-orange/30 text-portfolio-orange hover:bg-portfolio-orange/10"
              >
                <RiEyeLine className="mr-2" />
                Preview
              </Button>
              <Button
                onClick={handleCreateRole}
                disabled={saving || !roleName.trim() || selectedPermissions.size === 0}
                className="bg-gradient-to-r from-portfolio-orange to-orange-600 hover:from-portfolio-orange/80 hover:to-orange-600/80"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <RiSaveLine className="mr-2" />
                )}
                {saving ? 'Creating...' : 'Create Role'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Role Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="bg-dark-900/50 border-dark-700">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <RiShieldUserLine className="mr-2 text-portfolio-orange" />
                  Role Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Role Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      placeholder="e.g., Client, Viewer, Editor"
                      className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:border-portfolio-orange focus:ring-1 focus:ring-portfolio-orange transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={roleDescription}
                      onChange={(e) => setRoleDescription(e.target.value)}
                      placeholder="Describe what this role is for and its intended use..."
                      rows={3}
                      className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:border-portfolio-orange focus:ring-1 focus:ring-portfolio-orange transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Permissions Selection */}
            <Card className="bg-dark-900/50 border-dark-700">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center">
                    <RiLockLine className="mr-2 text-portfolio-orange" />
                    Permissions ({getSelectedPermissionsCount()} selected)
                  </h2>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search permissions..."
                        className="pl-10 pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:border-portfolio-orange focus:ring-1 focus:ring-portfolio-orange transition-colors"
                      />
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:border-portfolio-orange focus:ring-1 focus:ring-portfolio-orange transition-colors"
                    >
                      {getCategories().map(category => (
                        <option key={category} value={category}>
                          {category === 'all' ? 'All Categories' : category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Permission Levels Legend */}
                <div className="mb-6 p-4 bg-dark-800/50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Permission Levels</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {permissionLevels.map(level => (
                      <div key={level.level} className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${level.color} text-white`}>
                          {level.icon}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{level.name}</div>
                          <div className="text-xs text-gray-400">{level.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Permissions List */}
                <div className="space-y-4">
                  {getCategories().filter(cat => cat !== 'all').map(category => {
                    const categoryPermissions = getFilteredPermissions().filter(p => p.category === category);
                    if (categoryPermissions.length === 0) return null;

                    return (
                      <div key={category} className="border border-dark-700 rounded-lg overflow-hidden">
                        <div className={`p-4 bg-gradient-to-r ${getCategoryColor(category)} bg-opacity-20`}>
                          <h3 className="font-medium text-white flex items-center">
                            <IconContext.Provider value={{ className: "mr-2 text-lg" }}>
                              {getCategoryIcon(category)}
                            </IconContext.Provider>
                            {category} Permissions
                          </h3>
                        </div>
                        <div className="p-4 space-y-4">
                          {categoryPermissions.map(permission => (
                            <motion.div
                              key={permission.id}
                              className="p-4 bg-dark-800/30 rounded-lg border border-dark-700/50"
                              whileHover={{ scale: 1.01 }}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="font-medium text-white text-lg">{permission.name}</div>
                                  <div className="text-sm text-gray-400 mt-1">{permission.description}</div>
                                </div>
                              </div>
                              
                              {/* Permission Level Buttons */}
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400 mr-2">Access Level:</span>
                                
                                {/* No Access Button */}
                                <motion.button
                                  type="button"
                                  onClick={() => handlePermissionLevelChange(permission.id, 0)}
                                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    !selectedPermissions.has(permission.id)
                                      ? 'bg-gray-600 text-white shadow-lg'
                                      : 'bg-dark-700 text-gray-400 hover:bg-gray-600'
                                  }`}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <RiCloseLine className="inline mr-1" />
                                  No Access
                                </motion.button>

                                {/* Permission Level Buttons */}
                                {permissionLevels.map(level => (
                                  <motion.button
                                    key={level.level}
                                    type="button"
                                    onClick={() => handlePermissionLevelChange(permission.id, level.level)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                                      selectedPermissions.get(permission.id) === level.level
                                        ? `bg-gradient-to-r ${level.color} text-white shadow-lg transform scale-105`
                                        : 'bg-dark-700 text-gray-400 hover:bg-dark-600 border border-dark-600'
                                    }`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    title={`${level.name}: ${level.description}`}
                                  >
                                    {level.icon}
                                    {level.name}
                                  </motion.button>
                                ))}
                              </div>
                              
                              {/* Selected Level Indicator */}
                              {selectedPermissions.has(permission.id) && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="mt-3 p-2 bg-dark-900/50 rounded-lg border-l-4 border-portfolio-orange"
                                >
                                  <div className="text-sm text-portfolio-orange font-medium">
                                    ✓ {permissionLevels.find(l => l.level === selectedPermissions.get(permission.id))?.name} access granted
                                  </div>
                                </motion.div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* No Permissions Found */}
                  {getFilteredPermissions().length === 0 && (
                    <div className="text-center py-8">
                      <RiSearchLine className="text-4xl text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-400">No permissions found matching your search.</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Role Preview */}
            <AnimatePresence>
              {showPreview && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="bg-dark-900/50 border-dark-700">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <RiEyeLine className="mr-2 text-ai-blue" />
                        Role Preview
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm text-gray-400">Role Name</div>
                          <div className="text-white font-medium">{roleName || 'Untitled Role'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Description</div>
                          <div className="text-white">{roleDescription || 'No description provided'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Permissions</div>
                          <div className="text-white">{selectedPermissions.size} permissions selected</div>
                        </div>
                        <div className="space-y-2">
                          {Array.from(selectedPermissions.entries()).map(([permissionId, level]) => {
                            const permission = permissions.find(p => p.id === permissionId);
                            const levelInfo = permissionLevels.find(l => l.level === level);
                            if (!permission || !levelInfo) return null;
                            
                            return (
                              <div key={permissionId} className="flex items-center justify-between text-sm">
                                <span className="text-gray-300">{permission.name}</span>
                                <span className={`px-2 py-1 rounded text-xs bg-gradient-to-r ${levelInfo.color} text-white`}>
                                  {levelInfo.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Stats */}
            <Card className="bg-dark-900/50 border-dark-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <RiBarChartLine className="mr-2 text-ai-blue" />
                  Quick Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Permissions</span>
                    <span className="text-white font-medium">{permissions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Selected</span>
                    <span className="text-ai-blue font-medium">{selectedPermissions.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Categories</span>
                    <span className="text-white font-medium">{getCategories().length - 1}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Help */}
            <Card className="bg-dark-900/50 border-dark-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <RiInformationLine className="mr-2 text-portfolio-orange" />
                  Help
                </h3>
                <div className="space-y-3 text-sm text-gray-400">
                  <p>• <strong>Read Only:</strong> Users can view but not modify</p>
                  <p>• <strong>Edit:</strong> Users can view and modify content</p>
                  <p>• <strong>Full Access:</strong> Complete control including delete</p>
                  <p>• Select appropriate permission levels based on user responsibilities</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg max-w-md"
          >
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-4 text-white hover:text-gray-200"
              >
                <RiCloseLine />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreateRolePage; 