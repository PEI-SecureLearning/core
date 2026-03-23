const DOMAIN_LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function normalizeTenantDomain(value: string): string {
  return value.trim().toLowerCase().replace(/^@/, "").replace(/^\*\./, "");
}

export function isValidTenantDomain(value: string): boolean {
  const domain = normalizeTenantDomain(value);

  if (!domain || domain.length > 253 || /\s/.test(domain) || domain.includes("..")) {
    return false;
  }

  const labels = domain.split(".");
  if (labels.length < 2) {
    return false;
  }

  return labels.every((label) => DOMAIN_LABEL_RE.test(label));
}
