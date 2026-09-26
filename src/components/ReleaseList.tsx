import { formatDay, kindLabel, type ReleaseView } from "@/lib/types";

export function ReleaseList({ releases }: { releases: ReleaseView[] }) {
  if (releases.length === 0) {
    return <p className="text-fg-muted">No releases yet.</p>;
  }
  return (
    <ol className="flex list-none flex-col gap-4 p-0">
      {releases.map((release) => (
        <li key={release.id} className="rounded-[16px] border border-[var(--z-line)] bg-[var(--z-surface)] p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[15px]">
              <span className="text-fg-dim">{release.productName}</span>{" "}
              <span className="font-mono">{release.version}</span>
            </p>
            <time dateTime={release.releasedOn.toISOString().slice(0, 10)} className="font-mono text-[12px] text-fg-dim">
              {formatDay(release.releasedOn)}
            </time>
          </div>
          {release.summary ? <p className="mt-2 text-[14px] leading-relaxed text-fg-muted">{release.summary}</p> : null}
          {release.entries.length > 0 ? (
            <ul className="mt-4 flex list-none flex-col gap-3 p-0">
              {release.entries.map((entry) => (
                <li key={entry.id}>
                  <p className="text-[14px]">
                    <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-fg-dim">
                      {kindLabel(entry.kind)}
                    </span>{" "}
                    {entry.title}
                  </p>
                  {entry.body ? <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">{entry.body}</p> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
