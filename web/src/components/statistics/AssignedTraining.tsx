import React, { useState } from 'react';
import { ChevronRight, X } from 'lucide-react';

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
  const [isHovered, setIsHovered] = useState(false);
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
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes barShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes progressPop {
          0% { transform: scaleY(1); }
          40% { transform: scaleY(1.4); }
          70% { transform: scaleY(0.9); }
          100% { transform: scaleY(1); }
        }
        .row-slide {
          transition: transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
        }
        .row-slide:hover {
          transform: translateX(3px);
        }
      `}</style>

      <div
        className={`flex-1 bg-white/60 backdrop-blur-xl rounded-b-xl border-t-3 border-purple-500
          shadow-lg shadow-slate-300/50 p-5
          hover:shadow-2xl hover:shadow-purple-200/60
          transition-all duration-500 hover:-translate-y-1 group ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-slate-800">Assigned Training</h3>
        </div>

        {/* Progress Display */}
        <div className="flex items-baseline gap-1 mb-1">
          <span
            className="text-5xl font-bold text-purple-600 transition-all duration-300"
            style={{
              textShadow: isHovered ? '0 0 20px rgba(139, 92, 246, 0.35)' : 'none',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              display: 'inline-block',
              transition: 'text-shadow 0.4s ease, transform 0.3s ease',
            }}
          >
            {assigned}
          </span>
          <span className="text-xl text-slate-400 mx-0.5">/</span>
          <span className="text-2xl font-semibold text-slate-600">{total}</span>
        </div>

        <p className="text-[12px] text-slate-500 mb-3 font-medium">courses completed</p>

        {/* Progress Bar */}
        <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-1">
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-purple-400 via-violet-400 to-purple-600 transition-all duration-700 ease-out"
            style={{
              width: `${completionRate}%`,
              boxShadow: isHovered ? '0 0 12px rgba(139, 92, 246, 0.4), 0 0 6px rgba(139, 92, 246, 0.25)' : 'none',
              backgroundSize: '200% auto',
              animation: isHovered ? 'barShimmer 1.8s linear infinite' : 'none',
              transition: 'box-shadow 0.4s ease',
            }}
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] text-purple-500 font-semibold">{completionRate}% complete</span>
          <span className="text-[11px] text-slate-400">{total - assigned} remaining</span>
        </div>

        {/* Details Button */}
        <button
          onClick={() => setShowModal(true)}
          className="group/btn flex items-center gap-1.5 text-[13px] font-semibold text-purple-600
            hover:text-purple-700 transition-all duration-200 cursor-pointer
            bg-purple-50 hover:bg-purple-100 border border-purple-100 hover:border-purple-200
            px-3 py-1.5 rounded-lg"
        >
          View details
          <ChevronRight size={14} className="transition-transform duration-200 group-hover/btn:translate-x-0.5" />
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div
            className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl p-6 w-full max-w-md border border-white/60"
            style={{ animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h4 className="text-lg font-semibold text-slate-800">Assigned Courses</h4>
                <p className="text-[12px] text-slate-500">{assigned}/{total} completed</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer group/close"
              >
                <X size={18} className="text-slate-400 group-hover/close:text-slate-600 transition-colors group-hover/close:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            {/* Mini progress bar in modal */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-700"
                style={{ width: `${completionRate}%` }}
              />
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto purple-scrollbar">
              {courses.map((course, idx) => (
                <a
                  key={idx}
                  href={course.href}
                  className="row-slide flex items-center justify-between p-3 rounded-xl
                    bg-slate-50/80 hover:bg-purple-50/60 border border-transparent hover:border-purple-100/60
                    group/row"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${course.done ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                    <span className="text-[14px] font-medium text-slate-700 group-hover/row:text-purple-700 transition-colors">
                      {course.name}
                    </span>
                  </div>
                  {course.done ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10">
                      <span className="text-[11px] font-semibold text-emerald-600">Done</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10">
                      <span className="text-[11px] font-semibold text-amber-600">Pending</span>
                    </div>
                  )}
                </a>
              ))}
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl
                font-semibold text-[14px] hover:from-purple-700 hover:to-violet-700
                transition-all duration-200 shadow-lg shadow-purple-500/25
                hover:shadow-purple-500/40 hover:-translate-y-0.5 cursor-pointer"
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
