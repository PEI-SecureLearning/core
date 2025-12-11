import { ChevronRight, User, LogOut } from "lucide-react";
import { useKeycloak } from "@react-keycloak/web";
import { useRouterState, Link } from "@tanstack/react-router";


export function Logo() {
  return (
    <div className="flex items-center space-x-1 sm:space-x-2">
      <span className="font-semibold text-sm sm:text-base lg:text-lg whitespace-nowrap">
        Secure
      </span>
      <span className="font-semibold text-sm sm:text-base lg:text-lg text-purple-600 whitespace-nowrap">
        Learning
      </span>
    </div>
  );
}



export function Navbar() {
  const routerState = useRouterState();
  const { keycloak } = useKeycloak();
  const currentPath = routerState.location.pathname;
  const BASE_URL = import.meta.env.VITE_WEB_URL;

  // Split the current path into parts (e.g. "/campaigns/new-campaign" → ["campaigns", "new-campaign"])
  const parts = currentPath.split("/").filter(Boolean);

  const handleLogout = async () => {
    try {
      await keycloak.logout({
        // This property corresponds to the post_logout_redirect_uri parameter.
        redirectUri: BASE_URL,
      });

      console.log('User has been successfully logged out and redirected.');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Create formatted breadcrumb names
  const formattedParts = parts.map((p) =>
    p
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.substring(1))
      .join(" ")
  );

  // Build breadcrumb paths cumulatively
  const breadcrumbPaths = parts.map(
    (_, i) => "/" + parts.slice(0, i + 1).join("/")
  );

  return (
    <nav className="h-[8%] py-2 w-full border-b bg-white rounded-xl">
      <div className="flex flex-row justify-between h-full mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex-1 flex items-center justify-between gap-2 lg:gap-4">
          {/* Logo/Brand with Breadcrumb */}
          <div className="flex items-center space-x-2 lg:space-x-3 min-w-0 flex-1">
            <Logo />

            {/* Dynamic Breadcrumb */}
            {formattedParts.length > 0 && (
              <>
                <ChevronRight className="hidden lg:block h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex items-center text-sm min-w-0">
                  {formattedParts.map((part, i) => {
                    const isLast = i === formattedParts.length - 1;
                    const path = breadcrumbPaths[i];
                    return (
                      <div key={i} className="flex items-center min-w-0">
                        {!isLast ? (
                          <Link
                            to={path}
                            className="text-gray-700 hover:text-gray-900 font-medium transition-colors truncate"
                          >
                            {part}
                          </Link>
                        ) : (
                          <span className="text-gray-500 truncate">{part}</span>
                        )}
                        {!isLast && (
                          <span className="text-gray-400 mx-2 flex-shrink-0">
                            /
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2">
            <button className="flex flex-row items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-md hover:bg-gray-100 transition-colors flex-shrink-0">
              {/* User info - hidden on small screens */}
              <div className="flex flex-col items-end">
                <span className="text-xs lg:text-sm font-medium whitespace-nowrap">
                  {keycloak.tokenParsed?.name || keycloak.tokenParsed?.preferred_username || 'User'}
                </span>
                <span className="text-[10px] lg:text-xs text-gray-500">
                  {keycloak.tokenParsed?.realm_access?.roles?.includes('admin') ? 'Admin' :
                    keycloak.tokenParsed?.realm_access?.roles?.includes('org_manager') ? 'Manager' : 'User'}
                </span>
              </div>
              {/* Avatar - always visible */}
              <div className="lg:h-10 lg:w-10 sm:h-8 sm:w-8 rounded-r rounded-l  bg-gray-700 flex items-center justify-center flex-shrink-0">
                <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
            </button>

            <button
              onClick={() => handleLogout()}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
