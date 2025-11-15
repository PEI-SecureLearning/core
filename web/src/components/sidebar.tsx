import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Megaphone,
  FileText,
  Users,
  BarChart3,
  Settings,
  AlertCircle,
  CircleQuestionMark,
} from "lucide-react";

interface SidebarLinkProps {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const sidebarLinks: SidebarLinkProps[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/templates", label: "Templates", icon: FileText },
  { href: "/usergroups", label: "User groups", icon: Users },
  { href: "/statistics", label: "Statistics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

function SidebarLink({ href, label, icon: Icon }: SidebarLinkProps) {
  return (
    <Link
      to={href}
      activeProps={{
        className: "text-purple-700 bg-purple-50 font-medium",
      }}
      inactiveProps={{
        className: "text-gray-700 hover:bg-gray-100",
      }}
      className="flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-2 text-xs sm:text-sm rounded-md transition-colors group"
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="w-[15%] min-w-[120px] lg:min-w-[180px] h-full bg-gray-50 border-r border-gray-200 flex flex-col rounded-bl-xl">
      {/* Navigation Menu */}
      <nav className="flex-1 px-2 lg:px-3 py-4">
        <ul className="space-y-1">
          {sidebarLinks.map((link) => (
            <li key={link.href}>
              <SidebarLink {...link} />
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer - Report Problem */}
      <div className="px-2 lg:px-3 py-4 border-t border-gray-200">
        <SidebarLink
          href="/report"
          label="Report a problem"
          icon={AlertCircle}
        />
        <SidebarLink href="/help" label="Help" icon={CircleQuestionMark} />
      </div>
    </aside>
  );
}

export default Sidebar;