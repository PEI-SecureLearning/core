import { cn } from "@/lib/utils";

interface StepCardProps {
  index: number;
  label: string;
  active: boolean;
}

export default function StepCard({ index, label, active }: StepCardProps) {
  return (
    <div className="flex items-center align-middle gap-1">
      {/* Number Bubble */}
      <div
        className={cn(
          "py-0 px-3.5 rounded-full flex items-center justify-center font-semibold text-sm border",
          active
            ? "bg-purple-500 text-white border-purple-500"
            : "bg-gray-200 text-gray-700 border-gray-300"
        )}
      >
        {index + 1}
      </div>

      {/* Label */}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
