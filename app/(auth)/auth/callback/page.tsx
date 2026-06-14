import { Suspense } from "react";

import { AuthNotice } from "@/components/auth/AuthNotice";
import { AuthCallbackClient } from "@/app/(auth)/auth/callback/AuthCallbackClient";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
          <div className="w-full max-w-md">
            <AuthNotice
              actionHref=""
              description="Estamos validando seu link seguro e preparando sua area do paciente."
              title="Validando acesso"
            />
          </div>
        </main>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
