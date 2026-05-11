"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronRight,
  Menu,
  X,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import EmptyContent from "@/components/docs/EmptyContent";
import { useDocsSearch } from "@/components/docs/DocsSearchContext";
import {
  DOC_STRUCTURE,
  DOC_IDS,
  DEFAULT_DOC_ID,
  ALL_DOC_ITEMS,
  getPrevNext,
  type DocCategory,
  type DocItem,
} from "@/lib/docs";

const PRIMARY_CATEGORIES = [
  "empezar",
  "agentes",
  "infraestructura",
  "memoria",
  "integraciones",
  "web3",
];

const SECONDARY_CATEGORIES = [
  "guias",
  "herramientas",
  "casos-estudio",
  "glosario",
];

function getInitialId(): string {
  if (typeof window === "undefined") return DEFAULT_DOC_ID;
  const hash = window.location.hash.slice(1);
  return DOC_IDS.has(hash) ? hash : DEFAULT_DOC_ID;
}

function findCategoryOf(id: string): string {
  for (const cat of DOC_STRUCTURE) {
    if (cat.items.some((i) => i.id === id)) return cat.id;
  }
  return PRIMARY_CATEGORIES[0];
}

type NavState = { activeId: string; activeCategory: string };
type NavAction =
  | { type: "select_item"; id: string }
  | { type: "select_category"; catId: string };

const initialNavState: NavState = {
  activeId: DEFAULT_DOC_ID,
  activeCategory: PRIMARY_CATEGORIES[0],
};

function navReducer(state: NavState, action: NavAction): NavState {
  switch (action.type) {
    case "select_item":
      return { activeId: action.id, activeCategory: findCategoryOf(action.id) };
    case "select_category":
      return { ...state, activeCategory: action.catId };
    default:
      return state;
  }
}

