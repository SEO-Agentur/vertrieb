import { NextResponse, type NextRequest } from "next/server";

/**
 * Eine Anwendung, zwei Domains:
 * - Website (kivertrieb.net, www.): öffentliche Seiten aus src/app/w – die URL bleibt ohne /w
 * - Plattform (app.kivertrieb.net u. a.): interne Bereiche nur mit Sitzungs-Cookie (Prüfung serverseitig in requireUser)
 */
const SITE_HOSTS = (process.env.SITE_HOSTS ?? "kivertrieb.net,www.kivertrieb.net").split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
const PUBLIC = [/^\/login/, /^\/room\//, /^\/i\//, /^\/api\/room\//, /^\/api\/health/, /^\/_next\//, /^\/favicon/, /^\/robots\.txt$/, /^\/w(\/|$)/];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(":")[0].toLowerCase();

  if (SITE_HOSTS.includes(host)) {
    if (host.startsWith("www.")) {
      const url = req.nextUrl.clone();
      url.host = host.slice(4);
      url.port = "";
      if (process.env.NODE_ENV === "production" || req.headers.get("x-forwarded-proto") === "https") url.protocol = "https:";
      return NextResponse.redirect(url, 308);
    }
    if (pathname.startsWith("/_next/") || pathname.startsWith("/api/health")) return NextResponse.next();
    if (pathname === "/w" || pathname.startsWith("/w/")) {
      const url = req.nextUrl.clone();
      url.pathname = pathname.replace(/^\/w/, "") || "/";
      return NextResponse.redirect(url, 308);
    }
    const url = req.nextUrl.clone();
    url.pathname = pathname === "/" ? "/w" : `/w${pathname}`;
    return NextResponse.rewrite(url);
  }

  if (PUBLIC.some((r) => r.test(pathname))) return NextResponse.next();
  if (!req.cookies.get("sp_session")) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
