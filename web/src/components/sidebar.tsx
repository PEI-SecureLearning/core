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
  Fish
} from "lucide-react";
import {
  adminDashboardLink,
  adminLinks,
  getUserNavigationGroups,
  userDashboardLink,
  userStandaloneLinks
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
  exact: true
};

const contentManagerGroups: SidebarGroupProps[] = [
  {
    label: "LMS",
    icon: GraduationCap,
    isCollapsed: false,
    links: [
      { href: "/content-manager/courses", label: "Courses", icon: BookOpen },
      { href: "/content-manager/modules", label: "Modules", icon: Blocks },
      { href: "/content-manager/content", label: "Content", icon: FileStack }
    ]
  },
  {
    label: "Phishing",
    icon: Fish,
    isCollapsed: false,
    links: [
      { href: "/content-manager/templates", label: "Templates", icon: FileText }
    ]
  }
];

const contentManagerStandaloneLinks: SidebarLinkProps[] = [
  { href: "/content-manager/settings", label: "Settings", icon: Settings }
];

// SidebarLink

function SidebarLink({
  href,
  label,
  icon: Icon,
  isCollapsed,
  exact,
  indent = false
}: SidebarLinkProps & { isCollapsed: boolean; indent?: boolean }) {
  return (
    <Link
      to={href}
      activeOptions={{ exact: !!exact }}
      activeProps={{
        className:
          "text-primary dark:text-accent-secondary bg-primary/10 dark:bg-primary/20 font-medium"
      }}
      inactiveProps={{ className: "text-muted-foreground hover:bg-muted" }}
      className={`flex items-center gap-2 lg:gap-3 px-4 py-2 text-xs sm:text-sm ${indent && !isCollapsed ? "pl-6" : ""}`}
      title={isCollapsed ? label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="sidebar-label min-w-0 truncate">{label}</span>
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
  open,
  onToggle
}: Omit<SidebarGroupProps, "isCollapsed"> & {
  sidebarCollapsed: boolean;
  sidebarExpanded: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const location = useLocation();
  const isAnyActive = links.some((l) => location.pathname.startsWith(l.href));

  // Children should also be toggleable in collapsed mode (icons-only view).
  const showChildren = open;

  return (
    <li>
      <button
        onClick={onToggle}
        title={sidebarExpanded ? undefined : label}
        className={`w-full flex items-center gap-2 lg:gap-3 px-4 py-2 text-xs sm:text-sm transition-colors
          ${open ? "bg-muted/10" : ""}
          ${isAnyActive ? "text-primary dark:text-accent-secondary font-medium" : "text-muted-foreground hover:bg-muted"}`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="sidebar-label flex-1 text-left whitespace-nowrap">
          {label}
        </span>
        <ChevronDown
          className={`sidebar-label h-3 w-3 shrink-0 transition-transform duration-200 ${showChildren ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out ${showChildren ? "grid-rows-[1fr] opacity-100 bg-muted/40" : "grid-rows-[0fr] opacity-0"}`}
      >
        <ul className="overflow-hidden">
          {links.map((link) => (
            <li key={link.href}>
              <SidebarLink {...link} isCollapsed={sidebarCollapsed} indent />
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

// Sidebar

export function Sidebar() {
  // `isCollapsed` = the permanent/default state toggled by the button.
  // `isHovered`   = transient hover-expand while permanently collapsed.
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [openGroupKey, setOpenGroupKey] = useState<string | null>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { keycloak } = useKeycloak();
  const location = useLocation();

  // The sidebar shows its full content when permanently open OR when hovered.
  const expanded = !isCollapsed || isHovered;

  const isAdminRoute = location.pathname.startsWith("/admin");
  const isContentManagerRoute =
    location.pathname.startsWith("/content-manager");
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
  const userGroupsSignature = computedUserGroups
    .map(
      (group) =>
        `${group.label}:${group.links.map((link) => link.href).join(",")}`
    )
    .join("|");
  const contentGroupsWithKeys = contentManagerGroups.map((group) => ({
    ...group,
    groupKey: `content:${group.label}`
  }));
  const userGroupsWithKeys = computedUserGroups.map((group) => ({
    ...group,
    groupKey: `user:${group.label}`
  }));
  const activeContentGroupKey = contentGroupsWithKeys.find((group) =>
    group.links.some((link) => location.pathname.startsWith(link.href))
  )?.groupKey;
  const activeUserGroupKey = userGroupsWithKeys.find((group) =>
    group.links.some((link) => location.pathname.startsWith(link.href))
  )?.groupKey;

  const toggleGroup = (groupKey: string) => {
    setOpenGroupKey((prev) => (prev === groupKey ? null : groupKey));
  };

  // Keep only one expanded group and follow active route on navigation.
  useEffect(() => {
    if (isContentManagerRoute) {
      setOpenGroupKey(activeContentGroupKey ?? null);
      return;
    }

    if (isUserRoute) {
      setOpenGroupKey(activeUserGroupKey ?? null);
      return;
    }

    setOpenGroupKey(null);
  }, [
    isContentManagerRoute,
    isUserRoute,
    location.pathname,
    activeContentGroupKey,
    activeUserGroupKey,
    userGroupsSignature
  ]);

  let routePrefix = "";
  if (isAdminRoute) {
    routePrefix = "/admin";
  } else if (isContentManagerRoute) {
    routePrefix = "/content-manager";
  }

  const reportHref = `${routePrefix}/report`;
  const helpHref = `${routePrefix}/help`;

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
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
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
              <SidebarLink
                {...contentManagerDashboard}
                isCollapsed={!expanded}
              />
            </li>
            {contentGroupsWithKeys.map((group) => (
              <SidebarGroup
                key={group.label}
                {...group}
                sidebarCollapsed={isCollapsed}
                sidebarExpanded={expanded}
                open={openGroupKey === group.groupKey}
                onToggle={toggleGroup.bind(null, group.groupKey)}
              />
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
            {userGroupsWithKeys.map((group) => (
              <SidebarGroup
                key={group.label}
                {...group}
                sidebarCollapsed={isCollapsed}
                sidebarExpanded={expanded}
                open={openGroupKey === group.groupKey}
                onToggle={toggleGroup.bind(null, group.groupKey)}
              />
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
      <div className="py-1 border-t border-sidebar-border">
        <ul className="space-y-1">
          <li>
            <SidebarLink
              href={reportHref}
              label="Report a problem"
              icon={AlertCircle}
              isCollapsed={!expanded}
            />
          </li>
          <li>
            <SidebarLink
              href={helpHref}
              label="Help"
              icon={CircleQuestionMark}
              isCollapsed={!expanded}
            />
          </li>
        </ul>
      </div>
    </aside>
  );
}

export default Sidebar;
