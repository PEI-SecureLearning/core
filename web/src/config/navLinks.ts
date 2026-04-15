import {
    LayoutDashboard,
    Megaphone,
    FileText,
    Users,
    BarChart3,
    Settings,
    AlertCircle,
    CircleQuestionMark,
    Building2,
    ScrollText,
    ShieldCheck,
    BookOpen,
    Blocks,
    FileStack,
    Send,
    User,
    Package,
    Fish,
    GraduationCap,
    FolderCog,
} from "lucide-react";

export interface NavLinkDef {
    href: string;
    label: string;
    /** Short description shown on the WelcomePage cards. */
    description?: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    roles?: string[];
    feature?: string;
    /** When true the router matches the path exactly (no prefix). */
    exact?: boolean;
    /** When false the link is hidden from the WelcomePage cards grid. */
    showOnWelcome?: boolean;
    /** Group name for sidebar categorisation. */
    group?: string;
}

export interface NavGroupDef {
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    links: NavLinkDef[];
}

const groupIcons: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
    "Phishing": Fish,
    "LMS": GraduationCap,
    "Learning": BookOpen,
    "Management": FolderCog,
};

// ── Admin section ────────────────────────────────────────────────────────────

export const adminLinks: NavLinkDef[] = [
    {
        href: "/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
        exact: true,
        showOnWelcome: false,
    },
    {
        href: "/admin/tenants",
        label: "Tenant Management",
        description: "Create and manage organizations, configure features and access controls.",
        icon: Building2,
    },
    {
        href: "/admin/logs",
        label: "System Logs",
        description: "Monitor real-time platform activity and system events.",
        icon: ScrollText,
    },
    {
        href: "/admin/settings",
        label: "Settings",
        description: "Configure theme.",
        icon: Settings,
    },
];

// ── Regular-user section ─────────────────────────────────────────────────────

export const userLinks: NavLinkDef[] = [
    {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        exact: true,
        showOnWelcome: false,
    },
    {
        href: "/campaigns",
        label: "Campaigns",
        description: "View and manage your ongoing phishing simulation campaigns.",
        icon: Megaphone,
        roles: ["ORG_MANAGER"],
        feature: "phishing",
        group: "Phishing",
    },
    {
        href: "/sending-profiles",
        label: "Sending Profiles",
        description: "Configure your email delivery settings and profiles.",
        icon: Send,
        roles: ["ORG_MANAGER"],
        feature: "phishing",
        group: "Phishing",
    },
    {
        href: "/templates",
        label: "Templates",
        description: "Create and manage reusable phishing email templates.",
        icon: FileText,
        roles: ["ORG_MANAGER"],
        feature: "phishing",
        group: "Phishing",
    },
    {
        href: "/phishing-kits",
        label: "Phishing Kits",
        description: "Manage landing pages and phishing kit assets.",
        icon: Package,
        roles: ["ORG_MANAGER"],
        feature: "phishing",
        group: "Phishing",
    },
    {
        href: "/courses",
        label: "Courses",
        description: "Access and complete your security awareness training.",
        icon: BookOpen,
        roles: ["default-roles-$realmname"],
        feature: "lms",
        group: "LMS",
    },
    {
        href: "/courses/manage",
        label: "Manage Courses",
        description: "Manage organization courses.",
        icon: BookOpen,
        roles: ["ORG_MANAGER"],
        feature: "lms",
        group: "Learning",
    },
    {
        href: "/courses/assign",
        label: "Assign Courses",
        description: "Assign courses to users.",
        icon: GraduationCap,
        roles: ["ORG_MANAGER"],
        feature: "lms",
        group: "Learning",
    },
    {
        href: "/users",
        label: "User Management",
        description: "Manage user accounts, roles, and access permissions.",
        icon: User,
        roles: ["ORG_MANAGER"],
        group: "Management",
    },
    {
        href: "/usergroups",
        label: "User Groups",
        description: "Manage your target groups and user assignments.",
        icon: Users,
        roles: ["ORG_MANAGER"],
        group: "Management",
    },
    {
        href: "/compliance-org-manager",
        label: "Compliance",
        description: "Monitor and enforce security compliance across your organisation.",
        icon: ShieldCheck,
        roles: ["ORG_MANAGER"],
        group: "Management",
    },
    {
        href: "/statistics",
        label: "Statistics",
        description: "Check your organisation's overall security compliance score.",
        icon: BarChart3,
    },
    {
        href: "/settings",
        label: "Settings",
        icon: Settings,
        showOnWelcome: false,
    }
];

// ── Content-manager section ──────────────────────────────────────────────────

export const contentManagerLinks: NavLinkDef[] = [
    {
        href: "/content-manager",
        label: "Dashboard",
        icon: LayoutDashboard,
        exact: true,
        showOnWelcome: false,
    },
    {
        href: "/content-manager/courses",
        label: "Courses",
        description: "Create and manage training courses.",
        icon: BookOpen,
        group: "LMS",
    },
    {
        href: "/content-manager/modules",
        label: "Modules",
        description: "Organise content into reusable modules.",
        icon: Blocks,
        group: "LMS",
    },
    {
        href: "/content-manager/content",
        label: "Content",
        description: "Upload and manage media and learning materials.",
        icon: FileStack,
        group: "LMS",
    },
    {
        href: "/content-manager/templates",
        label: "Templates",
        description: "Design and maintain reusable email and page templates.",
        icon: FileText,
        group: "Phishing",
    },
    {
        href: "/content-manager/settings",
        label: "Settings",
        icon: Settings,
        showOnWelcome: false,
    },
];

// ── Footer links (shared) ────────────────────────────────────────────────────

export const footerLinks: NavLinkDef[] = [
    { href: "/report", label: "Report a problem", icon: AlertCircle },
    { href: "/help", label: "Help", icon: CircleQuestionMark },
];

// ── Helper: filter links by roles + features ─────────────────────────────────

export function filterLinks(
    links: NavLinkDef[],
    userRoles: string[],
    realmFeatures: Record<string, boolean>,
    realmName?: string
): NavLinkDef[] {
    return links.filter((link) => {
        // Feature gate
        if (link.feature && !realmFeatures[link.feature]) return false;
        // Role gate (no roles = visible to all)
        if (link.roles) {
            return link.roles.some((r) => {
                const requiredRole = r === "default-roles-$realmname" && realmName 
                    ? `default-roles-${realmName}` 
                    : r;
                return userRoles.includes(requiredRole);
            });
        }
        return true;
    });
}

// ── Helper: group links for sidebar ──────────────────────────────────────────

export function groupNavigationLinks(links: NavLinkDef[]): {
    dashboard?: NavLinkDef;
    groups: NavGroupDef[];
    standalone: NavLinkDef[];
} {
    const dashboard = links.find(l => l.exact && l.label === "Dashboard");
    const others = links.filter(l => l !== dashboard);

    const groupsMap = new Map<string, NavLinkDef[]>();
    const standalone: NavLinkDef[] = [];

    others.forEach(link => {
        if (link.group) {
            const list = groupsMap.get(link.group) || [];
            list.push(link);
            groupsMap.set(link.group, list);
        } else {
            standalone.push(link);
        }
    });

    const groups: NavGroupDef[] = Array.from(groupsMap.entries()).map(([label, links]) => ({
        label,
        icon: groupIcons[label] || LayoutDashboard,
        links,
    }));

    return { dashboard, groups, standalone };
}
