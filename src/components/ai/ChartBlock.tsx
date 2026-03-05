import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartBlockProps {
  config: any;
}

export const ChartBlock: React.FC<ChartBlockProps> = ({ config }) => {
  if (!config || !config.type || !config.data) {
    return null;
  }

  // Ensure options exist and merge defaults for dark mode
  const options = {
    ...config.options,
    responsive: true,
    maintainAspectRatio: false, // Allow container to control height
    plugins: {
      ...config.options?.plugins,
      legend: {
        ...config.options?.plugins?.legend,
        labels: { 
            color: '#9ca3af', // Gray-400
            ...config.options?.plugins?.legend?.labels
        } 
      },
      title: {
        ...config.options?.plugins?.title,
        color: '#e5e7eb', // Gray-200
        ...config.options?.plugins?.title
      }
    },
    scales: config.options?.scales ? {
       x: { 
           ticks: { color: '#9ca3af' }, 
           grid: { color: 'rgba(255, 255, 255, 0.1)' }, 
           ...config.options.scales.x 
       },
       y: { 
           ticks: { color: '#9ca3af' }, 
           grid: { color: 'rgba(255, 255, 255, 0.1)' }, 
           ...config.options.scales.y 
       }
    } : undefined
  };

  return (
    <div className="w-full h-80 my-6 p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden">
      <div className="w-full h-full relative">
        <Chart
            type={config.type}
            data={config.data}
            options={options}
        />
      </div>
    </div>
  );
};
