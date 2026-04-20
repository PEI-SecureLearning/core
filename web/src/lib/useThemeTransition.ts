import { useTheme } from "next-themes";
import { useCallback } from "react";

type SetTheme = (theme: string, event?: React.MouseEvent | MouseEvent) => void;

/**
 * Wraps next-themes' setTheme with a View Transition API animation.
 * The new theme "grows" in from the cursor position or center of the screen.
 *
 * Falls back to the plain setTheme call when the browser doesn't
 * support startViewTransition (e.g. Firefox < 126, Safari < 18).
 */
export function useThemeTransition(): SetTheme {
  const { setTheme } = useTheme();

  return useCallback((nextTheme: string, event?: React.MouseEvent | MouseEvent) => {
    if (
      !document.startViewTransition ||
      globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setTheme(nextTheme);
      return;
    }

    // Origin: mouse position if event provided, otherwise center of screen
    const x = event instanceof MouseEvent
      ? event.clientX
      : (event as React.MouseEvent)?.clientX ?? globalThis.innerWidth / 2;
    const y = event instanceof MouseEvent
      ? event.clientY
      : (event as React.MouseEvent)?.clientY ?? globalThis.innerHeight / 2;

    // The clip circle needs to reach the farthest corner
    const endRadius = Math.hypot(
      Math.max(x, globalThis.innerWidth - x),
      Math.max(y, globalThis.innerHeight - y)
    );

    // Set coordinates for CSS initial state to prevent flash
    document.documentElement.style.setProperty("--x", `${x}px`);
    document.documentElement.style.setProperty("--y", `${y}px`);

    const transition = document.startViewTransition(() => {
      setTheme(nextTheme);
    });

    transition.ready.then(() => {
      // Create a glowing expansion ring that follows the theme change
      const ring = document.createElement("div");
      ring.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 0;
        height: 0;
        border: 2px solid var(--primary);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 9999;
        box-sizing: border-box;
      `;
      document.body.appendChild(ring);

      // Animate the ring to scale up synchronously with the clip-path
      const ringAnimation = ring.animate(
        [
          { width: "0px", height: "0px", opacity: 1 },
          { width: `${endRadius * 2}px`, height: `${endRadius * 2}px`, opacity: 0 },
        ],
        {
          duration: 500, // Exact sync with clip-path
          easing: "cubic-bezier(0.65, 0, 0.35, 1)",
        }
      );

      ringAnimation.onfinish = () => ring.remove();

      // The actual theme snapshot animation
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
          fill: "forwards",
        }
      );
    });
  }, [setTheme]);
}
