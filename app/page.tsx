import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ROUTES } from "@/lib/constants/routes";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <Badge className="w-fit">SaaS multiempresa</Badge>
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
              Meu Painel — Portal do Paciente e Painel Profissional
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Fundação técnica inicial para profissionais da saúde operarem
              workspaces, pacientes, consultas e materiais em uma
              arquitetura limpa e segura.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
              href={ROUTES.entrar}
            >
              Acessar portal
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
              href={ROUTES.admin}
            >
              Ver painel
            </Link>
          </div>
        </header>
        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <span className="text-2xl">🏥</span>
            <h2 className="mt-3 text-base font-semibold">Multiempresa</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Estrutura preparada para workspaces, domínio, identidade visual e
              isolamento por clínica ou profissional.
            </p>
          </Card>
          <Card>
            <span className="text-2xl">👩‍⚕️</span>
            <h2 className="mt-3 text-base font-semibold">Profissional</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Base para acompanhar pacientes, consultas, notas e recursos
              compartilhados.
            </p>
          </Card>
          <Card>
            <span className="text-2xl">🧾</span>
            <h2 className="mt-3 text-base font-semibold">Paciente</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Portal simples para orientações, arquivos, vídeos e próximos
              compromissos.
            </p>
          </Card>
        </section>
      </div>
    </main>
  );
}
