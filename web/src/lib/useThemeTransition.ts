import { useTheme } from "next-themes";

type SetTheme = (theme: string) => void;

/**
 * Wraps next-themes' setTheme with a View Transition API animation.
 * The new theme "grows" in from the top-left corner (0, 0) to the
 * bottom-right, simulating a diagonal wipe.
 *
 * Falls back to the plain setTheme call when the browser doesn't
 * support startViewTransition (e.g. Firefox < 126, Safari < 18).
 */
export function useThemeTransition(): SetTheme {
  const { setTheme } = useTheme();

  return (nextTheme: string) => {
    if (
      !document.startViewTransition ||
      globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setTheme(nextTheme);
      return;
    }

    // Origin: top-left corner
    const x = 0;
    const y = 0;

    // The clip circle needs to reach the farthest corner (bottom-right)
    const endRadius = Math.hypot(globalThis.innerWidth, globalThis.innerHeight);

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
          duration: 600,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          // Animate the *incoming* (new) snapshot
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };
}
