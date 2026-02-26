import { memo } from "react";
import type { ReactElement } from "react";
import { Server, Lock, Loader2, CheckCircle, XCircle } from "lucide-react";

interface Props {
  readonly host: string;
  readonly setHost: (v: string) => void;
  readonly port: number;
  readonly setPort: (v: number) => void;
  readonly username: string;
  readonly setUsername: (v: string) => void;
  readonly password: string;
  readonly setPassword: (v: string) => void;
  readonly onTest?: () => void;
  readonly isTesting?: boolean;
  readonly testStatus?: string | null;
}

type ButtonState = 'success' | 'error' | 'default' | 'testing';

interface ButtonStateConfig {
  className: string;
  title: string;
  icon?: ReactElement;
}

const BUTTON_BASE_CLASSES = "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all disabled:cursor-not-allowed";
const BORDER_BASE = "border-2 bg-white";

const BUTTON_STATES: Record<ButtonState, ButtonStateConfig> = {
  success: {
    className: `${BORDER_BASE} border-green-500 text-green-700`,
    title: "Test passed",
    icon: <CheckCircle className="h-4 w-4" />,
  },
  error: {
    className: `${BORDER_BASE} border-red-500 text-red-700 hover:bg-red-50`,
    title: "Test failed - click to retry",
    icon: <XCircle className="h-4 w-4" />,
  },
  testing: {
    className: `${BORDER_BASE} border-amber-500 text-amber-700`,
    title: "Testing connection",
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
  },
  default: {
    className: `${BORDER_BASE} border-amber-500 text-amber-700 hover:bg-amber-50 disabled:opacity-50`,
    title: "Test SMTP connection",
  },
};

const getButtonState = (
  isTesting: boolean | undefined,
  isError: boolean,
  isSuccess: boolean
): ButtonState => {
  if (isTesting) return 'testing';
  if (isSuccess) return 'success';
  if (isError) return 'error';
  return 'default';
};

const isErrorStatus = (status: string | null | undefined): boolean => {
  if (!status) return false;
  const lowerStatus = status.toLowerCase();
  return lowerStatus.includes("failed") || 
         lowerStatus.includes("error") || 
         lowerStatus.includes("invalid");
};

const isSuccessStatus = (status: string | null | undefined, isError: boolean): boolean => {
  if (!status || isError) return false;
  const lowerStatus = status.toLowerCase();
  return lowerStatus.includes("success") || lowerStatus.includes("valid");
};

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
  const isError = isErrorStatus(testStatus);
  const isSuccess = isSuccessStatus(testStatus, isError);
  
  const buttonState = getButtonState(isTesting, isError, isSuccess);
  const config = BUTTON_STATES[buttonState];
  const buttonTitle = isSuccess && testStatus ? testStatus : config.title;

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
            disabled={!isValid || isTesting || isSuccess}
            className={`${BUTTON_BASE_CLASSES} ${config.className}`}
            title={buttonTitle}
          >
            {buttonState === 'testing' ? (
              <>
                {config.icon}
                Testing...
              </>
            ) : (
              <>
                Test
                {config.icon}
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