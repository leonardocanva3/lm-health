"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthNotice } from "@/components/auth/AuthNotice";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/paciente";
  }

  return value;
}

function getImplicitSessionParams(hash: string) {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
  };
}

export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const nextPath = useMemo(
    () => getSafeNextPath(searchParams.get("next")),
    [searchParams],
  );

  useEffect(() => {
    let isMounted = true;

    async function completeAuth() {
      const supabase = createBrowserSupabaseClient({ detectSessionInUrl: false });
      const code = searchParams.get("code");
      const errorDescription =
        searchParams.get("error_description") ?? searchParams.get("error");

      if (errorDescription) {
        throw new Error(errorDescription);
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          throw error;
        }
      } else if (typeof window !== "undefined") {
        const sessionParams = getImplicitSessionParams(window.location.hash);

        if (sessionParams) {
          const { error } = await supabase.auth.setSession(sessionParams);

          if (error) {
            throw error;
          }
        }
      }

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      if (!session) {
        throw new Error("Nao foi possivel criar a sessao do paciente.");
      }

      router.replace(nextPath);
    }

    completeAuth().catch((error) => {
      if (!isMounted) {
        return;
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel validar o link de acesso.",
      );
    });

    return () => {
      isMounted = false;
    };
  }, [nextPath, router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md">
        <AuthNotice
          actionHref={errorMessage ? "/entrar" : ""}
          actionLabel={errorMessage ? "Voltar para entrada" : undefined}
          description={
            errorMessage ??
            "Estamos validando seu link seguro e preparando sua area do paciente."
          }
          title={errorMessage ? "Link de acesso invalido" : "Validando acesso"}
        />
      </div>
    </main>
  );
}
