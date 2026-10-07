import { useEffect, useRef } from 'react';
import { fine, reduce } from '../lib/motion';

const TYPING = 'input, textarea, [contenteditable="true"]';

// Precision arrow cursor (mouse only):
// Sharp geometric arrow matching the OS/Figma precision style with the hotspot at its tip (1.5, 1.5).
// Adapts fill & stroke to the active theme with snappy click feedback.
export default function Cursor() {
  const pointerRef = useRef(null), layerRef = useRef(null);
  const on = fine && !reduce;

  useEffect(() => {
    if (!on) return;
    const root = document.documentElement;
    const pointer = pointerRef.current, layer = layerRef.current;
    root.classList.add('has-cursor');

    // Modal dialogs (project architecture, command menu) render in the browser's top layer, above any z-index.
    // The cursor lives in the top layer too (a manual popover) and is lifted back above each dialog as it opens.
    const lift = () => {
      if (!layer?.showPopover) return;
      if (layer.matches(':popover-open')) layer.hidePopover();
      layer.showPopover();
    };
    lift();
    const dialogs = new MutationObserver(lift);
    dialogs.observe(document.body, { subtree: true, attributeFilter: ['open'] });

    const move = e => {
      if (!root.classList.contains('cursor-on')) root.classList.add('cursor-on');
      if (pointer) pointer.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`;
    };
    const over = e => {
      const t = e.target;
      root.classList.toggle('cursor-text', !!t.closest?.(TYPING));
    };
    const leave = () => root.classList.remove('cursor-on');

    addEventListener('pointermove', move, { passive: true });
    addEventListener('pointerover', over, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);

    return () => {
      removeEventListener('pointermove', move);
      removeEventListener('pointerover', over);
      document.documentElement.removeEventListener('pointerleave', leave);
      dialogs.disconnect();
      if (layer?.matches?.(':popover-open')) layer.hidePopover();
      root.classList.remove('has-cursor', 'cursor-on', 'cursor-text');
    };
  }, [on]);

  if (!on) return null;
  return (
    <div className="cursor" popover="manual" ref={layerRef} aria-hidden="true">
      <span className="cursor-pointer" ref={pointerRef}>
        <svg width="22" height="26" viewBox="0 0 22 26" fill="none" className="cursor-arrow">
          <path
            d="M 1.5 1.5 L 1.5 21.5 L 7.2 15.2 L 16.5 16.8 Z"
            className="cursor-path"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </div>
  );
}

