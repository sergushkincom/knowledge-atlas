# Knowledge Atlas

A dark, Notion-like page for a pile of notes. The page is the database. Graph, list, and folder are views of the same notes, not separate pages.

The notes, topics, and AI assignments are local mock data. Nothing is sent to Notion or to a model.

## Run

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

```bash
pnpm test
pnpm lint
```

## The page

The breadcrumb is **Knowledge / Notes**. The view switch sits on the left of the bar under that title.

| View | What it shows |
| --- | --- |
| Graph | Clusters of notes. Drag a note into another topic to correct the AI. Drag a topic hub onto another to merge them. Double-click a pinned note to release it. |
| List | Every note as a row: name, topic, updated date. |
| Folder | Each topic as a folder. Open one to see its notes. |

Search in the bar filters the current view. ⌘K opens the same search. ⌘Z undoes a move, merge, or rename. Esc closes a peek or the menu.

On Graph, the switches at the right of the bar turn layers on and off:

- **Topics** — cluster membranes and topic hubs
- **Links** — notes that mention each other
- **Similarity** — dashed lines
- **Tags** — dotted lines for a tag shared by a small group
- **People** — dotted lines for a person shared by a small group

**Fit** recenters the map. It is a button, not a layer.

Click a note or a topic to open it in a side peek: properties, the AI reason, move, lock, and the note body. The map keeps the rest of the width.

The **···** menu holds source filters (Meeting notes, Docs, Journal, Wiki, Tasks) and **Reset demo**.

## Look

Inter, 13–14px in the chrome. Page background `#191919`, raised surface `#202020`, border `#2F2F2F`, text `#E6E6E6`, muted `#9B9B9B`, accent `#2383E2`. Corners are 8px. Topic colors are muted Notion swatches. Each cluster membrane breathes outward like a soap bubble, with a highlight that travels the rim. Reduced motion keeps the membrane still.

## Data

`data/seed.ts` has 120 notes. `data/seedAssignments.ts` sorts them into nine topics. Eighteen notes are ambiguous (confidence under 0.6) and ten have no links. Edges are derived when the graph is built. They are not stored.

Corrections live in the browser (`localStorage` key `knowledge-atlas`). Undo history is for the session. Reset demo restores the seed and clears that history.
