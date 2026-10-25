import { NextResponse, type NextRequest } from "next/server";

/**
 * Sends paths without a language prefix to /it or /en (by the visitor's browser language).
 * The staff panel (/staff), API routes and static files are left alone.
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (/^\/(it|en)(\/|$)/.test(pathname)) return NextResponse.next();
  const preferred = req.headers.get("accept-language") ?? "";
  const lang = /^\s*en\b/i.test(preferred) ? "en" : "it";
  const url = req.nextUrl.clone();
  url.pathname = `/${lang}${pathname === "/" ? "" : pathname}`;
  url.search = search;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|staff|_next|brand|icon|apple-icon|robots.txt|sitemap.xml|favicon.ico|.*\\..*).*)"],
};
