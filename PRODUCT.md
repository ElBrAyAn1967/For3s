# Product

## Register

brand

---

## Dual-mode positioning (foundational)

For3s opera dos modos visuales asignados a audiencias distintas. **No son opcionales del mismo sitio — son dos posicionamientos en una sola identidad.**

### Light Mode = B2B (Soft Tech) · Verde institucional

- **Audiencia:** equipos técnicos evaluando infraestructura, áreas de innovación corporativa, comités de decisión, ingeniería con presupuesto
- **Estado mental:** evaluación, due diligence, decisión empresarial. Horario laboral, oficina, sala de juntas, presentación a stakeholders
- **Color de identidad:** **`#174023` — verde profundo institucional**. Función emocional: **"bosque corporativo"** — autoridad seria sin agresividad. Es el color del capital institucional (Bloomberg, Goldman Sachs, fondos de inversión clásicos). Comunica que esta gente sí firma contratos.
- **Lo que el modo debe transmitir:** "For3s es una empresa seria de infraestructura. Esta gente firma contratos. Podemos confiar nuestra capa de IA aquí."
- **Anti-emoción:** intimidación tecnológica, modo hacker, caos visual, "esto parece un solo developer"

### Dark Mode = B2C (Deep Tech) · Ámbar builder

- **Audiencia:** builders independientes, founders técnicos LATAM, developers construyendo con agentes, comunidad open-source, curiosos hands-on
- **Estado mental:** construcción nocturna, exploración, learning by doing. Café a las 11pm, hoodie, terminal abierta, una mano en el teclado
- **Color de identidad:** **`#EF9B11` — ámbar dorado**. Función emocional: **"láser de precisión"** — energía que guía la acción técnica, brilla por contraste sobre obsidiana. Es el color del builder ejecutando en producción.
- **Lo que el modo debe transmitir:** "Esto es de ti y para ti, builder. Aquí están patterns reales, no demos. Hay gente real haciendo esto en LATAM."
- **Anti-emoción:** corporativo frío, condescendencia, lenguaje de comité, "esto es para empresas grandes"

### Dos modos, dos colores de identidad

A diferencia de marcas con un solo color "ADN cruzado", For3s deliberadamente usa **dos colores de identidad distintos** — uno por modo:

- **Light/B2B → verde `#174023`** en overlines, headlines accent, CTAs primary, logo, dots, focus rings
- **Dark/B2C → ámbar `#EF9B11`** en los mismos roles

Esta dualidad es **decisión estratégica**, no inconsistencia: cada audiencia ve la versión de For3s que le pertenece. El comité corporativo no ve un sitio "para builders coloreado de amarillo brillante"; el builder nocturno no ve un sitio "corporativo verde". Cada uno recibe una marca diseñada **para su contexto**.

El token `--brand-bold` resuelve esto en código: en Light apunta a `--c-green-30` (verde), en Dark apunta a `--c-brand-70` (ámbar). Toda decisión visual de identidad consume `--brand-bold` o `--foreground-accent`, nunca el color crudo directamente.

---

## Users

> Contextos de uso, no arquetipos por cargo. **B2B y B2C son co-primarios** — la página debe servir a ambos sin sacrificar uno por el otro. La elección de modo (Light/Dark) por el usuario es la primera señal de su contexto.

### Contexto 1 — Evaluación empresarial de proveedor (B2B Light) · CO-PRIMARIO

- **Modo:** B2B Light
- **Situación de llegada:** equipo técnico de empresa mediana o grande recibió presupuesto para "incorporar IA agentica" y está evaluando 3-5 proveedores. Visita la página desde laptop corporativa, en reunión preparatoria o sesión interna. Modo evaluativo, escéptico, busca señales de seriedad antes de invertir tiempo en una llamada
- **Necesidad que trae:** convencer a comité interno de que For3s no es vaporware. Necesita: casos de estudio reales con cifras, claridad técnica, sensación de empresa establecida con operación real, colaboradores visibles (Frutero, Godinez Studio) como prueba de ecosistema
- **Señal de éxito:** screenshot o descarga de una sección para presentarla internamente, o agendar una llamada formal sin fricción
- **Punto de pérdida:** copy genérico de "transform your business with AI", ausencia de números concretos, sensación de "esto parece portfolio personal"

