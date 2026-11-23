# Project

Working notes for Knowledge Atlas. The README is the public explanation.

## What it is

A dark page of notes the AI has already sorted. Graph, List and Folder show the same notes. A correction in one shows up in the others. Doubt is drawn on the map: under 60% confidence the note gets a dashed ring. A note you move is locked (`origin: 'user'`, `locked: true`) so a later re-sort has to leave it alone.

[DENYS: the sentence you actually want at the top, if this one is wrong.]

## Where things live

- `components/shell/AtlasShell.tsx` is the page. Dropping a JSON notes file on it loads those notes the same way as **Load notes from file…**. While the file is over the page, a dashed area reads "Drop your notes". A file that is not valid notes shows the same error as the file picker.
- `lib/arrival.ts` fades notes that land in Unsorted, one after another. `prefers-reduced-motion: reduce` shows them at once.
- `components/graph/GraphCanvas.tsx` draws the graph and owns drag, drop, and the paint loop.
- `lib/graph/hulls.ts` builds a cluster membrane and paints the soap-bubble outline.
- `lib/graph/motion.ts` flies a moved note and eases those outlines.
- `lib/graph/forces.ts` pulls a note toward its topic hub.
- `lib/actions.ts` and `lib/store.ts` store the move, the lock, undo, and re-sort.
- `components/inspector/Inspector.tsx` is the side peek. Picking a topic there calls the same move as a drag.

## Motion

Changing a note's topic used to update membership immediately. The note was still sitting in the old cluster, so the new membrane spiked across the map to include it and the old one collapsed. Both outlines popped.

Now the note lifts off and travels a curve to a seat on the near side of the new hub. The curve is a quadratic arc, bowed upward. A spring moves it along that arc, so it eases out and settles instead of sliding at one speed. For that flight it belongs to neither membrane: the one it left can close, and the one it is joining does not stretch out to meet it in mid-air. When it lands, it is part of the new cluster and the outline eases open around it.

Membranes ease even when the corner count changes. Each outline is resampled to a fixed ring of points around its center, and those points spring toward the new ring. A shape with a different number of corners can then ease instead of swapping.

`prefers-reduced-motion: reduce` skips the arc and the membrane spring. The note changes cluster at once. The same setting skips the fade-in of notes just loaded into Unsorted.

The note takes the new topic's color when it leaves. The flight is the part that shows where it came from.

[DENYS: say whether this feels right, and whether a merge or a re-sort should fly every note. Right now any topic change flies, including undo, merge, and re-sort.]

## Deliberately not built

Notion sync, real model calls, editing note text, sharing, a phone layout. Same list as the README.
