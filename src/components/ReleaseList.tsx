import { Markdown } from "@/components/Markdown";
import { kindLabel, releaseLabel, type Kind, type ReleaseView } from "@/lib/types";

const KIND_CLASS: Record<Kind, string> = {
  added: "text-fg-dim",
  fixed: "text-[var(--z-info-fg)]",
  changed: "text-fg-dim",
  security: "text-[var(--z-danger-fg)]",
};

const KIND_DOT: Record<Kind, string> = {
  added: "bg-[var(--z-button)]",
  fixed: "bg-[var(--z-info)]",
  changed: "bg-fg-dim",
  security: "bg-[var(--z-danger)]",
};

function releaseDate(value: Date) {
  const month = new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(value);
  return { month, day: value.getUTCDate(), year: value.getUTCFullYear() };
}

export function ReleaseList({ releases }: { releases: ReleaseView[] }) {
  if (releases.length === 0) {
    return (
      <div className="rounded-[16px] border border-dashed border-[var(--z-line)] px-5 py-10">
        <p className="text-[15px]">No releases yet.</p>
        <p className="mt-1 max-w-md text-[13px] leading-relaxed text-fg-dim">
          When a version ships, the notes show up here.
        </p>
      </div>
    );
  }

  return (
    <ol className="flex list-none flex-col p-0">
      {releases.map((release) => {
        const date = releaseDate(release.releasedOn);
        return (
        <li key={release.id} className="border-t border-[var(--z-line)] py-8 first:border-t-0 first:pt-2">
          <article className="grid gap-x-10 gap-y-3 sm:grid-cols-[7.75rem_minmax(0,1fr)]">
            <time dateTime={release.releasedOn.toISOString().slice(0, 10)} className="font-mono leading-none text-fg-dim">
              <span className="block text-[13px] text-fg">
                {date.month} {date.day}
              </span>
              <span className="mt-1 block text-[12px]">{date.year}</span>
            </time>
            <div className="min-w-0">
              <header>
                <h3 className="font-mono text-[28px] leading-none tracking-[-0.04em]">
                  {releaseLabel(release.productName, release.version)}
                </h3>
              </header>
              {release.summary ? (
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-fg-muted">{release.summary}</p>
              ) : null}
              {release.entries.length > 0 ? (
                <ul className="mt-6 flex list-none flex-col gap-6 border-t border-[var(--z-line)] p-0 pt-6">
                  {release.entries.map((entry) => (
                    <li key={entry.id} className="grid gap-x-4 gap-y-1 sm:grid-cols-[5.5rem_minmax(0,1fr)]">
                      <p className={`font-mono text-[10px] uppercase tracking-[0.16em] sm:pt-1.5 ${KIND_CLASS[entry.kind]}`}>
                        <span aria-hidden="true" className={`mr-1.5 inline-block size-1.5 translate-y-[-1px] rounded-full ${KIND_DOT[entry.kind]}`} />
                        {kindLabel(entry.kind)}
                      </p>
                      <div className="min-w-0">
                        <h4 className="text-[15px] font-medium leading-snug tracking-[-0.02em]">{entry.title}</h4>
                        {entry.body ? (
                          <Markdown source={entry.body} className="markdown mt-1.5 text-[14px] leading-[1.65] text-fg-muted" />
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </article>
        </li>
        );
      })}
    </ol>
  );
}
