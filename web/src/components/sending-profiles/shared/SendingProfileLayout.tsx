import type { ReactNode } from "react";

import ProfileBasicInfo from "@/components/sending-profiles/new/ProfileBasicInfo";
import ProfileSmtpConfig from "@/components/sending-profiles/new/ProfileSmtpConfig";
import CustomHeadersSection from "@/components/sending-profiles/new/CustomHeadersSection";
import ProfilePreview from "@/components/sending-profiles/new/ProfilePreview";
import type { CustomHeader } from "@/types/sendingProfile";

interface Props {
  // Header
  title: string;
  subtitle: string;

  // Basic info
  name: string;
  setName: (v: string) => void;
  fromFname: string;
  setFromFname: (v: string) => void;
  fromLname: string;
  setFromLname: (v: string) => void;
  fromEmail: string;
  setFromEmail: (v: string) => void;

  // SMTP
  smtpHost: string;
  setSmtpHost: (v: string) => void;
  smtpPort: number;
  setSmtpPort: (v: number) => void;
  username: string;
  setUsername: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  onTest: () => void;
  isTesting: boolean;
  testStatus: string | null;

  // Headers
  customHeaders: CustomHeader[];
  onAddHeader: (h: CustomHeader) => void;
  onRemoveHeader: (index: number) => void;

  // Footer slot
  footer: ReactNode;
}

export default function SendingProfileLayout({
  title,
  subtitle,
  name, setName,
  fromFname, setFromFname,
  fromLname, setFromLname,
  fromEmail, setFromEmail,
  smtpHost, setSmtpHost,
  smtpPort, setSmtpPort,
  username, setUsername,
  password, setPassword,
  onTest, isTesting, testStatus,
  customHeaders, onAddHeader, onRemoveHeader,
  footer,
}: Props) {
  return (
    <div className="liquid-glass-container h-full w-full animate-fade-in relative overflow-hidden">
      {/* Background blobs */}
      <div className="liquid-blob liquid-blob-1 bg-blue-400" />
      <div className="liquid-blob liquid-blob-2 bg-indigo-400" />
      <div className="liquid-blob liquid-blob-3 bg-cyan-400" />

      {/* Header */}
      <div className="liquid-glass-header flex-shrink-0 border-b border-white/20 py-3 px-6 animate-slide-down">
        <h3 className="text-xl font-semibold text-gray-800 tracking-tight">{title}</h3>
        <h2 className="text-sm font-medium text-gray-600">{subtitle}</h2>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0 overflow-hidden">
        {/* Left column: forms */}
        <div className="h-full w-full lg:w-[65%] purple-scrollbar overflow-y-auto pr-2 space-y-5">
          <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <ProfileBasicInfo
              name={name}
              setName={setName}
              fromFname={fromFname}
              setFromFname={setFromFname}
              fromLname={fromLname}
              setFromLname={setFromLname}
              fromEmail={fromEmail}
              setFromEmail={setFromEmail}
            />
          </div>

          <div className="animate-slide-up" style={{ animationDelay: "0.15s" }}>
            <ProfileSmtpConfig
              host={smtpHost}
              setHost={setSmtpHost}
              port={smtpPort}
              setPort={setSmtpPort}
              username={username}
              setUsername={setUsername}
              password={password}
              setPassword={setPassword}
              onTest={onTest}
              isTesting={isTesting}
              testStatus={testStatus}
            />
          </div>

          <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <CustomHeadersSection
              headers={customHeaders}
              onAddHeader={onAddHeader}
              onRemoveHeader={onRemoveHeader}
            />
          </div>
        </div>

        {/* Right column: preview */}
        <div
          className="h-full w-full lg:w-[35%] animate-slide-left overflow-hidden"
          style={{ animationDelay: "0.1s" }}
        >
          <ProfilePreview
            name={name}
            fromEmail={fromEmail}
            smtpHost={smtpHost}
            smtpPort={smtpPort}
            headerCount={customHeaders.length}
          />
        </div>
      </div>

      {/* Footer slot */}
      <div
        className="liquid-glass-footer flex-shrink-0 border-t border-white/20 py-4 animate-slide-up"
        style={{ animationDelay: "0.2s" }}
      >
        {footer}
      </div>
    </div>
  );
}
