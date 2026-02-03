"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

type AlertVariant = "success" | "error" | "info";

type AlertContextValue = {
  showAlert: (message: string, variant?: AlertVariant) => void;
};

const AlertContext = createContext<AlertContextValue | null>(null);

export function useCustomAlert(): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    return {
      showAlert: (message: string) => {
        if (typeof window !== "undefined") window.alert(message);
      },
    };
  }
  return ctx;
}

type AlertState = {
  open: boolean;
  message: string;
  variant: AlertVariant;
};

export function CustomAlertProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AlertState>({ open: false, message: "", variant: "info" });

  const showAlert = useCallback((message: string, variant: AlertVariant = "info") => {
    setState({ open: true, message, variant });
  }, []);

  const close = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {state.open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="custom-alert-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  state.variant === "success"
                    ? "bg-emerald-100 text-emerald-600"
                    : state.variant === "error"
                      ? "bg-rose-100 text-rose-600"
                      : "bg-slate-100 text-slate-600"
                }`}
              >
                {state.variant === "success" ? (
                  <CheckCircle className="h-5 w-5" aria-hidden />
                ) : state.variant === "error" ? (
                  <AlertCircle className="h-5 w-5" aria-hidden />
                ) : (
                  <Info className="h-5 w-5" aria-hidden />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="custom-alert-title" className="text-sm font-semibold text-slate-800">
                  {state.variant === "success" ? "Success" : state.variant === "error" ? "Error" : "Notice"}
                </h2>
                <p className="mt-1 text-sm text-slate-600">{state.message}</p>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={close}
                className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}
