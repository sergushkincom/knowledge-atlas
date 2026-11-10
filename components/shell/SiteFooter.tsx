import { ArrowUpRight, BookOpen } from 'lucide-react';
import type { ReactNode } from 'react';

const REPO = 'https://github.com/sergushkincom/knowledge-atlas';
/** GitHub's mark (Octicons, MIT). Lucide no longer ships brand icons. */
function GitHubMark() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

const LINKS: { label: string; href: string; icon: ReactNode }[] = [
  { label: 'GitHub', href: REPO, icon: <GitHubMark /> },
  { label: 'README', href: `${REPO}#readme`, icon: <BookOpen aria-hidden size={14} /> },
];
const link = 'rounded-sm underline-offset-2 hover:text-foreground hover:underline';

/** Who made this and where the code is. One thin row under the app, never over it. */
export function SiteFooter() {
  return (
    <footer className="flex h-8 shrink-0 items-center justify-between gap-3 border-t border-border bg-surface px-3 text-[12px] text-muted">
      <p className="truncate max-sm:hidden">MIT licensed · Design prototype</p>
      <nav aria-label="About this project" className="flex items-center gap-4 max-sm:w-full max-sm:justify-between">
        {LINKS.map((item) => (
          <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className={`${link} flex items-center gap-1`}>
            {item.icon}
            {item.label}
          </a>
        ))}
        <a href="https://sergushkin.com" target="_blank" rel="noreferrer" className={`${link} flex items-center gap-0.5`}>
          Built by <span className="text-foreground">Denys Sergushkin</span>
          <ArrowUpRight aria-hidden size={12} />
        </a>
      </nav>
    </footer>
  );
}
