//TODO: this component should fetch a statistics endpoint with the number of times phished, ignored, and reported from the backend API
//static rn


import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import type { ChartOptions } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface InteractionChartProps {
  title?: string;
  className?: string;
}

export const InteractionChart: React.FC<InteractionChartProps> = ({ 
  title = "Interaction chart",
  className = ""
}) => {
  const chartData = {
    labels: ['Phished', 'Ignored', 'Reported'],
    datasets: [
      {
        data: [35, 45, 10],
        backgroundColor: [
          '#C4B5FD', // Light purple for Phished
          '#8B5CF6', // Medium purple for Ignored
          '#6D28D9', // Dark purple for Reported
        ],
        borderColor: '#FFFFFF',
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  // Calculate label positions based on data
  const calculateLabelPositions = () => {
    const data = chartData.datasets[0].data;
    const total = data.reduce((acc, val) => acc + val, 0);
    const chartRadius = 100; // Half of w-50 (200px)
    const labelDistance = chartRadius + 40; // Distance from center for labels
    
    let currentAngle = -Math.PI / 2; // Start from top (-90 degrees)
    
    return data.map((value, index) => {
      const percentage = (value / total) * 100;
      const segmentAngle = (value / total) * 2 * Math.PI;
      const midAngle = currentAngle + segmentAngle / 2;
      
      // Calculate position
      const x = Math.cos(midAngle) * labelDistance;
      const y = Math.sin(midAngle) * labelDistance;
      
      // Convert to CSS positioning (center is at 50%, 50%)
      const leftPercent = 50 + (x / chartRadius) * 27; // Scale for container
      const topPercent = 50 + (y / chartRadius) * 42;
      
      currentAngle += segmentAngle;
      
      return {
        label: chartData.labels[index],
        percentage: Math.round(percentage),
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
      };
    });
  };

  const labelPositions = calculateLabelPositions();

  const chartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // We'll create custom labels
      },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((acc: number, data: number) => acc + data, 0);
            const percentage = ((value / total) * 100).toFixed(0);
            return `${label}: ${percentage}%`;
          }
        }
      }
    },
    cutout: 0, // Full pie chart, no donut
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Title */}
      <h3 className="text-lg font-medium text-gray-800 mb-6">
        {title}
      </h3>
      
      <div className="relative flex items-center justify-center">
        {/* Chart container */}
        <div className="w-100 h-50 relative">
          <Pie data={chartData} options={chartOptions} />
        </div>
        
        {/* Dynamic labels positioned around the chart */}
        <div className="absolute inset-0 pointer-events-none">
          {labelPositions.map((position, index) => (
            <div
              key={index}
              className="absolute text-sm text-gray-700 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: position.left,
                top: position.top,
              }}
            >
              <span className="font-medium">{position.label}:</span> {position.percentage}%
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InteractionChart;
