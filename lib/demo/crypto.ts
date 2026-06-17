// Cifrado de la API key del usuario — AES-256-GCM, SOLO server-side.
//
// Principio (alineado con For3s OS): el secreto NUNCA se guarda en texto plano
// ni vuelve al navegador. La clave maestra (DEMO_ENC_KEY) vive solo en el server
// (.env.local, fuera del repo). GCM da cifrado autenticado (detecta manipulación).
//
// Formato del blob persistido: base64(iv[12] || authTag[16] || ciphertext).

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function masterKey(): Buffer {
  const raw = process.env.DEMO_ENC_KEY;
  if (!raw) throw new Error("DEMO_ENC_KEY no configurada");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("DEMO_ENC_KEY debe ser 32 bytes (base64)");
  }
  return key;
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", masterKey(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
}

export function decryptSecret(blob: string): string {
  const buf = Buffer.from(blob, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", masterKey(), iv);
  decipher.setAuthTag(tag);
  return decipher.update(ct, undefined, "utf8") + decipher.final("utf8");
}