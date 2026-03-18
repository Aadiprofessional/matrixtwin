import React from 'react';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import { ProjectProvider } from './ProjectContext';
import { AIChatProvider } from './AIChatContext';
import { PermissionsProvider } from './PermissionsContext';
import { FormCountsProvider } from './FormCountsContext';
import { FeedbackProvider } from './FeedbackContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <PermissionsProvider>
          <ProjectProvider>
            <FormCountsProvider>
              <FeedbackProvider>
                <AIChatProvider>
                  {children}
                </AIChatProvider>
              </FeedbackProvider>
            </FormCountsProvider>
          </ProjectProvider>
        </PermissionsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}; 
