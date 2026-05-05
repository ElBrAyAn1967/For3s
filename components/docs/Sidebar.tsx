"use client";

import { useTranslations } from "next-intl";
import { DOC_STRUCTURE } from "@/lib/docs";

type Props = {
  activeId: string;
  onSelect: (id: string) => void;
  collapsed: boolean;
};

export default function Sidebar({ activeId, onSelect, collapsed }: Props) {
  const t = useTranslations("Docs");

  return (
    <nav className="w-full h-full flex flex-col overflow-y-auto scrollbar-none">
      <div className="space-y-4">
        {DOC_STRUCTURE.map((cat, catIdx) => (
          <div key={cat.id}>
            {collapsed ? (
              catIdx > 0 && (
                <div className="h-px bg-edge-secondary/40 mx-2 mb-3" />
              )
            ) : (
              <p className="text-[9px] font-mono tracking-widest text-foreground-tertiary/70 uppercase mb-1 px-2">
                {t(`categories.${cat.id}`)}
              </p>
            )}
            <ul className="space-y-0.5">
              {cat.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeId === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(item.id)}
                      title={t(`items.${item.id}.label`)}
                      className={`w-full flex items-center gap-2.5 px-2 py-1.5 min-h-[2.25rem] rounded-lg transition-all duration-150 ${
                        isActive
                          ? "bg-c-brand-70/12 text-c-brand-70"
                          : "text-foreground-secondary hover:bg-surface-primary-hover hover:text-foreground-active"
                      } ${collapsed ? "justify-center" : ""}`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!collapsed && (
                        <span
                          className={`text-xs leading-snug text-left ${
                            isActive ? "font-medium" : ""
                          }`}
                        >
                          {t(`items.${item.id}.label`)}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
