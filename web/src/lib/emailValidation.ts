export const EMAIL_MAX_LENGTH = 254;

function hasAsciiWhitespace(value: string): boolean {
  for (const char of value) {
    if (
      char === " " ||
      char === "\t" ||
      char === "\n" ||
      char === "\r" ||
      char === "\f" ||
      char === "\v"
    ) {
      return true;
    }
  }
  return false;
}

export function isValidEmail(value: string): boolean {
  const email = value.trim();

  if (!email || email.length > EMAIL_MAX_LENGTH) return false;
  if (hasAsciiWhitespace(email)) return false;

  const atIndex = email.indexOf("@");
  if (atIndex <= 0 || atIndex !== email.lastIndexOf("@")) return false;

  const localPart = email.slice(0, atIndex);
  const domainPart = email.slice(atIndex + 1);

  if (!localPart || localPart.length > 64 || !domainPart) return false;
  if (domainPart.startsWith(".") || domainPart.endsWith(".")) return false;
  if (domainPart.includes("..")) return false;

  const lastDot = domainPart.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === domainPart.length - 1) return false;

  return true;
}

export function getEmailDomain(value: string): string | null {
  const email = value.trim().toLowerCase();
  if (!isValidEmail(email)) return null;

  const atIndex = email.indexOf("@");
  return atIndex >= 0 ? email.slice(atIndex + 1) : null;
}
