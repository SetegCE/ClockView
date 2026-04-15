import type { Metadata } from "next";
import "./globals.css";
import "./dashboard.css";
import { DadosProvider } from "@/app/context/DadosContext";
import Sidebar from "@/app/components/Sidebar";
import HeaderClient from "@/app/components/HeaderClient";

export const metadata: Metadata = {
  title: "ClockView - Seteg",
  description: "Dashboard de jornada semanal dos colaboradores SETEG",
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
          <div className="cv-root">
            <Sidebar />
            <div className="cv-main">
              <HeaderClient />
              {children}
            </div>
          </div>
        </DadosProvider>
      </body>
    </html>
  );
}
