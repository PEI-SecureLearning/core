import { ChevronRight, User } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";

export function Navbar() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  // Derive the breadcrumb parts from the current path
  const parts = currentPath.split("/").filter(Boolean);

  // Turn "/campaigns/scheduled" → ["Campaigns", "Scheduled"]
  const formattedParts = parts.map(
    (p) => p.charAt(0).toUpperCase() + p.slice(1).replaceAll("-", " ")
  );

  return (
    <nav className="w-full border-b bg-white px-6 py-3 mx-auto">
      <div className="flex items-center justify-between">
        {/* Logo + Breadcrumb */}
        <div className="flex items-center space-x-3">
          {/* Brand */}
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-lg">Secure</span>
            <span className="font-semibold text-lg text-purple-600">
              Learning
            </span>
          </div>

          {/* Breadcrumb */}
          {formattedParts.length > 0 && (
            <>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <div className="flex items-center space-x-2 text-sm">
                {formattedParts.map((part, i) => (
                  <span
                    key={i}
                    className={`${
                      i === formattedParts.length - 1
                        ? "text-gray-500"
                        : "text-gray-700 hover:text-gray-900 font-medium cursor-pointer"
                    }`}
                  >
                    {part}
                    {i < formattedParts.length - 1 && (
                      <span className="text-gray-400 mx-2">/</span>
                    )}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* User Profile */}
        <button className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium">John Doe</span>
            <span className="text-xs text-gray-500">Admin</span>
          </div>
          <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
