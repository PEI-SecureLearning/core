import { ChevronRight, User, LogOut } from "lucide-react";
import { useKeycloak } from "@react-keycloak/web";
import { useRouterState, Link } from "@tanstack/react-router";
import "../css/navbar.css";

export function Logo() {
  return (
    <div className="flex items-center gap-2 space-x-1 sm:space-x-2 -translate-x-4 -translate-y-1">
      <img
        src="/Hatlogo.png"
        alt="Logo"
        className="size-14 ml-4 sm:ml-2 lg:ml-0"
      />

      <div className="hidden sm:flex flex-col">
        <span className="font-bold text-foreground text-sm sm:text-base lg:text-2xl z-10 translate-y-3 -translate-x-2">
          Secure
        </span>
        <span className="font-bold text-sm sm:text-base lg:text-xl text-primary z-10 translate-x-3">
          Learning
        </span>
      </div>
    </div>
  );
}

export function Navbar() {
  const routerState = useRouterState();
  const { keycloak } = useKeycloak();
  const currentPath = routerState.location.pathname;
  const baseUrl = import.meta.env.VITE_WEB_URL || globalThis.location.origin + "/app";

  const parts = currentPath.split("/").filter(Boolean);

  const handleLogout = async () => {
    try {
      await keycloak.logout({
        redirectUri: baseUrl
      });

      console.log("User has been successfully logged out and redirected.");
    } catch (error) {
      console.error("Logout failed:", error);
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
    <nav className="h-[8%] py-2 w-full border-b border-border bg-background">
      <div className="flex flex-row justify-between h-full mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex-1 flex items-center justify-between gap-2 lg:gap-4">
          {/* Logo/Brand with Breadcrumb */}
          <div className="flex items-center space-x-2 lg:space-x-3 min-w-0 flex-1">
            <Logo />

            {/* Dynamic Breadcrumb */}
            {formattedParts.length > 0 && (
              <>
                <ChevronRight className="hidden lg:block h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex items-center text-sm min-w-0">
                  {formattedParts.map((part, i) => {
                    const isLast = i === formattedParts.length - 1;
                    const path = breadcrumbPaths[i];
                    return (
                      <div key={part} className="flex items-center min-w-0">
                        {!isLast ? (
                          <Link
                            to={path}
                            className="text-foreground hover:text-foreground/80 font-medium transition-colors truncate"
                          >
                            {part}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground truncate">
                            {part}
                          </span>
                        )}
                        {!isLast && (
                          <span className="text-muted-foreground mx-2 shrink-0">
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
            <button className="flex flex-row items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-md hover:bg-muted transition-colors shrink-0 cursor-pointer">
              {/* User info */}
              <div className="flex flex-col items-end">
                <span className="text-xs lg:text-sm font-medium whitespace-nowrap">
                  {keycloak.tokenParsed?.name ||
                    keycloak.tokenParsed?.preferred_username ||
                    "User"}
                </span>
                <span className="text-[10px] lg:text-xs text-muted-foreground">
                  {keycloak.tokenParsed?.realm_access?.roles?.includes("admin")
                    ? "Admin"
                    : keycloak.tokenParsed?.realm_access?.roles?.includes(
                          "org_manager"
                        )
                      ? "Manager"
                      : "User"}
                </span>
              </div>
              {/* Avatar */}
              <div className="lg:h-10 lg:w-10 sm:h-8 sm:w-8 rounded-r rounded-l bg-foreground flex items-center justify-center shrink-0">
                <User className="h-3 w-3 sm:h-4 sm:w-4 text-background" />
              </div>
            </button>

            <button
              onClick={() => handleLogout()}
              className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors cursor-pointer"
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
