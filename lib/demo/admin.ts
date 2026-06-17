// Autorización del dashboard admin de la demo.
//
// Patrón simple (como godinez-ai): contraseña en header X-Admin-Password
// comparada contra la env var DEMO_ADMIN_PASSWORD. Suficiente para un dashboard
// interno. En .env.local (no se commitea).

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