### Contexto 2 — Builder nocturno explorando (B2C Dark) · CO-PRIMARIO

- **Modo:** B2C Dark
- **Situación de llegada:** founder técnico o developer LATAM construyendo un proyecto con agentes (Telegram bot, automation, side project). Encontró For3s vía Twitter, Discord, comunidad Frutero, AgentCamp, o búsqueda directa. Modo curioso, técnico, hands-on, sin tiempo para fluff
- **Necesidad que trae:** un pattern aplicable esta noche. Una guía concreta en Docs. Sentir que hay gente real haciendo esto en español. Validar que su intuición técnica está alineada con quienes ya construyeron antes (OpenClaw, Kukulcan Brain, Godinez Studio)
- **Señal de éxito:** copia código de Docs, comparte un link en Discord/Twitter, vuelve la noche siguiente, eventualmente entra al círculo
- **Punto de pérdida:** "request a demo to learn more", gated content educativo, marketing antes de sustancia, condescendencia técnica

### Contexto 3 — Curioso no-técnico por recomendación (B2C Light)

- **Modo:** B2C Light
- **Situación de llegada:** alguien le dijo "mira For3s, hacen cosas con IA". Probablemente founder no técnico, product manager, marketer LATAM. Quiere entender QUÉ es For3s sin sentirse estúpido ni perderse en jerga
- **Necesidad que trae:** un mapa mental claro en menos de 30 segundos: "ah, For3s hace X, sirve para Y, y existe Z." Sentir que la página le habla, no por encima de él
- **Señal de éxito:** sigue scrolleando 2+ minutos, lee un caso de estudio completo, o entra al círculo aunque no tenga necesidad inmediata
- **Punto de pérdida:** kubernetes orchestration patterns en hero, asumir conocimiento previo de agentic frameworks, lenguaje "para developers"

### Contexto 4 — Comprador serio listo para conversar (B2B Light)

- **Modo:** B2B Light
- **Situación de llegada:** ya visitó For3s antes. Ya leyó Docs. Vuelve con intención clara: contratar, agendar, o sumar a su comité
- **Necesidad que trae:** fricción mínima para conectar. Calendario, email directo, formulario corto. Validación de que el equipo opera (no es desk de soporte automatizado)
- **Señal de éxito:** completa flujo de contacto o agenda llamada
- **Punto de pérdida:** formulario largo, "we'll get back to you in 48hrs", ausencia de canal directo, sensación de "esto es trámite"

---

## Product Purpose

**For3s en 1 línea:**

For3s es la empresa de infraestructura para agentes de IA construida desde LATAM, con un sistema dual que sirve a la empresa en horario laboral y al builder en horario nocturno.

**Por qué existe:**

LATAM está copiando playbooks de San Francisco que asumen contexto distinto: equipos de 50 ingenieros, presupuestos de millones, infra cloud-native nativa. La realidad LATAM es equipos de 5, presupuestos de cientos de miles, y stacks heredados. Las empresas que quieren incorporar agentes en producción se topan con dos opciones: contratar consultora cara que les vende deck genérico, o construir desde cero con tutoriales de YouTube. For3s ocupa el espacio del medio — infraestructura adaptada a la realidad operativa de la región, con el rigor técnico de los mejores proveedores globales. La operación se sostiene en colaboración con **Frutero Club** (ecosistema de builders LATAM) y **Godinez Studio** (estudio de producto y desarrollo), lo que da a For3s acceso a comunidad real, casos de uso reales, y validación constante.

**Cómo se ve el éxito:**

