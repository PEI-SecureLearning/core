import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { BookOpen } from 'lucide-react'
import { useState, useEffect } from 'react';
import { Toolbar } from '@/components/content-manager/CourseDisplay';

export const Route = createFileRoute('/content-manager/courses')({
    component: RouteComponent,
})

const transition = {
    type: "spring" as const,
    stiffness: 200,
    damping: 20,
    mass: 1
}

import { CourseDisplay } from '@/components/content-manager/CourseDisplay';
import { CourseTitle } from '@/components/content-manager/CourseTitle';

function RouteComponent() {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    return (

        <motion.div
            layoutId="card-Courses"
            transition={transition}
            // Added 'relative' here so the absolute icon stays contained within this div
            className="w-full h-full py-4 px-6 bg-gray-50/50 flex flex-col relative"
        >
            <BookOpen
                className={`absolute top-0 right-0 -translate-y-1/50 -translate-x-5
                w-[100px] h-[100px] z-50 pointer-events-none
                transition-colors duration-[1000ms] ease-[cubic-bezier(0.4,0,0.2,1)] 
                ${isLoaded ? 'text-orange-500/80' : 'text-white/50'} rotate-12`}
            />

            <div className='w-full h-[8%] flex flex-row relative z-10'>
                <CourseTitle />

                <div className='flex flex-row gap-4'>
                    <Toolbar />
                </div>
            </div>

            <div className={`w-full h-[92%] rounded-lg p-10 relative overflow-hidden transition-colors duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)] 
        ${isLoaded ? 'bg-white' : 'bg-orange-500/50'} z-10 border-1 border-gray-200`}
            >
                <CourseDisplay />
            </div>

            {/* Placeholder for your layoutId icon if needed elsewhere */}
            <motion.div
                layoutId="icon-Courses"
                transition={transition}
            />
        </motion.div>

    )
}
