import type { CampaignUserSending } from "@/services/campaignsApi";

// ─── Badge / role helpers ────────────────────────────────────────────────────

export const getStatusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "sent":
      return "secondary";
    case "opened":
      return "outline";
    case "clicked":
    case "phished":
      return "destructive";
    default:
      return "outline";
  }
};

export const formatRoleLabel = (role?: string | null) => {
  if (!role) {
    return "Not set";
  }

  const normalizedRole = role.toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");

  if (normalizedRole === "org_manager") {
    return "Org Manager";
  }

  if (normalizedRole === "user") {
    return "User";
  }

  return role
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

export const getRoleBadgeVariantProps = (
  role?: string | null,
): { variant: "outline" | "secondary"; className?: string } => {
  if (!role) return { variant: "outline" };

  const normalizedRole = role.toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");

  if (normalizedRole === "org_manager") {
    return {
      variant: "secondary",
      className: "border-violet-500/20 bg-violet-500 text-white hover:bg-violet-500/90",
    };
  }

  if (normalizedRole === "user") {
    return { variant: "outline" };
  }

  return { variant: "secondary" };
};

// ─── Date helpers ────────────────────────────────────────────────────────────

export const getMostRecentStatusDate = (sending: CampaignUserSending): string => {
  const candidates = [sending.phished_at, sending.clicked_at, sending.opened_at, sending.sent_at]
    .filter((value): value is string => Boolean(value))
    .map((value) => ({
      value,
      time: new Date(value).getTime(),
    }))
    .filter((entry) => !Number.isNaN(entry.time));

  if (candidates.length === 0) {
    return "-";
  }

  const mostRecent = candidates.reduce(
    (latest, current) => (current.time > latest.time ? current : latest),
    candidates[0],
  );
  return new Date(mostRecent.value).toLocaleDateString();
};

export const formatCertificateDate = (date: string): string => {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleDateString();
};

// ─── Detail value renderer ───────────────────────────────────────────────────

export type DetailRowValue = string | number | boolean | null | undefined;

export interface DetailRow {
  label: string;
  value: DetailRowValue;
}
