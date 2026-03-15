import type { SVGProps } from "react";
import {
  BarChart3,
  BookOpen,
  Building2,
  FileText,
  Fish,
  FolderCog,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  Package,
  ScrollText,
  Send,
  Settings,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";

export interface AppNavLink {
  href: string;
  label: string;
  icon: React.ComponentType<SVGProps<SVGSVGElement>>;
  exact?: boolean;
  description?: string;
}

export interface AppNavGroup {
  label: string;
  icon: React.ComponentType<SVGProps<SVGSVGElement>>;
  links: AppNavLink[];
}

export const adminDashboardLink: AppNavLink = {
  href: "/admin",
  label: "Dashboard",
  icon: LayoutDashboard,
  exact: true,
};

export const adminLinks: AppNavLink[] = [
  {
    href: "/admin/tenants",
    label: "Tenants",
    icon: Building2,
    description: "Create and manage organizations, features, and tenant access.",
  },
  {
    href: "/admin/logs",
    label: "Logs",
    icon: ScrollText,
    description: "Inspect recent platform events and operational activity.",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
    description: "Manage platform-wide configuration and defaults.",
  },
];

export const userDashboardLink: AppNavLink = {
  href: "/dashboard",
  label: "Dashboard",
  icon: LayoutDashboard,
  exact: true,
};

export const userStandaloneLinks: AppNavLink[] = [
  {
    href: "/statistics",
    label: "Statistics",
    icon: BarChart3,
    description: "Review your organization’s security and compliance metrics.",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    description: "Adjust your personal and workspace settings.",
  },
];

export const getUserNavigationGroups = (
  realmFeatures: Record<string, boolean>,
  userRoles: string[],
): AppNavGroup[] => {
  const hasRole = (role: string) => userRoles.includes(role);
  const hasFeature = (feature: string) => Boolean(realmFeatures[feature]);
  const groups: AppNavGroup[] = [];

  const phishingLinks: AppNavLink[] = [];
  if (hasRole("ORG_MANAGER") && hasFeature("phishing")) {
    phishingLinks.push(
      {
        href: "/campaigns",
        label: "Campaigns",
        icon: Megaphone,
        description: "Plan and monitor phishing simulations for your users.",
      },
      {
        href: "/sending-profiles",
        label: "Sending Profiles",
        icon: Send,
        description: "Manage sender identities and delivery settings.",
      },
      {
        href: "/templates",
        label: "Templates",
        icon: FileText,
        description: "Create and edit phishing email templates.",
      },
      {
        href: "/phishing-kits",
        label: "Phishing Kits",
        icon: Package,
        description: "Manage landing pages and phishing kit assets.",
      },
    );
  }
  if (phishingLinks.length) {
    groups.push({ label: "Phishing", icon: Fish, links: phishingLinks });
  }

  const lmsLinks: AppNavLink[] = [];
  if (hasRole("DEFAULT_USER") && hasFeature("lms")) {
    lmsLinks.push({
      href: "/courses",
      label: "Courses",
      icon: BookOpen,
      description: "Access your assigned learning content and courses.",
    });
  }
  if (lmsLinks.length) {
    groups.push({ label: "LMS", icon: GraduationCap, links: lmsLinks });
  }

  const managementLinks: AppNavLink[] = [];
  if (hasRole("ORG_MANAGER")) {
    managementLinks.push(
      {
        href: "/tenants-org-manager",
        label: "Users",
        icon: User,
        description: "Manage tenant users and their access.",
      },
      {
        href: "/usergroups",
        label: "User Groups",
        icon: Users,
        description: "Organize users into targetable groups.",
      },
      {
        href: "/compliance-org-manager",
        label: "Compliance",
        icon: ShieldCheck,
        description: "Configure compliance policy and quiz requirements.",
      },
    );
  }
  if (managementLinks.length) {
    groups.push({ label: "Management", icon: FolderCog, links: managementLinks });
  }

  return groups;
};
