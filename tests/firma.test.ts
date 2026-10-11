import { describe, expect, it } from "vitest";
import { clientIdDeCorreo, firmaClientId, headersDeIdentidad } from "../lib/demo/for3sChat";

/**
 * SG-2 (auditoría de seguridad S60): la web firma cada X-Client-Id para que la key
 * demo sola ya no baste para hacerse pasar por un usuario. El servidor (Python,
 * `for3s_core.api_channel.firma_cliente`) verifica con HMAC-SHA256 en hex: las dos
 * puntas deben calcular EXACTAMENTE los mismos bytes.
 */
describe("firma del X-Client-Id", () => {
  const SECRETO = "s".repeat(48);
  const ID = "u" + "ab12".repeat(6);

  it("⭐ coincide byte a byte con el servidor (vector calculado con hmac de Python)", () => {
    expect(firmaClientId(ID, SECRETO)).toBe("c7c66b16f2d428d1a37b64d0773d0a07ebab06c98f7cea1066efd9c632cc12f4");
  });

  it("sin secreto no hay firma (el servidor en modo «aceptar» lo deja pasar)", () => {
    expect(firmaClientId(ID, undefined)).toBeNull();
    expect(firmaClientId(ID, "   ")).toBeNull();
    expect(headersDeIdentidad("ana@x.com", undefined)).toEqual({ "X-Client-Id": clientIdDeCorreo("ana@x.com") });
  });

  it("con secreto manda el id Y su firma, y la firma es la de ESE id", () => {
    const h = headersDeIdentidad("ana@x.com", SECRETO);
    expect(h["X-Client-Id"]).toBe(clientIdDeCorreo("ana@x.com"));
    expect(h["X-Client-Sig"]).toBe(firmaClientId(clientIdDeCorreo("ana@x.com"), SECRETO));
  });

  it("dos usuarios distintos nunca comparten firma", () => {
    const a = headersDeIdentidad("ana@x.com", SECRETO)["X-Client-Sig"];
    const b = headersDeIdentidad("beto@x.com", SECRETO)["X-Client-Sig"];
    expect(a).not.toBe(b);
  });

  it("los espacios alrededor del secreto no cambian la firma (Vercel a veces los conserva)", () => {
    expect(firmaClientId(ID, `  ${SECRETO}\n`)).toBe(firmaClientId(ID, SECRETO));
  });
});
