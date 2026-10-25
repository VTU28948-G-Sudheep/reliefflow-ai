import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "ReliefFlow AI — Disaster Assessment & Relief Planning",
  description: "AI-Assisted Emergency Response, Danger Assessment and Relief Distribution System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-relief-bg text-slate-800 antialiased min-h-screen flex">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
