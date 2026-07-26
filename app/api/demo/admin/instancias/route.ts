// GET /api/demo/admin/instancias — instancias demo-ables, para los selectores del
// panel admin (filtros, crear demo 1:1, cambiar demo).
//
// S4a · Antes el panel tenía la lista fija `["general","jazz","mashe","brian"]`
// duplicada en `SeccionDemo.tsx` y en `accountStore.ts`, con la nota "deben
// coincidir" — dos copias que había que recordar sincronizar a mano. Ahora salen de
// `demo_instancias`, así que una instancia creada con un INSERT aparece sola.
//
// 🛡️ Por qué esto NO abre el agujero que la lista fija evitaba: 'foresito' (la
// instancia INTERNA de la empresa, no demo-able — decisión de Brian 2026-07-22)
// NO está en demo_instancias. La tabla ES el registro de instancias demo-ables, así
// que la exclusión la garantiza el DATO y no una lista que hay que mantener.
// Si algún día se metiera foresito ahí, habría que añadir una columna `demoable`.

import { isAdminAuthorized } from "@/lib/demo/admin";
import { instanciasActivas } from "@/lib/demo/instancias";

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const filas = await instanciasActivas();
  return Response.json({
    instancias: filas.map((f) => ({
      instancia: f.instancia,
      modo: f.modo,
      maxConcurrent: f.max_concurrent,
    })),
  });
}
