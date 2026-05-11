"use client";

import { useEffect, useReducer, type FormEvent } from "react";
import { AnimatePresence, m as motion } from "framer-motion";
import { X, ArrowRight, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useConnectModal } from "./ConnectModalContext";

type FormState = {
  email: string;
  submitting: boolean;
  submitted: boolean;
};

type FormAction =
  | { type: "set_email"; value: string }
  | { type: "submit_start" }
  | { type: "submit_done" }
  | { type: "reset" };

const initialFormState: FormState = {
  email: "",
  submitting: false,
  submitted: false,
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "set_email":
      return { ...state, email: action.value };
    case "submit_start":
      return { ...state, submitting: true };
    case "submit_done":
      return { ...state, submitting: false, submitted: true };
    case "reset":
      return initialFormState;
    default:
      return state;
  }
}

export default function ConnectModal() {
  const t = useTranslations("ConnectModal");
  const { open, hide } = useConnectModal();
  const [form, dispatch] = useReducer(formReducer, initialFormState);
  const { email, submitting, submitted } = form;

  // ESC to close — needs a global listener while modal is open, so a real
  // useEffect (not an event handler on an element) is the correct primitive.
  // react-doctor-disable-next-line react-doctor/no-effect-event-handler
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, hide]);

  // Lock body scroll while open — side effect on document.body, not a
  // synthetic event handler. The useEffect is the correct primitive.
  // react-doctor-disable-next-line react-doctor/no-effect-event-handler
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // Reset form when modal closes (debounced)
  useEffect(() => {
    if (!open) {
      const timer = window.setTimeout(() => {
        dispatch({ type: "reset" });
      }, 250);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    dispatch({ type: "submit_start" });
    // Stub: simulate async (replace with real backend later)
    window.setTimeout(() => {
      dispatch({ type: "submit_done" });
    }, 600);
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="connect-modal-title"
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6 sm:py-10"
        >
          {/* Overlay */}
          <motion.button
            type="button"
            aria-label={t("close")}
            onClick={hide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-c-gray-0/80 backdrop-blur-sm cursor-default"
          />

          {/* Modal card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md rounded-2xl border border-edge-primary bg-surface-overlay-large overflow-hidden shadow-2xl"
          >
            {/* Banner — gradient amarillo For3s */}
            <div className="relative h-32 sm:h-36 overflow-hidden">
              <div
                aria-hidden
                className="absolute inset-0"
                style={{ background: "var(--marketing-gradient)" }}
              />
              {/* Glow radial sutil al centro */}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(255,255,255,0.25) 0%, transparent 60%)",
                }}
              />
              {/* Logo overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-c-gray-0 drop-shadow-sm">
                  For3s
                </span>
              </div>
              {/* Close button */}
              <button
                type="button"
                onClick={hide}
                aria-label={t("close")}
                className="absolute top-3 right-3 size-8 inline-flex items-center justify-center rounded-full bg-c-gray-0/30 hover:bg-c-gray-0/50 backdrop-blur-sm text-c-gray-100 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-8">
              {!submitted ? (
                <>
                  <h2
                    id="connect-modal-title"
                    className="text-xl sm:text-2xl font-semibold text-foreground-active leading-tight mb-2"
                  >
                    {t("title")}
                  </h2>
                  <p className="text-sm text-foreground-secondary leading-relaxed mb-5">
                    {t("description")}
                  </p>

                  <p className="text-[11px] font-mono uppercase tracking-widest text-c-brand-70 mb-5">
                    · {t("socialProof")}
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) =>
                        dispatch({ type: "set_email", value: e.target.value })
                      }
                      placeholder={t("placeholder")}
                      aria-label={t("placeholder")}
                      className="w-full rounded-lg bg-surface-primary border border-edge-primary px-4 py-3 text-sm text-foreground-active placeholder:text-foreground-tertiary outline-none focus:border-c-brand-70 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={submitting || !email.trim()}
                      className="btn-pill btn-pill-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {submitting ? t("submitting") : t("submit")}
                      {!submitting && (
                        <ArrowRight className="size-4 ml-1.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={hide}
                      className="block w-full text-center text-xs text-foreground-tertiary hover:text-foreground-active transition-colors py-2"
                    >
                      {t("cancel")}
                    </button>
                  </form>

                  <p className="text-[11px] text-foreground-tertiary text-center leading-relaxed mt-4">
                    {t("disclaimer")}
                  </p>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center size-12 rounded-full bg-c-brand-70/15 border border-c-brand-70/30 mb-4">
                    <CheckCircle2 className="size-6 text-c-brand-70" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground-active mb-2">
                    {t("success.title")}
                  </h2>
                  <p className="text-sm text-foreground-secondary leading-relaxed mb-6">
                    {t("success.description")}
                  </p>
                  <button
                    type="button"
                    onClick={hide}
                    className="btn-pill btn-pill-secondary"
                  >
                    {t("success.close")}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
