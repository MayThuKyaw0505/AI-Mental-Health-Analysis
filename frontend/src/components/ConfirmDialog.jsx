import { useEffect, useId, useRef } from "react";

export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  busy = false,
  onCancel,
  onConfirm,
}) {
  const dialog = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    if (open && !dialog.current.open) dialog.current.showModal();
    if (!open && dialog.current.open) dialog.current.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="confirm-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <span className="eyebrow">PLEASE CONFIRM</span>
      <h2 id={titleId}>{title}</h2>
      <p id={descriptionId}>{children}</p>
      <div className="actions">
        <button
          className="button secondary"
          type="button"
          disabled={busy}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="button danger-solid"
          type="button"
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? "Deleting…" : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
