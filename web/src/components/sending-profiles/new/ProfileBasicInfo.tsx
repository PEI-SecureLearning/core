import { memo } from "react";
import { User, Mail } from "lucide-react";

interface Props {
  name: string;
  setName: (v: string) => void;
  fromFname: string;
  setFromFname: (v: string) => void;
  fromLname: string;
  setFromLname: (v: string) => void;
  fromEmail: string;
  setFromEmail: (v: string) => void;
}

function ProfileBasicInfo({
  name,
  setName,
  fromFname,
  setFromFname,
  fromLname,
  setFromLname,
  fromEmail,
  setFromEmail,
}: Props) {
  return (
    <div className="liquid-glass-card p-6 relative z-10">
      <h4 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
        <User className="h-5 w-5 text-blue-500" />
        Identity Configuration
      </h4>

      <div className="space-y-4">
        {/* Profile Name (Internal) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Internal Profile Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., IT Support - Phishing"
            className="liquid-glass-input w-full px-4 py-2.5 text-gray-800 placeholder-gray-400"
          />
        </div>

        {/* Sender Name Split */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sender First Name
            </label>
            <input
              type="text"
              value={fromFname}
              onChange={(e) => setFromFname(e.target.value)}
              placeholder="John"
              className="liquid-glass-input w-full px-4 py-2.5 text-gray-800 placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sender Last Name
            </label>
            <input
              type="text"
              value={fromLname}
              onChange={(e) => setFromLname(e.target.value)}
              placeholder="Doe"
              className="liquid-glass-input w-full px-4 py-2.5 text-gray-800 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Sender Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sender Email Address *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
            <input
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="security@updates.com"
              className="liquid-glass-input w-full pl-10 pr-4 py-2.5 text-gray-800 placeholder-gray-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(ProfileBasicInfo);
