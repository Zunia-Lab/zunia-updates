"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Markdown } from "@/components/Markdown";

const MAX = 4000;
const MIN = 10;

export function MarkdownField() {
  const area = useRef<HTMLTextAreaElement>(null);
  const selection = useRef({ start: 0, end: 0 });
  const [source, setSource] = useState("");
  const [narrowMode, setNarrowMode] = useState<"write" | "preview">("write");
  const [mod, setMod] = useState("Ctrl");
  const previewId = useId();

  useEffect(() => {
    setMod(/Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl");
  }, []);

  useEffect(() => {
    const form = area.current?.form;
    if (!form) return;
    const onSubmit = (event: SubmitEvent) => {
      const value = area.current?.value ?? "";
      if (value.trim().length >= MIN && value.length <= MAX) return;
      setNarrowMode("write");
      event.preventDefault();
      requestAnimationFrame(() => area.current?.reportValidity());
    };
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, []);

  function remember() {
    const el = area.current;
    if (!el) return;
    selection.current = { start: el.selectionStart, end: el.selectionEnd };
  }

  function currentRange() {
    const el = area.current;
    if (!el) return null;
    if (document.activeElement === el) return { start: el.selectionStart, end: el.selectionEnd };
    return selection.current;
  }

  function apply(from: number, to: number, text: string, selStart: number, selEnd: number) {
    const el = area.current;
    if (!el) return;
    el.focus();
    el.setRangeText(text, from, to, "end");
    el.setSelectionRange(selStart, selEnd);
    selection.current = { start: selStart, end: selEnd };
    setSource(el.value);
  }

  function wrap(before: string, after: string, placeholder: string) {
    const el = area.current;
    const span = currentRange();
    if (!el || !span) return;
    const { start, end } = span;
    const selected = el.value.slice(start, end);
    const inner = selected || placeholder;
    const innerStart = start + before.length;
    apply(start, end, before + inner + after, innerStart, innerStart + inner.length);
  }

  function lineBlock() {
    const el = area.current;
    const span = currentRange();
    if (!el || !span) return null;
    const { start, end } = span;
    const lineStart = el.value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const lineEndIndex = el.value.indexOf("\n", end);
    const blockEnd = lineEndIndex === -1 ? el.value.length : lineEndIndex;
    return { lineStart, blockEnd, lines: el.value.slice(lineStart, blockEnd).split("\n") };
  }

  function transformLines(map: (lines: string[]) => string[]) {
    const block = lineBlock();
    if (!block) return;
    const nextBlock = map(block.lines).join("\n");
    apply(block.lineStart, block.blockEnd, nextBlock, block.lineStart, block.lineStart + nextBlock.length);
  }

  function togglePrefix(prefix: string) {
    transformLines((lines) => {
      const on = lines.every((line) => line.startsWith(prefix));
      return lines.map((line) => (on ? line.slice(prefix.length) : prefix + line));
    });
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === "b") {
      event.preventDefault();
      wrap("**", "**", "bold");
    } else if (key === "i") {
      event.preventDefault();
      wrap("*", "*", "italic");
    } else if (key === "k") {
      event.preventDefault();
      insertLink();
    } else if (key === "e") {
      event.preventDefault();
      wrap("`", "`", "code");
    }
  }

  function insertLink() {
    const el = area.current;
    const span = currentRange();
    if (!el || !span) return;
    const { start, end } = span;
    const label = el.value.slice(start, end) || "text";
    const urlStart = start + label.length + 3;
    apply(start, end, `[${label}](url)`, urlStart, urlStart + 3);
  }

  const tools: { label: string; shortcut?: string; icon: ReactNode; run: () => void }[] = [
    { label: "Heading", icon: <IconHeading />, run: () => togglePrefix("## ") },
    { label: "Bold", shortcut: `${mod}+B`, icon: <IconBold />, run: () => wrap("**", "**", "bold") },
    { label: "Italic", shortcut: `${mod}+I`, icon: <IconItalic />, run: () => wrap("*", "*", "italic") },
    { label: "Strikethrough", icon: <IconStrike />, run: () => wrap("~~", "~~", "struck") },
    { label: "Link", shortcut: `${mod}+K`, icon: <IconLink />, run: insertLink },
    { label: "Quote", icon: <IconQuote />, run: () => togglePrefix("> ") },
    { label: "Bulleted list", icon: <IconList />, run: () => togglePrefix("- ") },
    {
      label: "Numbered list",
      icon: <IconOrdered />,
      run: () =>
        transformLines((lines) => {
          const marked = /^\d+\.\s/;
          const on = lines.every((line) => marked.test(line));
          return on
            ? lines.map((line) => line.replace(marked, ""))
            : lines.map((line, index) => `${index + 1}. ${line.replace(marked, "")}`);
        }),
    },
    { label: "Inline code", shortcut: `${mod}+E`, icon: <IconCode />, run: () => wrap("`", "`", "code") },
    {
      label: "Code block",
      icon: <IconFence />,
      run: () => {
        const el = area.current;
        const span = currentRange();
        if (!el || !span) return;
        const { start, end } = span;
        const selected = el.value.slice(start, end) || "code";
        const inner = start + 4;
        apply(start, end, "```\n" + selected + "\n```", inner, inner + selected.length);
      },
    },
  ];

  const count = source.length;
  const showWrite = narrowMode === "write";
  const showPreview = narrowMode === "preview";

  return (
    <div className="@container flex flex-col gap-2">
      <div className="rounded-[12px] border border-[var(--z-line)] bg-[var(--z-surface)] focus-within:border-[color-mix(in_srgb,var(--z-fg)_35%,var(--z-line))]">
        <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 border-b border-[var(--z-line)] px-1.5 py-1.5">
          {tools.map((tool) => (
            <Tip key={tool.label} label={tool.label} shortcut={tool.shortcut}>
              <button
                type="button"
                aria-label={tool.shortcut ? `${tool.label}, ${tool.shortcut}` : tool.label}
                onMouseDown={(event) => event.preventDefault()}
                onClick={tool.run}
                className="inline-flex size-8 items-center justify-center rounded-md text-fg-muted hover:bg-[var(--z-state-hover)] hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--z-fg)]"
              >
                {tool.icon}
              </button>
            </Tip>
          ))}
          <div className="ml-auto flex rounded-full border border-[var(--z-line)] p-0.5 @min-[640px]:hidden">
            <ModeButton current={showWrite} onClick={() => setNarrowMode("write")}>
              Write
            </ModeButton>
            <ModeButton current={showPreview} onClick={() => setNarrowMode("preview")}>
              Preview
            </ModeButton>
          </div>
        </div>
        <div className="grid overflow-hidden rounded-b-[11px]">
          <textarea
            ref={area}
            id="report-body"
            name="body"
            required
            minLength={MIN}
            maxLength={MAX}
            rows={10}
            placeholder={"What you expected, and what happened.\n\n- the step you took\n- what you saw"}
            aria-describedby={previewId}
            onChange={(event) => setSource(event.target.value)}
            onKeyDown={onKeyDown}
            onKeyUp={remember}
            onMouseUp={remember}
            onSelect={remember}
            onBlur={remember}
            className={
              showWrite
                ? "min-h-[220px] w-full resize-y bg-transparent px-3 py-3 font-mono text-[13px] leading-relaxed text-fg outline-none placeholder:text-fg-dim"
                : "hidden min-h-[220px] w-full resize-y bg-transparent px-3 py-3 font-mono text-[13px] leading-relaxed text-fg outline-none @min-[640px]:block"
            }
          />
          <div
            id={previewId}
            className={
              showPreview
                ? "border-t border-[var(--z-line)] px-3 py-3"
                : "hidden border-t border-[var(--z-line)] px-3 py-3 @min-[640px]:block"
            }
          >
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-fg-dim">Preview</p>
            {source.trim() ? (
              <Markdown source={source} className="markdown text-[14px] leading-relaxed text-fg" />
            ) : (
              <p className="text-[13px] text-fg-dim">Nothing to preview yet.</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 text-[12px] text-fg-dim">
        <span>Markdown is stored as you write it.</span>
        <span className={count > MAX - 200 ? "text-[var(--z-danger)]" : undefined}>
          {count} / {MAX}
        </span>
      </div>
    </div>
  );
}

function ModeButton({ current, onClick, children }: { current: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={current}
      onClick={onClick}
      className={
        current
          ? "rounded-full bg-[var(--z-glass)] px-2.5 py-1 text-[12px] text-fg"
          : "rounded-full px-2.5 py-1 text-[12px] text-fg-dim hover:text-fg"
      }
    >
      {children}
    </button>
  );
}

function Tip({ label, shortcut, children }: { label: string; shortcut?: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+6px)] left-0 z-20 whitespace-nowrap rounded-md border border-[var(--z-line)] bg-[var(--z-surface-raised)] px-2 py-1 text-[11px] text-fg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {label}
        {shortcut ? <span className="text-fg-dim"> {shortcut}</span> : null}
      </span>
    </span>
  );
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      {children}
    </svg>
  );
}

