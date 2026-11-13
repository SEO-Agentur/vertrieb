// robots.txt der Plattform (app.kivertrieb.net): nichts indexieren. Die Website liefert ihre eigene robots.txt.
export const dynamic = "force-static";
export function GET() {
  return new Response("User-agent: *\nDisallow: /\n", { headers: { "content-type": "text/plain; charset=utf-8" } });
}
