import { ArrowUpRight } from 'lucide-react';

const REPO = 'https://github.com/sergushkincom/knowledge-atlas';
const LINKS = [
  { label: 'GitHub', href: REPO },
  { label: 'README', href: `${REPO}#readme` },
];
const link = 'rounded-sm underline-offset-2 hover:text-foreground hover:underline';

/** Who made this and where the code is. One thin row under the app, never over it. */
export function SiteFooter() {
  return (
    <footer className="flex h-8 shrink-0 items-center justify-between gap-3 border-t border-border bg-background px-3 text-[12px] text-muted">
      <p className="truncate max-sm:hidden">MIT licensed · Design prototype</p>
      <nav aria-label="About this project" className="flex items-center gap-3 max-sm:w-full max-sm:justify-between">
        {LINKS.map((item) => (
          <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className={link}>
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
