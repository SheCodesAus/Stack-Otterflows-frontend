import { useEffect } from "react";
import "./Modal.css";

function ReasonModal({
  open,
  title,
  label = "Reason",
  placeholder = "Add a reason...",
  value,
  onChange,
  onSubmit,
  onClose,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  busy = false,
  requireReason = false,
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

  const canSubmit = requireReason ? value.trim().length > 0 && !busy : !busy;

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
          <label className="modalLabel" htmlFor="modal-reason">
            {label}
          </label>
          <textarea
            id="modal-reason"
            className="modalTextarea"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            rows={4}
            disabled={busy}
          />
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
            onClick={onSubmit}
            disabled={!canSubmit}
          >
            {busy ? "Submitting..." : submitLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}

export default ReasonModal;