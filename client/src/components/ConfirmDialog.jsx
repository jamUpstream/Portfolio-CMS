import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
  onCancel,
  onConfirm
}) {
  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !loading) onCancel();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [loading, onCancel, open]);

  if (!open) return null;

  return (
    <div className="confirm-layer" role="presentation">
      <button className="confirm-backdrop" type="button" onClick={loading ? undefined : onCancel} aria-label="Close confirmation" />
      <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
        <div className={`confirm-icon ${variant}`}>
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h2 id="confirm-title">{title}</h2>
          <p id="confirm-description">{description}</p>
        </div>
        <div className="confirm-actions">
          <button className="button secondary" type="button" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button className={`button ${variant === 'danger' ? 'danger-button' : ''}`} type="button" onClick={onConfirm} disabled={loading}>
            {loading ? 'Working...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
