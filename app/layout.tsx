import type { Metadata } from "next";
import "./globals.css";
import "./dashboard.css";
import { DadosProvider } from "@/app/context/DadosContext";
import AppShell from "@/app/components/AppShell";

export const metadata: Metadata = {
  title: "ClockView - Seteg",
  icons: {
    icon: "/logo-seteg.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@700,500,400&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
        />
      </head>
      <body style={{ fontFamily: "'Satoshi', sans-serif" }}>
        <DadosProvider>
          <AppShell>{children}</AppShell>
        </DadosProvider>
      </body>
    </html>
  );
}
