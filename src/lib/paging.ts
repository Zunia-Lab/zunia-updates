export const REVIEW_PAGE_SIZE = 10;
export const RELEASE_PAGE_SIZE = 5;

export type PageMeta = {
  total: number;
  page: number;
  pages: number;
  size: number;
};

export type PageResult<T> = PageMeta & { items: T[] };

export function readPage(value: string | undefined): number {
  if (!value || !/^[1-9]\d{0,4}$/.test(value)) return 1;
  return Number(value);
}

export function pageOf(total: number, requested: number, size: number): PageMeta {
  const pages = total === 0 ? 0 : Math.ceil(total / size);
  const page = pages === 0 ? 1 : Math.min(Math.max(requested, 1), pages);
  return { total, page, pages, size };
}

export function pageParam(page: number): string | undefined {
  return page > 1 ? String(page) : undefined;
}

export function samePageParam(given: string | undefined, page: number): boolean {
  return given === pageParam(page);
}

export type PageSlot = number | "gap";

export function pageSlots(current: number, pages: number): PageSlot[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1);
  const slots: PageSlot[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(pages - 1, current + 1);
  if (start > 2) slots.push("gap");
  for (let page = start; page <= end; page += 1) slots.push(page);
  if (end < pages - 1) slots.push("gap");
  slots.push(pages);
  return slots;
}

export function listHref(
  path: string,
  query: Record<string, string | number | undefined>,
  pageKeys: readonly string[] = ["page"],
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "") continue;
    if (pageKeys.includes(key) && (value === 1 || value === "1")) continue;
    params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `${path}?${text}` : path;
}
