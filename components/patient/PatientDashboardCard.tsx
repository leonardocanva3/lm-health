import type { ReactNode } from "react";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

type PatientDashboardCardProps = {
  children: ReactNode;
  className?: string;
  description?: string;
  eyebrow?: string;
  title: string;
};

export function PatientDashboardCard({
  children,
  className,
  description,
  eyebrow,
  title,
}: PatientDashboardCardProps) {
  return (
    <Card className={cn("p-6", className)}>
      {eyebrow ? (
        <p className="text-sm font-medium text-emerald-800">{eyebrow}</p>
      ) : null}
      <h2 className="mt-2 text-xl font-semibold text-slate-950">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      ) : null}
      <div className="mt-5">{children}</div>
    </Card>
  );
}
