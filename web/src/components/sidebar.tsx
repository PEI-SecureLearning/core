import { Link } from "@tanstack/react-router";
import { useState } from "react";
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
  ChevronLeft,
  ChevronRight,
  Building2,
  ScrollText,
  ShieldCheck,
} from "lucide-react";

interface SidebarLinkProps {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  roles?: string[];
}

const adminLinks: SidebarLinkProps[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/tenants", label: "Tenants", icon: Building2 },
  { href: "/admin/logs", label: "Logs", icon: ScrollText },
  { href: "/admin/terms", label: "Terms", icon: ShieldCheck },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const userLinks: SidebarLinkProps[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/campaigns",
    label: "Campaigns",
    icon: Megaphone,
    roles: ["ORG_MANAGER"],
  },
  {
    href: "/sending-profiles",
    label: "Sending Profiles",
    icon: Users,
    roles: ["ORG_MANAGER"],
  },
  {
    href: "/templates",
    label: "Templates",
    icon: FileText,
    roles: ["ORG_MANAGER"],
  },
  {
    href: "/tenants-org-manager",
    label: "Tenant Manager",
    icon: Building2,
    roles: ["ORG_MANAGER"],
  },
  {
    href: "/usergroups",
    label: "User groups",
    icon: Users,
    roles: ["ORG_MANAGER"],
  },
  { href: "/statistics", label: "Statistics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

function SidebarLink({
  href,
  label,
  icon: Icon,
  isCollapsed,
}: SidebarLinkProps & { isCollapsed: boolean }) {
  return (
    <Link
      to={href}
      activeProps={{
        className: "text-purple-700 bg-purple-50 font-medium px-2",
      }}
      inactiveProps={{
        className: "text-gray-700 hover:bg-gray-100",
      }}
      className="flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-2 text-xs sm:text-sm rounded-md transition-colors group"
      title={isCollapsed ? label : undefined}
    >
      <Icon className="h-4 w-4 flex-shrink-0 transition-transform duration-300" />
      <span
        className={`truncate transition-all duration-700 ease-in-out whitespace-nowrap ${
          isCollapsed
            ? "opacity-0 w-0 overflow-hidden"
            : "opacity-100 delay-150"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { keycloak } = useKeycloak();

  const shouldShowContent = !isCollapsed || isHovered;
  const isAdminRoute = window.location.pathname.startsWith("/admin");

  const getUserRoles = () => {
    if (!keycloak.tokenParsed) return [];
    const realmAccess = keycloak.tokenParsed.realm_access;
    return realmAccess ? realmAccess.roles : [];
  };

  const userRoles = getUserRoles();

  const linksToDisplay = isAdminRoute
    ? adminLinks
    : userLinks.filter((link) => {
        if (!link.roles) return true;
        return link.roles.some((role) => userRoles.includes(role));
      });

  return (
    <aside
      className={`h-full bg-gray-50 border-r border-gray-200 flex flex-col rounded-bl-xl transition-all duration-400 ease-in-out ${
        shouldShowContent ? "w-[15%] min-w-[120px] lg:min-w-[180px]" : "w-12"
      }`}
      onMouseEnter={() => {
        if (isCollapsed) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => {
        if (isCollapsed) {
          setIsHovered(false);
        }
      }}
    >
      {/* Toggle Button */}
      <div className="px-1 lg:px-3 py-1 flex justify-end border-b border-gray-200">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-200 rounded-lg transition-all duration-300 text-gray-600"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 transition-transform duration-300" />
          ) : (
            <ChevronLeft className="h-4 w-4 transition-transform duration-300" />
          )}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-2 lg:px-1 py-4 overflow-hidden">
        <ul className="space-y-1">
          {linksToDisplay.map((link) => (
            <li key={link.href}>
              <SidebarLink {...link} isCollapsed={!shouldShowContent} />
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer - Report Problem */}
      <div className="px-2 lg:px-1 py-1 border-t border-gray-200">
        <SidebarLink
          href="/report"
          label="Report a problem"
          icon={AlertCircle}
          isCollapsed={!shouldShowContent}
        />
        <SidebarLink
          href="/help"
          label="Help"
          icon={CircleQuestionMark}
          isCollapsed={!shouldShowContent}
        />
      </div>
    </aside>
  );
}

export default Sidebar;
