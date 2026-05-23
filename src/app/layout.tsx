import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Portfolio Management",
  description: "Personal portfolio and tax planning dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen">
          <header className="border-b border-border">
            <div className="container mx-auto px-4 py-6 max-w-6xl">
              <h1 className="text-xl font-bold tracking-tight">
                Portfolio Management
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Personal finance dashboard — SimpleFIN & SnapTrade
              </p>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8 max-w-6xl">
            <Nav />
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
