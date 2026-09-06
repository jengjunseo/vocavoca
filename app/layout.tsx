import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "단어틈 — 나만의 단어 암기장",
  description: "JSON으로 시작하는 가볍고 꾸준한 영어 단어 학습",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
