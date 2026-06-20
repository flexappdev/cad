import type { Metadata } from "next";
import "./globals.css";
import { GAScript } from "@/components/GAScript";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export const metadata: Metadata = {
  title: { default: "CAD — Course A Day", template: "%s · CAD" },
  description: "One fresh AI-generated course per day, free to read.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <GAScript />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
