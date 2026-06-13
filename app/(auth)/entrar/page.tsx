"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthNotice } from "@/components/auth/AuthNotice";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { getCurrentSessionProfile, signIn } from "@/lib/auth/session";
import { isAdmin, isPatient } from "@/lib/auth/roles";
import { ROUTES } from "@/lib/constants/routes";

const loginSchema = z.object({
  email: z.string().email("Informe um email válido."),
  password: z.string().min(6, "Informe uma senha com pelo menos 6 caracteres."),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function EntrarPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [profileMissing, setProfileMissing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<LoginForm>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginForm) {
    setFormError(null);
    setProfileMissing(false);

    const parsed = loginSchema.safeParse(values);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (field === "email" || field === "password") {
          setError(field, { message: issue.message });
        }
      }

      setFormError("Revise os dados de acesso.");
      return;
    }

    setIsSubmitting(true);

    try {
      await signIn(parsed.data.email, parsed.data.password);
      const profile = await getCurrentSessionProfile();

      if (!profile) {
        setProfileMissing(true);
        return;
      }

      if (isAdmin(profile.role)) {
        router.replace(ROUTES.admin);
        return;
      }

      if (isPatient(profile.role)) {
        router.replace(ROUTES.paciente);
        return;
      }

      setFormError("Perfil sem permissão configurada. Fale com o administrador.");
    } catch {
      setFormError("Não foi possível entrar. Confira email e senha.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md space-y-4">
        {profileMissing ? (
          <AuthNotice
            actionHref=""
            description="Perfil não encontrado. Fale com o administrador."
            title="Acesso pendente"
          />
        ) : null}
        <Card>
          <div>
            <Link className="text-sm font-medium text-emerald-800" href={ROUTES.home}>
              Meu Painel
            </Link>
            <h1 className="mt-4 text-2xl font-semibold text-slate-950">Entrar</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Acesse sua área profissional ou portal do paciente.
            </p>
          </div>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <Input
                autoComplete="email"
                className="mt-2"
                placeholder="voce@exemplo.com"
                type="email"
                {...register("email")}
              />
              {errors.email ? (
                <span className="mt-1 block text-sm text-red-700">
                  {errors.email.message}
                </span>
              ) : null}
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Senha</span>
              <Input
                autoComplete="current-password"
                className="mt-2"
                placeholder="Sua senha"
                type="password"
                {...register("password")}
              />
              {errors.password ? (
                <span className="mt-1 block text-sm text-red-700">
                  {errors.password.message}
                </span>
              ) : null}
            </label>
            {formError ? (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
                {formError}
              </p>
            ) : null}
            <Button className="w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <p className="mt-4 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">
            Autenticação conectada ao Supabase Auth.
          </p>
        </Card>
      </div>
    </main>
  );
}
