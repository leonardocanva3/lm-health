import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { ROUTES } from "@/lib/constants/routes";

type AuthNoticeProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function AuthNotice({
  actionHref = ROUTES.entrar,
  actionLabel = "Ir para login",
  description,
  title,
}: AuthNoticeProps) {
  return (
    <Card className="mx-auto max-w-xl text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-2xl">
        🔐
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      {actionHref ? (
        <Link
          className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
          href={actionHref}
        >
          {actionLabel}
        </Link>
      ) : null}
    </Card>
  );
}
