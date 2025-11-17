import React, { useState } from 'react';

//Needs to get the assigned courses to the user from the API and show them here

interface AssignedTrainingProps {
  assigned?: number;
  total?: number;
  className?: string;
}

const AssignedTraining: React.FC<AssignedTrainingProps> = ({
  assigned = 8,
  total = 12,
  className = '',
}) => {
  const [showModal, setShowModal] = useState(false);
  // Example: first 5 are done, rest are to do
  const courses = [
    { name: 'Cybersecurity Basics', done: true, href: '#' },
    { name: 'Phishing Awareness', done: true, href: '#' },
    { name: 'Password Management', done: true, href: '#' },
    { name: 'Social Engineering', done: true, href: '#' },
    { name: 'Data Protection', done: true, href: '#' },
    { name: 'Incident Response', done: false, href: '#' },
    { name: 'Safe Browsing', done: false, href: '#' },
    { name: 'Email Security', done: false, href: '#' },
  ];

  return (
    <div className={`w-1/3 bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col justify-between ${className}`}>
      <h3 className="text-lg font-medium text-gray-800 mb-6">Assigned training</h3>
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="text-2xl font-bold text-purple-600">{assigned}</span>
        <span className="text-2xl font-bold text-gray-800">/{total}</span>
        {/* Certificate Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-8 h-8 text-gray-700"
        >
          <circle cx="12" cy="10" r="3" />
          <path d="M12 13v7m-4 0h8" />
          <rect x="3" y="3" width="18" height="8" rx="2" />
        </svg>
      </div>
      <div className="flex justify-end">
        <button
          className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors underline"
          onClick={() => setShowModal(true)}
        >
          Details
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-200/80"
            onClick={e => {
                if (e.target === e.currentTarget) setShowModal(false);
            }}>
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h4 className="text-xl font-semibold mb-6 text-gray-800">Assigned Courses</h4>
            <ul className="mb-6 space-y-3">
              {courses.map((course, idx) => (
                <li key={idx} className="pb-3 border-b border-gray-200 last:border-b-0">
                  <div className="flex items-start justify-between mb-1">
                    <a href={course.href} className="text-gray-900 font-medium hover:text-purple-600 transition-colors">
                      {course.name}
                    </a>
                    <span className={`text-sm font-semibold ${course.done ? 'text-green-600' : 'text-red-500'}`}>{course.done ? 'Done' : 'To do'}</span>
                  </div>
                </li>
              ))}
            </ul>
            <button
              className="w-full py-2 mt-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedTraining;
