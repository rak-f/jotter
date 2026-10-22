// Saves a web page as a note. Firecrawl's /scrape returns the page's main
// content as markdown: https://docs.firecrawl.dev/api-reference/endpoint/scrape
const ENDPOINT = "https://api.firecrawl.dev/v2/scrape";
// Transient failures, retried with Retry-After or exponential backoff:
// https://docs.firecrawl.dev/api-reference/errors
const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 4;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry-After is seconds or an HTTP date; undefined when absent or unparseable.
function retryAfterMs(header) {
  if (!header) return undefined;
  const ms = /^\d+$/.test(header.trim()) ? Number(header) * 1000 : Date.parse(header) - Date.now();
  return Number.isNaN(ms) ? undefined : Math.max(0, ms);
}

export async function scrape(url, apiKey = process.env.FIRECRAWL_API_KEY, { fetch = globalThis.fetch, sleep = wait } = {}) {
  if (!apiKey) throw new Error("set FIRECRAWL_API_KEY to clip pages (get a key at https://firecrawl.dev)");
  let response;
  for (let attempt = 1; ; attempt++) {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
    });
    if (!RETRYABLE.has(response.status) || attempt === MAX_ATTEMPTS) break;
    await sleep(retryAfterMs(response.headers.get("Retry-After")) ?? 1000 * 2 ** (attempt - 1));
  }
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
        const status = metadata?.statusCode;
        if (status !== undefined && !((status >= 200 && status < 300) || status === 304)) {
          throw new Error(`${url} returned ${status}${metadata.error ? `: ${metadata.error}` : ""}; nothing saved`);
        }
        const note = await ctx.addNote(markdown, { title: metadata?.title ?? url, source: metadata?.sourceURL ?? url });
        ctx.log(`Clipped note ${note.id}: ${note.title}`);
      },
    },
  },
};
