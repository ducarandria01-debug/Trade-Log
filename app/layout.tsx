import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apex Journal — Trading",
  description: "Journal de trading personnel et tableau de bord de performance.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
