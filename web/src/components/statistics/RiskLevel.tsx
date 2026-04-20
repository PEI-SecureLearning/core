import React, { useState } from "react";

interface RiskLevelProps {
  percentage?: number;
  title?: string;
  className?: string;
}

export const RiskLevel: React.FC<RiskLevelProps> = ({
  percentage = 15,
  title = "Risk Level",
  className = ""
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getConfig = (pct: number) => {
    if (pct <= 25)
      return {
        color: "success",
        label: "Low Risk",
        gradient: "from-success to-success/80",
        glowColor: "rgba(var(--success-rgb), 0.35)"
      };
    if (pct <= 50)
      return {
        color: "warning",
        label: "Moderate Risk",
        gradient: "from-warning to-warning/80",
        glowColor: "rgba(var(--warning-rgb), 0.35)"
      };
    if (pct <= 75)
      return {
        color: "orange",
        label: "High Risk",
        gradient: "from-warning to-error",
        glowColor: "rgba(var(--warning-rgb), 0.35)"
      };
    return {
      color: "error",
      label: "Critical Risk",
      gradient: "from-error to-error/80",
      glowColor: "rgba(var(--error-rgb), 0.35)"
    };
  };

  const config = getConfig(percentage);

  const colorClasses: Record<
    string,
    { bg: string; text: string; bar: string; badge: string }
  > = {
    success: {
      bg: "bg-success/10",
      text: "text-success",
      bar: "bg-success",
      badge: "bg-success/10 border-success/20 text-success"
    },
    warning: {
      bg: "bg-warning/10",
      text: "text-warning",
      bar: "bg-warning",
      badge: "bg-warning/10 border-warning/20 text-warning"
    },
    orange: {
      bg: "bg-warning/10",
      text: "text-warning",
      bar: "bg-linear-to-r from-warning to-error",
      badge: "bg-warning/10 border-warning/20 text-warning"
    },
    error: {
      bg: "bg-error/10",
      text: "text-error",
      bar: "bg-error",
      badge: "bg-error/10 border-error/20 text-error"
    }
  };

  const colors = colorClasses[config.color];

  return (
    <div
      className={`flex-1 bg-background/60 backdrop-blur-xl rounded-b-xl border-t-3 border-primary
        shadow-lg shadow-muted/50 p-5
        hover:shadow-2xl hover:shadow-primary/25
        transition-all duration-500 hover:-translate-y-1 group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <style>{`
        @keyframes barShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes iconWiggle {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-8deg) scale(1.1); }
          75% { transform: rotate(8deg) scale(1.1); }
        }
        @keyframes countUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .icon-hover-wiggle:hover {
          animation: iconWiggle 0.5s ease-in-out;
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
      </div>

      {/* Percentage Display */}
      <div className="flex items-baseline gap-1.5 mb-2">
        <span
          className={`text-4xl sm:text-5xl font-bold ${colors.text} transition-all duration-300
            ${isHovered ? "scale-105 drop-shadow-sm" : ""}`}
          style={{
            display: "inline-block",
            textShadow: isHovered ? `0 0 20px ${config.glowColor}` : "none",
            transition: "text-shadow 0.4s ease, transform 0.3s ease"
          }}
        >
          {percentage}
        </span>
        <span className="text-xl text-muted-foreground/70 font-medium">%</span>
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <span
          className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-full border ${colors.badge}
          transition-all duration-300 group-hover:scale-105`}
        >
          <span className={`w-1.5 h-1.5 rounded-full bg-current`} />
          {config.label}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out ${colors.bar}`}
          style={{
            width: `${Math.min(percentage, 100)}%`,
            boxShadow: isHovered
              ? `0 0 12px ${config.glowColor}, 0 0 6px ${config.glowColor}`
              : "none",
            backgroundSize: "200% auto",
            animation: isHovered ? "barShimmer 1.8s linear infinite" : "none"
          }}
        />
        {/* Track markers */}
        {[25, 50, 75].map((mark) => (
          <div
            key={mark}
            className="absolute top-0 bottom-0 w-px bg-background/60"
            style={{ left: `${mark}%` }}
          />
        ))}
      </div>

      {/* Scale labels */}
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-muted-foreground/70">0%</span>
        <span className="text-[10px] text-muted-foreground/70">100%</span>
      </div>
    </div>
  );
};

export default RiskLevel;
