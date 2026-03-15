import { Link, useLocation } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useKeycloak } from "@react-keycloak/web";
import {
  LayoutDashboard,
  FileText,
  Settings,
  AlertCircle,
  CircleQuestionMark,
  PanelLeftClose,
  PanelLeftOpen,
  BookOpen,
  Blocks,
  FileStack,
  ChevronDown,
  GraduationCap,
  Fish,
} from "lucide-react";
import {
  adminDashboardLink,
  adminLinks,
  getUserNavigationGroups,
  userDashboardLink,
  userStandaloneLinks,
} from "@/lib/navigation";

interface SidebarLinkProps {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  exact?: boolean;
}

interface SidebarGroupProps {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  links: SidebarLinkProps[];
  isCollapsed: boolean;
}

const contentManagerDashboard: SidebarLinkProps = {
  href: "/content-manager",
  label: "Dashboard",
  icon: LayoutDashboard,
  exact: true,
};

const contentManagerGroups: SidebarGroupProps[] = [
  {
    label: "LMS",
    icon: GraduationCap,
    isCollapsed: false,
    links: [
      { href: "/content-manager/courses", label: "Courses", icon: BookOpen },
      { href: "/content-manager/modules", label: "Modules", icon: Blocks },
      { href: "/content-manager/content", label: "Content", icon: FileStack },
    ],
  },
  {
    label: "Phishing",
    icon: Fish,
    isCollapsed: false,
    links: [
      { href: "/content-manager/templates", label: "Templates", icon: FileText },
    ],
  },
];

const contentManagerStandaloneLinks: SidebarLinkProps[] = [
  { href: "/content-manager/settings", label: "Settings", icon: Settings },
];

// SidebarLink

