import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { Blocks } from 'lucide-react'
import { useState, useEffect } from 'react';
import { Toolbar } from '@/components/content-manager/ToolBar';

export const Route = createFileRoute('/content-manager/modules')({
    component: RouteComponent,
})

const transition = {
    type: "spring" as const,
    stiffness: 300,
    damping: 40,
    mass: 1
}

import { ModuleDisplay } from '@/components/content-manager/ModuleDisplay';
import { ModuleTitle } from '@/components/content-manager/ModuleTitle';

function RouteComponent() {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    return (

        <motion.div
            layoutId="card-Modules"
            transition={transition}

            className="w-full h-full py-4 px-6 bg-gray-50/50 flex flex-col relative"
        >

            <div className='w-full h-[8%] flex flex-row relative z-10'>
                <ModuleTitle />

                <div className='w-[70%] flex flex-row gap-4 justify-end'>
                    <Toolbar />
                </div>
            </div>

            <div className={`w-full h-[92%] rounded-lg p-10 relative overflow-y-auto transition-colors duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)] 
        ${isLoaded ? 'bg-gray-100' : 'bg-purple-500/50'} z-10 border-1 border-gray-200`}
            >
                <ModuleDisplay />
            </div>

            <motion.div
                layoutId="icon-Modules"
                transition={transition}
            />
        </motion.div>

    )
}
