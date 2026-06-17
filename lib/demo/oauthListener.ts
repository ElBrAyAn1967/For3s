// Redirect URI oficial de Anthropic para el client_id de Claude Code.
//
// IMPORTANTE: el client_id de Claude Code solo acepta ESTE redirect_uri fijo
// (registrado del lado de Anthropic). NO se puede redirigir a localhost ni a
// nuestro dominio — Anthropic rechaza la petición ("Invalid request format").
//
// Por eso el flujo es "pegar código": Anthropic muestra el authorization code
// en pantalla tras autorizar, y el usuario lo pega en For3s. No hay callback
// automático posible con este client_id.
//
// Este módulo ya NO levanta un servidor local (no hay callback que recibir).
// Solo conserva el `state` del flujo en curso para validarlo al pegar el código.

export const OAUTH_REDIRECT_URI =
  "https://console.anthropic.com/oauth/code/callback";

// Estado colgado de globalThis para sobrevivir al hot-reload de Next en dev.
const g = globalThis as unknown as { __for3sOAuthState?: string };

export function setPendingState(state: string): void {
  g.__for3sOAuthState = state;
}

export function getPendingState(): string | null {
  return g.__for3sOAuthState ?? null;
}

export function clearPendingState(): void {
  g.__for3sOAuthState = undefined;
}
