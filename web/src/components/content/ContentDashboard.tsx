import { FileText, ShieldCheck } from "lucide-react";
import { useKeycloak } from "@react-keycloak/web";

export function ContentDashboard() {
  const { keycloak } = useKeycloak();
  const roles = keycloak.tokenParsed?.realm_access?.roles || [];
  const hasContentRole = roles.includes("content_manager");

  if (!hasContentRole) {
    return (
      <div className="min-h-full w-full bg-gray-50/50 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900">Content Area</h1>
          <p className="mt-3 text-gray-600">
            You do not have permission to access this section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full bg-gray-50/50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Content Manager
            </h1>
          </div>
          <p className="mt-3 text-gray-600">
            Basic content-manager page is active. Your Keycloak role and route wiring are working.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 text-gray-800 font-semibold">
            <FileText className="w-4 h-4" />
            Content Tools (Placeholder)
          </div>
          <p className="mt-2 text-gray-600 text-sm">
            Next step: add real content-management features here.
          </p>
        </div>
      </div>
    </div>
  );
}

