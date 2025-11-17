import React from 'react';

//this component shows the risk level with a progress bar and an icon - idk how to calculate but there should be an endpoint for it 

interface RiskLevelProps {
  percentage?: number;
  title?: string;
  className?: string;
  color?: 'green' | 'yellow' | 'red' | 'blue';
}

export const RiskLevel: React.FC<RiskLevelProps> = ({
  percentage = 15,
  title = "Risk level",
  className = "",
  color = 'green'
}) => {
  const colorClasses = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500', 
    red: 'bg-red-500',
    blue: 'bg-blue-500'
  };

  const textColorClasses = {
    green: 'text-green-700',
    yellow: 'text-yellow-700',
    red: 'text-red-700', 
    blue: 'text-blue-700'
  };

  const iconColorClasses = {
    green: 'text-green-500',
    yellow: 'text-yellow-500',
    red: 'text-red-500',
    blue: 'text-blue-500'
  };

  return (
    <div className={`w-1/3 bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      {/* Title */}
      <h3 className="text-lg font-medium text-gray-800 mb-6">
        {title}
      </h3>
      
      {/* Icon, Percentage and Progress Bar Container */}
      <div className="flex items-center gap-3">
        {/* Icon and Percentage Column */}
        <div className="flex flex-col items-center gap-1">
          {/* Icon */}
          <div className={`w-6 h-6 ${iconColorClasses[color]}`}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-full h-full"
            >
              <path d="M9 12l2 2 4-4" />
              <path d="M21 12c0 1-1 3-3 7s-6 6-6 6-4-2-6-6-3-6-3-7a8 8 0 1 1 18 0z" />
            </svg>
          </div>
          
          {/* Percentage Text */}
          <span className={`text-lg font-semibold ${textColorClasses[color]}`}>
            {percentage}%
          </span>
        </div>
        
        {/* Progress Bar - Rectangular with bold edges and bigger */}
        <div className="flex-1 bg-gray-200 border-2 border-gray-300 h-6">
          <div
            className={`h-full transition-all duration-300 ease-out ${colorClasses[color]}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default RiskLevel;
