import { Markdown } from "@/components/Markdown";
import { formatDay, teamLabel, type CommentView } from "@/lib/types";

export function CommentList({ comments }: { comments: CommentView[] }) {
  if (comments.length === 0) return null;
  return (
    <ul className="mt-4 flex list-none flex-col gap-3 border-t border-[var(--z-line)] p-0 pt-4">
      {comments.map((comment) => (
        <li key={comment.id}>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-dim">
            {teamLabel(comment.team)} · {formatDay(comment.createdAt)}
          </p>
          <Markdown source={comment.body} className="markdown mt-1 text-[14px] leading-relaxed text-fg-muted" />
        </li>
      ))}
    </ul>
  );
}
