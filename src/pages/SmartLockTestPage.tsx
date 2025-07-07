import React from 'react';
import SmartLockDashboard from '../components/SmartLockDashboard';

const SmartLockTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Smart Lock Dashboard Test</h1>
        <SmartLockDashboard />
      </div>
    </div>
  );
};

export default SmartLockTestPage; 