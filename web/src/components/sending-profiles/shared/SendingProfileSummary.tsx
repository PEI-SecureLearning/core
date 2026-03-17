interface SendingProfileSummaryProps {
  readonly name: string;
  readonly fromEmail: string;
  readonly smtpHost: string;
  readonly smtpPort: number;
  readonly customHeadersCount: number;
  readonly testResultText: string;
  readonly testResultColor: string;
}

export default function SendingProfileSummary({
  name,
  fromEmail,
  smtpHost,
  smtpPort,
  customHeadersCount,
  testResultText,
  testResultColor
}: Readonly<SendingProfileSummaryProps>) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 space-y-3">
      <h4 className="text-foreground font-semibold">Summary</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Profile Name</p>
          <p className="text-foreground font-medium break-all">{name || "-"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Sender Email</p>
          <p className="text-foreground font-medium break-all">
            {fromEmail || "-"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">SMTP Host</p>
          <p className="text-foreground font-medium break-all">
            {smtpHost || "-"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">SMTP Port</p>
          <p className="text-foreground font-medium">{smtpPort}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-muted-foreground">SMTP Test Result</p>
          <p className={`font-medium ${testResultColor}`}>{testResultText}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Custom Headers</p>
          <p className="text-foreground font-medium">{customHeadersCount}</p>
        </div>
      </div>
    </div>
  );
}
