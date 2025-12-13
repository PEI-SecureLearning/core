import { memo } from "react";
import { Server, Lock } from "lucide-react";

interface Props {
  host: string; setHost: (v: string) => void;
  port: number; setPort: (v: number) => void;
  username: string; setUsername: (v: string) => void;
  password: string; setPassword: (v: string) => void;
}

function ProfileSmtpConfig({ host, setHost, port, setPort, username, setUsername, password, setPassword }: Props) {
  return (
    <div className="liquid-glass-card p-6 relative z-10">
      <h4 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
        <Server className="h-5 w-5 text-blue-500" />
        SMTP Server Details
      </h4>

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