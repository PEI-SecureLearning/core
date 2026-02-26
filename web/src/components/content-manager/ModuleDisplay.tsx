import { motion } from 'framer-motion'
import { Blocks } from 'lucide-react'
import { ContentGrid } from './ContentGrid'

const MODULES = [
    { id: 1, title: "Introduction to Python",    category: "Programming", image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=60", desc: "Learn the basics of Python programming from scratch." },
    { id: 2, title: "RESTful API Design",         category: "Backend",     image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60", desc: "Design robust and scalable REST APIs with best practices." },
    { id: 3, title: "Database Modeling",          category: "Data",        image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=60", desc: "Master relational database design and normalization techniques." },
    { id: 4, title: "Authentication & Security",  category: "Security",    image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&auto=format&fit=crop&q=60", desc: "Implement secure authentication flows and authorization patterns." },
    { id: 5, title: "State Management",           category: "Frontend",    image: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800&auto=format&fit=crop&q=60", desc: "Explore modern state management solutions for complex UIs." },
    { id: 6, title: "Cloud Deployment",           category: "DevOps",      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60", desc: "Deploy and manage applications on cloud infrastructure." },
]

export function ModuleDisplay() {
    return (
        <motion.div animate={{ opacity: 1 }} className="w-full h-full">
            <ContentGrid items={MODULES} footerIcon={Blocks} footerLabel="8 Units" viewLabel="VIEW MODULE" />
        </motion.div>
    )
}
