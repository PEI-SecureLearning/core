import React, { useState } from 'react';
import { GraduationCap, Check, Clock, X } from 'lucide-react';

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
  const completionRate = Math.round((assigned / total) * 100);

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
    <>
      <div className={`flex-1 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-lg shadow-slate-200/50 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-slate-800">Assigned Training</h3>
          <div className="p-2 rounded-xl bg-purple-500/10">
            <GraduationCap size={18} className="text-purple-600" />
          </div>
        </div>

        {/* Progress Display */}
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-4xl font-bold text-purple-600">{assigned}</span>
          <span className="text-xl text-slate-400">/</span>
          <span className="text-2xl font-semibold text-slate-600">{total}</span>
        </div>

        <p className="text-[13px] text-slate-500 mb-4">courses completed</p>

        {/* Progress Bar */}
        <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-600 shadow-lg shadow-purple-500/30 transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>

        {/* Details Button */}
        <button
          onClick={() => setShowModal(true)}
          className="text-[13px] font-medium text-purple-600 hover:text-purple-700 transition-colors cursor-pointer"
        >
          View details →
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          `}</style>
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 w-full max-w-md border border-white/60 animate-[slideUp_0.3s_ease-out]">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-semibold text-slate-800">Assigned Courses</h4>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto purple-scrollbar">
              {courses.map((course, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition-colors"
                >
                  <a
                    href={course.href}
                    className="text-[14px] font-medium text-slate-700 hover:text-purple-600 transition-colors"
                  >
                    {course.name}
                  </a>
                  {course.done ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10">
                      <Check size={14} className="text-emerald-600" />
                      <span className="text-[12px] font-medium text-emerald-600">Done</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10">
                      <Clock size={14} className="text-amber-600" />
                      <span className="text-[12px] font-medium text-amber-600">Pending</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/25 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AssignedTraining;
