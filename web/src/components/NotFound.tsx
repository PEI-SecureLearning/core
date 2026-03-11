import { Link } from "@tanstack/react-router";
import { Home, SearchX } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-full py-16">
      <div className="max-w-sm w-full text-center px-6">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-purple-50 flex items-center justify-center">
            <SearchX className="h-8 w-8 text-purple-700" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-2">Page not found</h2>
        <p className="text-gray-500 text-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link
          to="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-purple-700 text-white hover:bg-purple-800 transition-colors text-sm font-medium mx-auto w-fit"
        >
          <Home className="h-4 w-4" />
          Go home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
