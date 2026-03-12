import { useEffect, useState } from 'react'
import { appAssetUrl } from '@/lib/app-path'

/**
 * Full-screen branded loading screen.
 *
 * Props
 * ─────
 * visible   – controls whether the loader is shown. When it flips to false
 *             the component plays a fade-out animation before unmounting.
 * label     – optional status line shown below the logo (default "Loading…")
 * minMs     – minimum time (ms) the loader is visible, so it never flashes
 *             on very fast loads (default 800 ms)
 */
export function AppLoader({
    visible,
    label = 'Loading…',
    minMs = 2000,
}: {
    readonly visible:  boolean
    readonly label?:   string
    readonly minMs?:   number
}) {
    // `show` drives the actual DOM presence; `fading` drives the CSS class.
    const [show,   setShow]   = useState(visible)
    const [fading, setFading] = useState(false)
    const [minPassed, setMinPassed] = useState(minMs <= 0)

    // Enforce minimum display time
    useEffect(() => {
        if (minMs <= 0) return
        const t = setTimeout(() => setMinPassed(true), minMs)
        return () => clearTimeout(t)
    }, [minMs])

    // When `visible` goes false AND minimum time has passed → start fade-out
    useEffect(() => {
        if (!visible && minPassed && show) {
            setFading(true)
            const t = setTimeout(() => { setFading(false); setShow(false) }, 600)
            return () => clearTimeout(t)
        }
        if (visible) { setShow(true); setFading(false) }
    }, [visible, minPassed, show])

    if (!show) return null

    return (
        <div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white"
            style={{
                transition: 'opacity 600ms cubic-bezier(0.4,0,0.2,1)',
                opacity: fading ? 0 : 1,
            }}
        >
            {/* Subtle radial glow behind the logo */}
            <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(168,85,247,0.08) 0%, transparent 70%)',
                }}
            />

            {/* Logo */}
            <div className="relative flex flex-col items-center gap-6">
                <div className="flex items-center gap-2 select-none">
                    <img
                        src={appAssetUrl("Hatlogo.png")}
                        alt="SecureLearning"
                        className="h-20 w-20 drop-shadow-sm"
                        style={{ animation: 'sl-pulse 2.4s ease-in-out infinite' }}
                    />
                    <div className="flex flex-col leading-none">
                        <span className="font-bold text-3xl text-slate-800 tracking-tight">Secure</span>
                        <span className="font-bold text-2xl text-purple-600 tracking-tight translate-x-3">Learning</span>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-48 h-0.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-purple-400"
                        style={{ animation: 'sl-bar 1.8s ease-in-out infinite' }}
                    />
                </div>

                {/* Status label */}
                <p
                    className="text-[13px] text-slate-400 tracking-wide"
                    style={{ animation: 'sl-fade 1.8s ease-in-out infinite' }}
                >
                    {label}
                </p>
            </div>

            <style>{`
                @keyframes sl-pulse {
                    0%, 100% { opacity: 1;   transform: scale(1); }
                    50%       { opacity: .85; transform: scale(0.97); }
                }
                @keyframes sl-bar {
                    0%   { width: 0%;   margin-left: 0%; }
                    50%  { width: 60%;  margin-left: 20%; }
                    100% { width: 0%;   margin-left: 100%; }
                }
                @keyframes sl-fade {
                    0%, 100% { opacity: .5; }
                    50%      { opacity: 1;  }
                }
            `}</style>
        </div>
    )
}
