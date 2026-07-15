// Diccionario humano del panel Servidor (F4.e Capa 1): traduce nombres técnicos
// del server a algo que Brian (o alguien menos técnico) lea de un vistazo.

export const SERVICIO_HUMANO: Record<string, { nombre: string; que: string }> = {
  docker: { nombre: "Docker", que: "Motor de contenedores — corre todos los For3s" },
  postgresql: { nombre: "PostgreSQL (host)", que: "Base de datos del sistema" },
  "valkey-server": { nombre: "Valkey (host)", que: "Cola de tareas del sistema" },
  "for3s-ctl": { nombre: "For3s Control", que: "El puente de este panel con el server" },
  tailscaled: { nombre: "Tailscale", que: "La red privada por la que entras aquí" },
};

// Servicios que NUNCA se apagan desde el panel (Capa 4): tumbarlos mata todo.
export const SERVICIOS_INTOCABLES = new Set(["docker", "for3s-ctl", "tailscaled"]);

export function labelServicio(id: string): { nombre: string; que: string } {
  return SERVICIO_HUMANO[id] ?? { nombre: id, que: "Servicio del sistema" };
}

// Nombre corto y amable de un contenedor: quita el prefijo de proyecto y el
// sufijo -1 para mostrar solo lo esencial (el rol ya viene del backend).
export function nombreCorto(nombre: string, instancia: string): string {
  let s = nombre;
  if (instancia !== "host") {
    const prefijo = instancia === "foresito" ? "for3s-" : `for3s-${instancia}-`;
    if (s.startsWith(prefijo)) s = s.slice(prefijo.length);
  }
  return s.replace(/-1$/, "");
}

// Etiqueta de cada For3s (grupo) para el panel.
export const INSTANCIA_HUMANA: Record<string, { nombre: string; sub: string }> = {
  foresito: { nombre: "Foresito", sub: "For3s empresa (nave nodriza)" },
  general: { nombre: "General", sub: "Demo pública + API de clientes" },
  brian: { nombre: "Brian", sub: "For3s personal" },
  jazz: { nombre: "Jazz", sub: "For3s de Jazz" },
  mashe: { nombre: "Mashe", sub: "For3s de Mashe" },
  host: { nombre: "Otros", sub: "Contenedores del host" },
};

export function labelInstancia(id: string): { nombre: string; sub: string } {
  return INSTANCIA_HUMANA[id] ?? { nombre: id, sub: "For3s" };
}

// Orden de aparición de los grupos (los importantes primero).
export const ORDEN_INSTANCIAS = ["foresito", "general", "brian", "jazz", "mashe", "host"];