- **B2B Light:** comité empresarial valida que For3s es opción seria sin necesidad de pedir referencias externas. Salen de la página con sensación de "esta gente sí construye". Llamada agendada con expectativa clara
- **B2C Dark:** builder regresa a Docs la semana siguiente y trae a un compañero. La página se vuelve marcador. For3s aparece en conversaciones de comunidad como referencia técnica
- **Métrica norte:** "la gente vuelve" — no medimos visitas únicas, medimos retorno. La página funciona si genera segundas visitas en menos de 7 días

**Qué NO es For3s:**

- No somos una agencia de implementación con staff augmentation. No hacemos "ponemos a 3 developers en tu equipo por 6 meses"
- No somos un curso ni una academia disfrazada de empresa. La educación es subproducto del trabajo real, no producto principal (AgentCamp existe como programa hermano, no como For3s)
- No somos un wrapper de OpenAI con UI bonita. Lo que damos es infraestructura, no chat
- No somos un consultorio gratis. Las llamadas tienen barrera mínima intencional — primero conversación de valor
- No somos una plataforma genérica de "AI for everything". Foco en agentes operativos para empresas y builders, no IA generativa para creators
- No somos community-first. Tenemos comunidad vía Frutero, pero la propuesta principal de For3s es operación, no pertenencia
- No somos cute. No personificamos al producto. No tenemos mascota. No hablamos como amigo simpático

---

## Brand Personality

### 3 adjetivos de personalidad

1. **Editorial-técnico** — escribimos como revista de oficio, no como agencia de marketing. Cada frase carga peso. Sin floritura, sin metáforas vacías. La autoridad viene del rigor del texto, no de adjetivos
2. **Latinoamericano sin disculpas** — operamos desde LATAM, pensamos en LATAM primero, contratamos en LATAM. No es "también atendemos LATAM" — es nuestro centro. No traducimos contenido SF al español, generamos contenido LATAM y lo traducimos al inglés
3. **Dualidad consciente** — no es contradicción ser empresa seria Y comunidad técnica al mismo tiempo. Es una decisión arquitectónica. Cada superficie del sitio sabe en qué modo está y responde acorde

### Voz en B2B Light (página principal, casos de estudio, evaluación corporativa)

- **Pronombre con el lector:** "su equipo", "ustedes". Trato formal sin paternalismo
- **Densidad de copy:** equilibrado — denso en sustancia técnica, aireado en respiración visual. Una idea por párrafo
- **Anglicismos:** técnicos OK (deployment, infrastructure, orchestration). Marketing-anglicismos prohibidos (leverage, empower, unlock)
- **Frases por párrafo:** 3-5. Declarativas, terminadas en punto. Sin signos de exclamación
- **Cifras y datos:** siempre que se puedan, contextualizadas. "14ms p99 latency en producción" > "ultra-fast"
- **Humor:** seco si aparece. Default: sin humor. La autoridad B2B no compite con la simpatía
- **Primera persona:** "For3s" o "nuestro equipo". Evitar "yo" — la marca habla como empresa

### Voz en B2C Dark (Docs, comunidad, contenido para builders)

- **Pronombre con el lector:** "tú", directo. Mezcla con "vos" aceptada si el contexto lo pide
- **Densidad de copy:** denso en código y patterns, conversacional en explicación. Asume conocimiento técnico básico
- **Anglicismos y Spanglish:** libres. "Hacer deploy", "el stack", "una request" son nativos en LATAM builder. No traducir forzadamente
- **Code-switching:** nativo. "Lo importante es que tu agente sea reproducible, no que sea fancy"
- **Emojis:** contextual (✓, ⚡, →). No emojis decorativos ni faces. Cero emojis en hero
- **Humor:** seco builder, regional cuando aplica. "No te compliques, no estás construyendo Skynet"
- **Primera persona:** "nosotros" o "el equipo de For3s". Brian habla como autor identificable en posts de Docs, no en marketing

### Frases canónicas (sí suenan a For3s)

