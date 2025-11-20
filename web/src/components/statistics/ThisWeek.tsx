import React from "react";


// to add the statistics of this week - hours spent and modules completed

interface ThisWeekProps {
  hours: number;
  modules: number;
}

const ThisWeek: React.FC<ThisWeekProps> = ({ hours, modules }) => {
  return (
    <div className="w-1/3 bg-white rounded-lg border border-gray-200 p-4 flex flex-col shadow-sm">
      <h3 className="text-lg font-medium text-gray-800 mb-6">This week</h3>
      <div className="flex items-center justify-center">
        <div className="flex flex-col items-end pr-4">
          <span className="text-3xl font-semibold text-gray-800">{hours}</span>
          <span className="text-base text-gray-500">hours</span>
        </div>
        <div className="h-10 w-[2px] bg-purple-500 mx-2" />
        <div className="flex flex-col items-start pl-4">
          <span className="text-3xl font-semibold text-gray-800">{modules}</span>
          <span className="text-base text-gray-500">modules</span>
        </div>
      </div>
    </div>
  );
};

export default ThisWeek;
