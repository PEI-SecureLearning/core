import type { ReactNode } from "react";

interface SendingProfileStepSectionProps {
  readonly stepNumber: number;
  readonly title: string;
  readonly description: ReactNode;
  readonly children: ReactNode;
  readonly subtle?: boolean;
}

export default function SendingProfileStepSection({
  stepNumber,
  title,
  description,
  children
}: Readonly<SendingProfileStepSectionProps>) {
  return (
    <div className="space-y-4 h-full flex-col flex">
      <div className={`bg-surface border border-border rounded-lg px-5 py-4`}>
        <h3 className="text-sm font-semibold text-foreground">
          Step {stepNumber}: {title}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