function SidebarLink({
  href,
  label,
  icon: Icon,
  isCollapsed,
  exact,
  indent = false,
}: SidebarLinkProps & { isCollapsed: boolean; indent?: boolean }) {
  return (
    <Link
      to={href}
      activeOptions={{ exact: !!exact }}
      activeProps={{ className: "text-primary dark:text-accent-secondary bg-primary/10 dark:bg-primary/20 font-medium" }}
      inactiveProps={{ className: "text-muted-foreground hover:bg-muted" }}
      className={`flex items-center gap-2 lg:gap-3 px-4 py-2 text-xs sm:text-sm ${indent ? "pl-6" : ""}`}
      title={isCollapsed ? label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="sidebar-label whitespace-nowrap">{label}</span>
    </Link>
  );
}

// SidebarGroup

function SidebarGroup({
  label,
  icon: Icon,
  links,
  sidebarCollapsed,
  sidebarExpanded,
}: Omit<SidebarGroupProps, "isCollapsed"> & { sidebarCollapsed: boolean; sidebarExpanded: boolean}) {
  const location = useLocation();
  const isAnyActive = links.some((l) => location.pathname.startsWith(l.href));
  const [open, setOpen] = useState(true);
  const userChoice = useRef<boolean | null>(null); // null = no explicit choice yet
  const prevCollapsed = useRef(sidebarCollapsed);

  // When the permanent collapsed state changes, sync open accordingly.
  useEffect(() => {
    if (prevCollapsed.current === sidebarCollapsed) return;
    prevCollapsed.current = sidebarCollapsed;
  }, [sidebarCollapsed]);

  // Children visible whenever the sidebar is visually expanded (permanent or hover).
  const showChildren = open && sidebarExpanded;

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    userChoice.current = next;
  };

  return (
    <li>
      <button
        onClick={handleToggle}
        title={sidebarExpanded ? undefined : label}
        className={`w-full flex items-center gap-2 lg:gap-3 px-4 py-2 text-xs sm:text-sm transition-colors
          ${isAnyActive ? "text-primary dark:text-accent-secondary font-medium" : "text-muted-foreground hover:bg-muted"}`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="sidebar-label flex-1 text-left whitespace-nowrap">{label}</span>
        <ChevronDown
          className={`sidebar-label h-3 w-3 shrink-0 transition-transform duration-200 ${showChildren ? "rotate-180" : ""}`}
        />
      </button>

      <ul className={`overflow-hidden transition-all duration-200 ease-in-out ${showChildren ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
        {links.map((link) => (
          <li key={link.href}>
            <SidebarLink {...link} isCollapsed={sidebarCollapsed} indent />
          </li>
        ))}
      </ul>
    </li>
  );
}

// Sidebar

export function Sidebar() {
  // `isCollapsed` = the permanent/default state toggled by the button.
  // `isHovered`   = transient hover-expand while permanently collapsed.
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { keycloak } = useKeycloak();
  const location = useLocation();

  // The sidebar shows its full content when permanently open OR when hovered.
  const expanded = !isCollapsed || isHovered;

  const isAdminRoute = location.pathname.startsWith("/admin");
  const isContentManagerRoute = location.pathname.startsWith("/content-manager");
  const isUserRoute = !isAdminRoute && !isContentManagerRoute;

  const handleMouseEnter = () => {
    if (!isCollapsed) return;
    hoverTimeout.current = setTimeout(() => setIsHovered(true), 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
    setIsHovered(false);
  };

  const handleToggle = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
    setIsHovered(false);
    setIsCollapsed((c) => !c);
  };

  const getUserRoles = (): string[] => {
    if (!keycloak.tokenParsed) return [];
    const realmAccess = keycloak.tokenParsed.realm_access;
    return realmAccess ? realmAccess.roles : [];
  };

  const getRealmFeatures = (): Record<string, boolean> => {
    if (!keycloak.tokenParsed) return {};
    return (keycloak.tokenParsed.features as Record<string, boolean>) ?? {};
  };

  const userRoles = getUserRoles();
  const realmFeatures = getRealmFeatures();
  const computedUserGroups = getUserNavigationGroups(realmFeatures, userRoles);

  const reportHref = isAdminRoute ? "/admin/report" : isContentManagerRoute ? "/content-manager/report" : "/report";
  const helpHref = isAdminRoute ? "/admin/help" : isContentManagerRoute ? "/content-manager/help" : "/help";

  return (
    <aside
      data-collapsed={expanded ? "false" : "true"}
      style={{ width: expanded ? "clamp(120px, 18%, 260px)" : "3rem" }}
      className="h-full bg-sidebar border-r border-sidebar-border flex flex-col rounded-bl-xl overflow-hidden transition-[width] duration-300 ease-in-out"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Toggle button — right-aligned, toggles the permanent state */}
      <div className="h-10 border-b border-sidebar-border shrink-0 flex items-center justify-end px-2">
        <button
          onClick={handleToggle}
          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
          title="Toggle sidebar"
        >
          {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-hidden">
        {isAdminRoute && (
          <ul className="space-y-1">
            <li>
              <SidebarLink {...adminDashboardLink} isCollapsed={!expanded} />
            </li>
            {adminLinks.map((link) => (
              <li key={link.href}>
                <SidebarLink {...link} isCollapsed={!expanded} />
              </li>
            ))}
          </ul>
        )}

        {isContentManagerRoute && (
          <ul className="space-y-1">
            <li>
              <SidebarLink {...contentManagerDashboard} isCollapsed={!expanded} />
            </li>
            {contentManagerGroups.map((group) => (
              <SidebarGroup key={group.label} {...group} sidebarCollapsed={isCollapsed} sidebarExpanded={expanded} />
            ))}
            {contentManagerStandaloneLinks.map((link) => (
              <li key={link.href}>
                <SidebarLink {...link} isCollapsed={!expanded} />
              </li>
            ))}
          </ul>
        )}

        {isUserRoute && (
          <ul className="space-y-1">
            <li>
              <SidebarLink {...userDashboardLink} isCollapsed={!expanded} />
            </li>
            {computedUserGroups.map((group) => (
              <SidebarGroup key={group.label} {...group} sidebarCollapsed={isCollapsed} sidebarExpanded={expanded} />
            ))}
            {userStandaloneLinks.map((link) => (
              <li key={link.href}>
                <SidebarLink {...link} isCollapsed={!expanded} />
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* Footer */}
      <div className="px-2 lg:px-1 py-1 border-t border-sidebar-border">
        <SidebarLink href={reportHref} label="Report a problem" icon={AlertCircle} isCollapsed={!expanded} />
        <SidebarLink href={helpHref} label="Help" icon={CircleQuestionMark} isCollapsed={!expanded} />
      </div>
    </aside>
  );
}

export default Sidebar;
