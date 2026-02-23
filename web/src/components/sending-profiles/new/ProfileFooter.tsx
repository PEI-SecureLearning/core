import { memo } from "react";
import type { ReactElement } from "react";
import { Link } from "@tanstack/react-router";
import { Save, Loader2 } from "lucide-react";
import { StatusMessage } from "@/components/sending-profiles/shared/statusMessage";

interface Props {
  onSubmit: () => void;
  isValid: boolean;
  isLoading?: boolean;
  status?: string | null;
}

interface ButtonContent {
  icon: ReactElement;
  text: string;
}

const getButtonContent = (isLoading: boolean | undefined): ButtonContent => {
  if (isLoading) {
    return { icon: <Loader2 className="h-4 w-4 animate-spin" />, text: "Saving..." };
  }
  return { icon: <Save className="h-4 w-4" />, text: "Create Profile" };
};

function ProfileFooter({ onSubmit, isValid, isLoading, status }: Props) {
  const buttonContent = getButtonContent(isLoading);

  return (
    <div className="flex flex-col gap-3 px-6 relative z-10">
      {status && <StatusMessage status={status} />}

      <div className="flex gap-4 justify-end">
        <Link
          to="/sending-profiles"
          className="liquid-glass-button-secondary px-6 py-2.5 text-sm"
        >
          Cancel
        </Link>

        <button
          onClick={onSubmit}
          disabled={!isValid || isLoading}
          className="liquid-glass-button bg-blue-600 hover:bg-blue-700 flex items-center gap-2 px-6 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {buttonContent.icon}
          {buttonContent.text}
        </button>
      </div>
    </div>
  );
}

export default memo(ProfileFooter);
