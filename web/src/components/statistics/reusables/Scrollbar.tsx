import React, { useRef, useState, useEffect } from 'react';

export default function CustomScrollbar({ children, className = "", maxHeight = "16rem" }) {
  const scrollRef = useRef(null);
  const trackRef = useRef(null);
  const [thumbHeight, setThumbHeight] = useState(0);
  const [thumbTop, setThumbTop] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const updateScrollbar = () => {
    const scrollEl = scrollRef.current;
    const trackEl = trackRef.current;
    if (!scrollEl || !trackEl) return;
    
    const trackHeight = trackEl.offsetHeight;
    const scrollRatio = scrollEl.clientHeight / scrollEl.scrollHeight;
    const calculatedThumbHeight = Math.max(trackHeight * scrollRatio, 40);
    
    const scrollPercentage = scrollEl.scrollTop / (scrollEl.scrollHeight - scrollEl.clientHeight);
    const calculatedThumbTop = scrollPercentage * (trackHeight - calculatedThumbHeight);
    
    setThumbHeight(calculatedThumbHeight);
    setThumbTop(calculatedThumbTop);
  };

  const handleTrackClick = (e) => {
    const trackEl = trackRef.current;
    const scrollEl = scrollRef.current;
    if (!trackEl || !scrollEl) return;

    const rect = trackEl.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const trackHeight = trackEl.offsetHeight;
    const scrollPercentage = clickY / trackHeight;
    
    scrollEl.scrollTop = scrollPercentage * (scrollEl.scrollHeight - scrollEl.clientHeight);
  };

  const handleThumbMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const trackEl = trackRef.current;
      const scrollEl = scrollRef.current;
      if (!trackEl || !scrollEl) return;

      const rect = trackEl.getBoundingClientRect();
      const mouseY = e.clientY - rect.top;
      const trackHeight = trackEl.offsetHeight;
      const scrollPercentage = Math.max(0, Math.min(1, mouseY / trackHeight));
      
      scrollEl.scrollTop = scrollPercentage * (scrollEl.scrollHeight - scrollEl.clientHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    updateScrollbar();
    window.addEventListener('resize', updateScrollbar);
    return () => window.removeEventListener('resize', updateScrollbar);
  }, []);

  return (
    <div className={`relative flex gap-4 ${className}`}>
      <div 
        ref={trackRef} 
        onClick={handleTrackClick}
        className="relative w-1 bg-gray-200 rounded-full flex-shrink-0 cursor-pointer" 
        style={{ minHeight: maxHeight }}
      >
        <div 
          onMouseDown={handleThumbMouseDown}
          className="absolute left-0 w-full bg-purple-600 rounded-full transition-all duration-150 cursor-grab active:cursor-grabbing"
          style={{ 
            height: `${thumbHeight}px`,
            top: `${thumbTop}px`,
            transition: isDragging ? 'none' : 'all 0.15s'
          }}
        />
      </div>
      
      <div 
        ref={scrollRef}
        onScroll={updateScrollbar}
        className="flex-1 overflow-y-auto pr-2 scrollbar-hide"
        style={{ 
          maxHeight,
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none' 
        }}
      >
        {children}
      </div>
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}