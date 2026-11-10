"use client";

import { useEffect, useId, useRef, useState } from "react";
import horrorFilters from "@data/horrorFilters.json";
import styles from "./GenreSelect.module.css";

// "All horror" first, then every subgenre A to Z
const OPTIONS: { id: number | undefined; name: string }[] = [
  { id: undefined, name: "All horror" },
  ...[...horrorFilters.subgenres].sort((a, b) => a.name.localeCompare(b.name)),
];

type GenreSelectProps = {
  label: string;
  value?: number;
  onChange: (id: number | undefined) => void;
  disabled?: boolean;
};

// A dropdown whose open list is short and scrolls, like the list boxes.
// The browser's own <select> list can't be resized, so this one is built by hand.
export default function GenreSelect({ label, value, onChange, disabled }: GenreSelectProps) {
  const baseId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedIndex = Math.max(
    0,
    OPTIONS.findIndex((option) => option.id === value),
  );
  const optionId = (index: number) => `${baseId}-option-${index}`;

  // Close when clicking or tapping anywhere outside
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Keep the highlighted option visible inside the scrolling list
  useEffect(() => {
    if (!open) return;
    document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- optionId only depends on baseId
  }, [open, active]);

  function openList() {
    setActive(selectedIndex);
    setOpen(true);
    // Wait for the list to render before focusing it
    requestAnimationFrame(() => listRef.current?.focus());
  }

  function close() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  function choose(index: number) {
    if (OPTIONS[index].id !== value) onChange(OPTIONS[index].id);
    close();
  }

  function onButtonKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      openList();
    }
  }

  function onListKeyDown(e: React.KeyboardEvent) {
    const last = OPTIONS.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: Math.min(active + 1, last),
      ArrowUp: Math.max(active - 1, 0),
      PageDown: Math.min(active + 8, last),
      PageUp: Math.max(active - 8, 0),
      Home: 0,
      End: last,
    };
    if (e.key in moves) {
      e.preventDefault();
      setActive(moves[e.key]);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      setOpen(false);
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      // Typing a letter jumps to the next genre starting with it
      const letter = e.key.toLowerCase();
      const order = [...OPTIONS.keys()].map((i) => (active + 1 + i) % OPTIONS.length);
      const match = order.find((i) => OPTIONS[i].name.toLowerCase().startsWith(letter));
      if (match !== undefined) setActive(match);
    }
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <span id={`${baseId}-label`} className={styles.label}>
        {label}
      </span>
      {/* The open list lines up under the button, not the label */}
      <div className={styles.field}>
        <button
          ref={buttonRef}
          type="button"
          className={styles.button}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={`${baseId}-label ${baseId}-button`}
          id={`${baseId}-button`}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={onButtonKeyDown}
          disabled={disabled}
        >
          {OPTIONS[selectedIndex].name}
        </button>

        {open && (
          <ul
            ref={listRef}
            className={styles.list}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={`${baseId}-label`}
            aria-activedescendant={optionId(active)}
            onKeyDown={onListKeyDown}
          >
            {OPTIONS.map((option, index) => (
              <li
                key={option.name}
                id={optionId(index)}
                role="option"
                aria-selected={index === selectedIndex}
                className={`${styles.option} ${index === active ? styles.active : ""}`}
                onClick={() => choose(index)}
                onPointerMove={() => setActive(index)}
              >
                {option.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
