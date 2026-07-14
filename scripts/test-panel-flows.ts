/**
 * F4.c — PRUEBAS DE FLUJO COMPLETO del panel (Frente B).
 *
 * Corre la MISMA capa de datos que ejecuta la UI (lib/for3sAdmin.ts) contra el
 * BACKEND REAL por el tailnet: no es un mock — cada flujo toca Postgres, el
 * audit y el LLM de verdad. Uso:
 *
 *   FOR3S_ADMIN_TOKEN=... FOR3S_CTL_TOKEN=... bun scripts/test-panel-flows.ts
 *
 * Flujos: A auth · B prospecto (waitlist pública→contactar→convertir→descartar)
 * · C cliente completo (alta→chat real→cuota 429→rotar→suspender 403→reactivar→
 * revocar terminal) · D instancias (flota+ciclo mashe+foresito bloqueado) ·
 * E caminos de error. Limpia sus datos al final (los del audit se quedan:
 * es inmutable a propósito).
 */

// ── shim mínimo de navegador (bun no tiene window/localStorage) ──
const almacen = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (k: string) => almacen.get(k) ?? null,
    setItem: (k: string, v: string) => void almacen.set(k, v),
    removeItem: (k: string) => void almacen.delete(k),
  },
};

import {
  FOR3S_PUBLIC,
  PanelError,
  altaCliente,
  cambiarEstado,
  editarCliente,
  getClientes,
  getInstancias,
  getLatencias,
  getLogs,
  getSeries,
  getWaitlist,
  instanciaOrden,
  parseScopes,
  rotarKey,
  setToken,
  validarToken,
  waitlistEstado,
  waitlistPublica,
} from "../lib/for3sAdmin";

const ADMIN_TOKEN = process.env.FOR3S_ADMIN_TOKEN ?? "";
const CTL_TOKEN = process.env.FOR3S_CTL_TOKEN ?? "";
const CLIENTE_PRUEBA = "panel-flujo-e2e";
const EMAIL_PRUEBA = "flujo-e2e@panel-test.mx";

let pasos = 0;
let fallos = 0;
function ok(nombre: string, cond: boolean, detalle = "") {
  pasos++;
  if (cond) {
    console.log(`  ✅ ${nombre}${detalle ? ` — ${detalle}` : ""}`);
  } else {
    fallos++;
    console.log(`  ❌ ${nombre}${detalle ? ` — ${detalle}` : ""}`);
  }
}

