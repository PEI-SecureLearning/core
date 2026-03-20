import { memo, useState } from "react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FormTooltip from "@/components/shared/FormTooltip";
import RequiredAsterisk from "@/components/shared/RequiredAsterisk";

interface Props {
  readonly host: string;
  readonly setHost: (v: string) => void;
  readonly port: number;
  readonly setPort: (v: number) => void;
  readonly username: string;
  readonly setUsername: (v: string) => void;
  readonly password: string;
  readonly setPassword: (v: string) => void;
  readonly isTesting?: boolean;
  readonly testStatus?: string | null;
  readonly smtpConfigChanged?: boolean;
}

function ProfileSmtpConfig({
  host,
  setHost,
  port,
  setPort,
  username,
  setUsername,
  password,
  setPassword,
  isTesting = false,
  testStatus,
  smtpConfigChanged = true
}: Props) {
  const [showPassword, setShowPassword] = useState(false);

  const isHostValid = host.trim().length > 0;
  const isPortValid = Number.isFinite(port) && port > 0;
  const isUsernameValid = username.trim().length > 0;
  const isPasswordRequired = smtpConfigChanged;
  const isPasswordValid = !isPasswordRequired || password.trim().length > 0;

  const isTestFailed =
    !!testStatus && /(failed|error|invalid)/i.test(testStatus);
  const isTestSuccess =
    !!testStatus && !isTestFailed && /(success|valid|passed)/i.test(testStatus);

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h4 className="text-foreground font-semibold flex items-center gap-2">
          SMTP Server Details
        </h4>
        {isTesting && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <Loader2 className="size-5 animate-spin" />
          </div>
        )}
        {isTestSuccess && (
          <FormTooltip side="left" content={["SMTP configuration is valid"]}>
            <div className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle2 className="size-5" />
            </div>
          </FormTooltip>
        )}
        {isTestFailed && (
          <FormTooltip
            side="left"
            content={[testStatus || "Test failed"]}
            variant="error"
          >
            <div className="flex items-center gap-2 text-sm text-red-600 ">
              <XCircle className="size-5" />
            </div>
          </FormTooltip>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-2">
          <Label
            htmlFor="smtp-host"
            className="text-sm font-medium text-foreground/90 mb-1 flex items-center gap-1.5"
          >
            Host <RequiredAsterisk isValid={isHostValid} />
            <FormTooltip
              side="right"
              content={["SMTP server host used to send simulation emails."]}
            />
          </Label>
          <Input
            id="smtp-host"
            type="text"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="smtp.provider.com"
            className="w-full h-10 rounded-md bg-surface-subtle border-border text-foreground placeholder:text-muted-foreground/60"
          />
        </div>
        <div>
          <Label
            htmlFor="smtp-port"
            className="text-sm font-medium text-foreground/90 mb-1 flex items-center gap-1.5"
          >
            Port <RequiredAsterisk isValid={isPortValid} />
            <FormTooltip
              side="right"
              content={["SMTP port provided by your mail provider."]}
            />
          </Label>
          <Input
            id="smtp-port"
            type="number"
            value={port}
            onChange={(e) => setPort(Number(e.target.value))}
            className="w-full h-10 rounded-md bg-surface-subtle border-border text-foreground placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label
            htmlFor="smtp-username"
            className="text-sm font-medium text-foreground/90 mb-1 flex items-center gap-1.5"
          >
            Username <RequiredAsterisk isValid={isUsernameValid} />
            <FormTooltip
              side="right"
              content={["Username used to authenticate with the SMTP server."]}
            />
          </Label>
          <Input
            id="smtp-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full h-10 rounded-md bg-surface-subtle border-border text-foreground placeholder:text-muted-foreground/60"
            autoComplete="off"
          />
        </div>
        <div>
          <Label
            htmlFor="smtp-password"
            className="text-sm font-medium text-foreground/90 mb-1 flex items-center gap-1.5"
          >
            Password
            {isPasswordRequired && (
              <RequiredAsterisk isValid={isPasswordValid} />
            )}
            <FormTooltip
              side="right"
              content={["Password used to authenticate with the SMTP server."]}
            />
          </Label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/80 hover:text-primary transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
            <Input
              id="smtp-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 pl-9 rounded-md bg-surface-subtle border-border text-foreground placeholder:text-muted-foreground/60"
              autoComplete="new-password"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(ProfileSmtpConfig);
