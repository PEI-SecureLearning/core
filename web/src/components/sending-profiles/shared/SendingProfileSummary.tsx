import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { CustomHeader } from "@/types/sendingProfile";

interface SendingProfileSummaryProps {
  readonly name: string;
  readonly fname: string;
  readonly lname: string;
  readonly fromEmail: string;
  readonly smtpHost: string;
  readonly smtpPort: number;
  readonly customHeaders: CustomHeader[];
}

export default function SendingProfileSummary({
  name,
  fname,
  lname,
  fromEmail,
  smtpHost,
  smtpPort,
  customHeaders
}: Readonly<SendingProfileSummaryProps>) {
  const [headersOpen, setHeadersOpen] = useState(false);
  const initial = (name?.trim().charAt(0) || "?").toUpperCase();
  const senderName = [fname, lname].filter(Boolean).join(" ") || "-";

  return (
    <Card className="bg-surface border-border overflow-hidden gap-0 py-0">
      <CardHeader className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="h-10 w-10 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Sending Profile
          </p>
          <h4 className="text-foreground font-semibold truncate">{name || "-"}</h4>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            From
          </p>
          <p className="mt-1 text-sm text-foreground break-all">
            <span className="font-medium">{senderName}</span>
            <span className="text-muted-foreground"> {"<"}</span>
            <span className="font-medium">{fromEmail || "-"}</span>
            <span className="text-muted-foreground">{">"}</span>
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            SMTP Server
          </p>
          <p className="mt-1 text-sm text-foreground break-all">
            {smtpHost || "-"}:{smtpPort}
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setHeadersOpen((prev) => !prev)}
            className="flex w-full items-center justify-between gap-2 text-left"
            aria-expanded={headersOpen}
          >
            <div className="flex items-center gap-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Custom Headers
              </p>
              <span className="px-2 py-0.5 text-[10px] uppercase bg-muted rounded-full text-muted-foreground">
                {customHeaders.length}
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-primary transition-transform duration-300 ${headersOpen ? "rotate-180" : "rotate-0"}`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${headersOpen ? "max-h-80 opacity-100 mt-2" : "max-h-0 opacity-0"
              }`}
          >
            <div className="rounded-md bg-muted/35 px-3 py-2 border-dashed border">
              {customHeaders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No custom headers configured.
                </p>
              ) : (
                <ul className="list-none pl-0 space-y-1 text-sm text-foreground">
                  {customHeaders.map((header, index) => (
                    <li
                      key={`${header.name}-${index}`}
                      className="break-all font-mono flex items-start gap-2"
                    >
                      <span className="text-muted-foreground">-</span>
                      <span>
                        <span className="font-medium">{header.name}:</span>{" "}
                        <span>{header.value}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
