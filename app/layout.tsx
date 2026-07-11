import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "두근두근 뽑기",
  description: "다트, 룰렛으로 재미있게 당첨자를 뽑는 사이트",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen font-sans text-slate-100 antialiased">
        <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/60 px-6 py-4 backdrop-blur-lg">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-lg font-extrabold tracking-tight transition hover:opacity-80"
          >
            <span className="text-xl">🎯</span>
            <span className="bg-gradient-to-r from-orange-300 via-brand-400 to-orange-500 bg-clip-text text-transparent">
              두근두근 뽑기
            </span>
          </a>
        </header>
        <main>{children}</main>
        <footer className="mt-16 border-t border-white/5 px-6 py-8 text-center text-xs text-slate-600">
          공정한 랜덤, 재미있는 연출 — 두근두근 뽑기
        </footer>
      </body>
    </html>
  );
}
