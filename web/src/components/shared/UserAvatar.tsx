interface UserAvatarProps {
  readonly name: string;
  readonly size?: "sm" | "md" | "lg";
  readonly shape?: "circle" | "rounded";
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

const shapeClasses = {
  circle: "rounded-full",
  rounded: "rounded-md",
};

export function UserAvatar({ name, size = "md", shape = "circle" }: UserAvatarProps) {
  const initial = (name?.[0] || "U").toUpperCase();
  return (
    <div
      className={`flex-shrink-0 flex items-center justify-center font-semibold bg-primary/20 text-primary ${sizeClasses[size]} ${shapeClasses[shape]}`}
    >
      {initial}
    </div>
  );
}
