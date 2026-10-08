'use client';

import { buildTopicTree } from '@/lib/selectors';
import { topicSwatch } from '@/lib/theme/palette';
import { useAtlasStore } from '@/lib/store';

function LineSample({ dash, color }: { dash?: string; color: string }) {
  return (
    <svg width="28" height="10" viewBox="0 0 28 10" aria-hidden className="shrink-0">
      <line
        x1="1"
        y1="5"
        x2="27"
        y2="5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray={dash}
      />
    </svg>
  );
}

export function Legend() {
  const topics = useAtlasStore((state) => state.topics);
  const theme = useAtlasStore((state) => state.settings.theme);
  const rows = buildTopicTree(topics);
  const ink = theme === 'dark' ? '#E6E6E6' : '#191919';
  const faint = theme === 'dark' ? 'rgba(180, 180, 180, 0.9)' : 'rgba(70, 70, 70, 0.9)';
  const link = 'rgba(140, 170, 210, 0.95)';

  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-10 w-[168px] rounded-lg border border-border bg-surface px-2.5 py-2 text-[12px] text-muted">
      <ul className="flex flex-col gap-1">
        {rows.map(({ topic }) => {
          const swatch = topicSwatch(topic.color, theme);
          return (
            <li key={topic.id} className="flex h-[18px] min-w-0 items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ background: swatch.node }}
              />
              <span className="truncate text-foreground">{topic.name}</span>
            </li>
          );
        })}
      </ul>
      <div className="my-1.5 h-px bg-border" />
      <ul className="flex flex-col gap-1">
        <li className="flex h-[18px] items-center gap-2">
          <LineSample color={link} />
          Link
        </li>
        <li className="flex h-[18px] items-center gap-2">
          <LineSample color={faint} dash="4 3" />
          Similarity
        </li>
        <li className="flex h-[18px] items-center gap-2">
          <LineSample color={faint} dash="1 2.4" />
          Tag or person
        </li>
        <li className="flex h-[18px] items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="shrink-0">
            <circle cx="7" cy="7" r="2.1" fill={ink} />
            <circle
              cx="7"
              cy="7"
              r="5.2"
              fill="none"
              stroke={ink}
              strokeWidth="1"
              strokeDasharray="2.1 1.5"
            />
          </svg>
          Low confidence
        </li>
      </ul>
    </div>
  );
}
