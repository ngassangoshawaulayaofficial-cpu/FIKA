import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FIKA Marketplace",
  description: "On-demand beauty and grooming marketplace in Dar es Salaam",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
