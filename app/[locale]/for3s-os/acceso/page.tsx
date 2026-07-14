import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import WaitlistFor3s from "@/components/for3s-admin/WaitlistFor3s";

export const metadata: Metadata = {
  title: "For3s OS · Lista de espera",
  description: "Pide acceso a la API de For3s OS — memoria como infraestructura.",
};

// Waitlist PÚBLICA de For3s OS (Frente B F4.c): el prospecto deja sus datos y
// caen directo a la lista que Brian gestiona desde /for3s-admin (convertir en
// cliente con un clic). Postea al endpoint público del canal (Funnel).
export default async function For3sAccesoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <WaitlistFor3s />;
}
