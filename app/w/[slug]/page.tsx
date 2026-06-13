/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";
import {
  AtSign,
  CalendarCheck,
  Clock,
  Globe,
  LogIn,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";
import { getPublicWorkspaceBySlug } from "@/lib/workspaces/public-queries";
import { getWorkspaceInitials } from "@/lib/workspaces/queries";

type PublicWorkspacePageProps = {
  params: Promise<{ slug: string }>;
};

type ContactItem = {
  href?: string | null;
  icon: typeof MessageCircle;
  label: string;
  value?: string | null;
};

export const dynamic = "force-dynamic";

function getWhatsappHref(value?: string | null) {
  if (!value?.trim()) {
    return null;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  return `https://wa.me/${digits}`;
}

function getInstagramHref(value?: string | null) {
  if (!value?.trim()) {
    return null;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://instagram.com/${value.replace(/^@/, "")}`;
}

function getSiteHref(value?: string | null) {
  if (!value?.trim()) {
    return null;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://${value}`;
}

function ContactRow({ href, icon: Icon, label, value }: ContactItem) {
  if (!value?.trim()) {
    return null;
  }

  const content = (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm transition-colors hover:border-slate-300">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-700">
        <Icon aria-hidden="true" size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-950">
          {value}
        </p>
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <a href={href} rel="noreferrer" target="_blank">
      {content}
    </a>
  );
}

export default async function PublicWorkspacePage({
  params,
}: PublicWorkspacePageProps) {
  const { slug } = await params;
  const workspace = await getPublicWorkspaceBySlug(slug);

  if (!workspace) {
    notFound();
  }

  const initials = getWorkspaceInitials(workspace.name);
  const primaryColor = workspace.primaryColor ?? "#047857";
  const secondaryColor = workspace.secondaryColor ?? "#0f172a";
  const whatsappHref = getWhatsappHref(workspace.whatsapp);
  const instagramHref = getInstagramHref(workspace.instagram);
  const siteHref = getSiteHref(workspace.site);
  const style = {
    "--workspace-primary": primaryColor,
    "--workspace-secondary": secondaryColor,
  } as CSSProperties;
  const location = [workspace.address, workspace.cityState]
    .filter(Boolean)
    .join(" - ");
  const contactItems: ContactItem[] = [
    {
      href: whatsappHref,
      icon: MessageCircle,
      label: "WhatsApp",
      value: workspace.whatsapp,
    },
    {
      href: workspace.phone ? `tel:${workspace.phone.replace(/\D/g, "")}` : null,
      icon: Phone,
      label: "Telefone",
      value: workspace.phone,
    },
    {
      href: instagramHref,
      icon: AtSign,
      label: "Instagram",
      value: workspace.instagram,
    },
    {
      href: siteHref,
      icon: Globe,
      label: "Site",
      value: workspace.site,
    },
    {
      icon: MapPin,
      label: "Endereco",
      value: location,
    },
    {
      icon: Clock,
      label: "Horario",
      value: workspace.businessHours,
    },
  ];
  const benefits = [
    "Acompanhamento organizado em um portal simples para o paciente.",
    "Consultas, orientacoes e materiais concentrados em um unico lugar.",
    "Comunicacao direta com o profissional pelos canais comerciais.",
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950" style={style}>
      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto grid min-h-[88vh] w-full max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4">
              {workspace.logoUrl ? (
                <img
                  alt={`Logo de ${workspace.name}`}
                  className="max-h-16 max-w-52 object-contain"
                  src={workspace.logoUrl}
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg text-xl font-semibold text-white [background:var(--workspace-secondary)]">
                  {initials}
                </div>
              )}
            </div>
            <p className="mt-10 text-sm font-semibold uppercase text-[color:var(--workspace-primary)]">
              {workspace.specialty ?? "Atendimento personalizado"}
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-normal text-slate-950 sm:text-6xl">
              {workspace.name}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Um espaco digital para acompanhar seu cuidado com clareza,
              seguranca e acesso direto aos canais do atendimento.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {whatsappHref ? (
                <a
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 [background:var(--workspace-primary)]"
                  href={whatsappHref}
                  rel="noreferrer"
                  target="_blank"
                >
                  <MessageCircle aria-hidden="true" size={18} />
                  WhatsApp
                </a>
              ) : null}
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-950 shadow-sm transition-colors hover:bg-slate-50"
                href={ROUTES.paciente}
              >
                <LogIn aria-hidden="true" size={18} />
                Acessar area do paciente
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-lg border border-slate-200 bg-slate-950 p-6 text-white shadow-xl [background:var(--workspace-secondary)]">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/10 text-base font-semibold text-white ring-1 ring-white/15">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold">{workspace.name}</p>
                  <p className="mt-1 truncate text-sm text-white/70">
                    {workspace.specialty ?? "Portal do atendimento"}
                  </p>
                </div>
              </div>
              <div className="mt-8 grid gap-3">
                {workspace.businessHours ? (
                  <div className="flex items-center gap-3 rounded-md bg-white/10 px-4 py-3 text-sm text-white/85">
                    <Clock aria-hidden="true" size={18} />
                    {workspace.businessHours}
                  </div>
                ) : null}
                {workspace.cityState ? (
                  <div className="flex items-center gap-3 rounded-md bg-white/10 px-4 py-3 text-sm text-white/85">
                    <MapPin aria-hidden="true" size={18} />
                    {workspace.cityState}
                  </div>
                ) : null}
                <div className="flex items-center gap-3 rounded-md bg-white/10 px-4 py-3 text-sm text-white/85">
                  <ShieldCheck aria-hidden="true" size={18} />
                  Portal conectado ao acompanhamento do paciente
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-sm font-semibold uppercase text-[color:var(--workspace-primary)]">
              Sobre o atendimento
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">
              Cuidado com rotina, proximidade e informacao organizada.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Este portal reune os principais caminhos para iniciar ou continuar
              seu acompanhamento, com acesso rapido aos contatos comerciais e a
              area do paciente.
            </p>
          </div>
          <div className="grid gap-4">
            {benefits.map((benefit) => (
              <div
                className="flex gap-4 rounded-lg border border-slate-200 bg-white px-5 py-5 shadow-sm"
                key={benefit}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-50 text-[color:var(--workspace-primary)]">
                  <Sparkles aria-hidden="true" size={18} />
                </span>
                <p className="text-sm leading-6 text-slate-600">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-[color:var(--workspace-primary)]">
              Informacoes de contato
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">
              Fale com {workspace.name}
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {contactItems.map((item) => (
              <ContactRow key={item.label} {...item} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-lg px-6 py-10 text-white shadow-xl sm:px-8 lg:flex-row lg:items-center lg:justify-between [background:var(--workspace-secondary)]">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase text-white/70">
              <CalendarCheck aria-hidden="true" size={18} />
              Agende seu atendimento
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal">
              Comece seu acompanhamento pelo canal principal.
            </h2>
          </div>
          {whatsappHref ? (
            <a
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100"
              href={whatsappHref}
              rel="noreferrer"
              target="_blank"
            >
              <MessageCircle aria-hidden="true" size={18} />
              Chamar no WhatsApp
            </a>
          ) : null}
        </div>
      </section>

      {whatsappHref ? (
        <a
          aria-label="Chamar no WhatsApp"
          className={cn(
            "fixed bottom-5 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition-transform hover:scale-105",
            "[background:var(--workspace-primary)]",
          )}
          href={whatsappHref}
          rel="noreferrer"
          target="_blank"
        >
          <MessageCircle aria-hidden="true" size={24} />
        </a>
      ) : null}
    </main>
  );
}
