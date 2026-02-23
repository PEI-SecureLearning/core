import { memo } from "react";
import type { ReactElement } from "react";
import { Link } from "@tanstack/react-router";
import { Save, Loader2, Trash2 } from "lucide-react";

interface Props {
  onSave: () => void;
  onDelete: () => void;
  isValid: boolean;
  isLoading?: boolean;
  status?: string | null;
}

type MessageType = 'error' | 'success' | 'info';

interface MessageStyle {
  containerClass: string;
  dotClass: string;
}

const MESSAGE_STYLES: Record<MessageType, MessageStyle> = {
  error: {
    containerClass: "text-red-600 border-red-200/30",
    dotClass: "bg-red-500",
  },
  success: {
    containerClass: "text-green-600 border-green-200/30",
    dotClass: "bg-green-500",
  },
  info: {
    containerClass: "text-gray-600 border-blue-200/30",
    dotClass: "bg-blue-400",
  },
};

const getMessageType = (status: string): MessageType => {
  const lowerStatus = status.toLowerCase();
  
  if (
    lowerStatus.includes("failed") ||
    lowerStatus.includes("error") ||
    lowerStatus.includes("invalid") ||
    lowerStatus.includes("fill")
  ) {
    return 'error';
  }
  
  if (lowerStatus.includes("success") || lowerStatus.includes("valid")) {
    return 'success';
  }
  
  return 'info';
};

const StatusMessage = memo(function StatusMessage({
  status,
}: {
  status: string;
}) {
  const messageType = getMessageType(status);
  const style = MESSAGE_STYLES[messageType];
  
  return (
    <div
      className={`text-sm px-4 py-2 bg-white/50 backdrop-blur-sm rounded-xl border ${style.containerClass}`}
    >
      <span
        className={`inline-block w-2 h-2 rounded-full mr-2 animate-pulse ${style.dotClass}`}
      ></span>
      {status}
    </div>
  );
});

interface ButtonContent {
  icon: ReactElement;
  text: string;
}

const getButtonContent = (isLoading: boolean | undefined): ButtonContent => {
  if (isLoading) {
    return {
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      text: "Updating...",
    };
  }
  
  return {
    icon: <Save className="h-4 w-4" />,
    text: "Save Changes",
  };
};

function EditProfileFooter({
  onSave,
  onDelete,
  isValid,
  isLoading,
  status,
}: Props) {
  const buttonContent = getButtonContent(isLoading);

  return (
    <div className="flex flex-col gap-3 px-6 relative z-10">
      {status && <StatusMessage status={status} />}

      <div className="flex gap-4 justify-between items-center">
        {/* Botão de Perigo (Apagar) */}
        <button
          onClick={onDelete}
          disabled={isLoading}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
        >
          <Trash2 className="h-4 w-4" />
          Delete Profile
        </button>

        <div className="flex gap-4">
          <Link
            to="/sending-profiles"
            className="liquid-glass-button-secondary px-6 py-2.5 text-sm"
          >
            Cancel
          </Link>
          
          <button
            onClick={onSave}
            disabled={!isValid || isLoading}
            className="liquid-glass-button bg-blue-600 hover:bg-blue-700 flex items-center gap-2 px-6 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
