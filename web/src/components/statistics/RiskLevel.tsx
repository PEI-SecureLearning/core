import React from 'react';
import { Shield, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

interface RiskLevelProps {
  percentage?: number;
  title?: string;
  className?: string;
}

export const RiskLevel: React.FC<RiskLevelProps> = ({
  percentage = 15,
  title = "Risk Level",
  className = "",
}) => {
  // Determine color and icon based on percentage
  const getConfig = (pct: number) => {
    if (pct <= 25) return {
      color: 'emerald',
      label: 'Low Risk',
      Icon: ShieldCheck,
      gradient: 'from-emerald-500 to-emerald-600'
    };
    if (pct <= 50) return {
      color: 'amber',
      label: 'Moderate Risk',
      Icon: Shield,
      gradient: 'from-amber-500 to-amber-600'
    };
    if (pct <= 75) return {
      color: 'orange',
      label: 'High Risk',
      Icon: ShieldAlert,
      gradient: 'from-orange-500 to-orange-600'
    };
    return {
      color: 'rose',
      label: 'Critical Risk',
      Icon: ShieldX,
      gradient: 'from-rose-500 to-rose-600'
    };
  };

  const config = getConfig(percentage);
  const Icon = config.Icon;

  const colorClasses: Record<string, { bg: string; text: string; bar: string; glow: string }> = {
    emerald: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-600',
      bar: 'bg-gradient-to-r from-emerald-400 to-emerald-500',
      glow: 'shadow-emerald-500/30'
    },
    amber: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-600',
      bar: 'bg-gradient-to-r from-amber-400 to-amber-500',
      glow: 'shadow-amber-500/30'
    },
    orange: {
      bg: 'bg-orange-500/10',
      text: 'text-orange-600',
      bar: 'bg-gradient-to-r from-orange-400 to-orange-500',
      glow: 'shadow-orange-500/30'
    },
    rose: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-600',
      bar: 'bg-gradient-to-r from-rose-400 to-rose-500',
      glow: 'shadow-rose-500/30'
    },
  };

  const colors = colorClasses[config.color];

  return (
    <div className={`flex-1 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-lg shadow-slate-200/50 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-slate-800">{title}</h3>
        <div className={`p-2 rounded-xl ${colors.bg}`}>
          <Icon size={18} className={colors.text} />
        </div>
      </div>

      {/* Percentage Display */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className={`text-4xl font-bold ${colors.text}`}>{percentage}</span>
        <span className="text-xl text-slate-400">%</span>
      </div>

      {/* Status Label */}
      <p className={`text-[13px] font-medium ${colors.text} mb-4`}>{config.label}</p>

      {/* Progress Bar */}
      <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out ${colors.bar} shadow-lg ${colors.glow}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default RiskLevel;
