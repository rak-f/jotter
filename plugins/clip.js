// Saves a web page as a note. Firecrawl's /scrape returns the page's main
// content as markdown: https://docs.firecrawl.dev/api-reference/endpoint/scrape
const ENDPOINT = "https://api.firecrawl.dev/v2/scrape";

export async function scrape(url, apiKey = process.env.FIRECRAWL_API_KEY) {
  if (!apiKey) throw new Error("set FIRECRAWL_API_KEY to clip pages (get a key at https://firecrawl.dev)");
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.success) throw new Error(`Firecrawl could not read ${url}: ${body.error ?? `HTTP ${response.status}`}`);
  return body.data;
}

export default {
  name: "clip",
  description: "Saves a web page as a markdown note, using Firecrawl (reads FIRECRAWL_API_KEY).",
  commands: {
    clip: {
      usage: "jot clip <url>",
      run: async (args, ctx, client = scrape) => {
        const [url] = args;
        if (!url) throw new Error("usage: jot clip <url>");
        const { markdown, metadata } = await client(url);
        const note = await ctx.addNote(markdown, { title: metadata?.title ?? url, source: metadata?.sourceURL ?? url });
        ctx.log(`Clipped note ${note.id}: ${note.title}`);
      },
    },
  },
};
