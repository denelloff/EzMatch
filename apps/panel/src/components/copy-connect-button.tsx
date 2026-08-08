'use client';

import clsx from 'clsx';
import { useRef, useState } from 'react';
import { secondaryButtonClass } from '@/components/ui';

/** Selectable connect line + one-click copy to clipboard. */
export function CopyConnectButton({
  connect,
  copyLabel = 'Copy connect',
  copiedLabel = 'Copied',
  className,
  compact = false,
}: {
  connect: string;
  copyLabel?: string;
  copiedLabel?: string;
  className?: string;
  /** Icon-style chip for dense tables. */
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const selectAll = () => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.select();
    el.setSelectionRange(0, el.value.length);
  };

  const copy = async () => {
    selectAll();
    try {
      await navigator.clipboard.writeText(connect);
    } catch {
      document.execCommand('copy');
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div
      className={clsx(
        'flex items-center gap-1.5',
        compact ? 'max-w-full' : 'w-full max-w-md',
        className,
      )}
    >
      <input
        ref={inputRef}
        readOnly
        value={connect}
        onFocus={selectAll}
        onClick={selectAll}
        className={clsx(
          'console-surface min-w-0 flex-1 rounded-lg border border-ink-700 bg-ink-950 font-mono text-ink-200 outline-none focus:border-brand-500/50',
          compact ? 'px-2 py-1 text-[11px]' : 'px-3 py-2 text-xs',
        )}
        title={connect}
        aria-label="Connect command"
      />
      <button
        type="button"
        onClick={() => void copy()}
        className={clsx(secondaryButtonClass, 'shrink-0')}
      >
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}
