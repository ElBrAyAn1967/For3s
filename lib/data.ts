/**
 * Structural / non-translatable data.
 * Translatable content lives in /messages/{locale}.json keyed by these IDs.
 */

export const siteConfig = {
  name: "Brian López",
  handle: "brianweb3",
  email: "brayan002150@gmail.com",
  github: "https://github.com/brianweb3",
  twitter: "https://x.com/brianweb3",
};

export const collaboratorIds = [] as const;

export type ProjectStatus = "activo" | "desarrollo" | "pausado";

export const projects = [
  {
    id: "for3s",
    name: "For3s",
    tags: ["CEO", "AI Infra", "Agentes", "LATAM"],
    status: "activo" as ProjectStatus,
    year: "2025",
    featured: true,
  },
  {
    id: "kukulcan-brain",
    name: "Kukulcan Brain",
    tags: ["Knowledge Graph", "Memoria", "Agentes"],
    status: "desarrollo" as ProjectStatus,
    year: "2025",
    featured: true,
  },
  {
    id: "trustdrop",
    name: "TrustDrop",
    tags: ["Web3", "Blockchain", "DeFi"],
    status: "pausado" as ProjectStatus,
    year: "2023",
    featured: false,
  },
  {
    id: "acompanante",
    name: "Acompañante",
    tags: ["AgentAI", "Salud", "Social Impact"],
    status: "activo" as ProjectStatus,
    year: "2024",
    featured: false,
  },
  {
    id: "agentcamp",
    name: "AgentCamp 2026",
    tags: ["Educación", "Comunidad", "Agentes"],
    status: "activo" as ProjectStatus,
    year: "2026",
    featured: true,
  },
] as const;

export const skills = [
  "AI Infra", "Agentes de IA", "Next.js", "TypeScript",
  "Blockchain", "Web3", "LLMs", "Orquestación", "LATAM",
  "Product", "Community", "Founders", "Claude API",
  "Knowledge Graphs", "Telegram Bots", "Vercel",
];

export const timelineYears = ["2026", "2025", "2024", "2023", "2022"] as const;
