// Tipos del sistema de demo For3s (Fase 1 — acceso, aislamiento, capacidad).
//
// Tres tipos de demo:
//  - 'jazz'  / 'mashe' : especializados 1:1, acceso por token secreto en la URL.
//  - 'general'         : abierto N:N, tope de 10 concurrentes + lista de espera.
//
// Cada demo corre (Fase 2) en su propio contenedor Docker en el servidor for3s,
// totalmente aislado: lo que pasa en uno no contagia a los otros.

// P1 · La instancia es un DATO, no una lista fija en el código.
// Antes: type DemoKind = "jazz" | "mashe" | "brian" | "general" → agregar una
// instancia en demo_instancias (1 INSERT) funcionaba en la BD pero TypeScript la
// rechazaba en 27 archivos: la BD escalaba y el código no. Ahora el tipo es
// abierto y la validez se comprueba en RUNTIME contra demo_instancias
// (lib/demo/instancias.ts). Se mantiene el nombre DemoKind para no romper firmas.
export type DemoKind = string;

// Las instancias "base" que existían antes de demo_instancias. SOLO se usan como
// fallback/semilla cuando no se puede consultar la BD — nunca como fuente de verdad.
export const INSTANCIAS_SEMILLA = ["general", "brian", "jazz", "mashe"] as const;

// Estado de una sesión de usuario (identificada por cookie). Mapea la máquina
// de estados del plan: el usuario llega → se identifica → conecta su API key →
// ocupa cupo (o espera) → usa → se libera.
export type SessionStatus =
  | "connecting" // identificado, aún no pega API key válida
  | "ready" // API key válida, listo para ocupar cupo
  | "active" // ocupando un cupo del contenedor
  | "waiting" // en lista de espera (solo General lleno)
  | "released"; // liberó el cupo (inactividad o salida)

// ⚠️⚠️ P3 · ESTO NO ES LA FUENTE DE VERDAD DEL CUPO. NO LO USES DIRECTO.
// El cupo real vive en `demo_instancias.max_concurrent` y SIEMPRE se lee con
// `cupoDe(instancia)` (lib/demo/instancias.ts), que además cachea y permite
// cambiarlo con un UPDATE sin redeploy.
// Este mapa existe SOLO como red de seguridad para el caso de que la BD no
// responda, y solo cubre las instancias semilla. Una instancia nueva NO va aquí.
// Único consumidor legítimo: el fallback dentro de cupoDe().
export const MAX_CONCURRENT: Record<string, number> = {
  jazz: 1,
  mashe: 1,
  brian: 1,
  general: 10,
};

// Nombre del contenedor Docker de una instancia. Se deriva por convención para
// que una instancia nueva funcione sin tocar código (antes era un mapa fijo).
export function containerName(instancia: string): string {
  return `for3s-demo-${instancia}`;
}

// Una cuenta/demo. Para jazz/mashe el token es el secreto que da acceso;
// general no tiene token (se entra por /demo directo).
export interface DemoAccount {
  kind: DemoKind;
  token: string | null;
  maxConcurrent: number;
  containerName: string;
}

// Vista de una sesión que el cliente necesita conocer (sin secretos).
export interface SessionView {
  cookieId: string;
  kind: DemoKind;
  status: SessionStatus;
  position: number | null; // posición en cola si status === 'waiting'
  apiKeyHint: string | null; // últimos 4 chars, p.ej. "…x9f2" — nunca la key completa
}

// Una persona registrada en la demo General (nombre + correo = sesión persistente).
// El correo normalizado (minúsculas) es la identidad única: volver a entrar con
// el mismo correo continúa la misma sesión donde se quedó.
export interface DemoUser {
  id: string;
  kind: DemoKind; // demo REAL: dónde vive el hilo del agente (fuente de verdad)
  kindUi: DemoKind; // demo MOSTRADO en el panel (cosmético; el admin lo cambia sin
  // mover el hilo). Migrar el hilo real entre agentes = pendiente a futuro.
  name: string; // normalizado (minúsculas) en BD; la UI lo capitaliza al pintar
  email: string; // normalizado (minúsculas) — identidad única
  status: SessionStatus;
  position: number | null; // posición en cola si waiting
  notified: boolean; // si ya se le "notificó" cupo disponible (stub email)
  agentOn: boolean; // estado del agente For3s OS (contenedor on/off)
  createdAt: number; // primera vez que se registró
  lastSeenAt: number; // último heartbeat (detecta cierre de pestaña)
}

// Resultado de registrar/continuar una sesión por nombre+correo.
export interface RegisterResult {
  status: SessionStatus; // active | waiting
  position: number | null;
  returning: boolean; // true si el correo ya existía (continúa donde se quedó)
  activeCount: number;
  maxConcurrent: number;
  hasApiKey: boolean; // true si este correo ya tiene su SK guardada (entra directo)
  apiKeyHint: string | null; // últimos 4 de la SK guardada (para mostrar sin descifrar)
  agentOn: boolean; // estado del agente For3s OS (contenedor on/off) — relevante en 1:1
}

// Error de acceso: correo existe pero el nombre no coincide.
export interface RegisterDenied {
  error: "name_mismatch";
}

// Respuesta de las API routes de capacidad.
export interface CapacityResponse {
  status: SessionStatus;
  position: number | null;
  activeCount: number;
  maxConcurrent: number;
}
