"use client";

import { useEffect, useRef } from "react";

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
  const didFocus = useRef(false);
  const onEnterRef = useRef(onEnter);
  const onEscapeRef = useRef(onEscape);

  useEffect(() => { onEnterRef.current = onEnter; }, [onEnter]);
  useEffect(() => { onEscapeRef.current = onEscape; }, [onEscape]);

  useEffect(() => {
    if (!open) {
      didFocus.current = false;
      return;
    }

    if (!didFocus.current) {
      focusRef?.current?.focus?.();
      didFocus.current = true;
    }

    const prevOverflow = document.body.style.overflow;
    if (lockBodyScroll) document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onEscapeRef.current) {
        e.preventDefault();
        e.stopPropagation();
        onEscapeRef.current();
        return;
      }
      if (e.key === "Enter" && onEnterRef.current) {
        e.preventDefault();
        e.stopPropagation();
        onEnterRef.current();
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      if (lockBodyScroll) document.body.style.overflow = prevOverflow;
    };
  }, [open, focusRef, lockBodyScroll]);
}
