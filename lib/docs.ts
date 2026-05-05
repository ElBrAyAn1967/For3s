import {
  Sparkles,
  Compass,
  BookOpen,
  Bot,
  Cpu,
  Network,
  Database,
  PuzzleIcon,
  Zap,
  Brain,
  Wrench,
  ListTree,
  type LucideIcon,
  Server,
  Rocket,
  Activity,
  DollarSign,
  Shield,
  GitBranch,
  Layers,
  Box,
  Send,
  MessageSquare,
  Mail,
  Webhook,
  Code2,
  Wallet,
  Coins,
  ShieldCheck,
  Link2,
  PlayCircle,
  TerminalSquare,
  StickyNote,
  CloudUpload,
  Hammer,
  Bot as BotIcon,
  GitMerge,
  HeartHandshake,
  Sparkle,
  Building2,
} from "lucide-react";

export type DocItem = {
  id: string;
  icon: LucideIcon;
};

export type DocCategory = {
  id: string;
  items: DocItem[];
};

export const DOC_STRUCTURE: DocCategory[] = [
  {
    id: "empezar",
    items: [
      { id: "que-es-for3s", icon: Sparkles },
      { id: "filosofia", icon: Compass },
      { id: "como-leer-docs", icon: BookOpen },
    ],
  },
  {
    id: "agentes",
    items: [
      { id: "openclaw", icon: Bot },
      { id: "hermes", icon: Cpu },
      { id: "anatomia-agente", icon: Brain },
      { id: "patrones-orquestacion", icon: Network },
      { id: "memoria-contexto", icon: Database },
      { id: "tool-use", icon: PuzzleIcon },
    ],
  },
  {
    id: "infraestructura",
    items: [
      { id: "arquitectura-produccion", icon: Server },
      { id: "despliegue-escalamiento", icon: Rocket },
      { id: "observabilidad", icon: Activity },
      { id: "costos-rate-limiting", icon: DollarSign },
      { id: "seguridad-guardrails", icon: Shield },
    ],
  },
  {
    id: "memoria",
    items: [
      { id: "knowledge-graphs", icon: GitBranch },
      { id: "rag-vs-memoria", icon: Layers },
      { id: "embeddings-vector", icon: Box },
      { id: "kukulcan-brain", icon: Brain },
    ],
  },
  {
    id: "integraciones",
    items: [
      { id: "telegram", icon: Send },
      { id: "whatsapp", icon: MessageSquare },
      { id: "google-suite", icon: Mail },
      { id: "webhooks-eventos", icon: Webhook },
      { id: "apis-propias", icon: Code2 },
    ],
  },
  {
    id: "web3",
    items: [
      { id: "identidad-onchain", icon: Wallet },
      { id: "pagos-programaticos", icon: Coins },
      { id: "trustdrop", icon: ShieldCheck },
      { id: "wallets-agentes", icon: Link2 },
    ],
  },
  {
    id: "guias",
    items: [
      { id: "primer-agente-claude", icon: PlayCircle },
      { id: "telegram-bot-30min", icon: TerminalSquare },
      { id: "agente-notion", icon: StickyNote },
      { id: "deploy-vercel", icon: CloudUpload },
    ],
  },
  {
    id: "herramientas",
    items: [
      { id: "stack-for3s", icon: Hammer },
      { id: "claude-api", icon: BotIcon },
      { id: "nextjs-ai", icon: GitMerge },
      { id: "cuando-usar-llm", icon: ListTree },
    ],
  },
  {
    id: "casos-estudio",
    items: [
      { id: "acompanante", icon: HeartHandshake },
      { id: "godinez-ai", icon: Sparkle },
      { id: "for3s-internal", icon: Building2 },
    ],
  },
  {
    id: "glosario",
    items: [
      { id: "terminos", icon: Wrench },
    ],
  },
];

/** Flat list — útil para prev/next navigation y validación */
export const ALL_DOC_ITEMS = DOC_STRUCTURE.flatMap((c) => c.items);

/** Set de IDs válidos */
export const DOC_IDS = new Set(ALL_DOC_ITEMS.map((i) => i.id));

/** Default item al cargar /docs sin hash */
export const DEFAULT_DOC_ID = "que-es-for3s";

export function getPrevNext(activeId: string) {
  const idx = ALL_DOC_ITEMS.findIndex((i) => i.id === activeId);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? ALL_DOC_ITEMS[idx - 1] : null,
    next: idx < ALL_DOC_ITEMS.length - 1 ? ALL_DOC_ITEMS[idx + 1] : null,
  };
}
