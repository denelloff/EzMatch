'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { dangerButtonClass, secondaryButtonClass } from '@/components/ui';

export type DeleteServerLabels = {
  delete: string;
  title: string;
  body: string;
  confirm: string;
  cancel: string;
  failed: string;
};

/**
 * Modal confirm → POST delete → hard navigation so the list always refreshes.
 * Portaled to document.body so it is not clipped by layout overflow/transform.
 */
export function DeleteServerButton({
  serverId,
  labels,
}: {
  serverId: string;
  labels: DeleteServerLabels;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy]);

  async function confirmDelete() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/admin/servers/${serverId}/delete`, {
        method: 'POST',
        credentials: 'same-origin',
        redirect: 'follow',
      });

      const finalUrl = new URL(res.url);
      const deleteError = finalUrl.searchParams.get('deleteError');
      if (deleteError) {
        setError(deleteError);
        setBusy(false);
        return;
      }

      window.location.assign('/admin/servers');
    } catch {
      setError(labels.failed);
      setBusy(false);
    }
  }

  const dialog =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !busy) setOpen(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="w-full max-w-md rounded-2xl border border-ink-700/80 bg-ink-900 p-5 shadow-[0_24px_64px_-28px_rgba(0,0,0,0.85)]"
            >
              <h2
                id={titleId}
                className="text-base font-semibold text-ink-100"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {labels.title}
              </h2>
              <p className="mt-2 text-sm text-ink-300">{labels.body}</p>

              {error ? (
                <p className="mt-3 rounded-xl border border-danger-500/35 bg-danger-500/10 px-3 py-2 text-xs text-danger-500">
                  {error}
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button
                  ref={cancelRef}
                  type="button"
                  className={secondaryButtonClass}
                  disabled={busy}
                  onClick={() => setOpen(false)}
                >
                  {labels.cancel}
                </button>
                <button
                  type="button"
                  className={dangerButtonClass}
                  disabled={busy}
                  onClick={() => void confirmDelete()}
                >
                  {busy ? '…' : labels.confirm}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        className={dangerButtonClass}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        {labels.delete}
      </button>
      {dialog}
    </>
  );
}
