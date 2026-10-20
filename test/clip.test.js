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
