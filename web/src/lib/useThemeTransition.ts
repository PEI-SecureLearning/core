import { useTheme } from "next-themes";
import { useCallback } from "react";

type SetTheme = (theme: string) => void;

/**
 * Wraps next-themes' setTheme with a View Transition API animation.
 * The new theme "grows" in from the center of the screen
 *
 * Falls back to the plain setTheme call when the browser doesn't
 * support startViewTransition (e.g. Firefox < 126, Safari < 18).
 */
export function useThemeTransition(): SetTheme {
  const { setTheme } = useTheme();

  return useCallback((nextTheme: string) => {
    if (
      !document.startViewTransition ||
      globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setTheme(nextTheme);
      return;
    }

    // Origin: center of the screen for a more fluid feel
    const x = globalThis.innerWidth / 2;
    const y = globalThis.innerHeight / 2;

    // The clip circle needs to reach the farthest corner
    const endRadius = Math.hypot(
      Math.max(x, globalThis.innerWidth - x),
      Math.max(y, globalThis.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      setTheme(nextTheme);
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 500,
          easing: "cubic-bezier(0.65, 0, 0.35, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  }, [setTheme]);
}
