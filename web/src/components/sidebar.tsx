import { Link, useLocation } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { PanelLeftClose, PanelLeftOpen, ChevronDown } from "lucide-react";
import {
  adminLinks,
  userLinks,
  contentManagerLinks,
  footerLinks,
  filterLinks,
  groupNavigationLinks,
  type NavLinkDef,
} from "@/config/navLinks";

interface SidebarLinkProps {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  exact?: boolean;
}

interface SidebarGroupProps {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  links: NavLinkDef[];
  sidebarExpanded: boolean;
  open: boolean;
  onToggle: () => void;
}

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
      inactiveProps={{ className: "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" }}
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
  sidebarExpanded,
  open,
  onToggle
}: Readonly<SidebarGroupProps>) {
  const location = useLocation();
  const isAnyActive = links.some((l) => location.pathname.startsWith(l.href));
  const showChildren = open && sidebarExpanded;

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        title={sidebarExpanded ? undefined : label}
        className={`w-full flex items-center gap-2 lg:gap-3 px-4 py-2 text-xs sm:text-sm transition-colors
          ${open ? "bg-sidebar-accent/50" : ""}
          ${isAnyActive ? "text-primary dark:text-accent-secondary font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
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
              <SidebarLink {...link} isCollapsed={!sidebarExpanded} indent />
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

// Sidebar

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [openGroupKey, setOpenGroupKey] = useState<string | null>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { keycloak } = useKeycloak();
  const location = useLocation();

  const expanded = !isCollapsed || isHovered;

  const isAdminRoute = location.pathname.startsWith("/admin");
  const isContentManagerRoute = location.pathname.startsWith("/content-manager");

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

  const userRoles = keycloak.tokenParsed?.realm_access?.roles || [];
  const realmFeatures = (keycloak.tokenParsed as any)?.features || {};

  // Select the appropriate source links
  let sourceLinks = userLinks;
  let routePrefix = "";

  if (isAdminRoute) {
    sourceLinks = adminLinks;
    routePrefix = "/admin";
  } else if (isContentManagerRoute) {
    sourceLinks = contentManagerLinks;
    routePrefix = "/content-manager";
  }

  const [initDone, setInitDone] = useState(false);

  const visibleLinks = useMemo(() => filterLinks(sourceLinks, userRoles, realmFeatures, keycloak.realm), [sourceLinks, userRoles, realmFeatures, keycloak.realm]);
  const { dashboard, groups, standalone } = useMemo(() => groupNavigationLinks(visibleLinks), [visibleLinks]);

  useEffect(() => {
    if (!initDone) {
      const activeGroup = groups.find((group: any) =>
        group.links.some((link: NavLinkDef) => location.pathname.startsWith(link.href))
      )?.label;
      setOpenGroupKey(activeGroup ?? groups[0]?.label ?? null);
      setInitDone(true);
    }
  }, [groups, location.pathname, initDone]);

  // Adjust footer links with route prefix if they aren't absolute
  const activeFooterLinks = footerLinks.map((link) => ({
    ...link,
    href:
      link.href.startsWith("/") && routePrefix
        ? `${routePrefix}${link.href}`
        : link.href
  }));

  return (
    <aside
      data-collapsed={expanded ? "false" : "true"}
      style={{ width: expanded ? "clamp(120px, 18%, 260px)" : "3rem" }}
      className="h-full bg-sidebar border-r border-sidebar-border flex flex-col rounded-bl-xl overflow-hidden transition-[width] duration-300 ease-in-out"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="h-10 border-b border-sidebar-border shrink-0 flex items-center justify-end px-2">
        <button
          onClick={handleToggle}
          className="p-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-colors text-sidebar-foreground"
          title="Toggle sidebar"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 py-4 overflow-hidden">
        <ul className="space-y-1">
          {dashboard && (
            <li>
              <SidebarLink {...dashboard} isCollapsed={!expanded} />
            </li>
          )}

          {groups.map((group: any) => (
            <SidebarGroup
              key={group.label}
              {...group}
              sidebarExpanded={expanded}
              open={openGroupKey === group.label}
              onToggle={() =>
                setOpenGroupKey((prev) =>
                  prev === group.label ? null : group.label
                )
              }
            />
          ))}

          {standalone.map((link: NavLinkDef) => (
            <li key={link.href}>
              <SidebarLink {...link} isCollapsed={!expanded} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="py-1 border-t border-sidebar-border">
        <ul className="space-y-1">
          {activeFooterLinks.map((link) => (
            <li key={link.href}>
              <SidebarLink
                {...link}
                isCollapsed={!expanded}
              />
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export default Sidebar;
