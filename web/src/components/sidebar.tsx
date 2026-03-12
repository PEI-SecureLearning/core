import { Link, useLocation } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useKeycloak } from "@react-keycloak/web";
import {
  LayoutDashboard,
  Megaphone,
  FileText,
  Users,
  BarChart3,
  Settings,
  AlertCircle,
  CircleQuestionMark,
  PanelLeftClose,
  PanelLeftOpen,
  Building2,
  ScrollText,
  ShieldCheck,
  BookOpen,
  Blocks,
  FileStack,
  Send,
  User,
  ChevronDown,
  GraduationCap,
  Fish,
  FolderCog,
} from "lucide-react";

interface SidebarLinkProps {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  roles?: string[];
  exact?: boolean;
  feature?: string;
}

interface SidebarGroupProps {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  links: SidebarLinkProps[];
  isCollapsed: boolean;
}

const adminLinks: SidebarLinkProps[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN"],
    exact: true,
  },
  {
    href: "/admin/tenants",
    label: "Tenants",
    icon: Building2,
    roles: ["ADMIN"],
  },
  { href: "/admin/logs", label: "Logs", icon: ScrollText, roles: ["ADMIN"] },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
];

const userDashboard: SidebarLinkProps = {
  href: "/dashboard",
  label: "Dashboard",
  icon: LayoutDashboard,
  exact: true,
};

