import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Knowledge Atlas",
  description: "AI-organized graph of a messy Notion workspace. Drag notes to correct the map.",
};

const themeBoot = `(function(){try{var raw=localStorage.getItem('knowledge-atlas');if(!raw)return;var theme=JSON.parse(raw).state.settings.theme;if(theme==='light'||theme==='dark')document.documentElement.dataset.theme=theme;}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="dark" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-background font-sans text-foreground">
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
        {children}
      </body>
    </html>
  );
}
