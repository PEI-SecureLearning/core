import React, { useState } from 'react';

type ExpandButtonProps = {
    label?: string;
    loadingLabel?: string;
    disabled?: boolean;
    onClick?: (e: React.MouseEvent) => void;
};

const ExpandButton = ({
    label = 'Submit',
    loadingLabel = 'Loading...',
    disabled = false,
    onClick,
}: ExpandButtonProps) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'finished'>('idle');

    // When externally disabled (e.g. quiz not ready), stay idle but prevent clicks
    const isExternallyDisabled = disabled && status === 'idle';

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (status !== 'idle' || disabled) return;

        setStatus('loading');

        // Animate: loading → loaded → finished → idle
        setTimeout(() => {
            setStatus('loaded');
            setTimeout(() => {
                setStatus('finished');
                // Call the real handler at the "finished" moment
                onClick?.(e);
                setTimeout(() => {
                    setStatus('idle');
                }, 1000);
            }, 600);
        }, 900);
    };

    const isLoading = status === 'loading';
    const isLoaded = status === 'loaded' || status === 'finished';
    const isFinished = status === 'finished';
    const isActive = status !== 'idle';

    return (
        <button
            onClick={handleClick}
            disabled={isExternallyDisabled || isActive}
            title={isExternallyDisabled ? loadingLabel : undefined}
            className={`
                group relative overflow-hidden outline-none bg-purple-700 rounded-[10px]
                px-[25px] py-[6px] text-[1.1em] text-white font-['Inter'] cursor-pointer
                transition-all duration-300 ease-in-out h-[38px] min-w-[140px]
                ${isActive ? 'pr-[73px]' : 'hover:pr-[73px]'}
                disabled:opacity-60 disabled:cursor-not-allowed
                font-medium
            `}
        >
            <span className="relative z-10">
                {isExternallyDisabled ? loadingLabel : label}
            </span>

            {/* Expand panel — slides in on hover / active */}
            <span
                className={`
                    absolute top-0 right-0 h-[36px] w-[36px] border-l border-[#eee]/20
                    flex items-center justify-center
                    transition-transform duration-300 ease-in-out
                    ${isActive ? 'translate-x-0' : 'translate-x-[49px] group-hover:translate-x-0'}
                `}
            >
                {/* Arrow icon — shown when idle */}
                {!isLoaded && (
                    <svg
                        className={`h-[10px] w-[10px] fill-white transition-transform duration-300 ${isLoading ? 'scale-0' : 'scale-[1.5]'}`}
                        viewBox="0 0 32 32"
                    >
                        <path d="M8.489 31.975c-0.271 0-0.549-0.107-0.757-0.316-0.417-0.417-0.417-1.098 0-1.515l14.258-14.264-14.050-14.050c-0.417-0.417-0.417-1.098 0-1.515s1.098-0.417 1.515 0l14.807 14.807c0.417 0.417 0.417 1.098 0 1.515l-15.015 15.022c-0.208 0.208-0.486 0.316-0.757 0.316z" />
                    </svg>
                )}

                {/* Spinner — shown while loading */}
                <span
                    className={`
                        absolute h-[40px] w-[40px] border-4 border-white border-l-transparent border-r-transparent
                        rounded-full animate-[spin_1.5s_linear_infinite] transition-opacity duration-700
                        scale-[0.3] pointer-events-none
                        ${isLoading ? 'opacity-100' : 'opacity-0'}
                    `}
                />

                {/* Check icon — shown when done */}
                {isLoaded && (
                    <svg
                        className={`h-[10px] w-[10px] transition-transform duration-300 fill-none ${isFinished ? 'scale-[1.5]' : 'scale-0 translate-y-[50px]'}`}
                        viewBox="0 0 20 20"
                    >
                        <path
                            stroke="#fff"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17 5L8 15l-5-4"
                        />
                    </svg>
                )}
            </span>
        </button>
    );
};

export default ExpandButton;