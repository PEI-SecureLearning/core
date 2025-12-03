import { Link } from "@tanstack/react-router";
import { useState } from "react";
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
} from "lucide-react";

interface SidebarLinkProps {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  isCollapsed: boolean;
}

const sidebarLinks: Omit<SidebarLinkProps, 'isCollapsed'>[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/templates", label: "Templates", icon: FileText },
  { href: "/usergroups", label: "User groups", icon: Users },
  { href: "/statistics", label: "Statistics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/tenants-org-manager", label: "Tenant Manager", icon: Building2 },
];

function SidebarLink({ href, label, icon: Icon, isCollapsed }: SidebarLinkProps) {
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
      <span className={`truncate transition-all duration-700 ease-in-out whitespace-nowrap ${
        isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 delay-150'
      }`}>
        {label}
      </span>
    </Link>
  );
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const shouldShowContent = !isCollapsed || isHovered;

  return (
    <aside 
      className={`h-full bg-gray-50 border-r border-gray-200 flex flex-col rounded-bl-xl transition-all duration-400 ease-in-out ${
        shouldShowContent ? 'w-[15%] min-w-[120px] lg:min-w-[180px]' : 'w-12'
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
          {sidebarLinks.map((link) => (
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
