export const NOTICES: Record<string, string> = {
  release: "Version published. It is on the changelog and the versions page.",
  entry: "Changelog line published.",
  status: "Review updated.",
  shipped: "Marked fixed. The version is on the changelog, and the review is public.",
  comment: "Reply posted.",
  edited: "Reply updated.",
  deleted: "Reply deleted.",
  invalid: "That form could not be saved.",
  reply: "The reply was not saved. Write it again, then post it.",
  exists: "That version already exists, or this review is already fixed.",
  notready: "Accept the review before marking it fixed.",
};

export function noticeFrom(query: { saved?: string; error?: string }): string | undefined {
  if (query.saved && NOTICES[query.saved]) return NOTICES[query.saved];
  if (query.error && NOTICES[query.error]) return NOTICES[query.error];
  return undefined;
}
