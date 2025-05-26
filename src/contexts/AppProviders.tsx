import React from 'react';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import { ProjectProvider } from './ProjectContext';
import { AIChatProvider } from './AIChatContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ProjectProvider>
          <AIChatProvider>
            {children}
          </AIChatProvider>
        </ProjectProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}; 