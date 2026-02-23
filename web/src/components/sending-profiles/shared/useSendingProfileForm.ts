import { useState, useCallback, useMemo, useEffect } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { toast } from "sonner";

import { testSendingProfileConfiguration } from "@/services/sendingProfilesApi";
import type { CustomHeader, SendingProfileCreate } from "@/types/sendingProfile";

// ---------------------------------------------------------------------------
// Hook: useSendingProfileForm
// Encapsulates all shared state and logic for create & edit pages.
// ---------------------------------------------------------------------------

export function useSendingProfileForm() {
  const { keycloak } = useKeycloak();

  // Derive realm from JWT once
  const realm = useMemo<string>(() => {
    const iss = (keycloak.tokenParsed as { iss?: string } | undefined)?.iss;
    if (!iss) return "";
    return iss.split("/realms/")[1] ?? "";
  }, [keycloak.tokenParsed]);

  // ── Form fields ─────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [fromFname, setFromFname] = useState("");
  const [fromLname, setFromLname] = useState("");
  const [fromEmail, setFromEmail] = useState("");

  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState<number>(587);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [customHeaders, setCustomHeaders] = useState<CustomHeader[]>([]);

  // ── Operation state ──────────────────────────────────────────────────────
  const [status, setStatus] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testPassed, setTestPassed] = useState(false);

  // ── Auto-reset test when SMTP credentials change ─────────────────────────
  useEffect(() => {
    if (testPassed) {
      setTestPassed(false);
      setTestStatus(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [smtpHost, smtpPort, username, password]);

  // ── Header handlers ──────────────────────────────────────────────────────
  const addHeader = useCallback((header: CustomHeader) => {
    setCustomHeaders((prev) => [...prev, header]);
  }, []);

  const removeHeader = useCallback((index: number) => {
    setCustomHeaders((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ── Build API payload (single source of truth) ───────────────────────────
  const buildPayload = useCallback((): SendingProfileCreate => ({
    name,
    from_fname: fromFname,
    from_lname: fromLname,
    from_email: fromEmail,
    smtp_host: smtpHost,
    smtp_port: smtpPort,
    username,
    password,
    custom_headers: customHeaders.map(({ name: n, value: v }) => ({ name: n, value: v })),
  }), [name, fromFname, fromLname, fromEmail, smtpHost, smtpPort, username, password, customHeaders]);

  // ── Test SMTP configuration ──────────────────────────────────────────────
  const handleTest = useCallback(async () => {
    if (!realm) {
      toast.error("Could not determine Realm. Are you logged in?");
      return;
    }
    if (!name || !fromEmail || !smtpHost || !username || !password) {
      toast.error("Please fill in all required fields before testing.");
      return;
    }

    setIsTesting(true);
    setTestStatus(null);
    setTestPassed(false);

    try {
      const result = await testSendingProfileConfiguration(buildPayload(), keycloak.token);
      setTestStatus(result.message);
      setTestPassed(true);
    } catch (err: unknown) {
      const message = err instanceof Error
        ? err.message
        : "Failed to test configuration. Check SMTP settings.";
      toast.error(message);
      setTestStatus(message);
      setTestPassed(false);
    } finally {
      setIsTesting(false);
    }
  }, [realm, name, fromEmail, smtpHost, username, password, buildPayload, keycloak.token]);

  // ── Derived validation ───────────────────────────────────────────────────
  const isBasicValid = !!name && !!fromEmail && !!smtpHost && !!username;
  const isFullyValid = isBasicValid && !!password;

  return {
    // Token / realm
    realm,
    keycloak,

    // Basic info
    name, setName,
    fromFname, setFromFname,
    fromLname, setFromLname,
    fromEmail, setFromEmail,

    // SMTP
    smtpHost, setSmtpHost,
    smtpPort, setSmtpPort,
    username, setUsername,
    password, setPassword,

    // Headers
    customHeaders, setCustomHeaders,
    addHeader, removeHeader,

    // Operation state
    status, setStatus,
    testStatus,
    isLoading, setIsLoading,
    isTesting,
    testPassed, setTestPassed,

    // Actions
    buildPayload,
    handleTest,

    // Derived
    isBasicValid,
    isFullyValid,
  };
}