const userStandaloneLinks: SidebarLinkProps[] = [
  { href: "/statistics", label: "Statistics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

const userGroups = (realmFeatures: Record<string, boolean>, userRoles: string[]) => {
  const hasRole = (role: string) => userRoles.includes(role);
  const hasFeature = (f: string) => !!realmFeatures[f];

  const groups: Omit<SidebarGroupProps, "isCollapsed">[] = [];

  const phishingLinks: SidebarLinkProps[] = [];
  if (hasRole("ORG_MANAGER") && hasFeature("phishing")) {
    phishingLinks.push(
      { href: "/campaigns", label: "Campaigns", icon: Megaphone },
      { href: "/sending-profiles", label: "Sending Profiles", icon: Send },
      { href: "/templates", label: "Templates", icon: FileText },
    );
  }
  if (phishingLinks.length) groups.push({ label: "Phishing", icon: Fish, links: phishingLinks });

  const lmsLinks: SidebarLinkProps[] = [];
  if (hasRole("DEFAULT_USER") && hasFeature("lms")) {
    lmsLinks.push({ href: "/courses", label: "Courses", icon: BookOpen });
  }
  if (lmsLinks.length) groups.push({ label: "LMS", icon: GraduationCap, links: lmsLinks });

  const mgmtLinks: SidebarLinkProps[] = [];
  if (hasRole("ORG_MANAGER")) {
    mgmtLinks.push(
      { href: "/tenants-org-manager", label: "User Management", icon: User },
      { href: "/usergroups", label: "User Groups", icon: Users },
      { href: "/compliance-org-manager", label: "Compliance", icon: ShieldCheck },
    );
  }
  if (mgmtLinks.length) groups.push({ label: "Management", icon: FolderCog, links: mgmtLinks });

  return groups;
};

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
      activeProps={{
        className: "text-primary dark:text-accent-secondary bg-primary/10 dark:bg-primary/20 font-medium px-2",
      }}
      inactiveProps={{
        className: "text-foreground hover:bg-muted",
      }}
      className={`flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-2 text-xs sm:text-sm rounded-md group ${indent ? "pl-4 lg:pl-5" : ""}`}
      title={isCollapsed ? label : undefined}
    >
      <Icon className="h-4 w-4 flex-shrink-0 transition-transform duration-300" />
      <span
        className={`truncate transition-[opacity,width] duration-300 ease-in-out whitespace-nowrap ${
          isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 delay-100"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

function SidebarGroup({ label, icon: Icon, links, isCollapsed }: SidebarGroupProps & { isCollapsed: boolean }) {
  const location = useLocation();
  const isAnyActive = links.some((l) => location.pathname.startsWith(l.href));
  const [open, setOpen] = useState(isAnyActive);

  return (
    <li>
      {/* Group header — acts as a toggle when expanded */}
      <button
        onClick={() => !isCollapsed && setOpen((o) => !o)}
        title={isCollapsed ? label : undefined}
        className={`w-full flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-2 text-xs sm:text-sm rounded-md transition-colors
          ${isAnyActive ? "text-primary dark:text-accent-secondary font-medium" : "text-foreground hover:bg-muted"}`}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span
          className={`flex-1 text-left truncate transition-[opacity,width] duration-300 ease-in-out whitespace-nowrap ${
            isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 delay-100"
          }`}
        >
          {label}
        </span>
        {!isCollapsed && (
          <ChevronDown
            className={`h-3 w-3 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {/* Group children */}
      <ul
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          open && !isCollapsed ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {links.map((link) => (
          <li key={link.href}>
            <SidebarLink {...link} isCollapsed={isCollapsed} indent />
          </li>
        ))}
      </ul>
    </li>
  );
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { keycloak } = useKeycloak();
  const location = useLocation();

  const shouldShowContent = !isCollapsed || isHovered;
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isContentManagerRoute = location.pathname.startsWith("/content-manager");
  const isUserRoute = !isAdminRoute && !isContentManagerRoute;

  const handleMouseEnter = () => {
    if (!isCollapsed) return;
    hoverTimeout.current = setTimeout(() => setIsHovered(true), 400);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
    if (isCollapsed) setIsHovered(false);
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
  const computedUserGroups = userGroups(realmFeatures, userRoles);

  const reportHref = isAdminRoute
    ? "/admin/report"
    : isContentManagerRoute
      ? "/content-manager/report"
      : "/report";

  const helpHref = isAdminRoute
    ? "/admin/help"
    : isContentManagerRoute
      ? "/content-manager/help"
      : "/help";

  return (
    <aside
      className={`h-full bg-sidebar border-r border-sidebar-border flex flex-col rounded-bl-xl transition-all duration-300 ease-in-out ${
        shouldShowContent ? "w-[13%] min-w-[120px] lg:min-w-[180px]" : "w-12"
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Toggle Button */}
      <div className="relative py-1 h-10 border-b border-sidebar-border">
        <button
          onClick={() => {
            if (hoverTimeout.current) {
              clearTimeout(hoverTimeout.current);
              hoverTimeout.current = null;
            }
            setIsHovered(false);
            setIsCollapsed((c) => !c);
          }}
          className={`absolute top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-lg transition-all duration-300 text-muted-foreground ${
            shouldShowContent ? "right-2" : "left-1/2 -translate-x-1/2"
          }`}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {shouldShowContent ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-2 lg:px-1 py-4 overflow-hidden">
        {isAdminRoute && (
          <ul className="space-y-1">
            {adminLinks.map((link) => (
              <li key={link.href}>
                <SidebarLink {...link} isCollapsed={!shouldShowContent} />
              </li>
            ))}
          </ul>
        )}

        {isContentManagerRoute && (
          <ul className="space-y-1">
            <li>
              <SidebarLink {...contentManagerDashboard} isCollapsed={!shouldShowContent} />
            </li>
            {contentManagerGroups.map((group) => (
              <SidebarGroup key={group.label} {...group} isCollapsed={!shouldShowContent} />
            ))}
            {contentManagerStandaloneLinks.map((link) => (
              <li key={link.href}>
                <SidebarLink {...link} isCollapsed={!shouldShowContent} />
              </li>
            ))}
          </ul>
        )}

        {isUserRoute && (
          <ul className="space-y-1">
            <li>
              <SidebarLink {...userDashboard} isCollapsed={!shouldShowContent} />
            </li>
            {computedUserGroups.map((group) => (
              <SidebarGroup key={group.label} {...group} isCollapsed={!shouldShowContent} />
            ))}
            {userStandaloneLinks.map((link) => (
              <li key={link.href}>
                <SidebarLink {...link} isCollapsed={!shouldShowContent} />
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* Footer - Report / Help */}
      <div className="px-2 lg:px-1 py-1 border-t border-sidebar-border">
        <SidebarLink href={reportHref} label="Report a problem" icon={AlertCircle} isCollapsed={!shouldShowContent} />
        <SidebarLink href={helpHref} label="Help" icon={CircleQuestionMark} isCollapsed={!shouldShowContent} />
      </div>
    </aside>
  );
}

export default Sidebar;
