import { memo } from "react";
import type { ReactElement } from "react";
import { Link } from "@tanstack/react-router";
import { Save, Loader2, Trash2 } from "lucide-react";
import { StatusMessage } from "@/components/sending-profiles/shared/statusMessage";

interface Props {
  onSave: () => void;
  onDelete: () => void;
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
    return { icon: <Loader2 className="h-4 w-4 animate-spin" />, text: "Updating..." };
  }
  return { icon: <Save className="h-4 w-4" />, text: "Save Changes" };
};

function EditProfileFooter({ onSave, onDelete, isValid, isLoading, status }: Readonly<Props>) {
  const buttonContent = getButtonContent(isLoading);

  return (
    <div className="flex flex-col gap-3 px-6 relative z-10">
      {status && <StatusMessage status={status} />}

      <div className="flex gap-4 justify-between items-center">
        <button
          onClick={onDelete}
          disabled={isLoading}
          className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
        >
          <Trash2 className="h-4 w-4" />
          Delete Profile
        </button>

        <div className="flex gap-4">
          <Link
            to="/sending-profiles"
            className="px-6 py-2.5 rounded-lg text-sm font-medium border border-border bg-surface hover:bg-surface-subtle text-foreground transition-colors"
          >
            Cancel
          </Link>

          <button
            onClick={onSave}
            disabled={!isValid || isLoading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {buttonContent.icon}
            {buttonContent.text}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(EditProfileFooter);
