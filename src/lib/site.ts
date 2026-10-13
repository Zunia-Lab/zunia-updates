/**
 * The site's name, address, sections and outside links, in one place for
 * everything that names them: the root layout's metadata, the header and
 * footer (components/Shell.tsx) and /llms.txt (lib/llms.ts).
 */

export const SITE_URL = "https://updates.zunialab.com";

export const SITE_NAME = "Zunia updates";

export const SITE_DESCRIPTION = "Changelog, versions, and a place to report a bug or ask for a feature.";

/** The header's sections, in order. */
export const SECTIONS = [
  { href: "/", label: "Changelog", id: "changelog" },
  { href: "/versions", label: "Versions", id: "versions" },
  { href: "/requests", label: "Reviews", id: "requests" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

/** The report form, linked beside the sections. */
export const REPORT = { href: "/requests/new", label: "Report" } as const;

/** Where the site sends people outside it. */
export const LINKS = {
  website: "https://zunialab.com",
  docs: "https://docs.zunialab.com",
  security: "https://zunialab.com/security",
  brand: "https://zunialab.com/brand",
  platforms: "https://zunialab.com/#platforms",
  extensionSource: "https://github.com/Zunia-Lab/zunia-extension",
  mobileSource: "https://github.com/Zunia-Lab/zunia-mobile",
  github: "https://github.com/Zunia-Lab",
} as const;

export const FOOTER = [
  {
    title: "Zunia",
    links: [
      { label: "Website", href: LINKS.website },
      { label: "Documentation", href: LINKS.docs },
      { label: "Security", href: LINKS.security },
      { label: "Brand", href: LINKS.brand },
    ],
  },
  {
    title: "Extension",
    links: [
      { label: "Chrome", href: LINKS.platforms },
      { label: "Edge", href: LINKS.platforms },
      { label: "Firefox", href: LINKS.platforms },
      { label: "Safari", href: LINKS.platforms },
      { label: "Source", href: LINKS.extensionSource },
    ],
  },
  {
    title: "Also",
    links: [
      { label: "Mobile", href: LINKS.mobileSource },
      { label: "GitHub", href: LINKS.github },
    ],
  },
] as const;
