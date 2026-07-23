import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import GeneralPageShell from "@/components/demo/GeneralPageShell";
import { resolveByToken } from "@/lib/demo/accounts";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Demo" });
  return {
    title: `For3s — ${t("title")}`,
    robots: { index: false, follow: false }, // demos 1:1 privadas, no indexar
  };
}

// Demo ESPECIALIZADA 1:1 (Jazz / Mashe / Brian). Mismo formato que General, pero
// el correo debe ser el AUTORIZADO de esa demo (se valida en /api/.../register).
// El token de la URL solo resuelve a qué demo es; si no existe → 404.
export default async function TokenDemoPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  const account = await resolveByToken(token);
  if (!account) notFound();

  const t = await getTranslations({ locale, namespace: "Demo" });
  // Nombre a saludar: si la 1:1 trae nombre de persona (creada desde el panel),
  // se usa ese; si es una legado (jazz/mashe/brian), la traducción de siempre.
  const name = account.nombrePersona?.trim()
    ? account.nombrePersona.trim()
    : t(`specialized.${account.kind}.name`);

  return (
    <GeneralPageShell
      kind={account.kind}
      label={t("specialized.label")}
      title={t("specialized.title", { name })}
      description={t("specialized.description")}
    />
  );
}
