import { createFileRoute } from "@tanstack/react-router";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
});

type ThemeOption = {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
};

const themeOptions: ThemeOption[] = [
  {
    value: "light",
    label: "Light",
    icon: Sun,
    description: "Clean white background, optimised for bright environments.",
  },
  {
    value: "dark",
    label: "Dark",
    icon: Moon,
    description: "Dark background, easier on the eyes in low-light settings.",
  },
  {
    value: "system",
    label: "System",
    icon: Monitor,
    description: "Automatically follows your operating-system preference.",
  },
];

function RouteComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  // Avoid hydration mismatch – only render theme-sensitive UI client-side
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="h-full w-full relative flex overflow-y-auto bg-background text-foreground">
      <div className="max-w-2xl mx-auto space-y-10 absolute inset-y-5 left-10">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your application preferences.
          </p>
        </div>

        {/* Appearance section */}
        <section className="space-y-4">
          <div className="border-b border-border pb-2">
            <h2 className="text-base font-medium">Appearance</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose how the interface looks to you.
            </p>
          </div>

          {mounted ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {themeOptions.map(({ value, label, icon: Icon, description }) => {
                const isActive = theme === value;
                return (
                  <button
                    key={value}
                    id={`theme-${value}`}
                    onClick={() => setTheme(value)}
                    className={`
                      relative flex flex-col items-start gap-3 rounded-xl border p-4 text-left
                      transition-all duration-200 cursor-pointer
                      ${isActive
                        ? "border-purple-500 ring-2 ring-purple-500/40 bg-purple-50 dark:bg-purple-950/30"
                        : "border-border hover:border-purple-300 hover:bg-muted/50"
                      }
                    `}
                    aria-pressed={isActive}
                  >
                    {/* Icon badge */}
                    <span
                      className={`
                        inline-flex items-center justify-center rounded-lg p-2
                        ${isActive
                          ? "bg-purple-500 text-white"
                          : "bg-muted text-muted-foreground"
                        }
                        transition-colors duration-200
                      `}
                    >
                      <Icon className="h-4 w-4" />
                    </span>

                    <div>
                      <p
                        className={`text-sm font-medium ${isActive ? "text-purple-700 dark:text-purple-300" : ""}`}
                      >
                        {label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                        {description}
                      </p>
                    </div>

                    {/* Active indicator dot */}
                    {isActive && (
                      <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-purple-500" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            // Skeleton while mounting to avoid flash
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-32 rounded-xl border border-border bg-muted/30 animate-pulse"
                />
              ))}
            </div>
          )}

          {mounted && (
            <p className="text-xs text-muted-foreground">
              Currently resolved to:{" "}
              <span className="font-medium capitalize text-foreground">
                {resolvedTheme}
              </span>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
