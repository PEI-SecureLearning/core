import { useEffect, useMemo, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/tenants-org-manager")({
  component: TenantOrgManager,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

function extractRealmFromToken(iss?: string) {
  if (!iss) return null;
  const parts = iss.split("/realms/");
  return parts[1] ?? null;
}

function extractDomainFromClaims(claims?: { email?: string; preferred_username?: string }) {
  const candidate = claims?.email || claims?.preferred_username;
  if (!candidate || !candidate.includes("@")) return null;
  return candidate.split("@")[1];
}

function TenantOrgManager() {
  const { keycloak } = useKeycloak();
  const [realm, setRealm] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const tokenRealm = useMemo(
    () => extractRealmFromToken((keycloak.tokenParsed as { iss?: string } | undefined)?.iss),
    [keycloak.tokenParsed]
  );
  const tokenDomain = useMemo(
    () => {
      // Try access token first, then ID token in case email is only there.
      const fromAccess = extractDomainFromClaims(
        keycloak.tokenParsed as { email?: string; preferred_username?: string } | undefined
      );
      if (fromAccess) return fromAccess;
      return extractDomainFromClaims(
        keycloak.idTokenParsed as { email?: string; preferred_username?: string } | undefined
      );
    },
    [keycloak.tokenParsed, keycloak.idTokenParsed]
  );

  useEffect(() => {
    // If we already know the realm from the token, prime the UI so the form is usable.
    if (tokenRealm && !realm) {
      setRealm(tokenRealm);
      setStatus((prev) => prev ?? `Realm pre-filled from token: ${tokenRealm}`);
    }
  }, [tokenRealm, realm]);

  useEffect(() => {
    // On mount/when token changes, auto-lookup realm using the org manager's email domain.
    const doLookup = async () => {
      // If token already has the realm, don't override it with domain lookup.
      if (tokenRealm) return;
      if (!tokenDomain || !keycloak.authenticated) return;
      setStatus("Detecting realm from your domain...");
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/realms?domain=${encodeURIComponent(tokenDomain)}`, {
          headers: {
            Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
          },
        });
        if (!res.ok) {
          throw new Error(`Lookup failed: ${res.statusText}`);
        }
        const data = await res.json();
        setRealm(data.realm);
        setStatus(`Realm locked to ${data.realm}.`);
      } catch (err) {
        console.error(err);
        setRealm("");
        setStatus("Could not resolve your realm from domain. Contact an admin.");
      } finally {
        setIsLoading(false);
      }
    };
    doLookup();
  }, [tokenDomain, tokenRealm, keycloak.authenticated, keycloak.token]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetRealm = tokenRealm || realm || "";
    if (!targetRealm) {
      setStatus("Realm not resolved from token or domain. Cannot add users.");
      return;
    }
    if (!name || !email || !role) {
      setStatus("Name, email, and role are required to create a user.");
      return;
    }
    setStatus(null);
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/realms/users`, {
        method: "POST",
        headers: {
          Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ realm: targetRealm, username, name, email, role }),
      });
      if (!res.ok) {
        let message = res.statusText;
        try {
          const data = await res.json();
          message = data?.detail || JSON.stringify(data);
        } catch {
          const text = await res.text();
          if (text) message = text;
        }
        throw new Error(`HTTP ${res.status}: ${message || "Unknown error"}`);
      }
      const data = await res.json();
      setStatus(
        `User ${username} added to realm ${targetRealm}. Temporary password (one-time): ${data?.temporary_password ?? "N/A"}`
      );
      setUsername("");
      setName("");
      setEmail("");
      setRole("");
    } catch (err) {
      console.error(err);
      setStatus(err instanceof Error ? err.message : "Failed to add user.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full p-6 flex flex-col gap-6 overflow-y-auto">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Tenant Manager</h1>
        <p className="text-sm text-gray-600">
          You are limited to your tenant realm as determined by your Keycloak domain.
        </p>
      </div>

      <Card className="shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg">Add User to Realm</CardTitle>
          <CardDescription>
            Create a Keycloak user within your tenant realm. Realm is locked to your domain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleAddUser}>
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="New User"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="new.user"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                placeholder="user / manager / admin"
              />
            </div>
            <Button type="submit" disabled={isLoading || (!tokenRealm && !realm)} className="w-full">
              {isLoading ? "Saving..." : tokenRealm || realm ? "Add user" : "Realm not resolved"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {status && (
        <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          {status}
        </div>
      )}
    </div>
  );
}
