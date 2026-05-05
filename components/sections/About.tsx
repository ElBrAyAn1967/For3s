"use client";

import { motion } from "framer-motion";
import { collaborators } from "@/lib/data";

const values = [
  {
    label: "Infraestructura",
    desc: "Construyo la base que otros necesitan para escalar.",
  },
  {
    label: "Comunidad",
    desc: "Los mejores productos nacen de comunidades reales.",
  },
  {
    label: "LATAM First",
    desc: "Resuelvo problemas desde y para América Latina.",
  },
];

export default function About() {
  return (
    <section
      id="about"
      className="section-blend py-16 sm:py-24 bg-surface-overlay-large"
      style={{ ["--blend-from" as string]: "var(--surface-primary)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-2 gap-10 md:gap-16 items-start"
        >
          {/* Left */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-4 text-c-brand-70">
              Sobre mí
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-5 sm:mb-6 leading-tight text-foreground-active">
              For3s — Las puertas hacia{" "}
              <span className="text-c-brand-70">la nueva era</span>
            </h2>
            <p className="text-foreground-secondary leading-relaxed mb-4">
              Soy Brian, CEO de{" "}
              <strong className="text-foreground-active font-semibold">
                For3s
              </strong>{" "}
              — empresa nueva de infraestructura para agentes de IA en LATAM. El
              nombre viene del latín: <em>las puertas</em>. Cada proyecto que
              construyo es una puerta que abrimos juntos.
            </p>
            <p className="text-foreground-secondary leading-relaxed mb-8">
              No construyo features — construyo plataformas. Mi enfoque está en
              la capa de infraestructura: orquestación de agentes, sistemas de
              memoria, y los protocolos que hacen posible la siguiente
              generación de software.
            </p>

            {/* Collaborators */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-tertiary mb-3">
                En colaboración con
              </p>
              {collaborators.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="flex items-start gap-3 p-4 rounded-xl border border-edge-secondary bg-surface-primary hover:border-edge-primary hover:bg-surface-primary-hover transition-colors"
                >
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-c-brand-70 flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-semibold text-sm text-foreground-active">
                        {c.name}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          color: "var(--c-brand-70)",
                          backgroundColor:
                            "color-mix(in oklab, var(--c-brand-70) 10%, transparent)",
                          border:
                            "1px solid color-mix(in oklab, var(--c-brand-70) 25%, transparent)",
                        }}
                      >
                        {c.role}
                      </span>
                    </div>
                    <p className="text-xs text-foreground-secondary leading-relaxed">
                      {c.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right — values */}
          <div className="flex flex-col gap-3 mt-2 md:mt-12">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-tertiary mb-1">
              Cómo opero
            </p>
            {values.map((v, i) => (
              <motion.div
                key={v.label}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className="flex items-start gap-4 p-5 rounded-xl border border-edge-secondary bg-surface-primary hover:border-edge-primary hover:bg-surface-primary-hover transition-colors"
              >
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-c-brand-70 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground-active mb-1">
                    {v.label}
                  </p>
                  <p className="text-sm text-foreground-secondary leading-relaxed">
                    {v.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
