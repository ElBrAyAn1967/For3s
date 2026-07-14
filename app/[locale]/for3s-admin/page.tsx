import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import PanelDashboard from "@/components/for3s-admin/PanelDashboard";

export const metadata: Metadata = {
  title: "For3s OS · Panel",
  robots: { index: false, follow: false }, // interno, no indexar
};

// Panel de administración de For3s OS (Frente B F4.c). Cascarón público SIN
// datos ni secretos: el navegador de Brian habla directo con el server por el
// tailnet (Tailscale Serve). Sin tailnet + token, la página no muestra nada.
// Patrón demo-admin: wrapper server + componente cliente, sin navbar/footer.
export default async function For3sAdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PanelDashboard />;
}
