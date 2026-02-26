import { BookOpen, Blocks, FileStack } from "lucide-react";
import { motion } from "motion/react";
import { DashCard } from "@/components/content-manager/DashCard";


function ContManDashboard() {
    return (
        <div className="w-full h-full bg-gray-50/50">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-[10%] px-8 py-4 flex flex-col md:flex-row justify-between items-start gap-4"
            >
                <div className="flex flex-col mt-5">
                    <h1 className="text-6xl font-bold text-slate-900 tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg -translate-y-3 translate-x-10">
                        Manage courses, modules, and content.
                    </p>
                </div >

            </motion.div >

            <div className="w-full h-[75%] px-5 p-14 flex flex-row gap-8 justify-center mt-5 ">
                <DashCard
                    title="Courses"
                    subtitle="See the existing courses"
                    gradient="linear-gradient(130deg, #8040bbff 8%, #4d0a8cff 70%, #2a024dff 100%)"
                    shadowColor="#7e22ce"
                    Icon={BookOpen}
                    to="/content-manager/courses"
                />
                <DashCard
                    title="Modules"
                    subtitle="Browse recent modules"
                    gradient="linear-gradient(130deg, #c084fc 8%, #9c21d5ff 70%, #511482ff 100%)"
                    shadowColor="#9333ea"
                    Icon={Blocks}
                    to="/content-manager/modules"
                />
                <DashCard
                    title="Content"
                    subtitle="Manage media content"
                    gradient="linear-gradient(130deg, #cd9dffff 8%, #a855f7 70%, #6713b1ff 100%)"
                    shadowColor="#a855f7"
                    Icon={FileStack}
                    to="/content-manager/content"
                />
            </div>
        </div >
    );
}

export default ContManDashboard;