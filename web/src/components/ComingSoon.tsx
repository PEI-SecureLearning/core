import { ArrowLeft, Construction } from "lucide-react";
import { useRouter } from "@tanstack/react-router";

interface ComingSoonProps {
  readonly feature: string;
  readonly description?: string;
}

export function ComingSoon({ feature, description }: ComingSoonProps) {
  const router = useRouter();

  return (
    <div className="flex-1 flex items-center justify-center min-h-full py-16">
      <div className="max-w-sm w-full text-center px-6">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-purple-50 flex items-center justify-center">
            <Construction className="h-8 w-8 text-purple-700" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-2">{feature}</h2>
        <p className="text-gray-500 text-sm mb-8">
          {description ?? "This feature is currently under development and will be available soon."}
        </p>

        <button
          onClick={() => router.history.back()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium mx-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </button>
      </div>
    </div>
  );
}

export default ComingSoon;
