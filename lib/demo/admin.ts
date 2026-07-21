// Autorización del apartado Demo (dentro del panel de administración).
//
// Patrón simple (como godinez-ai): contraseña en header X-Admin-Password
// comparada contra la env var DEMO_ADMIN_PASSWORD. Suficiente para un dashboard
// interno. En .env.local (no se commitea) y ya configurada en Vercel.
//
// ⚠️ LECCIÓN (2026-07-21): al absorber /demo-admin en el panel (pieza E) cambié esta
// auth por "validar el token del panel CONTRA EL SERVER" (:8443). Ese endpoint es
// tailnet-only → desde Vercel nunca se alcanzaba → "Sesión no autorizada". Mover un
// componente de una página a una pestaña NO requería tocar la autenticación.
// Se revirtió a esto, que ya funcionaba y no necesita variables nuevas.

export function isAdminAuthorized(request: Request): boolean {
  const expected = process.env.DEMO_ADMIN_PASSWORD;
  if (!expected) return false; // sin contraseña configurada → acceso cerrado
  const provided = request.headers.get("x-admin-password");
  return provided === expected;
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.DEMO_ADMIN_PASSWORD;
  return !!expected && password === expected;
}
