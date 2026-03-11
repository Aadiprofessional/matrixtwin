import React, { useRef } from 'react';
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
import { RiDownload2Line, RiShareLine } from 'react-icons/ri';

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
  const chartRef = useRef<any>(null);

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

  const getChartBlob = async (): Promise<Blob | null> => {
    const chartInstance = chartRef.current;
    if (!chartInstance) return null;
    const dataUrl = chartInstance.toBase64Image('image/png', 1);
    const response = await fetch(dataUrl);
    return await response.blob();
  };

  const handleDownload = async () => {
    const blob = await getChartBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `chart-${Date.now()}.png`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const blob = await getChartBlob();
    if (!blob) return;
    const file = new File([blob], `chart-${Date.now()}.png`, { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Chart Snapshot' });
      return;
    }
    const url = URL.createObjectURL(blob);
    await navigator.clipboard.writeText(url);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  return (
    <div className="w-full h-80 my-6 p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden">
      <div className="w-full h-full relative">
        <div className="absolute top-0 right-0 z-10 flex gap-2">
          <button onClick={handleDownload} className="text-xs px-2 py-1 rounded border border-white/15 text-gray-300 hover:bg-white/10 inline-flex items-center gap-1">
            <RiDownload2Line />
            Download
          </button>
          <button onClick={handleShare} className="text-xs px-2 py-1 rounded border border-white/15 text-gray-300 hover:bg-white/10 inline-flex items-center gap-1">
            <RiShareLine />
            Share
          </button>
        </div>
        <Chart
            ref={chartRef}
            type={config.type}
            data={config.data}
            options={options}
        />
      </div>
    </div>
  );
};
