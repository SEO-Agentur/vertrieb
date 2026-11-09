import { NextResponse, type NextRequest } from "next/server";

// Grobe Vorprüfung: interne Bereiche nur mit Sitzungs-Cookie. Die eigentliche Prüfung erfolgt serverseitig (requireUser).
const PUBLIC = [/^\/login/, /^\/room\//, /^\/i\//, /^\/api\/room\//, /^\/api\/health/, /^\/_next\//, /^\/favicon/];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
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