function IconHeading() {
  return (
    <Icon>
      <path d="M3 3.5v9M8 3.5v9M3 8h5M11 12.5V7.2c0-1.4 2.2-1.4 2.2 0" strokeLinecap="round" />
    </Icon>
  );
}

function IconBold() {
  return (
    <Icon>
      <path d="M4.5 3.5h4.2a2.4 2.4 0 0 1 0 4.8H4.5zM4.5 8.3h4.8a2.5 2.5 0 0 1 0 5H4.5z" strokeLinejoin="round" />
    </Icon>
  );
}

function IconItalic() {
  return (
    <Icon>
      <path d="M7 3.5h5M4 12.5h5M9.2 3.5 6.8 12.5" strokeLinecap="round" />
    </Icon>
  );
}

function IconStrike() {
  return (
    <Icon>
      <path d="M3 8h10" strokeLinecap="round" />
      <path d="M5.2 5.2c.4-1 1.4-1.7 2.8-1.7 1.8 0 2.8 1 2.8 2.2M10.8 10.8c-.4 1-1.4 1.7-2.8 1.7-1.8 0-2.8-1-2.8-2.2" strokeLinecap="round" />
    </Icon>
  );
}

function IconLink() {
  return (
    <Icon>
      <path d="M7 9.2 9 7.2M6.2 6.4 5 7.6a2.2 2.2 0 0 0 3.1 3.1l1.2-1.2M9.8 9.6 11 8.4a2.2 2.2 0 0 0-3.1-3.1L6.7 6.5" strokeLinecap="round" />
    </Icon>
  );
}

