"use client";

/**
 * Modal de confirmación integrado al diseño del panel (reemplaza al
 * window.confirm nativo — feo y fuera de marca). Overlay con blur, tarjeta
 * de la casa, y el botón de confirmar marca el peligro cuando aplica.
 */
export default function ConfirmModal({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  peligro = false,
  ocupado = false,
  onConfirmar,
  onCancelar,
}: {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  peligro?: boolean;
  ocupado?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  if (!abierto) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onCancelar}
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-edge-primary bg-surface-overlay-large p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p
          className={`text-[11px] font-mono uppercase tracking-widest mb-2 ${
            peligro ? "text-danger" : "text-brand-bold"
          }`}
        >
          {peligro ? "⚠ Acción delicada" : "Confirmar"}
        </p>
        <h2 className="text-lg font-semibold text-foreground-active mb-2">{titulo}</h2>
        <p className="text-sm text-foreground-secondary mb-6">{mensaje}</p>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onCancelar} disabled={ocupado} className="btn-pill">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={ocupado}
            className={`btn-pill ${peligro ? "border border-danger text-danger" : "btn-pill-primary"}`}
          >
            {ocupado ? "…" : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
