import { SITE_URL } from "@/lib/site";
export const dynamic = "force-static";
export function GET() {
  return new Response(`User-agent: *\nAllow: /\nDisallow: /kontakt?\n\nSitemap: ${SITE_URL}/sitemap.xml\n`, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
