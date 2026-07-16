// Panel For3s OS (Frente B F4.c) — capa de datos del panel admin.
//
// TODO el tráfico va del NAVEGADOR de Brian directo al server for3s por el
// tailnet (Tailscale Serve, tailnet-only): /adm = admin API (clientes/consumo/
// waitlist) y /ctl = control de instancias. Vercel NUNCA ve el token ni los
// datos — esta página es un cascarón público; sin tailnet + token no pinta nada.
// El token vive SOLO en localStorage del navegador de Brian (logout lo borra).

export const FOR3S_BASE =
  process.env.NEXT_PUBLIC_FOR3S_ADMIN_BASE ?? "https://for3s.tail6749e5.ts.net:8443";
// URL pública (Funnel) — la usa el formulario público de waitlist del sitio.
export const FOR3S_PUBLIC =
  process.env.NEXT_PUBLIC_FOR3S_PUBLIC_BASE ?? "https://for3s.tail6749e5.ts.net";

const TOKEN_KEY = "for3s_admin_token";
const CTL_TOKEN_KEY = "for3s_ctl_token";

export function getToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(TOKEN_KEY) ?? "";
}
export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}
// /ctl (instancias) usa SU PROPIO token (defensa en capas: si el de admin se
// filtra, nadie apaga instancias). Opcional: sin él, Instancias avisa.
export function getCtlToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(CTL_TOKEN_KEY) ?? "";
}
export function setCtlToken(token: string): void {
  if (token) window.localStorage.setItem(CTL_TOKEN_KEY, token);
}
export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(CTL_TOKEN_KEY);
}

/** Error tipado: distingue "token malo" (401) de "no llego al server" (tailnet). */
export class PanelError extends Error {
  constructor(
    message: string,
    public readonly kind: "auth" | "red" | "api",
    public readonly status?: number,
  ) {
    super(message);
  }
}

