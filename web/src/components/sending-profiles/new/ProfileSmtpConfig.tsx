import { memo } from "react";
import { Server, Lock, Loader2, CheckCircle, XCircle } from "lucide-react";

interface Props {
  host: string; setHost: (v: string) => void;
  port: number; setPort: (v: number) => void;
  username: string; setUsername: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  onTest?: () => void;
  isTesting?: boolean;
  testStatus?: string | null;
}

function ProfileSmtpConfig({ 
  host, setHost, 
  port, setPort, 
  username, setUsername, 
  password, setPassword,
  onTest,
  isTesting,
  testStatus,
}: Props) {
  const isValid = host && port && username && password;
  
  const isError =
    testStatus &&
    (testStatus.toLowerCase().includes("failed") ||
      testStatus.toLowerCase().includes("error") ||
      testStatus.toLowerCase().includes("invalid"));
  
  const isSuccess =
    testStatus &&
    !isError &&
    (testStatus.toLowerCase().includes("success") ||
      testStatus.toLowerCase().includes("valid"));

  return (
    <div className="liquid-glass-card p-6 relative z-10">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-gray-800 font-semibold flex items-center gap-2">
          <Server className="h-5 w-5 text-blue-500" />
          SMTP Server Details
        </h4>
        
        {onTest && (
          <button
            onClick={onTest}
            disabled={!isValid || isTesting || !!isSuccess}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all disabled:cursor-not-allowed ${
              isSuccess
                ? "border-2 border-green-500 text-green-700 bg-white"
                : isError
                ? "border-2 border-red-500 text-red-700 bg-white hover:bg-red-50"
                : "border-2 border-amber-500 text-amber-700 bg-white hover:bg-amber-50 disabled:opacity-50"
            }`}
            title={
              isSuccess 
                ? testStatus || "Test passed" 
                : isError 
                ? "Test failed - click to retry" 
                : "Test SMTP connection"
            }
          >
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : isSuccess ? (
              <>
                Test
                <CheckCircle className="h-4 w-4" />
              </>
            ) : isError ? (
              <>
                Test
                <XCircle className="h-4 w-4" />
              </>
            ) : (
              <>
                Test
              </>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Host *</label>
          <input
            type="text"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="smtp.provider.com"
            className="liquid-glass-input w-full px-4 py-2.5 text-gray-800 placeholder-gray-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Port *</label>
          <input
            type="number"
            value={port}
            onChange={(e) => setPort(Number(e.target.value))}
            className="liquid-glass-input w-full px-4 py-2.5 text-gray-800 placeholder-gray-400"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="liquid-glass-input w-full px-4 py-2.5 text-gray-800 placeholder-gray-400"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="liquid-glass-input w-full pl-10 pr-4 py-2.5 text-gray-800 placeholder-gray-400"
              autoComplete="new-password"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(ProfileSmtpConfig);