function IconQuote() {
  return (
    <Icon>
      <path d="M4 4.5v7M6.2 6.2c.8-.8 2-.6 2.4.4.3.8 0 1.6-.7 2" strokeLinecap="round" />
    </Icon>
  );
}

function IconList() {
  return (
    <Icon>
      <path d="M6 4.5h7M6 8h7M6 11.5h7" strokeLinecap="round" />
      <circle cx="3.4" cy="4.5" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="3.4" cy="8" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="3.4" cy="11.5" r="0.7" fill="currentColor" stroke="none" />
    </Icon>
  );
}

function IconOrdered() {
  return (
    <Icon>
      <path d="M6.5 4.5h6.5M6.5 8h6.5M6.5 11.5h6.5" strokeLinecap="round" />
      <path d="M2.6 5.2V3.4l-.7.5M2.4 7.2h1.6L2.4 8.8h1.7M2.4 10.4c.9 0 1.5.4 1.5.9s-.6.8-1.5.8" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  );
}

function IconCode() {
  return (
    <Icon>
      <path d="M6 5 3.5 8 6 11M10 5l2.5 3L10 11" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  );
}

function IconFence() {
  return (
    <Icon>
      <path d="M5.2 4.2 2.8 8l2.4 3.8M10.8 4.2 13.2 8l-2.4 3.8M8.6 3.5 7.4 12.5" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  );
}