async function llamar<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const tok = token ?? getToken();
  let res: Response;
  try {
    res = await fetch(`${FOR3S_BASE}${path}`, {
      ...init,
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${tok}`,
        "X-Admin-Actor": "panel-brian",
        ...init.headers,
      },
    });
  } catch {
    throw new PanelError(
      "No llego al server. ¿Estás en el tailnet (Tailscale encendido)?",
      "red",
    );
  }
  if (res.status === 401) {
    throw new PanelError("Token inválido o vencido.", "auth", 401);
  }
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new PanelError(`Respuesta rara del server (HTTP ${res.status}).`, "api", res.status);
  }
  if (!res.ok) {
    const msg =
      typeof data === "object" && data !== null && "error" in data
        ? String((data as { error?: unknown }).error)
        : typeof data === "object" && data !== null && "mensaje" in data
          ? String((data as { mensaje?: unknown }).mensaje)
          : `HTTP ${res.status}`;
    throw new PanelError(msg, "api", res.status);
  }
  return data as T;
}

// ───────────────────────── tipos (espejo del backend) ─────────────────────────

export interface UsoCliente {
  llamadas: number;
  tokens: number;
  costo: string; // NUMERIC llega como string
  errores: number;
  ultimo: string | null;
}

export interface Cliente {
  client_id: string;
  nombre: string | null;
  estado: "activo" | "suspendido" | "revocado";
  byok: boolean;
  scopes: string; // jsonb llega serializado
  con_key: boolean;
  key_expira_at: string | null;
  estado_motivo: string | null;
  ultimo_uso: string;
  creado_at: string;
  cuota_dia_requests: number | null;
  cuota_dia_tokens: number | null;
  uso: UsoCliente | null;
}

export interface PuntoSerie {
  dia: string;
  llamadas: number;
  tokens: number;
  costo: string;
  errores: number;
}

export interface Latencias {
  global: { llamadas?: number; p50?: number | null; p95?: number | null; max?: number | null };
  clientes: { client_id: string; llamadas: number; p50: number | null; p95: number | null; max: number | null }[];
  dias: number;
}

export interface LogLlamada {
  creado_at: string;
  tema: string | null;
  tokens_in: number;
  tokens_out: number;
  costo_usd: string;
  byok: boolean;
  ms: number;
  estado: "ok" | "error" | "timeout";
}

export interface Prospecto {
  id: number;
  nombre: string;
  email: string;
  mensaje: string | null;
  origen: string;
  estado: "nuevo" | "contactado" | "convertido" | "descartado";
  estado_por: string | null;
  estado_at: string | null;
  creado_at: string;
  actualizado_at: string;
}

export interface Instancia {
  nombre: string;
  proyecto: string;
  encendida: boolean;
  control: boolean;
  critica: boolean;
}

export function parseScopes(raw: string | string[] | null | undefined): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

// ───────────────────────── admin API (/adm) ─────────────────────────

/** Valida un token contra un endpoint CON auth (el /ping no exige token). */
export async function validarToken(token: string): Promise<boolean> {
  try {
    await llamar("/adm/consumo/resumen?dias=1", {}, token);
    return true;
  } catch (e) {
    if (e instanceof PanelError && e.kind === "auth") return false;
    throw e; // red/api: que la UI lo distinga de "token malo"
  }
}

export const getClientes = (dias = 30) =>
  llamar<{ clientes: Cliente[]; dias: number }>(`/adm/clientes?dias=${dias}`);

// M3: alta = onboarding (rechaza duplicados, arma el paquete completo). Acepta
// cuotas opcionales para fijarlas en el mismo paso. Un id repetido → 409.
export const altaCliente = (datos: {
  client_id: string;
  nombre?: string;
  dias?: number;
  scopes?: string[];
  cuota_dia_requests?: number | null;
  cuota_dia_tokens?: number | null;
}) =>
  llamar<{ ok: boolean; client_id: string; key: string }>("/adm/clientes", {
    method: "POST",
    body: JSON.stringify(datos),
  });

export const cambiarEstado = (
  clientId: string,
  accion: "suspender" | "reactivar" | "revocar",
  motivo: string,
) =>
  llamar<{ ok: boolean; mensaje: string }>(
    `/adm/clientes/${encodeURIComponent(clientId)}/estado`,
    { method: "POST", body: JSON.stringify({ accion, motivo }) },
  );

export const rotarKey = (clientId: string) =>
  llamar<{ ok: boolean; key: string }>(
    `/adm/clientes/${encodeURIComponent(clientId)}/rotar`,
    { method: "POST", body: JSON.stringify({}) },
  );

export const editarCliente = (
  clientId: string,
  datos: {
    cuota_dia_requests: number | null;
    cuota_dia_tokens: number | null;
    scopes?: string[];
  },
) =>
  llamar<{ ok: boolean; mensaje: string }>(
    `/adm/clientes/${encodeURIComponent(clientId)}`,
    { method: "PATCH", body: JSON.stringify(datos) },
  );

export const getLogs = (clientId: string, limit = 100) =>
  llamar<{ logs: LogLlamada[] }>(
    `/adm/clientes/${encodeURIComponent(clientId)}/logs?limit=${limit}`,
  );

export const getResumen = (dias = 30) =>
  llamar<{ resumen: UsoCliente[] & { client_id?: string }[]; dias: number }>(
    `/adm/consumo/resumen?dias=${dias}`,
  );

export type Granularidad = "hora" | "dia" | "semana";
export const getSeries = (dias = 30, gran: Granularidad = "dia") =>
  llamar<{ series: PuntoSerie[]; dias: number; gran: Granularidad }>(
    `/adm/consumo/series?dias=${dias}&gran=${gran}`,
  );

export const getLatencias = (dias = 7) => llamar<Latencias>(`/adm/latencias?dias=${dias}`);

export const getWaitlist = (estado?: string) =>
  llamar<{ waitlist: Prospecto[] }>(
    `/adm/waitlist${estado ? `?estado=${encodeURIComponent(estado)}` : ""}`,
  );

export const waitlistEstado = (id: number, estado: string) =>
  llamar<{ ok: boolean; mensaje: string }>(`/adm/waitlist/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  });

// ───────────────────────── control de instancias (/ctl) ─────────────────────────
// BUG cazado post-suite: /ctl exige SU token, no el de admin — sin esto la
// sección Instancias daría 401 en el navegador. Usa el token ctl si existe.

const tokenCtl = () => getCtlToken() || getToken();

export const getInstancias = () =>
  llamar<{ instancias: Instancia[] }>("/ctl/instancias", {}, tokenCtl());

export const instanciaOrden = (nombre: string, accion: "encender" | "apagar") =>
  llamar<{ ok: boolean; instancia: string; encendida: boolean; ms: number }>(
    `/ctl/instancias/${encodeURIComponent(nombre)}/${accion}`,
    { method: "POST" },
    tokenCtl(),
  );

// Capa 3: control de UN contenedor (reiniciar/parar/arrancar). Lista negra dura
// en el server: los intocables (nave nodriza) responden 403.
export const contenedorOrden = (
  nombre: string,
  accion: "reiniciar" | "parar" | "arrancar",
) =>
  llamar<{ ok: boolean; contenedor: string; corriendo: boolean; ms: number }>(
    `/ctl/contenedores/${encodeURIComponent(nombre)}/${accion}`,
    { method: "POST" },
    tokenCtl(),
  );

// Contenedores que el panel NO deja tocar (espejo de la lista del server).
export const CONT_INTOCABLES = new Set(["for3s-agent-1", "for3s-worker-1", "for3s-postgres-1"]);

// Capa 4: control de un servicio del HOST (arrancar/parar/reiniciar). Lista
// BLANCA en el server (SVC_CONTROLABLES); todo lo demás → 403.
export const servicioOrden = (
  nombre: string,
  accion: "arrancar" | "parar" | "reiniciar",
) =>
  llamar<{ ok: boolean; servicio: string; activo: boolean; ms: number }>(
    `/ctl/servicios/${encodeURIComponent(nombre)}/${accion}`,
    { method: "POST" },
    tokenCtl(),
  );

// Servicios que el panel puede controlar (espejo de la whitelist del server).
export const SVC_CONTROLABLES = new Set(["postgresql", "valkey-server"]);

export interface ServidorFoto {
  ts: string;
  sistema: {
    uptime_s?: number;
    carga?: number[];
    cpus?: number;
    ram_total_mb?: number;
    ram_libre_mb?: number;
    swap_total_mb?: number;
    swap_libre_mb?: number;
    disco_total_gb?: number;
    disco_usado_gb?: number;
    disco_libre_gb?: number;
    host?: string;
    kernel?: string;
    temp_c?: number;
  };
  servicios: { servicio: string; activo: boolean; estado: string }[];
  contenedores: {
    nombre: string;
    estado: string;
    detalle: string;
    imagen: string;
    red: string;
    puertos: string;
    instancia: string;
    rol: string;
  }[];
  consumo: { nombre: string; cpu: number; ram_pct: number; ram: string }[];
}

/** Foto completa del host (pestaña Servidor). Puede tardar ~3-6s (docker stats). */
export const getServidor = () => llamar<ServidorFoto>("/ctl/servidor", {}, tokenCtl());

// For3s Trace — alertas de trazabilidad con su punto exacto.
export interface TraceAlerta {
  id: number;
  client_id: string;
  clave: string;
  severidad: "alta" | "media";
  detalle: string;
  numeros: string; // jsonb
  paso: string | null; // "registro→pago"
  componente: string | null; // "pago"
  afectados: string; // jsonb: [{entidad, ubicacion}]
  n_afectados: number;
  dia: string;
  creado_at: string;
}

export const getAlertas = () =>
  llamar<{ alertas: TraceAlerta[]; instancia: string }>("/adm/alertas");

export const marcarAlertaVista = (id: number) =>
  llamar<{ ok: boolean }>(`/adm/alertas/${id}/vista`, { method: "POST", body: JSON.stringify({}) });

// ───────────────────── expediente / hoja de servicio (Frente E F1) ─────────────────────

export interface Mision {
  id: number;
  tipo: "codigo" | "analisis" | "equipo" | "otro";
  pedido: string;
  que_hizo: string;
  verificacion: string;
  resultado: "en_curso" | "entregada" | "verificada" | "fallida";
  errores: string;
  ms: number;
  creado_at: string;
  cerrado_at: string | null;
}

export interface ExpedienteHoja {
  dias: number;
  fuentes_caidas: string[];
  misiones?: { total: number; filas: Mision[] };
  nocturno?: { job: string; corridas: number; ok: number; ultima: string | null }[];
  equipo?: {
    id: number;
    tarea: string;
    familia: string;
    n_specialists: number;
    n_ok: number;
    segundos: number;
    creado_at: string;
  }[];
  automod?: { archivo: string; origen: string; nota: string; detectado_at: string }[];
  insights?: Record<string, number>;
}

/** La hoja de servicio: el trabajo REAL de For3s con evidencia (misiones +
 * nocturno + equipo + automod + insights). La confianza se gana viéndolo. */
export const getExpediente = (dias = 7) => llamar<ExpedienteHoja>(`/adm/expediente?dias=${dias}`);

// ───────────────────────── waitlist pública (Funnel) ─────────────────────────

/** Alta pública de prospecto — SIN token (endpoint público del canal). */
export async function waitlistPublica(datos: {
  nombre: string;
  email: string;
  mensaje?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${FOR3S_PUBLIC}/v1/waitlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...datos, origen: "sitio" }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (res.ok && data.ok) return { ok: true };
    return { ok: false, error: data.error ?? `HTTP ${res.status}` };
  } catch {
    return { ok: false, error: "sin conexión" };
  }
}
