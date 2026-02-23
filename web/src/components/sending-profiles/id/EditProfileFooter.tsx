import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { Save, Loader2, Trash2 } from "lucide-react";

interface Props {
  onSave: () => void;
  onDelete: () => void;
  isValid: boolean;
  isLoading?: boolean;
  status?: string | null;
}

const StatusMessage = memo(function StatusMessage({
  status,
}: {
  status: string;
}) {
  const isError =
    status.toLowerCase().includes("failed") ||
    status.toLowerCase().includes("error") ||
    status.toLowerCase().includes("invalid") ||
    status.toLowerCase().includes("fill");
  const isSuccess = 
    status.toLowerCase().includes("success") || 
    status.toLowerCase().includes("valid");
  
  return (
    <div
      className={`text-sm px-4 py-2 bg-white/50 backdrop-blur-sm rounded-xl border ${
        isError 
          ? "text-red-600 border-red-200/30" 
          : isSuccess 
          ? "text-green-600 border-green-200/30"
          : "text-gray-600 border-blue-200/30"
      }`}
    >
      <span
        className={`inline-block w-2 h-2 rounded-full mr-2 animate-pulse ${
          isError 
            ? "bg-red-500" 
            : isSuccess 
            ? "bg-green-500"
            : "bg-blue-400"
        }`}
      ></span>
      {status}
    </div>
  );
});

function EditProfileFooter({
  onSave,
  onDelete,
  isValid,
  isLoading,
  status,
}: Props) {
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
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(EditProfileFooter);
