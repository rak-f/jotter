import { test } from "node:test";
import assert from "node:assert/strict";
import clip, { scrape } from "../plugins/clip.js";

test("jot clip saves the scraped markdown as a note", async () => {
  const lines = [];
  const saved = [];
  const ctx = {
    addNote: async (text, meta) => {
      saved.push({ text, ...meta });
      return { id: 1, text, ...meta };
    },
    log: (line) => lines.push(line),
  };
  const client = async (url) => ({ markdown: "# Tide tables\n\nHigh tide at 06:12.", metadata: { title: "Tide tables", sourceURL: url } });
  await clip.commands.clip.run(["https://example.com/tides"], ctx, client);
  assert.deepEqual(saved, [{ text: "# Tide tables\n\nHigh tide at 06:12.", title: "Tide tables", source: "https://example.com/tides" }]);
  assert.deepEqual(lines, ["Clipped note 1: Tide tables"]);
});

test("jot clip without a url explains itself", async () => {
  await assert.rejects(() => clip.commands.clip.run([], {}, async () => {}), /usage: jot clip <url>/);
});

test("clipping without an API key explains which variable to set", async () => {
  await assert.rejects(() => scrape("https://example.com", ""), /FIRECRAWL_API_KEY/);
});

test("jot clip does not save a page that returned an error status", async () => {
  const saved = [];
  const ctx = { addNote: async (text) => saved.push(text), log: () => {} };
  const client = async () => ({ markdown: "Not Found", metadata: { statusCode: 404, error: "Not Found" } });
  await assert.rejects(() => clip.commands.clip.run(["https://example.com/gone"], ctx, client), /returned 404: Not Found/);
  assert.deepEqual(saved, []);
});

const reply = (status, body, headers = {}) => new Response(JSON.stringify(body), { status, headers });

test("scrape retries transient failures, honoring Retry-After, then succeeds", async () => {
  const replies = [
    reply(429, { success: false, error: "Rate limit exceeded" }, { "Retry-After": "7" }),
    reply(503, { success: false, error: "Service unavailable" }),
    reply(200, { success: true, data: { markdown: "# Hi" } }),
  ];
  const sleeps = [];
  const data = await scrape("https://example.com", "fc-test", { fetch: async () => replies.shift(), sleep: async (ms) => sleeps.push(ms) });
  assert.deepEqual(data, { markdown: "# Hi" });
  assert.deepEqual(sleeps, [7000, 2000]);
});

test("scrape stops retrying after a bounded number of attempts", async () => {
  let calls = 0;
  const fetch = async () => (calls++, reply(500, { success: false, error: "Internal error" }));
  await assert.rejects(() => scrape("https://example.com", "fc-test", { fetch, sleep: async () => {} }), /Internal error/);
  assert.equal(calls, 4);
});

test("scrape does not retry an error that will not go away", async () => {
  let calls = 0;
  const fetch = async () => (calls++, reply(401, { success: false, error: "Unauthorized" }));
  await assert.rejects(() => scrape("https://example.com", "bad", { fetch, sleep: async () => {} }), /Unauthorized/);
  assert.equal(calls, 1);
});
