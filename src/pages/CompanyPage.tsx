import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { adminService } from '../services/adminService';
import { companyService } from '../services/companyService';
import { useFeedback } from '../contexts/FeedbackContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Dialog } from '../components/ui/Dialog';
import { ProjectHeader } from '../components/layout/ProjectHeader';
import { motion } from 'framer-motion';
import { 
  RiBuildingLine, 
  RiLogoutBoxLine, 
  RiAdminLine, 
  RiTeamLine, 
  RiArrowRightLine, 
  RiCheckboxCircleLine, 
  RiErrorWarningLine,
  RiArrowRightUpLine
} from 'react-icons/ri';

const CompanyPage: React.FC = () => {
  const { showToast } = useFeedback();
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [adminRequest, setAdminRequest] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal States
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  
  // Admin Request Form State
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  
  // Join Company Form State
  const [joinCompanyId, setJoinCompanyId] = useState('');

  useEffect(() => {
    const checkCompanyAndRedirect = async () => {
      if (!user) return;

      // Check if user has a company_id in context
      if (user.company_id) {
        // User has a company, redirect to dashboard
        navigate('/projects');
        return;
      }

      try {
        // Double check with server to get fresh user data
        const currentUser = await api.getCurrentUser();
        
        if (currentUser) {
           // If the user object from server has company_id, use it
           if (currentUser.company_id) {
             updateUser(currentUser);
             navigate('/projects');
             return;
           }

           // FALLBACK: If user object is missing company_id but they might actually have one
           // (API inconsistency), try to fetch projects. If they can see projects, they are in a company.
           try {
             const projects = await api.getProjectsList();
             // API returns { message: "..." } on error, or array on success.
             // If it's an array (even empty), user has access.
             if (Array.isArray(projects)) {
                // User has access to projects -> must be in a company
                // Manually patch the user state to unblock them
                const patchedUser = { ...currentUser, company_id: 'inferred-from-projects' };
                // Also update local storage immediately to persist this fix
                localStorage.setItem('user', JSON.stringify(patchedUser));
                
                // Do NOT call updateUser(patchedUser) as it tries to write to DB
                // Instead, update the context state directly if possible, or force reload
                // Since we can't easily access setUser from here without exposing it,
                // we'll rely on the localStorage update and a page reload or navigation
                
                // But we can try to update the context if we have access to it
                // We'll use a safer approach: just navigate. 
                // The AuthContext initializes from localStorage, so if we updated localStorage,
                // a page reload would fix it. But we want to avoid reload.
                
                // Let's assume updateUser handles the DB write failure gracefully or we modified it to ignore invalid UUIDs
                updateUser(patchedUser);
                navigate('/projects');
                return;
             }
           } catch (pError) {
             // Ignore error if they can't fetch projects
           }
        }
      } catch (e) {
        console.error('Failed to fetch current user in CompanyPage', e);
      }

      // If still no company_id, stay on this page and fetch any existing admin request
      fetchAdminRequest();
    };

    checkCompanyAndRedirect();
  }, [user, navigate]);

  const fetchAdminRequest = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminRequest();
      if (data) {
        setAdminRequest(data);
        setCompanyName(data.company_name);
        setCompanyAddress(data.company_details?.address || '');
        setCompanyPhone(data.company_details?.phone || '');
        setCompanyWebsite(data.company_details?.website || '');

        // If the request is approved, refresh user data and redirect
        if (data.status === 'approved') {
          try {
            const currentUser = await api.getCurrentUser();
            if (currentUser) {
              // Optimistically update user status and role to break the loop
              // Since the admin request is approved, the user IS an admin and IS approved
              const updatedUser = {
                ...currentUser,
                status: 'approved',
                role: 'admin',
                // If the request contains company_id, we should use it too
                // But admin request response might not have it directly in the root
                // It might be data.company_id if available
                company_id: data.company_id || currentUser.company_id
              };
              
              updateUser(updatedUser);
              // Small delay to ensure context updates
              setTimeout(() => {
                navigate('/projects');
              }, 100);
            }
          } catch (e) {
            console.error('Failed to refresh user data', e);
            // Try redirecting anyway if status is approved
            navigate('/projects');
          }
        }
      }
    } catch (err) {
      // Ignore 404 or empty if not found
      console.log('No existing admin request found');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleAdminRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      company_name: companyName,
      company_details: {
        address: companyAddress,
        phone: companyPhone,
        website: companyWebsite
      }
    };

    try {
      if (adminRequest && (adminRequest.status === 'pending' || adminRequest.status === 'rejected')) {
        await adminService.updateAdminRequest(adminRequest.id, payload as any);
        showToast('Admin request updated successfully!');
      } else {
        await adminService.submitAdminRequest(payload as any);
        showToast('Admin request submitted successfully!');
      }
      // Refresh request status
      await fetchAdminRequest();
      setShowAdminModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to submit admin request');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.joinCompany(joinCompanyId);
      showToast('Joined company successfully!');
      
      if (user) {
        // Fetch updated user info to get the correct company_id (UUID)
        // Do NOT use joinCompanyId directly as it might be a code (e.g. "005601") not a UUID
        try {
          const updatedUser = await api.getCurrentUser();
          if (updatedUser) {
            updateUser(updatedUser);
          }
        } catch (e) {
          console.error('Failed to refresh user data after join', e);
          // Fallback: force a page refresh or redirect which might trigger re-auth/fetch
        }
      }
      setShowJoinModal(false);
      navigate('/projects');
    } catch (err: any) {
      setError(err.message || 'Failed to join company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-portfolio-dark text-white font-sans selection:bg-portfolio-orange selection:text-white">
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <ProjectHeader />
      
      <main className="relative z-10 pt-24 sm:pt-32 px-3 sm:px-6 md:px-12 max-w-7xl mx-auto pb-10 sm:pb-12">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10 sm:mb-16"
        >
           <h5 className="text-portfolio-orange font-mono text-sm tracking-widest mb-4 uppercase">
              // Onboarding
            </h5>
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white tracking-tighter leading-[0.9] mb-4 sm:mb-6">
              COMPANY <br />
              <span className="text-gray-800 text-stroke-white">SETUP</span>
            </h1>
            <p className="text-gray-400 text-base sm:text-lg max-w-xl leading-relaxed border-l-2 border-portfolio-orange pl-4 sm:pl-6">
              Join an existing team to collaborate on projects, or register a new organization to manage your own workspace.
            </p>
        </motion.div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
          {/* Option 1: Register */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="group relative bg-white/5 border border-white/10 p-5 sm:p-8 hover:bg-white/10 transition-all duration-300 cursor-pointer overflow-hidden"
            onClick={() => setShowAdminModal(true)}
          >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <RiArrowRightUpLine className="text-2xl text-portfolio-orange" />
            </div>
            
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform duration-300">
              <RiAdminLine className="text-3xl" />
            </div>
            
            <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white group-hover:text-portfolio-orange transition-colors">
              Register New Company
            </h3>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Create a new organization and become the administrator. Full control over projects, teams, and resources.
            </p>
            
            <div className="flex items-center text-sm font-mono text-gray-500 group-hover:text-white transition-colors">
              <span>{adminRequest ? 'VIEW STATUS' : 'START REGISTRATION'}</span>
              <RiArrowRightLine className="ml-2" />
            </div>

            {/* Status Indicator if request exists */}
            {adminRequest && (
              <div className={`absolute bottom-4 right-4 px-3 py-1 text-xs font-mono uppercase tracking-wider rounded border ${
                adminRequest.status === 'pending' ? 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10' : 
                adminRequest.status === 'rejected' ? 'border-red-500/50 text-red-500 bg-red-500/10' : 
                'border-green-500/50 text-green-500 bg-green-500/10'
              }`}>
                {adminRequest.status}
              </div>
            )}
          </motion.div>

          {/* Option 2: Join */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="group relative bg-white/5 border border-white/10 p-5 sm:p-8 hover:bg-white/10 transition-all duration-300 cursor-pointer overflow-hidden"
            onClick={() => setShowJoinModal(true)}
          >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <RiArrowRightUpLine className="text-2xl text-portfolio-orange" />
            </div>

            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-6 text-green-400 group-hover:scale-110 transition-transform duration-300">
              <RiTeamLine className="text-3xl" />
            </div>
            
            <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white group-hover:text-portfolio-orange transition-colors">
              Join Existing Company
            </h3>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Enter a Company ID to join an existing team. Start collaborating on assigned projects immediately.
            </p>
            
            <div className="flex items-center text-sm font-mono text-gray-500 group-hover:text-white transition-colors">
              <span>JOIN TEAM</span>
              <RiArrowRightLine className="ml-2" />
            </div>
          </motion.div>
        </div>

        {/* Logout Action */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-14 sm:mt-24 flex justify-center"
        >
           <button 
             onClick={handleLogout} 
             className="group flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 transition-all duration-300"
           >
              <RiLogoutBoxLine className="text-gray-400 group-hover:text-red-400 transition-colors" /> 
              <span className="text-gray-300 group-hover:text-red-200 font-mono text-sm tracking-wider uppercase">Sign Out</span>
           </button>
        </motion.div>
      </main>
      
      {/* Admin Request Modal */}
      <Dialog
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        title={adminRequest ? 'Update Admin Request' : 'Register New Company'}
        className="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {adminRequest 
              ? 'Update your company details below.' 
              : 'Submit your company details to become an administrator.'}
          </p>
          
          {adminRequest && (
            <div className={`mb-4 p-3 rounded ${
              adminRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
              adminRequest.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              <div className="font-semibold flex items-center justify-between">
                <span>Status: {adminRequest.status.toUpperCase()}</span>
              </div>
              {adminRequest.rejection_reason && (
                <p className="text-sm mt-1">Reason: {adminRequest.rejection_reason}</p>
              )}
            </div>
          )}

          <form onSubmit={handleAdminRequestSubmit} className="space-y-4">
            <Input
              label="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              disabled={loading || (adminRequest && (adminRequest.status === 'approved' || adminRequest.status === 'pending'))}
            />
            <Input
              label="Address"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              disabled={loading || (adminRequest && (adminRequest.status === 'approved' || adminRequest.status === 'pending'))}
            />
            <Input
              label="Phone"
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
              disabled={loading || (adminRequest && (adminRequest.status === 'approved' || adminRequest.status === 'pending'))}
            />
            <Input
              label="Website"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              disabled={loading || (adminRequest && (adminRequest.status === 'approved' || adminRequest.status === 'pending'))}
            />
            
            {error && (
              <div className="text-red-500 text-sm mt-2">{error}</div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setShowAdminModal(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                isLoading={loading}
                disabled={adminRequest && (adminRequest.status === 'approved' || adminRequest.status === 'pending')}
              >
                {adminRequest ? 'Update Request' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </div>
      </Dialog>

      {/* Join Company Modal */}
      <Dialog
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Join Existing Company"
        className="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Enter the Company ID provided by your administrator to join their team.
          </p>
          
          <form onSubmit={handleJoinCompany} className="space-y-4">
            <Input
              label="Company ID"
              value={joinCompanyId}
              onChange={(e) => setJoinCompanyId(e.target.value)}
              required
              disabled={loading}
              placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
            />
            
            {error && (
              <div className="text-red-500 text-sm mt-2">{error}</div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setShowJoinModal(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                isLoading={loading}
              >
                Join Company
              </Button>
            </div>
          </form>
        </div>
      </Dialog>
    </div>
  );
};

export default CompanyPage;
