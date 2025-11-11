import { ChevronRight, User } from "lucide-react";
import { useRouterState, Link } from "@tanstack/react-router";

export function Navbar() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  // Split the current path into parts (e.g. "/campaigns/new-campaign" → ["campaigns", "new-campaign"])
  const parts = currentPath.split("/").filter(Boolean);

  // Create formatted breadcrumb names
  const formattedParts = parts.map(
    (p) => p.charAt(0).toUpperCase() + p.slice(1).replaceAll("-", " ")
  );

  // Build breadcrumb paths cumulatively
  const breadcrumbPaths = parts.map(
    (_, i) => "/" + parts.slice(0, i + 1).join("/")
  );

  return (
    <nav className="w-full border-b bg-white px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Brand + Breadcrumb */}
        <div className="flex items-center space-x-3">
          {/* Logo */}
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
              <div className="flex items-center text-sm">
                {formattedParts.map((part, i) => {
                  const isLast = i === formattedParts.length - 1;
                  const path = breadcrumbPaths[i];
                  return (
                    <div key={i} className="flex items-center">
                      {!isLast ? (
                        <Link
                          to={path}
                          className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                        >
                          {part}
                        </Link>
                      ) : (
                        <span className="text-gray-500">{part}</span>
                      )}
                      {!isLast && <span className="text-gray-400 mx-2">/</span>}
                    </div>
                  );
                })}
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
