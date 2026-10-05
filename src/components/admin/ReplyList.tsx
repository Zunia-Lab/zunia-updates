import { Markdown } from "@/components/Markdown";
import { MarkdownField } from "@/components/MarkdownField";
import { editComment, removeComment } from "@/app/admin/actions";
import { formatDay, teamLabel, type CommentView } from "@/lib/types";

const quiet = "rounded-full border border-[var(--z-line)] px-3 py-2 text-[13px]";

export function ReplyList({ comments, reportId }: { comments: CommentView[]; reportId: string }) {
  if (comments.length === 0) return null;
  const next = `/admin/reports/${reportId}`;
  return (
    <ul className="mt-4 flex list-none flex-col gap-4 border-t border-[var(--z-line)] p-0 pt-4">
      {comments.map((comment) => (
        <li key={comment.id}>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-dim">
            {teamLabel(comment.team)} · {formatDay(comment.createdAt)}
          </p>
          <Markdown source={comment.body} className="markdown mt-1 text-[14px] leading-relaxed text-fg-muted" />
          <div className="mt-3 flex flex-col gap-3">
            <details>
              <summary className="w-fit cursor-pointer text-[13px] text-fg-dim hover:text-fg">Edit</summary>
              <form action={editComment} className="mt-3 flex flex-col gap-3">
                <input type="hidden" name="reportId" value={reportId} />
                <input type="hidden" name="commentId" value={comment.id} />
                <input type="hidden" name="next" value={next} />
                <MarkdownField
                  id={`edit-${comment.id}`}
                  defaultValue={comment.body}
                  minLength={2}
                  maxLength={2000}
                  rows={6}
                  hint="Markdown. The team name on this reply stays the same."
                />
                <button type="submit" className={`w-fit ${quiet}`}>
                  Save reply
                </button>
              </form>
            </details>
            <details>
              <summary className="w-fit cursor-pointer text-[13px] text-fg-dim hover:text-fg">Delete</summary>
              <form action={removeComment} className="mt-3 flex flex-col gap-3">
                <input type="hidden" name="reportId" value={reportId} />
                <input type="hidden" name="commentId" value={comment.id} />
                <input type="hidden" name="next" value={next} />
                <p className="text-[13px] leading-relaxed text-fg-dim">
                  This removes the reply from the review, including the public page.
                </p>
                <button type="submit" className={`w-fit ${quiet}`}>
                  Delete reply
                </button>
              </form>
            </details>
          </div>
        </li>
      ))}
    </ul>
  );
}
