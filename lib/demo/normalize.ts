// Normalización de datos de entrada.
//
// Regla de Brian: TODO dato que llega del usuario se convierte a minúsculas y
// se recortan espacios, sin importar cómo lo haya escrito. Así "Brian@Gmail.com"
// y "brian@gmail.com " son la MISMA sesión — nunca duplicados por mayúsculas.

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function normalizeName(raw: string): string {
  // Nombre: minúsculas + colapsar espacios internos. (La UI puede mostrarlo
  // capitalizado al pintar; en la BD vive normalizado para comparar/deduplicar.)
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

// Validación básica de formato de email (defensa además del type="email" del form).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(raw: string): boolean {
  return EMAIL_RE.test(raw.trim().toLowerCase());
}