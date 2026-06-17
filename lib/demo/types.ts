// Tipos del sistema de demo For3s (Fase 1 — acceso, aislamiento, capacidad).
//
// Tres tipos de demo:
//  - 'jazz'  / 'mashe' : especializados 1:1, acceso por token secreto en la URL.
//  - 'general'         : abierto N:N, tope de 10 concurrentes + lista de espera.
//
// Cada demo corre (Fase 2) en su propio contenedor Docker en el servidor for3s,
// totalmente aislado: lo que pasa en uno no contagia a los otros.

export type DemoKind = "jazz" | "mashe" | "brian" | "general";

// Estado de una sesión de usuario (identificada por cookie). Mapea la máquina
// de estados del plan: el usuario llega → se identifica → conecta su API key →
// ocupa cupo (o espera) → usa → se libera.
export type SessionStatus =
  | "connecting" // identificado, aún no pega API key válida
  | "ready" // API key válida, listo para ocupar cupo
  | "active" // ocupando un cupo del contenedor
  | "waiting" // en lista de espera (solo General lleno)
  | "released"; // liberó el cupo (inactividad o salida)

// Capacidad máxima concurrente por tipo de demo.
export const MAX_CONCURRENT: Record<DemoKind, number> = {
  jazz: 1,
  mashe: 1,
  brian: 1,
  general: 10,
};

// Nombre del contenedor Docker por tipo (Fase 2 lo usa para enrutar al server).
export const CONTAINER_NAME: Record<DemoKind, string> = {
  jazz: "for3s-demo-jazz",
  mashe: "for3s-demo-mashe",
  brian: "for3s-demo-brian",
  general: "for3s-demo-general",
};

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
  kind: DemoKind; // a qué demo pertenece la sesión
  name: string; // normalizado (minúsculas) en BD; la UI lo capitaliza al pintar
  email: string; // normalizado (minúsculas) — identidad única
  status: SessionStatus;
  position: number | null; // posición en cola si waiting
  notified: boolean; // si ya se le "notificó" cupo disponible (stub email)
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
