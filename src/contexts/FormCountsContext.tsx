import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useProjects } from './ProjectContext';
import { API_BASE_URL } from '../utils/api';

interface FormCountsContextType {
  diaryCount: number;
  safetyCount: number;
  labourCount: number;
  cleansingCount: number;
  rfiCount: number;
  formsCount: number;
  refreshCounts: () => Promise<void>;
}

const FormCountsContext = createContext<FormCountsContextType | undefined>(undefined);

export const useFormCounts = () => {
  const context = useContext(FormCountsContext);
  if (!context) {
    throw new Error('useFormCounts must be used within a FormCountsProvider');
  }
  return context;
};

export const FormCountsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { selectedProject } = useProjects();
  
  const [diaryCount, setDiaryCount] = useState(0);
  const [safetyCount, setSafetyCount] = useState(0);
  const [labourCount, setLabourCount] = useState(0);
  const [cleansingCount, setCleansingCount] = useState(0);
  const [rfiCount, setRfiCount] = useState(0);
  const [formsCount, setFormsCount] = useState(0);

  const fetchCounts = async () => {
    if (!user) return;

    try {
      const queryParams = new URLSearchParams();
      if (selectedProject?.id) queryParams.append('projectId', selectedProject.id);
      if (user?.id) queryParams.append('userId', user.id);
      
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      
      const response = await fetch(`${API_BASE_URL || 'https://server.matrixtwin.com/api'}/global-forms/pending-counts?${queryParams.toString()}`, { headers });
      
      if (response.ok) {
        const counts = await response.json();
        // User provided format: {"diary":1,"inspection":2,"labour":0,"safety":1,"survey":1,"cleansing":0,"forms":0}
        setDiaryCount(counts.diary || 0);
        setSafetyCount(counts.safety || 0);
        setLabourCount(counts.labour || 0);
        setCleansingCount(counts.cleansing || 0);
        setFormsCount(counts.forms || 0);
        
        // RFI is sum of inspection + survey as per user requirement
        setRfiCount((counts.inspection || 0) + (counts.survey || 0));
      }
    } catch (error) {
      console.error('Error fetching form counts:', error);
    }
  };

  useEffect(() => {
    fetchCounts();
    
    // Set up polling for counts every 60 seconds
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, [user?.id, selectedProject?.id]);

  return (
    <FormCountsContext.Provider value={{ 
      diaryCount, 
      safetyCount, 
      labourCount, 
      cleansingCount,
      refreshCounts: fetchCounts,
      rfiCount,
      formsCount
    }}>
      {children}
    </FormCountsContext.Provider>
  );
};
