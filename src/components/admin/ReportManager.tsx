import Link from "next/link";
import { Markdown } from "@/components/Markdown";
import { ReplyList } from "@/components/admin/ReplyList";
import { MarkdownField } from "@/components/MarkdownField";
import { StatusPill } from "@/components/StatusPill";
import { Block, Field, fieldClass } from "@/components/admin/fields";
import { addComment, publishReport, setReportStatus } from "@/app/admin/actions";
import {
  KINDS,
  formatDay,
  kindLabel,
  releaseLabel,
  teamLabel,
  typeLabel,
  type ReleaseView,
  type ReportView,
  type Team,
} from "@/lib/types";

const primary =
  "rounded-full bg-[var(--z-button)] px-4 py-2 text-[13px] text-[var(--z-button-fg)]";
const quiet = "rounded-full border border-[var(--z-line)] px-3 py-2 text-[13px]";

export function ReportManager({
  report,
  team,
  releases,
  today,
}: {
  report: ReportView;
  team: Team;
  releases: ReleaseView[];
  today: string;
}) {
  const next = `/admin/reports/${report.id}`;
  const ready = report.status === "accepted" || report.status === "planned" || report.status === "in_progress";
  const productReleases = releases.filter((release) => release.productId === report.productId);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[16px] border border-[var(--z-line)] bg-[var(--z-surface)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-[20px] font-medium leading-snug tracking-[-0.03em]">{report.title}</h2>
          <StatusPill status={report.status} />
        </div>
        <p className="mt-2 font-mono text-[12px] text-fg-dim">
          {typeLabel(report.type)} · {report.productName} · {formatDay(report.createdAt)}
        </p>
        {report.contact ? <p className="mt-2 text-[13px] text-fg-muted">{report.contact}</p> : null}
        <p className="mt-4 text-[14px] leading-relaxed text-fg-muted">{guidance(report)}</p>
        {report.version ? (
          <p className="mt-3 text-[14px]">
            Fixed in {releaseLabel(report.productName, report.version)}.{" "}
            <Link href="/versions" className="text-fg-muted underline">
              Versions
            </Link>
          </p>
        ) : null}
        <Markdown source={report.body} />
        <ReplyList comments={report.comments} reportId={report.id} />
      </section>

      <section className="rounded-[16px] border border-[var(--z-line)] bg-[var(--z-surface)] p-5">
        <h2 className="text-[16px] font-medium">Reply</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-fg-dim">
          Signed {teamLabel(team)}. Visible on the public review once this is accepted.
        </p>
        <form action={addComment} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="reportId" value={report.id} />
          <input type="hidden" name="next" value={next} />
          <MarkdownField
            id={`comment-${report.id}`}
            minLength={2}
            maxLength={2000}
            rows={6}
            placeholder="What the reporter should know."
            hint="Markdown. Posted under your team name."
          />
          <button type="submit" className={`w-fit ${quiet}`}>
            Post reply
          </button>
        </form>
      </section>

      {report.status === "new" ? (
        <section className="rounded-[16px] border border-[var(--z-line)] bg-[var(--z-surface)] p-5">
          <h2 className="text-[16px] font-medium">Decision</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-fg-dim">
            Accept puts the title on Reviews. Decline and spam stay private. The version comes after accept.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusButton reportId={report.id} next={next} status="accepted" label="Accept" primary />
            <StatusButton reportId={report.id} next={next} status="declined" label="Decline" />
            <StatusButton reportId={report.id} next={next} status="spam" label="Spam" />
          </div>
        </section>
      ) : null}

      {ready ? (
        <section className="rounded-[16px] border border-[var(--z-line)] bg-[var(--z-surface)] p-5">
          <h2 className="text-[16px] font-medium">While it is open</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {report.status !== "in_progress" ? (
              <StatusButton reportId={report.id} next={next} status="in_progress" label="In development" />
            ) : null}
            {report.status !== "planned" ? (
              <StatusButton reportId={report.id} next={next} status="planned" label="Planned" />
            ) : null}
            {report.status !== "accepted" ? (
              <StatusButton reportId={report.id} next={next} status="accepted" label="Accepted" />
            ) : null}
            <StatusButton reportId={report.id} next={next} status="declined" label="Decline" />
          </div>
        </section>
      ) : null}

      {report.status === "declined" || report.status === "spam" ? (
        <section className="rounded-[16px] border border-[var(--z-line)] bg-[var(--z-surface)] p-5">
          <h2 className="text-[16px] font-medium">Reopen</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-fg-dim">Accept puts the title back on Reviews.</p>
          <div className="mt-4">
            <StatusButton reportId={report.id} next={next} status="accepted" label="Accept" primary />
          </div>
        </section>
      ) : null}

      {ready ? (
        <section className="rounded-[16px] border border-[var(--z-line)] bg-[var(--z-surface)] p-5">
          <h2 className="text-[16px] font-medium">Mark fixed</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">
            Pick the version that already shipped, or create it here. The public note is the line on the changelog. The product stays {report.productName}.
          </p>
          <form action={publishReport} className="mt-5 grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="reportId" value={report.id} />
            <input type="hidden" name="next" value={next} />
            <Field label="Existing version" className="sm:col-span-2">
              <select name="releaseId" className={fieldClass} defaultValue="">
                <option value="">Create the version below</option>
                {productReleases.map((release) => (
                  <option key={release.id} value={release.id}>
                    {releaseLabel(release.productName, release.version)}
                  </option>
                ))}
              </select>
            </Field>
            {productReleases.length === 0 ? (
              <p className="text-[13px] text-fg-dim sm:col-span-2">
                No {report.productName} version yet. Fill in the new version, or publish one from Versions first.
              </p>
            ) : null}
            <Field label="New version" hint="Used only when the list above is left empty.">
              <input name="version" placeholder="0.1.3" className={fieldClass} />
            </Field>
            <Field label="Date">
              <input name="releasedOn" type="date" defaultValue={today} className={fieldClass} />
            </Field>
            <Field label="Release summary" hint="Plain text. Used only for a new version." className="sm:col-span-2">
              <input name="summary" placeholder="What this version is for" className={fieldClass} />
            </Field>
            <Field label="Kind">
              <select name="kind" required defaultValue="fixed" className={fieldClass}>
                {KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {kindLabel(kind)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Public title">
              <input name="title" required defaultValue={report.title} className={fieldClass} />
            </Field>
            <Block label="Public note" hint="Markdown. Shown under the title on the changelog." className="sm:col-span-2">
              <MarkdownField
                id={`note-${report.id}`}
                required={false}
                minLength={0}
                rows={6}
                placeholder="What was fixed, in the words a reader should see."
                hint="Markdown. Optional."
              />
            </Block>
            <button type="submit" className={`w-fit ${primary}`}>
              Mark fixed
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}

function StatusButton({
  reportId,
  next,
  status,
  label,
  primary: emphasized,
}: {
  reportId: string;
  next: string;
  status: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <form action={setReportStatus}>
      <input type="hidden" name="reportId" value={reportId} />
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className={emphasized ? primary : quiet}>
        {label}
      </button>
    </form>
  );
}

function guidance(report: ReportView): string {
  if (report.status === "new") {
    return "Private. Accept it to show the title on Reviews. The version is chosen after that.";
  }
  if (report.status === "shipped" && report.version) {
    return `Public, and fixed in ${releaseLabel(report.productName, report.version)}.`;
  }
  if (report.status === "in_progress") {
    return "Public on Reviews, marked in development. When it ships, mark it fixed and name the version.";
  }
  if (report.status === "accepted" || report.status === "planned") {
    return "Public on Reviews. No version yet. When it ships, mark it fixed and name the version.";
  }
  if (report.status === "declined") return "Closed. It stays off Reviews until you accept it.";
  return "Closed as spam. It stays off Reviews.";
}
