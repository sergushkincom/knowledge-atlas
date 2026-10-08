import type { TopicColor } from '@/lib/types';

export interface TopicSwatch {
  node: string;
  label: string;
  /** Topic color at 8% opacity, for cluster hull fills. */
  hull: string;
  /** Topic color at 25% opacity, for cluster hull strokes. */
  hullStroke: string;
}

export interface TopicPaletteEntry {
  dark: TopicSwatch;
  light: TopicSwatch;
}

function hexAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function swatch(node: string, label: string): TopicSwatch {
  return {
    node,
    label,
    hull: hexAlpha(node, 0.08),
    hullStroke: hexAlpha(node, 0.25),
  };
}

export const themeBackgrounds = {
  dark: {
    background: '#191919',
    surface: '#202020',
    elevated: '#252525',
  },
  light: {
    background: '#FFFFFF',
    surface: '#F7F7F5',
    elevated: '#FFFFFF',
  },
} as const;

/**
 * Muted Notion-like topic colors. Label hexes are the text color on that
 * theme's background; node hexes are the graph dot. Hulls derive from node.
 */
export const topicPalette: Record<TopicColor, TopicPaletteEntry> = {
  gray: {
    dark: swatch('#9B9B9B', '#E4E4E4'),
    light: swatch('#6F6F6F', '#3F3F3F'),
  },
  brown: {
    dark: swatch('#B0845A', '#F0D0B4'),
    light: swatch('#8A5A32', '#6A3E1E'),
  },
  orange: {
    dark: swatch('#D4844A', '#F6D0B0'),
    light: swatch('#B8611E', '#8A3E08'),
  },
  yellow: {
    dark: swatch('#C9A227', '#F6E6B0'),
    light: swatch('#8C6A12', '#6A4E08'),
  },
  green: {
    dark: swatch('#4F9A68', '#C8EBD4'),
    light: swatch('#2E7D4F', '#1B5C34'),
  },
  blue: {
    dark: swatch('#4C8ED0', '#D0E4FA'),
    light: swatch('#1F6CB5', '#154E86'),
  },
  purple: {
    dark: swatch('#9A78C4', '#E4D4F8'),
    light: swatch('#7A56A8', '#5A3484'),
  },
  pink: {
    dark: swatch('#D16B98', '#F8D0E2'),
    light: swatch('#B84B78', '#8A2754'),
  },
  red: {
    dark: swatch('#D06565', '#F8D0D0'),
    light: swatch('#B94A4A', '#8A2A2A'),
  },
  teal: {
    dark: swatch('#3EAAA4', '#C8F0EA'),
    light: swatch('#1D7F7A', '#0E5C58'),
  },
};

export function topicSwatch(color: TopicColor, theme: 'dark' | 'light'): TopicSwatch {
  return topicPalette[color][theme];
}
