import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconContext } from 'react-icons';
import { UserRole } from './lib/supabase';

// Contexts
import { AppProviders } from './contexts/AppProviders';
import { useAuth } from './contexts/AuthContext';

// Layouts
import { Layout } from './components/layout/Layout';

// Components
import ScrollToTop from './components/ScrollToTop';
import { PermissionErrorModal } from './components/ui/PermissionErrorModal';

// Debug utilities
import './utils/authDebug';
import './utils/tokenManager';

// Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import DiaryPage from './pages/DiaryPage';
import SafetyPage from './pages/SafetyPage';
import LabourPage from './pages/LabourPage';
import CleansingPage from './pages/CleansingPage';
import RfiPage from './pages/RfiPage';
import FormsPage from './pages/FormsPage';
import TeamPage from './pages/TeamPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import TaskPage from './pages/TaskPage';
import ReportsPage from './pages/ReportsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import DigitalTwinsPage from './pages/DigitalTwinsPage';
import DigitalTwinsAnalyticsPage from './pages/DigitalTwinsAnalyticsPage';
import DigitalTwinsControlPage from './pages/DigitalTwinsControlPage';
import ModelViewerPage from './pages/ModelViewerPage';
import ModelUploadPage from './pages/ModelUploadPage';
import CreateRolePage from './pages/CreateRolePage';
import IoTDashboardPage from './pages/IoTDashboardPage';
import SmartLockTestPage from './pages/SmartLockTestPage';
import VoiceCallPage from './pages/VoiceCallPage';
import AskAIPage from './pages/AskAIPage';
import HomePage from './pages/HomePage';
import CompanyPage from './pages/CompanyPage';


// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRoles?: UserRole[] }> = ({
  children,
  requiredRoles,
}) => {
  const { isAuthenticated, hasPermission, user, isInitialized } = useAuth();
  const location = useLocation();
  const [showPermissionError, setShowPermissionError] = useState(false);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If user is logged in, has 'user' role, no company_id, and is not approved, restrict them to /company page only
  if (user?.role === 'user' && !user?.company_id && user?.status !== 'approved') {
    if (location.pathname !== '/company') {
      return <Navigate to="/company" replace />;
    }
    return <>{children}</>;
  }

  if (requiredRoles) {
    // Check if user has required role
    if (!hasPermission(requiredRoles)) {
      // Show permission error modal instead of redirecting
      return (
        <>
          <PermissionErrorModal
            isOpen={true}
            onClose={() => {
              // Don't automatically redirect, let user choose
              setShowPermissionError(false);
            }}
            title="Access Denied"
            message="You don't have permission to access this page. Please contact your administrator if you believe this is an error."
            requiredRole={requiredRoles.join(' or ')}
            userRole={user?.role}
          />
          {/* Show the current page content behind the modal but keep it accessible */}
          {children}
        </>
      );
    }
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { i18n } = useTranslation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Set document direction based on language
    const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
  }, [i18n.language]);

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<HomePage />} />
        
        {/* Auth routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/projects" /> : <Login />} 
        />
        <Route 
          path="/signup" 
          element={isAuthenticated ? <Navigate to="/projects" /> : <Signup />} 
        />
        <Route 
          path="/forgot-password" 
          element={isAuthenticated ? <Navigate to="/projects" /> : <ForgotPassword />} 
        />
        <Route 
          path="/reset-password" 
          element={isAuthenticated ? <Navigate to="/projects" /> : <ResetPassword />} 
        />

        {/* Protected routes */}
        <Route
          path="/company"
          element={
            <ProtectedRoute>
              <CompanyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-home"
          element={
            <ProtectedRoute>
              <Navigate to="/projects" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/:projectId"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        {/* Project Scoped Routes */}
        <Route path="/dashboard/:projectId/tasks" element={<ProtectedRoute><Layout><TaskPage /></Layout></ProtectedRoute>} />
        <Route path="/dashboard/:projectId/team" element={<ProtectedRoute requiredRoles={['admin', 'projectManager', 'contractor']}><Layout><TeamPage /></Layout></ProtectedRoute>} />
        <Route path="/dashboard/:projectId/create-role" element={<ProtectedRoute requiredRoles={['admin']}><Layout><CreateRolePage /></Layout></ProtectedRoute>} />
        <Route path="/dashboard/:projectId/rfi" element={<ProtectedRoute><Layout><RfiPage /></Layout></ProtectedRoute>} />
        <Route path="/dashboard/:projectId/diary" element={<ProtectedRoute><Layout><DiaryPage /></Layout></ProtectedRoute>} />
        <Route path="/dashboard/:projectId/safety" element={<ProtectedRoute><Layout><SafetyPage /></Layout></ProtectedRoute>} />
        <Route path="/dashboard/:projectId/labour" element={<ProtectedRoute><Layout><LabourPage /></Layout></ProtectedRoute>} />
        <Route path="/dashboard/:projectId/cleansing" element={<ProtectedRoute><Layout><CleansingPage /></Layout></ProtectedRoute>} />
        <Route path="/dashboard/:projectId/forms" element={<ProtectedRoute requiredRoles={['admin', 'projectManager', 'contractor']}><Layout><FormsPage /></Layout></ProtectedRoute>} />
        <Route path="/dashboard/:projectId/reports" element={<ProtectedRoute requiredRoles={['admin', 'projectManager', 'contractor']}><Layout><ReportsPage /></Layout></ProtectedRoute>} />
        <Route path="/dashboard/:projectId/analytics" element={<ProtectedRoute requiredRoles={['admin', 'projectManager', 'contractor']}><Layout><AnalyticsPage /></Layout></ProtectedRoute>} />
        <Route path="/dashboard/:projectId/settings" element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />
        <Route path="/dashboard/:projectId/voice-call" element={<ProtectedRoute><Layout><VoiceCallPage /></Layout></ProtectedRoute>} />
        
        {/* Digital Twins Scoped Routes */}
        <Route path="/dashboard/:projectId/digital-twins" element={<ProtectedRoute><Layout><DigitalTwinsPage /></Layout></ProtectedRoute>} />
        <Route path="/dashboard/:projectId/digital-twins/viewer" element={<ProtectedRoute><ModelViewerPage /></ProtectedRoute>} />
        <Route path="/dashboard/:projectId/digital-twins/upload" element={<ProtectedRoute><Layout><ModelUploadPage /></Layout></ProtectedRoute>} />
        <Route path="/dashboard/:projectId/digital-twins/iot-dashboard" element={<ProtectedRoute><Layout><IoTDashboardPage /></Layout></ProtectedRoute>} />
        <Route path="/dashboard/:projectId/digital-twins/analytics" element={<ProtectedRoute><Layout><DigitalTwinsAnalyticsPage /></Layout></ProtectedRoute>} />
        <Route path="/dashboard/:projectId/digital-twins/control" element={<ProtectedRoute><Layout><DigitalTwinsControlPage /></Layout></ProtectedRoute>} />

        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <Layout>
                <TaskPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/team"
          element={
            <ProtectedRoute requiredRoles={['admin' as UserRole, 'projectManager' as UserRole, 'contractor' as UserRole]}>
              <Layout>
                <TeamPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-role"
          element={
            <ProtectedRoute requiredRoles={['admin' as UserRole]}>
              <Layout>
                <CreateRolePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rfi"
          element={
            <ProtectedRoute>
              <Layout>
                <RfiPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/diary"
          element={
            <ProtectedRoute>
              <Layout>
                <DiaryPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/safety"
          element={
            <ProtectedRoute>
              <Layout>
                <SafetyPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/labour"
          element={
            <ProtectedRoute>
              <Layout>
                <LabourPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cleansing"
          element={
            <ProtectedRoute>
              <Layout>
                <CleansingPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/forms"
          element={
            <ProtectedRoute requiredRoles={['admin' as UserRole, 'projectManager' as UserRole, 'contractor' as UserRole]}>
              <Layout>
                <FormsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute requiredRoles={['admin' as UserRole, 'projectManager' as UserRole, 'contractor' as UserRole]}>
              <Layout>
                <ReportsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute requiredRoles={['admin' as UserRole, 'projectManager' as UserRole, 'contractor' as UserRole]}>
              <Layout>
                <AnalyticsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ask-ai"
          element={
            <AskAIPage />
          }
        />
        
        <Route
          path="/voice-call"
          element={
            <ProtectedRoute>
              <Layout>
                <VoiceCallPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        {/* Digital Twins routes */}
        <Route
          path="/digital-twins"
          element={
            <ProtectedRoute>
              <Layout>
                <DigitalTwinsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/digital-twins/viewer"
          element={
            <ProtectedRoute>
              <ModelViewerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/digital-twins/upload"
          element={
            <ProtectedRoute>
              <Layout>
                <ModelUploadPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/digital-twins/iot-dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <IoTDashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/digital-twins/analytics"
          element={
            <ProtectedRoute>
              <Layout>
                <DigitalTwinsAnalyticsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/digital-twins/control"
          element={
            <ProtectedRoute>
              <Layout>
                <DigitalTwinsControlPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        {/* Catch-all route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <IconContext.Provider value={{ className: 'react-icons' }}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppProviders>
          <AppRoutes />
        </AppProviders>
      </BrowserRouter>
    </IconContext.Provider>
  );
}

export default App;