async function chatConKey(key: string, mensaje: string): Promise<number> {
  const res = await fetch(`${FOR3S_PUBLIC}/v1/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": key },
    body: JSON.stringify({ message: mensaje, tema: "panel-e2e" }),
  });
  return res.status;
}

async function flujoA_auth() {
  console.log("\n— FLUJO A · autenticación —");
  ok("token malo rechazado", (await validarToken("token-falso-123456789012345")) === false);
  ok("token bueno aceptado", (await validarToken(ADMIN_TOKEN)) === true);
  setToken(ADMIN_TOKEN); // como el login de la UI
  // el /ctl usa OTRO token: getInstancias con el token admin debe dar 401
  try {
    await getInstancias();
    ok("ctl exige SU token (admin≠ctl)", false, "aceptó el token equivocado");
  } catch (e) {
    ok("ctl exige SU token (admin≠ctl)", e instanceof PanelError && e.kind === "auth");
  }
}

async function flujoB_prospecto() {
  console.log("\n— FLUJO B · prospecto: sitio → waitlist → contactar → descartar —");
  const alta = await waitlistPublica({ nombre: "Flujo E2E", email: EMAIL_PRUEBA, mensaje: "prueba de flujo completo" });
  ok("alta pública desde el sitio", alta.ok);
  const dupe = await waitlistPublica({ nombre: "Flujo E2E v2", email: EMAIL_PRUEBA });
  ok("reintento mismo email no truena (dedupe)", dupe.ok);
  const lista = await getWaitlist("nuevo");
  const p = lista.waitlist.find((x) => x.email === EMAIL_PRUEBA);
  ok("aparece en el panel como nuevo", !!p, p ? `#${p.id} «${p.nombre}»` : "no está");
  if (!p) return null;
  ok("dedupe actualizó el nombre", p.nombre === "Flujo E2E v2");
  const r1 = await waitlistEstado(p.id, "contactado");
  ok("nuevo → contactado", r1.ok);
  try {
    await waitlistEstado(p.id, "zombie");
    ok("estado inventado rechazado", false);
  } catch (e) {
    ok("estado inventado rechazado", e instanceof PanelError && e.status === 409);
  }
  return p.id;
}

async function flujoC_cliente(waitlistId: number | null) {
  console.log("\n— FLUJO C · cliente completo: convertir → chat real → cuota → rotar → estados —");
  // convertir (lo que hace la UI: alta + marcar convertido)
  const alta = await altaCliente({ client_id: CLIENTE_PRUEBA, nombre: "Cliente Flujo E2E", dias: 7 });
  ok("alta devuelve key f3k_ una vez", alta.key.startsWith("f3k_"), alta.key.slice(0, 12) + "…");
  if (waitlistId != null) {
    const conv = await waitlistEstado(waitlistId, "convertido");
    ok("prospecto marcado convertido", conv.ok);
  }
  const clientes = await getClientes(30);
  const c = clientes.clientes.find((x) => x.client_id === CLIENTE_PRUEBA);
  ok("cliente en la tabla del panel", !!c);
  ok("scopes por default (chat, byok)", !!c && parseScopes(c.scopes).includes("chat"));
  ok("expiración registrada (7 días)", !!c?.key_expira_at);

  // chat REAL con la key (el LLM responde de verdad)
  const s1 = await chatConKey(alta.key, "Responde solo: OK");
  ok("chat real con la key nueva → 200", s1 === 200, `HTTP ${s1}`);

  // cuota diaria = 1 → la siguiente llamada debe dar 429 (gate persistente)
  const ed = await editarCliente(CLIENTE_PRUEBA, { cuota_dia_requests: 1, cuota_dia_tokens: null });
  ok("editar cuota a 1 req/día", ed.ok);
  const s2 = await chatConKey(alta.key, "Responde solo: OK");
  ok("2ª llamada bloqueada por cuota → 429", s2 === 429, `HTTP ${s2}`);
  const ed2 = await editarCliente(CLIENTE_PRUEBA, { cuota_dia_requests: null, cuota_dia_tokens: null });
  ok("cuota devuelta al default", ed2.ok);

  // rotar: la key vieja muere al instante
  const rot = await rotarKey(CLIENTE_PRUEBA);
  ok("rotar entrega key nueva", rot.key.startsWith("f3k_") && rot.key !== alta.key);
  const sVieja = await chatConKey(alta.key, "hola");
  ok("key VIEJA muerta → 401", sVieja === 401, `HTTP ${sVieja}`);

  // suspender → 403 en el canal · reactivar → vuelve
  const su = await cambiarEstado(CLIENTE_PRUEBA, "suspender", "prueba de flujo");
  ok("suspender", su.ok);
  const sSusp = await chatConKey(rot.key, "hola");
  ok("suspendido no entra → 403", sSusp === 403, `HTTP ${sSusp}`);
  const re = await cambiarEstado(CLIENTE_PRUEBA, "reactivar", "fin de la prueba");
  ok("reactivar", re.ok);

  // logs del cliente reflejan las llamadas ATENDIDAS (las rechazadas —
  // 429/401/403 — NO se miden: el gate corta antes de registrar, diseño F3;
  // registrar rechazos retroalimentaría la ventana del rate)
  const logs = await getLogs(CLIENTE_PRUEBA, 20);
  ok("logs con la llamada real atendida", logs.logs.length >= 1, `${logs.logs.length} filas`);
  ok("la llamada atendida quedó 'ok'", logs.logs.some((l) => l.estado === "ok"));
  ok("logs traen ms y estado", logs.logs.every((l) => typeof l.ms === "number" && !!l.estado));

  // series/latencias del panel ven el tráfico
  const serie = await getSeries(30);
  ok("la serie del resumen tiene el tráfico de hoy", serie.series.some((p) => p.llamadas > 0));
  const lat = await getLatencias(7);
  ok("latencias p50 con dato real", lat.global.p50 != null, `p50=${lat.global.p50}ms`);

  // revocar = TERMINAL: reactivar debe rebotar
  const rev = await cambiarEstado(CLIENTE_PRUEBA, "revocar", "cierre de la prueba");
  ok("revocar", rev.ok);
  try {
    await cambiarEstado(CLIENTE_PRUEBA, "reactivar", "no debería");
    ok("revocado es TERMINAL (reactivar rebota)", false);
  } catch (e) {
    ok("revocado es TERMINAL (reactivar rebota)", e instanceof PanelError && e.status === 409);
  }
  const sRev = await chatConKey(rot.key, "hola");
  ok("revocado no entra → 403", sRev === 403, `HTTP ${sRev}`);
}

async function flujoD_instancias() {
  console.log("\n— FLUJO D · instancias (token ctl) —");
  setToken(CTL_TOKEN);
  const flota = await getInstancias();
  ok("flota completa", flota.instancias.length >= 5, `${flota.instancias.length} instancias`);
  const foresito = flota.instancias.find((i) => i.nombre === "foresito");
  ok("foresito visible pero SIN control", !!foresito && !foresito.control);
  const general = flota.instancias.find((i) => i.nombre === "general");
  ok("general marcada crítica", !!general?.critica);
  try {
    await instanciaOrden("foresito", "apagar");
    ok("orden sobre foresito rebota", false, "¡la aceptó!");
  } catch (e) {
    ok("orden sobre foresito rebota", e instanceof PanelError && e.status === 404);
  }
  // ciclo real con mashe (estaba apagada; la devolvemos igual)
  const mashe = flota.instancias.find((i) => i.nombre === "mashe");
  ok("mashe presente y apagada", !!mashe && !mashe.encendida);
  if (mashe && !mashe.encendida) {
    const enc = await instanciaOrden("mashe", "encender");
    ok("encender mashe (verificado por el server)", enc.ok && enc.encendida, `${(enc.ms / 1000).toFixed(1)}s`);
    const apa = await instanciaOrden("mashe", "apagar");
    ok("apagar mashe (devuelta a su estado)", apa.ok && !apa.encendida, `${(apa.ms / 1000).toFixed(1)}s`);
  }
  setToken(ADMIN_TOKEN);
}

async function flujoE_errores() {
  console.log("\n— FLUJO E · caminos de error —");
  try {
    await altaCliente({ client_id: "…###…" });
    ok("client_id basura rechazado", false);
  } catch (e) {
    ok("client_id basura rechazado", e instanceof PanelError && e.status === 400);
  }
  const logsNadie = await getLogs("cliente-inexistente-xyz", 10);
  ok("logs de cliente inexistente = lista vacía (no error)", logsNadie.logs.length === 0);
  const wl = await waitlistPublica({ nombre: "X", email: "sin-arroba" });
  ok("email inválido en el form → error legible", !wl.ok && wl.error === "request inválido");
}

(async () => {
  if (!ADMIN_TOKEN || !CTL_TOKEN) {
    console.error("Faltan FOR3S_ADMIN_TOKEN / FOR3S_CTL_TOKEN en el entorno.");
    process.exit(2);
  }
  console.log("🧪 F4.c — flujos completos del panel contra el backend REAL");
  await flujoA_auth();
  const waitlistId = await flujoB_prospecto();
  await flujoC_cliente(waitlistId);
  await flujoD_instancias();
  await flujoE_errores();
  console.log(`\n═══ RESULTADO: ${pasos - fallos}/${pasos} pasos OK · ${fallos} fallos ═══`);
  process.exit(fallos === 0 ? 0 : 1);
})();
