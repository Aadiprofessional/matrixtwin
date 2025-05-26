import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

// Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import RfiPage from './pages/RfiPage';
import DiaryPage from './pages/DiaryPage';
import SafetyPage from './pages/SafetyPage';
import LabourPage from './pages/LabourPage';
import CleansingPage from './pages/CleansingPage';
import FormsPage from './pages/FormsPage';
import SettingsPage from './pages/SettingsPage';
import TaskPage from './pages/TaskPage';
import TeamPage from './pages/TeamPage';
import ReportsPage from './pages/ReportsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import NotFoundPage from './pages/NotFoundPage';
import AskAIPage from './pages/AskAIPage';
import VoiceCallPage from './pages/VoiceCallPage';
import DigitalTwinsPage from './pages/DigitalTwinsPage';
import ModelViewerPage from './pages/ModelViewerPage';
import ModelUploadPage from './pages/ModelUploadPage';
import IoTDashboardPage from './pages/IoTDashboardPage';
import DigitalTwinsAnalyticsPage from './pages/DigitalTwinsAnalyticsPage';
import DigitalTwinsControlPage from './pages/DigitalTwinsControlPage';


// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRoles?: UserRole[] }> = ({
  children,
  requiredRoles,
}) => {
  const { isAuthenticated, hasPermission, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRoles) {
    // Check if user has required role
    if (!hasPermission(requiredRoles)) {
      // If user is worker or site inspector, redirect to dashboard
      if (user?.role === 'worker' || user?.role === 'siteInspector') {
        return <Navigate to="/dashboard" />;
      }
      return <Navigate to="/" />;
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
          path="/"
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
            <ProtectedRoute requiredRoles={['admin' as UserRole, 'projectManager' as UserRole, 'siteInspector' as UserRole]}>
              <Layout>
                <SafetyPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/labour"
          element={
            <ProtectedRoute requiredRoles={['admin' as UserRole, 'projectManager' as UserRole, 'contractor' as UserRole]}>
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
            <ProtectedRoute>
              <Layout>
                <AskAIPage />
              </Layout>
            </ProtectedRoute>
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
      <BrowserRouter>
        <AppProviders>
          <AppRoutes />
        </AppProviders>
      </BrowserRouter>
    </IconContext.Provider>
  );
}

export default App; 