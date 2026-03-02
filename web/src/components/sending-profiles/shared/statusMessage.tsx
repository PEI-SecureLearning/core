import { memo } from "react";

export type MessageType = "error" | "success" | "info";

interface MessageStyle {
  containerClass: string;
  dotClass: string;
}

export const MESSAGE_STYLES: Record<MessageType, MessageStyle> = {
  error: {
    containerClass: "text-red-600 border-red-200/30",
    dotClass: "bg-red-500",
  },
  success: {
    containerClass: "text-green-600 border-green-200/30",
    dotClass: "bg-green-500",
  },
  info: {
    containerClass: "text-gray-600 border-purple-200/30",
    dotClass: "bg-purple-400",
  },
};

export const getMessageType = (status: string): MessageType => {
  const s = status.toLowerCase();
  if (
    s.includes("failed") ||
    s.includes("error") ||
    s.includes("invalid") ||
    s.includes("fill")
  ) {
    return "error";
  }
  if (s.includes("success") || s.includes("valid")) {
    return "success";
  }
  return "info";
};

export const StatusMessage = memo(function StatusMessage({
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
      />
      {status}
    </div>
  );
});
