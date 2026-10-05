import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { getCurrentUser } from "@/lib/auth/server";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "ProjectHub", template: "%s · ProjectHub" },
  description: "Project management dashboard",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={inter.variable}>
      {/* Browser extensions (e.g. WOT, Grammarly) add attributes to <body>; ignore those mismatches. */}
      <body suppressHydrationWarning>
        <AuthProvider initialUser={user}>{children}</AuthProvider>
      </body>
    </html>
  );
}
