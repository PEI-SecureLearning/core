import { useEffect, useState } from "react";
import { Logo } from "@/components/navbar";
import "../css/loading.css";

interface LoadingScreenProps {
  readonly message?: string;
  readonly visible?: boolean;
}

export function LoadingScreen({
  message = "Hang on a second...",
  visible = true,
}: LoadingScreenProps) {
  const [show, setShow] = useState(false);

  // Fade in on mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Fade out when visible flips to false
  useEffect(() => {
    if (!visible) setShow(false);
  }, [visible]);

  return (
    <div
      className="loading-screen"
      style={{ opacity: show ? 1 : 0 }}
    >
      <div className="loading-logo">
        <Logo />
      </div>
      <p className="loading-message">{message}</p>
    </div>
  );
}

export default LoadingScreen;