export default function DocsClient() {
  const t = useTranslations("Docs");
  const { query } = useDocsSearch();
  const [nav, dispatchNav] = useReducer(navReducer, initialNavState);
  const { activeId, activeCategory } = nav;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const id = getInitialId();
    dispatchNav({ type: "select_item", id });

    const onHashChange = () => {
      const newId = getInitialId();
      dispatchNav({ type: "select_item", id: newId });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const handleSelect = (id: string) => {
    dispatchNav({ type: "select_item", id });
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${id}`);
    }
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectCategory = (catId: string) => {
    dispatchNav({ type: "select_category", catId });
    const cat = DOC_STRUCTURE.find((c) => c.id === catId);
    if (cat && cat.items.length > 0) {
      handleSelect(cat.items[0].id);
    }
  };

  const { prev, next } = getPrevNext(activeId);

  const isSearching = query.trim().length > 0;
  const filteredResults = useMemo(() => {
    if (!isSearching) return null;
    const q = query.trim().toLowerCase();
    return ALL_DOC_ITEMS.filter((item) => {
      const label = t(`items.${item.id}.label`).toLowerCase();
      const summary = t(`items.${item.id}.summary`).toLowerCase();
      return label.includes(q) || summary.includes(q);
    });
  }, [query, isSearching, t]);

  return (
    <div className="min-h-screen bg-surface-primary flex flex-col">
      {/* Sub-header de docs: solo top tabs */}
      <DocsTabs
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
      />

      {/* Mobile sidebar toggle */}
      <div className="lg:hidden sticky top-[6.75rem] sm:top-16 z-30 bg-surface-primary/95 backdrop-blur-sm border-b border-edge-secondary">
        <button
          type="button"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-expanded={sidebarOpen}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-foreground-secondary hover:text-foreground-active transition-colors"
        >
          {sidebarOpen ? (
            <X className="size-4 text-brand-bold shrink-0" />
          ) : (
            <Menu className="size-4 text-brand-bold shrink-0" />
          )}
          <span className="font-mono text-xs tracking-widest uppercase text-foreground-tertiary">
            {t("mobileLabel")}
          </span>
          <ChevronRight
            className={`size-3.5 ml-auto text-foreground-tertiary transition-transform duration-200 ${
              sidebarOpen ? "rotate-90" : ""
            }`}
          />
        </button>
        {sidebarOpen && (
          <div className="border-t border-edge-secondary bg-surface-overlay-large px-4 pt-4 pb-6 max-h-[60vh] overflow-y-auto scrollbar-none">
            <SidebarBody
              activeId={activeId}
              activeCategoryId={activeCategory}
              filtered={filteredResults}
              onSelect={handleSelect}
              collapsed={false}
            />
          </div>
        )}
      </div>

      {/* Main layout */}
      <div className="flex-1 flex relative">
        {/* Desktop sidebar */}
        <aside
          className={`hidden lg:flex flex-col shrink-0 sticky top-[7rem] self-start h-[calc(100vh-7rem)] border-r border-edge-secondary transition-all duration-200 ${
            collapsed ? "w-12" : "w-64 xl:w-72"
          }`}
        >
          <div
            className={`h-full overflow-y-auto scrollbar-none py-7 ${
              collapsed ? "px-1.5" : "px-4"
            }`}
          >
            <SidebarBody
              activeId={activeId}
              activeCategoryId={activeCategory}
              filtered={filteredResults}
              onSelect={handleSelect}
              collapsed={collapsed}
            />
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
            aria-label={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
            className="absolute -right-3 top-8 z-10 size-6 rounded-full bg-surface-primary border border-edge-primary flex items-center justify-center text-foreground-secondary hover:text-foreground-active hover:border-brand-bold transition-colors"
          >
            {collapsed ? (
              <PanelLeft className="size-3" />
            ) : (
              <PanelLeftClose className="size-3" />
            )}
          </button>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-10 sm:py-12 pb-20 max-w-[860px] mx-auto lg:mx-0">
            <DocArticle activeId={activeId} />

            <div className="flex items-center justify-between gap-4 pt-8 mt-12 border-t border-edge-secondary">
              {prev ? (
                <button
                  type="button"
                  onClick={() => handleSelect(prev.id)}
                  className="group flex flex-col gap-1 text-left max-w-[48%]"
                >
                  <span className="text-xs text-foreground-tertiary">
                    {t("navigation.previous")}
                  </span>
                  <span className="text-base text-foreground-active group-hover:text-brand-bold transition-colors">
                    ← {t(`items.${prev.id}.label`)}
                  </span>
                </button>
              ) : (
                <span />
              )}
              {next ? (
                <button
                  type="button"
                  onClick={() => handleSelect(next.id)}
                  className="group flex flex-col gap-1 text-right max-w-[48%] ml-auto"
                >
                  <span className="text-xs text-foreground-tertiary">
                    {t("navigation.next")}
                  </span>
                  <span className="text-base text-foreground-active group-hover:text-brand-bold transition-colors">
                    {t(`items.${next.id}.label`)} →
                  </span>
                </button>
              ) : (
                <span />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─── Top tabs only ─── */

function DocsTabs({
  activeCategory,
  onSelectCategory,
}: {
  activeCategory: string;
  onSelectCategory: (id: string) => void;
}) {
  const t = useTranslations("Docs");

  return (
    <div className="sticky top-16 z-30 bg-surface-primary/90 backdrop-blur-md border-b border-edge-secondary">
      <nav
        className="px-4 sm:px-6 lg:px-8 flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none"
        aria-label="Categories"
      >
        {PRIMARY_CATEGORIES.map((catId) => {
          const isActive = activeCategory === catId;
          return (
            <button
              key={catId}
              type="button"
              onClick={() => onSelectCategory(catId)}
              className={`relative px-3 py-3 text-sm whitespace-nowrap transition-colors ${
                isActive
                  ? "text-brand-bold font-semibold"
                  : "text-foreground-secondary hover:text-foreground-active"
              }`}
            >
              {t(`categories.${catId}`)}
              {isActive && (
                <span className="absolute left-3 right-3 -bottom-px h-0.5 bg-brand-bold rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ─── Sidebar body ─── */

function SidebarBody({
  activeId,
  activeCategoryId,
  filtered,
  onSelect,
  collapsed,
}: {
  activeId: string;
  activeCategoryId: string;
  filtered: DocItem[] | null;
  onSelect: (id: string) => void;
  collapsed: boolean;
}) {
  const t = useTranslations("Docs");

  if (filtered) {
    if (filtered.length === 0) {
      return (
        <p className="px-2 py-3 text-xs text-foreground-tertiary">
          {t("search.empty")}
        </p>
      );
    }
    return (
      <nav className="w-full">
        <p className="text-[10px] font-mono tracking-widest text-foreground-tertiary/70 uppercase mb-2 px-2">
          {t("search.results", { count: filtered.length })}
        </p>
        <ul className="space-y-0.5">
          {filtered.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              isActive={activeId === item.id}
              onSelect={onSelect}
              collapsed={false}
            />
          ))}
        </ul>
      </nav>
    );
  }

  const activeCat = DOC_STRUCTURE.find((c) => c.id === activeCategoryId);
  const secondary = DOC_STRUCTURE.filter((c) =>
    SECONDARY_CATEGORIES.includes(c.id)
  );

  return (
    <nav className="size-full flex flex-col">
      {activeCat && (
        <SidebarCategory
          category={activeCat}
          activeId={activeId}
          onSelect={onSelect}
          collapsed={collapsed}
          showLabel={!collapsed}
        />
      )}
      {!collapsed && secondary.length > 0 && (
        <div className="mt-8 pt-6 border-t border-edge-secondary/50 space-y-5">
          {secondary.map((cat) => (
            <SidebarCategory
              key={cat.id}
              category={cat}
              activeId={activeId}
              onSelect={onSelect}
              collapsed={false}
              showLabel
            />
          ))}
        </div>
      )}
    </nav>
  );
}

function SidebarCategory({
  category,
  activeId,
  onSelect,
  collapsed,
  showLabel,
}: {
  category: DocCategory;
  activeId: string;
  onSelect: (id: string) => void;
  collapsed: boolean;
  showLabel: boolean;
}) {
  const t = useTranslations("Docs");

  return (
    <div>
      {showLabel && (
        <p className="text-[10px] font-mono tracking-widest text-foreground-tertiary/70 uppercase mb-2 px-2">
          {t(`categories.${category.id}`)}
        </p>
      )}
      <ul className="space-y-0.5">
        {category.items.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            isActive={activeId === item.id}
            onSelect={onSelect}
            collapsed={collapsed}
          />
        ))}
      </ul>
    </div>
  );
}

function SidebarItem({
  item,
  isActive,
  onSelect,
  collapsed,
}: {
  item: DocItem;
  isActive: boolean;
  onSelect: (id: string) => void;
  collapsed: boolean;
}) {
  const t = useTranslations("Docs");
  const Icon = item.icon;

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(item.id)}
        title={t(`items.${item.id}.label`)}
        className={`w-full flex items-center gap-2.5 px-2 py-1.5 min-h-[2.25rem] rounded-lg transition-all duration-150 ${
          isActive
            ? "bg-brand-bold/12 text-brand-bold"
            : "text-foreground-secondary hover:bg-surface-primary-hover hover:text-foreground-active"
        } ${collapsed ? "justify-center" : ""}`}
      >
        <Icon className="size-4 shrink-0" />
        {!collapsed && (
          <span
            className={`text-sm leading-snug text-left ${
              isActive ? "font-medium" : ""
            }`}
          >
            {t(`items.${item.id}.label`)}
          </span>
        )}
      </button>
    </li>
  );
}

function DocArticle({ activeId }: { activeId: string }) {
  const t = useTranslations("Docs");

  return (
    <article className="w-full min-w-0">
      <div className="flex items-center gap-1.5 text-xs text-foreground-tertiary mb-5">
        <span>{t("breadcrumb")}</span>
        <ChevronRight className="size-3" />
        <span className="text-foreground-active">
          {t(`items.${activeId}.label`)}
        </span>
      </div>

      <h1 className="text-4xl md:text-5xl font-semibold leading-[1.1] tracking-tight mb-5 text-foreground-active">
        {t(`items.${activeId}.title`)}
      </h1>

      <p className="text-lg text-foreground-secondary leading-relaxed mb-8 pb-8 border-b border-edge-secondary">
        {t(`items.${activeId}.summary`)}
      </p>

      <EmptyContent />
    </article>
  );
}
