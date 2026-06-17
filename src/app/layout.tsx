import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GAScript } from "@/components/GAScript";

export const metadata: Metadata = {
  title: { default: "CAD — Course A Day", template: "%s · CAD" },
  description: "One fresh AI-generated course per day, free to read.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <GAScript />
        <Header />
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
