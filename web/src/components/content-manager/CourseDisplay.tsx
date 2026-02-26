import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

const COURSES = [
    { id: 1, title: "Advanced React Patterns",   category: "Development", image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60", desc: "Master hooks, render props, and performance optimization." },
    { id: 2, title: "UI/UX Design Systems",       category: "Design",      image: "https://images.unsplash.com/photo-1586717791821-3f44a563dc4c?w=800&auto=format&fit=crop&q=60", desc: "Build scalable design languages for modern applications." },
    { id: 3, title: "Data Science Fundamentals",  category: "Data",        image: "https://images.unsplash.com/photo-1551288049-bbbda536339a?w=800&auto=format&fit=crop&q=60", desc: "Learn Python, Pandas, and visualization techniques." },
    { id: 4, title: "Cloud Architecture",         category: "DevOps",      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60", desc: "Design resilient and scalable cloud-native applications." },
    { id: 5, title: "TypeScript Mastery",         category: "Development", image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&auto=format&fit=crop&q=60", desc: "Deep dive into TypeScript's type system and advanced patterns." },
    { id: 6, title: "Cybersecurity Fundamentals", category: "Security",    image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&auto=format&fit=crop&q=60", desc: "Core concepts of threat modeling and secure development." },
]

export function CourseDisplay() {
    return (
        <motion.div animate={{ opacity: 1 }} className="w-full h-full">
            <ContentGrid items={COURSES} footerIcon={BookOpen} footerLabel="12 Lessons" viewLabel="VIEW COURSE" />
        </motion.div>
    )
}
