# 📋 GUÍA — Registrar la GitHub OAuth App (Pieza C, para Brian)

> El código del flujo OAuth de GitHub ya está construido y probado (503 sin credenciales,
> 401 sin sesión, estado real funciona). Solo falta que registres la OAuth App en tu cuenta
> **fruterito101** (decisión Brian 2026-07-20) y pegues 2 credenciales. Sin esto, el botón
> "Conectar GitHub" responde 503 (degrada limpio); con esto, el círculo se cierra.

---

## 1 · Crear la OAuth App (2 minutos)

1. GitHub (logueado como **fruterito101**) → **Settings** → **Developer settings** (abajo del
   menú izquierdo) → **OAuth Apps** → **New OAuth App**.
2. Llenar:
   - **Application name:** `For3s Conectores` (o el que quieras)
   - **Homepage URL:** `https://for3s.tail6749e5.ts.net`
   - **Authorization callback URL:**
     `https://for3s.tail6749e5.ts.net/api/demo/connectors/github/callback`
     ⚠️ EXACTA (GitHub la valida carácter por carácter).
3. **Register application.**
4. En la página de la app: copia el **Client ID**. Luego **Generate a new client secret** →
   copia el **secret** (solo se ve una vez).

## 2 · Pegar las credenciales en el sitio

En `marca-personal/.env.local` (ya dejé las líneas con placeholder, solo reemplaza el valor):
```
GITHUB_OAUTH_CLIENT_ID=<el Client ID>
GITHUB_OAUTH_CLIENT_SECRET=<el Client Secret>
```
(Opcional, ya tiene default correcto: `NEXT_PUBLIC_SITE_BASE=https://for3s.tail6749e5.ts.net`)

## 3 · Probar (el pago de la pieza C)

1. Correr el sitio en tu máquina (tailnet) → entrar a `/demo` con tu correo.
2. Pestaña **Conectores** → **GitHub** → **Conectar** → GitHub te pide autorizar → aceptas →
   vuelves a la demo, GitHub aparece **Conectado**.
3. Pestaña **Chat** → "resume mi repo `<owner>/<repo>`" → el agente lee TU repo con TU token y
   responde. **Ese es el círculo cerrado: conectaste y tu agente ya usa la herramienta.**
4. Para desconectar: pestaña Conectores → GitHub → **Desconectar** (borra tu token del vault).

## 4 · Notas de seguridad (ya implementadas)

- El **client secret** vive SOLO en el server del sitio (`.env.local`), nunca en el navegador.
- El **token del usuario** se guarda cifrado (AES-256-GCM) en el vault de la instancia general,
  ligado a tu correo (`github_<correo>`). Nunca vuelve al navegador.
- El agente usa el token SOLO del usuario de esa sesión (aislamiento verificado E2E).
- **v1 read-only:** el MCP de GitHub va en modo lectura (issues/PRs/repos). Sin writes por la web.
- Scopes pedidos: `read:user repo` (leer perfil + repos). Menor privilegio.

---

*Relacionado: `Cuerpo/Plan_Pieza_C_Conectores_OAuth.md` (en el Mente OS de For3s) ·
`lib/demo/githubOAuth.ts` · `app/api/demo/connectors/github/*`.*
