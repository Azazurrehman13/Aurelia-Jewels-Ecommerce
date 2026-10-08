import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import "../components/Dialog.css";

const DialogContext = createContext(null);
let toastId = 0;

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null); // the open confirm popup
  const [toasts, setToasts] = useState([]);
  const resolver = useRef(null);
  const okRef = useRef(null);
  const cancelRef = useRef(null);

  /* ---------- confirm popup: await confirm({...}) gives true or false ---------- */
  const close = useCallback((result) => {
    resolver.current?.(result);
    resolver.current = null;
    setDialog(null);
  }, []);

  const confirm = useCallback((options) => {
    const opts = typeof options === "string" ? { message: options } : options;
    return new Promise((resolve) => {
      resolver.current?.(false); // a popup was already open: close it as "cancel"
      resolver.current = resolve;
      setDialog({
        title: "Are you sure?",
        confirmText: "Confirm",
        cancelText: "Cancel",
        danger: false,
        ...opts,
      });
    });
  }, []);

  // Esc closes it, and the page behind it does not scroll
  useEffect(() => {
    if (!dialog) return;
    const onKey = (e) => e.key === "Escape" && close(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [dialog, close]);

  // focus the safe button first for dangerous actions
  useEffect(() => {
    if (dialog) (dialog.danger ? cancelRef : okRef).current?.focus();
  }, [dialog]);

  /* ---------- toast notifications ---------- */
  const removeToast = useCallback(
    (id) => setToasts((list) => list.filter((t) => t.id !== id)),
    []
  );

  const show = useCallback(
    (type, message, ms = 3500) => {
      const id = ++toastId;
      setToasts((list) => [...list.slice(-3), { id, type, message }]);
      setTimeout(() => removeToast(id), ms);
    },
    [removeToast]
  );

  const toast = useMemo(
    () => ({
      success: (m) => show("success", m),
      error: (m) => show("error", m, 5000),
      info: (m) => show("info", m),
    }),
    [show]
  );

  const value = useMemo(() => ({ confirm, toast }), [confirm, toast]);
  const icons = { success: "✓", error: "!", info: "i" };

  return (
    <DialogContext.Provider value={value}>
      {children}

      {dialog && (
        <div
          className="dlg-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && close(false)}
        >
          <div className="dlg" role="alertdialog" aria-modal="true" aria-labelledby="dlg-title">
            <div className={`dlg-icon ${dialog.danger ? "danger" : ""}`}>
              {dialog.danger ? "!" : "◆"}
            </div>
            <h3 id="dlg-title">{dialog.title}</h3>
            <p>{dialog.message}</p>
            <div className="dlg-actions">
              <button ref={cancelRef} className="dlg-btn ghost" onClick={() => close(false)}>
                {dialog.cancelText}
              </button>
              <button
                ref={okRef}
                className={`dlg-btn ${dialog.danger ? "danger" : ""}`}
                onClick={() => close(true)}
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span className="toast-icon">{icons[t.type]}</span>
            <p>{t.message}</p>
            <button onClick={() => removeToast(t.id)} aria-label="Close">×</button>
          </div>
        ))}
      </div>
    </DialogContext.Provider>
  );
}

export const useDialog = () => useContext(DialogContext);