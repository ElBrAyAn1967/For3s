import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import AdminDashboard from "@/components/demo/AdminDashboard";

export const metadata: Metadata = {
  title: "For3s · Demo Admin",
  robots: { index: false, follow: false }, // interno, no indexar
};

// Dashboard interno del demo (solo Brian). Login por contraseña dentro del
// componente cliente. Sin navbar/footer — es una pantalla de administración.
export default async function DemoAdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AdminDashboard />;
}