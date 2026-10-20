# jotter

A tiny command-line note taker you can extend with plugins.

> Demo repository for a Wildfire walkthrough. It is a real, working tool, kept deliberately small.

```bash
npm install -g github:erikengervall/jotter
jot add "Call the plumber on Tuesday"
jot list
jot count
```

Notes live in `~/.jotter/notes.json` (set `JOTTER_HOME` to move them).

## Clipping a web page

The `clip` plugin turns a URL into a note, so a note can start from a page instead of a copy-paste. It calls [Firecrawl](https://docs.firecrawl.dev), which returns the page's main content as markdown, so it needs an API key:

```bash
export FIRECRAWL_API_KEY=fc-...
jot clip https://example.com
jot list
```

The note keeps the page title and its URL in `source`.

## Plugins

Every file in `plugins/` adds commands to `jot`. The interface is one default export with a name and its commands; [PLUGINS.md](PLUGINS.md) documents it and lists the shipped plugins.

## Develop

```bash
npm install
npm test
```
