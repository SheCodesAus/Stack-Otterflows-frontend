import { useEffect } from "react";
import "./Modal.css";

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
  busy = false,
}) {
  useEffect(() => {
    if (!open) return;

    function handleEscape(event) {
      if (event.key === "Escape" && !busy) {
        onClose?.();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div className="modalOverlay" onClick={!busy ? onClose : undefined}>
      <div
        className="modalCard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modalHeader">
          <h2 id="modal-title" className="modalTitle">{title}</h2>
        </header>

        <div className="modalBody">
          <p className="modalMessage">{message}</p>
        </div>

        <footer className="modalActions">
          <button
            type="button"
            className="modalBtn modalBtnSecondary"
            onClick={onClose}
            disabled={busy}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className="modalBtn modalBtnPrimary"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Working..." : confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}

export default ConfirmModal;