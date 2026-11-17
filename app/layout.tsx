import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

const description = "AI-organized graph of a messy Notion workspace. Drag notes to correct the map.";

export const metadata: Metadata = {
  metadataBase: new URL("https://denys-knowledge-atlas.vercel.app"),
  title: "Knowledge Atlas",
  description,
  openGraph: {
    title: "Knowledge Atlas",
    description,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "The graph: nine topic clusters drawn as soft membranes, with low-confidence notes marked by a dashed ring",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Knowledge Atlas",
    description,
    images: ["/og.png"],
  },
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
