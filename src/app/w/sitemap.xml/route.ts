import { SITE_PAGES, SITE_URL } from "@/lib/site";
export const dynamic = "force-static";
export function GET() {
  const indexable = SITE_PAGES.filter((p) => !["/impressum", "/datenschutz"].includes(p));
  const today = new Date().toISOString().slice(0, 10);
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable.map((p) => `  <url><loc>${SITE_URL}${p === "/" ? "/" : p}</loc><lastmod>${today}</lastmod></url>`).join("\n")}\n</urlset>\n`;
  return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8" } });
}
