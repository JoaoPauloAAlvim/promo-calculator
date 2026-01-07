"use client";

import { useEffect } from "react";

type Options = {
  open: boolean;

  focusRef?: React.RefObject<HTMLElement | null>;
  lockBodyScroll?: boolean;

  onEnter?: () => void;
  onEscape?: () => void;
};

export function useModalA11y({
  open,
  focusRef,
  lockBodyScroll = true,
  onEnter,
  onEscape,
}: Options) {
  useEffect(() => {
    if (!open) return;

    focusRef?.current?.focus?.();

    const prevOverflow = document.body.style.overflow;
    if (lockBodyScroll) document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onEscape) {
        e.preventDefault();
        e.stopPropagation();
        onEscape();
        return;
      }

      if (e.key === "Enter" && onEnter) {
        e.preventDefault();
        e.stopPropagation();
        onEnter();
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      if (lockBodyScroll) document.body.style.overflow = prevOverflow;
    };
  }, [open, focusRef, lockBodyScroll, onEnter, onEscape]);
}