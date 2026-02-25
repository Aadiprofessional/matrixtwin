import React from 'react';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import { ProjectProvider } from './ProjectContext';
import { AIChatProvider } from './AIChatContext';
import { PermissionsProvider } from './PermissionsContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <PermissionsProvider>
          <ProjectProvider>
            <AIChatProvider>
              {children}
            </AIChatProvider>
          </ProjectProvider>
        </PermissionsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}; 