1. *"Construimos infraestructura, no features."*
2. *"Latinoamérica no necesita imitar a SF. Necesita su propio playbook."*
3. *"Si no funciona en producción real, no funciona."*
4. *"Cada doc en este sitio salió de un proyecto que ya pagó alguien."*
5. *"For3s opera donde otros prometen."*
6. *"Dos modos, dos colores. Verde para el comité, ámbar para el builder."*
7. *"Esto no es un curso. Es lo que aprendimos cobrando."*
8. *"Abrimos las puertas hacia la era de los agentes."*

### Frases prohibidas (no debe decir nunca For3s)

1. *"Revolutionizing the AI landscape."*
2. *"Empowering teams to leverage cutting-edge technology."*
3. *"Welcome to the future of work."*
4. *"Built with love."* / *"Made with ♥ in LATAM."*
5. *"Your AI assistant."* / *"Tu asistente inteligente."*
6. *"Unlock the power of agents."*
7. *"Reimagine your workflow."*
8. *"Trusted by 1000+ companies worldwide."* (a menos que sea verdad y demostrable)

### Tono emocional objetivo

- **B2B Light** — principal: **confianza institucional** (Stripe, Linear corporate). Secundario: **autoridad editorial** (Stripe Press, A16z technical writing)
- **B2C Dark** — principal: **pertenencia técnica** (Modal, Vercel hobby, Lee Robinson posts). Secundario: **autoridad accesible** (impeccable.style, builder communities serias)

---

## Anti-references (mixto: qué evitar, qué tomar)

### Godinez.AI — anti-tono, NO anti-relación

Godinez.AI es **colaborador operativo** de For3s. La relación es real y se mantiene. Pero **visualmente y en tono son hermanos con identidad distinta**, no clones.

- **Evitamos de Godinez.AI:** la personificación cute ("El asistente al que le delegas todo", "tu empleado AI que nunca falta al trabajo"), el anthropomorfismo de IA como empleado-personaje, el framing "delegate everything" que infantiliza al usuario, el lenguaje cariñoso con el producto, el copy "más barato que un intern"
- **Razón estratégica:** Godinez.AI opera en B2C SaaS para SMB no-técnico — su personificación funciona ahí. For3s opera en infraestructura para empresa media-grande y builder técnico — la personificación destruye autoridad. El cliente B2B no quiere "el asistente al que le delega" — quiere "la empresa que despliega su infra". El builder no quiere "tu empleado AI" — quiere "el stack que ya usaste tú primero"

### Frutero Club — anti-format, NO anti-comunidad

Frutero es **colaborador operativo y referencia LATAM**. La cercanía cultural se preserva. Lo que NO replicamos es la propuesta visual y el lenguaje.

- **Evitamos de Frutero:** naming juguetón (Casa Frutero, $PULPA, Avocado/Lemon/Apple), success metrics como "25+ hackathon wins" en hero, testimoniales informales ("Los mensajes de Jazz haha"), community-vibe como propuesta principal en lugar de operación, el cargado emocional de "comunidad" sobre "infraestructura", el copy "Acelera tu carrera con IA y Cripto"
- **Razón estratégica:** Frutero es comunidad como producto — su naming juguetón funciona porque la comunidad ES el atractivo. For3s tiene comunidad como subproducto (vía Frutero) pero la propuesta principal es la operación. El lector B2B necesita ver "infraestructura" en hero, no "acelera tu carrera". El builder B2C respeta más a quien construye que a quien organiza meetups

### Espacio Cripto / Substack-style — anti-format educativo

- **Evitamos:** posicionarse como academia o newsletter educativo, formato "aprende desde cero", gated content que pide email antes de dar valor, look de Substack landing (banner con título + descripción + form de suscripción + "X subscribers"), categorizarse como "academy"
- **Razón estratégica:** For3s no es escuela. La educación que damos en Docs es derivada del trabajo, no producto en sí. El modal de captura de leads sí puede inspirarse del UX de Espacio Cripto (modal flotante con propuesta clara, no redirección), pero el posicionamiento general NO es "aprende For3s en 6 semanas". AgentCamp existe como programa hermano para eso

### AWS / Azure landing — anti-corporate-cold

