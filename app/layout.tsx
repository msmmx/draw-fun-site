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
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <header className="border-b border-slate-800 px-6 py-4">
          <a href="/" className="text-lg font-bold tracking-tight">
            🎯 두근두근 뽑기
          </a>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
