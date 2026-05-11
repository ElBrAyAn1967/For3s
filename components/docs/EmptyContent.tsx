"use client";

import { useTranslations } from "next-intl";
import { Construction } from "lucide-react";

export default function EmptyContent() {
  const t = useTranslations("Docs.empty");

  return (
    <div className="rounded-2xl border border-dashed border-edge-primary p-10 sm:p-14 text-center">
      <div className="inline-flex items-center justify-center size-12 rounded-full bg-c-brand-70/10 border border-c-brand-70/25 mb-5">
        <Construction className="size-5 text-c-brand-70" />
      </div>
      <p className="text-[10px] font-mono tracking-widest text-c-brand-70/80 uppercase mb-3">
        {t("label")}
      </p>
      <h3 className="text-lg sm:text-xl font-semibold text-foreground-active mb-2">
        {t("title")}
      </h3>
      <p className="text-sm text-foreground-secondary max-w-md mx-auto leading-relaxed">
        {t("description")}
      </p>
    </div>
  );
}