- **Evitamos:** gris corporativo, copy plagado de buzzwords ("synergize", "enterprise-grade", "mission-critical"), navegación impenetrable de 8 niveles, ausencia de personalidad
- **Razón estratégica:** el otro extremo del problema. AWS funciona porque ya es estándar de facto. For3s no puede ser AWS-frío sin tener el peso institucional para sostenerlo

### Bubble.io / templates Vercel genéricos — anti-saturación visual

- **Evitamos:** cards neon brillantes sobre fondo oscuro saturado, hero con gradient "build the future faster", "Powered by AI" en footer, copy template hyperlocal de SaaS landing
- **Razón estratégica:** look de café instantáneo. Inmediatamente legible como "esto es generado por template, no por equipo"

### Web3 con neon verde/morado sobre negro — anti-estética obsoleta

- **Evitamos:** "hacker chic" 2020-2022, fondo negro saturado con accentos fluorescentes, terminal-vibe forzado, glitch effects, cyberpunk fonts
- **Razón estratégica:** se ve junior. La estética crypto-bro envejeció mal. For3s usa obsidiana profunda con tinte azul (#0B0C10), NO negro puro neon-saturado

---

## References positivas (qué tomamos)

Las marcas/sitios que SÍ inspiran For3s, con qué tomamos y qué no de cada uno:

### Modal.com — arquitectura de tokens

- **Tomamos:** sistema de semantic tokens (`foreground-primary`, `surface-overlay-large`, `edge-primary`), botones pill con micro-feedback (`scale: 0.97` en :active), hovers translúcidos (`rgba(255,255,255,0.05)` sobre dark), `color-mix(in oklab, ...)` para mezclas precisas, anillo focus 3px brand-color, font-feature-settings: "cv11" en Inter (single-storey 'a')
- **No tomamos:** verde lima como brand (For3s es ámbar), dark mode hardcoded sin toggle (For3s tiene dual mode B2B Light + B2C Dark)

### impeccable.style — voz editorial

- **Tomamos:** voz declarativa corta ("Brand work is not product UI"), oraciones de 5-9 palabras terminadas en punto, sin emojis, sin "discover/amazing/powerful", section-nav numerada flotante como pill bottom-center, why-panels rotativos con stacked grid
- **No tomamos:** Cormorant Garamond serif italic (For3s usa Inter), light mode cremoso con tinte magenta (For3s tiene Soft Tech B2B + Deep Tech B2C explícitos)

### Vercel (post-2023) — dualidad corporate + builder

- **Tomamos:** balance entre marketing serio (`/`) y comunidad técnica (`/templates`, `/blog`), Inter Variable como primary, dark mode con identidad clara, micro-interactions discretas en hover/focus
- **No tomamos:** el gradient negro-a-azul saturado del hero, "Build the future faster" como copy template

### Stripe Press / Stripe corporate — autoridad editorial

- **Tomamos:** copy denso pero respirado, tablas técnicas como elementos visuales, números concretos en headings, ausencia total de stock photos
- **No tomamos:** look pastel cremoso (Stripe Press es claramente brand de revista, For3s es brand de empresa de infra)

---

## Design Principles

1. **Dos modos, dos colores de identidad.** Verde `#174023` carga la identidad en B2B Light (institucional). Ámbar `#EF9B11` carga la identidad en B2C Dark (builder). Cada audiencia recibe el color diseñado para su contexto mental. La voz se modula entre modos pero NO se rompe — los principios narrativos cruzan, los colores no. **NO implica:** cambiar el color al azar entre superficies; el token `--brand-bold` resuelve la elección y nunca se mezcla con el otro dentro del mismo modo.

2. **Mostrar antes que prometer.** Cada claim técnico debe estar respaldado con caso real, código verificable, o métrica concreta. Sin evidencia, la palabra no aparece. La autoridad la da el archivo demostrable, no el adjetivo. **NO implica:** que cada palabra requiera footnote — implica que las afirmaciones grandes ("infra confiable para producción") deben mapear a algo público

3. **LATAM nativo, no traducido.** El copy se piensa en español primero. Inglés es traducción posterior. El sitio se siente hecho en LATAM aunque tenga `/en`. **NO implica:** rechazar audiencia internacional — implica que la identidad operativa es LATAM-first y los recursos en EN son derivados, no la fuente

4. **Densidad antes que decoración.** En desktop, llenar espacio con info real. En mobile, comprimir con jerarquía clara. Cero "scroll-jacking" para ocultar que no hay nada. Cero animaciones que rellenen vacío conceptual. **NO implica:** ascetismo visual — implica que cada decoración tiene que ganar su lugar contra alternativa de info real

5. **Sin gates falsos.** No pedimos email para leer Docs. No exigimos signup para ver casos de estudio. La fricción se gana después de dar valor, no antes. El modal de "círculo" aparece como invitación, no como condición. **NO implica:** todo gratis para siempre — implica que el primer valor es público, los siguientes niveles tienen fricción intencional y honesta

---

## Accessibility & Inclusion

- **WCAG target:** AA mínimo, AAA en superficies críticas (CTAs, navegación)
- **Contraste mínimo:** 4.5:1 body text, 3:1 large text — defaults WCAG AA
- **Reduced motion:** respetar `prefers-reduced-motion: reduce` siempre. Las micro-interacciones (`scale: 0.97`, hover lifts, spotlight del Hero) se desactivan
- **Color blindness:** estados nunca se diferencian solo por color. Siempre acompañados de icono, texto, o forma. Status pills con check + texto, no solo color verde
- **Keyboard navigation:** todos los controles accesibles via `Tab`. Focus visible con anillo ámbar 3px. Modal de "círculo" trappea focus y restaura al cerrar
- **Screen readers:** labels en español primario, inglés en `/en`. `aria-label` en iconos solitarios (hamburger, theme toggle, language switcher). `aria-pressed` en toggles. `role="dialog"` + `aria-modal` en modal
- **Touch target mínimo:** 44x44px iOS / 48x48px Android para cualquier control interactivo
- **i18n:** ES + EN completos vía `next-intl`. Considerar que strings en español son ~20% más largos que inglés — layouts deben permitir overflow gracioso
- **Modo claro/oscuro:** respeta `prefers-color-scheme` del OS en primera visita. Override manual del usuario persiste en localStorage. Cambio de idioma NO afecta el modo
- **Otras:**
  - Spotlight del Hero solo en `hover: hover` (desactivado en touch)
  - Animaciones de framer-motion con `viewport={{ once: true }}` para evitar re-disparos en scroll back
  - Marquee de skills usa `prefers-reduced-motion` para pausar animación

---

## (Extras opcionales — no obligatorios por impeccable)

### Success Metrics

- Visitantes únicos / mes: **3,000 mes 1 → 10,000 mes 6**
- Subs al círculo (B2C Dark): **2-5% de visitantes únicos**
- Llamadas agendadas (B2B Light) / mes: **5-15 mes 1, escalable**
- Tiempo medio en `/docs`: **3+ minutos** (señal de lectura real, no bounce técnico)
- Bounce hero: **< 50%** (la mayoría debe scrollear más allá del hero)
- **Métrica norte:** "la gente vuelve" — second-visit rate dentro de 7 días, target 25%+

### Direct competition

- **Vercel AI SDK** — Hacen bien: estándar técnico, comunidad de Next.js. Hacen mal: posicionamiento "para todos" diluye foco. Diferenciador For3s: LATAM-first, infraestructura adaptada a stacks heredados, no solo cloud-native
- **LangChain / LangGraph** — Hacen bien: vocabulario técnico instalado, ecosystem amplio. Hacen mal: complejidad innecesaria, "framework para frameworks", DX confusa. Diferenciador For3s: opinión clara, stack opinionado, "esto sí, esto no"
- **AI consultancies LATAM (genéricas)** — Hacen bien: cercanía cultural. Hacen mal: posicionamiento de agencia (staff aug, "ponemos developers"), no construyen producto propio, dependencia de horas-hombre. Diferenciador For3s: empresa de infraestructura con producto, no servicio horas-hombre

### Roadmap visible (6 meses)

- **Q3 2026:** consolidar página principal con Soft Tech (B2B Light) + Deep Tech (B2C Dark). Docs llenas en 30% de items (focus: OpenClaw, Hermes, Anatomía de un agente, Patrones de orquestación). Casos de estudio 2-3 publicados con cifras reales
- **Q4 2026:** Docs al 70%. Modal de "círculo" con backend real (Mailchimp, Resend o ConvertKit). Primeros 2 case studies firmados con cliente B2B real. Sistema de booking integrado para llamadas. Sync visible con AgentCamp 2026

### Glosario For3s

- **Agente** — sistema de IA con memoria persistente, contexto propio, capacidad de acción, e identidad emergente. NO es chatbot. NO es prompt + LLM
- **Infraestructura** — la capa que permite construir, desplegar, escalar, observar y mantener agentes en producción. NO incluye el agente mismo. NO incluye servicios de implementación
- **Builder** — persona técnica que construye con agentes. NO es synonym de developer. Incluye founders técnicos, ingenieros, side-project makers
- **El círculo** — lista de email cerrada con acceso temprano a herramientas, betas privadas, contenido técnico no público. Captura por modal "Conectar"
- **Era agentica** — momento actual donde los agentes operan como entidades persistentes con memoria y acción, no como chatbots de turno. Empieza ~2024-2025 con tool use estándar
- **Modo dual** — la decisión foundational de For3s: B2B Light + B2C Dark. No es feature, es identidad
- **Soft Tech** — el lenguaje visual del modo claro (B2B): bento cards, hueso, sombras sutiles, autoridad cálida
- **Deep Tech** — el lenguaje visual del modo oscuro (B2C): obsidiana, bordes finos, sin sombras, autoridad técnica
- **OpenClaw** — agente operativo desarrollado dentro del ecosistema For3s, base de varios proyectos (Godinez Studio chat-action-cards, github-worker, etc.). Documentado en Docs
- **Hermes** — agente mensajero de For3s, capa de comunicación entre agentes y humanos. Documentado en Docs
- **Kukulcan Brain** — sistema de memoria persistente y conocimiento para agentes, basado en knowledge graphs. Proyecto interno
- **AgentCamp** — programa intensivo de 4 semanas para builders. Parte del ecosistema Frutero, NO es For3s, pero comparte filosofía orchestration-first
- **Frutero Club** — comunidad de builders y founders LATAM. Colaborador operativo de For3s, donde nace la validación de proyectos
- **Godinez Studio** — estudio de producto y desarrollo. Colaborador operativo de For3s, brazo de implementación creativa

### Restricciones técnicas

- **Performance:** LCP < 2s, JS budget < 200kb por ruta. Cualquier animación nueva tiene que ganar su peso
- **SEO:** keywords objetivo — "infraestructura agentes IA LATAM", "agent infrastructure LATAM", "agentes IA producción", "For3s"
- **Hosting:** Vercel (Next.js 16 + Turbopack). Limita ciertos features experimentales pero ofrece edge runtime
- **Stack actual:** Next.js 16 App Router + Tailwind CSS v4 + shadcn/ui + framer-motion + next-intl + Inter + Fira Mono (validar migración a JetBrains Mono según `DESIGN.md`)
- **Equipo:** núcleo operativo de For3s reducido — limita complejidad mantenible. Cualquier sistema visual nuevo debe documentarse en `DESIGN.md` para sostenibilidad
- **i18n:** ES + EN vía `next-intl`. Toda key nueva en `messages/es.json` exige par en `messages/en.json` antes de merge

---

> Este `PRODUCT.md` es la fuente de verdad estratégica de For3s. Cualquier decisión de diseño debe poder anclarse aquí. Si una decisión "no encaja", o cambiamos la decisión o actualizamos este archivo — nunca silenciosamente.
>
> Última actualización: 2026-05-11 · v1 inicial
