import { motion } from 'framer-motion'
import { FileStack } from 'lucide-react'
import { ContentGrid } from './ContentGrid'

const CONTENT = [
    { id: 1, title: "React Hooks Deep Dive",      category: "Video",    image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&auto=format&fit=crop&q=60", desc: "A comprehensive video walkthrough of all React hooks." },
    { id: 2, title: "CSS Grid Cheat Sheet",       category: "Document", image: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&auto=format&fit=crop&q=60", desc: "Quick reference PDF for CSS Grid layout properties." },
    { id: 3, title: "TypeScript Best Practices",  category: "Article",  image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&auto=format&fit=crop&q=60", desc: "Guidelines for writing clean and maintainable TypeScript." },
    { id: 4, title: "Node.js Performance Tuning", category: "Video",    image: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&auto=format&fit=crop&q=60", desc: "Optimize your Node.js applications for maximum throughput." },
    { id: 5, title: "Design Tokens Guide",        category: "Document", image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&auto=format&fit=crop&q=60", desc: "How to build and manage a design token system." },
    { id: 6, title: "Git Workflow Handbook",      category: "Article",  image: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800&auto=format&fit=crop&q=60", desc: "Branching strategies and collaboration best practices." },
]

export function ContentDisplay() {
    return (
        <motion.div animate={{ opacity: 1 }} className="w-full h-full">
            <ContentGrid items={CONTENT} footerIcon={FileStack} footerLabel="3 Files" viewLabel="VIEW CONTENT" />
        </motion.div>
    )
}
