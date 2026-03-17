import { useKeycloak } from "@react-keycloak/web";
import { motion } from "motion/react";
import { BookOpen } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { contentManagerLinks, filterLinks } from "../config/navLinks";
import "../components/WelcomePage.css"; // Reusing the quick-card styles

export default function ContManDashboard() {
    const { keycloak } = useKeycloak();
    const userRoles = keycloak.tokenParsed?.realm_access?.roles || [];
    const realmFeatures = (keycloak.tokenParsed as any)?.features || {};

    const visibleCards = filterLinks(contentManagerLinks, userRoles, realmFeatures).filter(
        (link) => link.showOnWelcome !== false && !!link.description
    );

    const dashboardLinksKey = visibleCards.map((c) => c.href).join(",");

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
    };

    return (
        <div className="min-h-full w-full bg-background/50 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                    <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-primary mb-2">
                            <BookOpen className="w-4 h-4" />
                            <span>Content Creation</span>
                        </div>
                        <h1 className="text-4xl font-bold text-foreground tracking-tight">
                            Content Manager Dashboard
                        </h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            Manage courses, modules, and content.
                        </p>
                    </div>
                </motion.div>

                {/* Cards Grid */}
                <motion.div
                    key={dashboardLinksKey}
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 grid-flow-row-dense"
                >
                    {visibleCards.map((card, index) => {
                        const isFeatured = (index + 1) % 4 === 0;

                        return (
                            <motion.div
                                key={card.href}
                                variants={item}
                                className={`quick-card-container shadow-lg ${isFeatured ? "md:col-span-2 lg:col-span-2" : ""}`}
                            >
                                {/* Front face */}
                                <div className={`quick-card-front ${isFeatured ? "bg-gradient-to-br from-card/80 to-accent/10" : "bg-card"}`}>
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${isFeatured ? "bg-primary text-primary-foreground" : "bg-accent/10 text-primary"
                                        }`}>
                                        <card.icon className="w-6 h-6" />
                                    </div>
                                    <div className={isFeatured ? "flex flex-col md:flex-row md:items-start justify-between gap-4 flex-1" : "flex-1"}>
                                        <div className="max-w-md">
                                            <h3 className={`font-semibold text-foreground mb-2 ${isFeatured ? "text-xl" : "text-lg"}`}>
                                                {card.label}
                                            </h3>
                                            <p className="text-muted-foreground line-clamp-2">{card.description}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Hover overlay */}
                                <div className="quick-card-overlay">
                                    <div className="quick-card-overlay-icon -mb-3 translate-y-2">
                                        <card.icon className="w-6 h-6" />
                                    </div>
                                    <p className="quick-card-overlay-title translate-y-2">{card.label}</p>
                                    <p className="quick-card-overlay-desc translate-y-2">{card.description}</p>
                                    <Link
                                        to={card.href}
                                        className="mt-4 flex justify-center gap-2 items-center mx-auto shadow-xl text-sm font-semibold bg-primary-foreground text-primary hover:bg-secondary transition-all duration-300 relative z-10 px-5 py-2.5 rounded-full group"
                                    >
                                        Explore
                                        <svg
                                            className="w-5 h-5 justify-end group-hover:rotate-90 ease-linear duration-300"
                                            viewBox="0 0 16 19"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M7 18C7 18.5523 7.44772 19 8 19C8.55228 19 9 18.5523 9 18H7ZM8.70711 0.292893C8.31658 -0.0976311 7.68342 -0.0976311 7.29289 0.292893L0.928932 6.65685C0.538408 7.04738 0.538408 7.68054 0.928932 8.07107C1.31946 8.46159 1.95262 8.46159 2.34315 8.07107L8 2.41421L13.6569 8.07107C14.0474 8.46159 14.6805 8.46159 15.0711 8.07107C15.4616 7.68054 15.4616 7.04738 15.0711 6.65685L8.70711 0.292893ZM9 18L9 1H7L7 18H9Z"
                                                className="fill-current"
                                            ></path>
                                        </svg>
                                    </Link>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </div>
    );
}