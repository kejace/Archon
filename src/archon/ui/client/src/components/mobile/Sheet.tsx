/**
 * Sheet — a portal overlay used across the mobile reflows.
 *
 * One primitive covers both gestures the dashboard needs on a phone:
 *   - `side="left"`  → a navigation drawer (Blueprint TOC, Diffs file tree)
 *   - `side="bottom"`→ a bottom sheet (DAG filters / node details, Logs filters)
 *
 * It renders into document.body so it escapes any `overflow:hidden` /
 * transformed ancestor, traps nothing (intentionally lightweight), closes on
 * backdrop tap / Escape / swipe toward the closing edge, and locks body scroll
 * while open. Callers gate rendering on useIsMobile so it never mounts on
 * desktop. Styling lives in Sheet.module.css.
 */
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Sheet.module.css';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  side?: 'left' | 'bottom' | 'right';
  /** Accessible title shown in the sheet header (omit to hide the header). */
  title?: React.ReactNode;
  /** Extra class on the panel for per-use sizing. */
  className?: string;
  children: React.ReactNode;
}

export function Sheet({ open, onClose, side = 'bottom', title, className, children }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // Escape to close, body-scroll lock, and focus management while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      // Focus trap: keep Tab cycling within the sheet so keyboard users can't
      // tab out into the (inert, scroll-locked) page behind the backdrop.
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) { e.preventDefault(); panel.focus(); return; }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || active === panel) { e.preventDefault(); last.focus(); }
      } else if (active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Move focus into the sheet, remembering where it came from so we can
    // restore it when the sheet closes (keyboard / screen-reader users).
    const prevFocus = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      prevFocus?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  // Swipe-to-dismiss toward the panel's closing edge.
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touchStart.current;
    if (!s) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    const THRESH = 60;
    if (side === 'bottom' && dy > THRESH && dy > Math.abs(dx)) onClose();
    if (side === 'left' && -dx > THRESH && Math.abs(dx) > Math.abs(dy)) onClose();
    if (side === 'right' && dx > THRESH && Math.abs(dx) > Math.abs(dy)) onClose();
    touchStart.current = null;
  };

  return createPortal(
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        ref={panelRef}
        className={`${styles.panel} ${styles[side]} ${className ?? ''}`}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {side === 'bottom' && <div className={styles.grabber} aria-hidden="true" />}
        {title != null && (
          <div className={styles.header}>
            <span className={styles.title}>{title}</span>
            <button type="button" className={styles.close} onClick={onClose} aria-label="Close">×</button>
          </div>
        )}
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
