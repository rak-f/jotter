# Writing a jotter plugin

A plugin is one JavaScript file in `plugins/`. jotter loads every `plugins/*.js` at startup, in name order.

## Interface

The file's default export is an object:

```js
export default {
  name: "wordcount",                      // unique plugin name
  description: "Counts the words across all your notes.",
  commands: {
    count: {                              // adds `jot count`
      usage: "jot count",
      run: async (args, ctx) => { ... },  // args: the words after the command
    },
  },
};
```

`ctx` gives a command three things:

- `ctx.addNote(text, meta)` saves a note and returns it. `meta` is merged into the note (for example `{ title, source }`).
- `ctx.listNotes()` returns every note.
- `ctx.log(line)` prints a line.

Two plugins may not define the same command. A plugin that needs a dependency adds it to `package.json`; one that needs a secret reads it from the environment and says which variable in its `description`.

## Shipped plugins

| Plugin | Command | What it does |
|---|---|---|
| [wordcount](plugins/wordcount.js) | `jot count` | Counts the words across all your notes. |
| [clip](plugins/clip.js) | `jot clip <url>` | Saves a web page as a markdown note, using [Firecrawl](https://docs.firecrawl.dev). Reads `FIRECRAWL_API_KEY`. |

## Testing

Add a test under `test/` that imports your plugin and calls `run` with a fake `ctx`. See `test/wordcount.test.js`.
