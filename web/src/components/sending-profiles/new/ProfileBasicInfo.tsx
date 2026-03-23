import { memo } from "react";
import { Mail } from "lucide-react";

import FormTooltip from "@/components/shared/FormTooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidEmail } from "@/lib/emailValidation";
import RequiredAsterisk from "@/components/shared/RequiredAsterisk";

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
  setFromEmail
}: Readonly<Props>) {
  const isEmailInvalid = !!fromEmail && !isValidEmail(fromEmail);
  const isNameValid = name.trim().length > 0;


  return (
    <div className="bg-surface border border-border rounded-lg py-6 px-6">
      <div className="flex flex-col gap-10">
        <div>
          <Label
            htmlFor="profile-name"
            className="block text-sm font-medium text-foreground/90 mb-1"
          >
            Profile Name <RequiredAsterisk isValid={isNameValid} />
          </Label>
          <Input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., IT Support - Phishing"
            className="w-full h-10 rounded-md bg-surface-subtle border-border text-foreground placeholder:text-muted-foreground/60"
          />
        </div>

        <div>
          <Label
            htmlFor="sender-email"
            className="flex items-center gap-1.5 text-sm font-medium text-foreground/90 mb-1"
          >
            Sender Email Address <RequiredAsterisk isValid={!isEmailInvalid} />
            <FormTooltip
              side="right"
              content={[
                "This email will appear as the sender address in simulation emails.",
                "Use a convincing domain to improve campaign realism."
              ]}
            />
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-accent-secondary" />
            <Input
              id="sender-email"
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="security@updates.com"
              aria-invalid={isEmailInvalid}
              className="w-full h-10 pl-10 rounded-md bg-surface-subtle border-border text-foreground placeholder:text-muted-foreground/60"
            />
          </div>
          {isEmailInvalid && (
            <p className="text-xs text-destructive mt-1">
              Please enter a valid email address.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label
              htmlFor="sender-first-name"
              className="block text-sm font-medium text-foreground/90 mb-1"
            >
              Sender First Name
            </Label>
            <Input
              id="sender-first-name"
              type="text"
              value={fromFname}
              onChange={(e) => setFromFname(e.target.value)}
              placeholder="John"
              className="w-full h-10 rounded-md bg-surface-subtle border-border text-foreground placeholder:text-muted-foreground/60"
            />
          </div>
          <div>
            <Label
              htmlFor="sender-last-name"
              className="block text-sm font-medium text-foreground/90 mb-1"
            >
              Sender Last Name
            </Label>
            <Input
              id="sender-last-name"
              type="text"
              value={fromLname}
              onChange={(e) => setFromLname(e.target.value)}
              placeholder="Doe"
              className="w-full h-10 rounded-md bg-surface-subtle border-border text-foreground placeholder:text-muted-foreground/60"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(ProfileBasicInfo);
