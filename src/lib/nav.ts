import type { Dictionary } from "@/lib/i18n";

/** Public pages, in menu order (paths are appended to /it or /en). */
export function navItems(d: Dictionary) {
  return [
    { path: "/about", label: d.nav.about },
    { path: "/courses", label: d.nav.courses },
    { path: "/placement-test", label: d.nav.placement },
    { path: "/study-trips", label: d.nav.trips },
    { path: "/ai-tutor", label: d.nav.tutor },
    { path: "/resources", label: d.nav.resources },
    { path: "/contact", label: d.nav.contact },
  ];
}

export const PUBLIC_PATHS = ["", ...["/about", "/courses", "/placement-test", "/study-trips", "/ai-tutor", "/resources", "/contact", "/privacy", "/cookie"]];
