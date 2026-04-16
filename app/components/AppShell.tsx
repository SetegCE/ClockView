"use client";

// Renderiza sidebar e header apenas quando o usuário está autenticado (fora do /login)

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import HeaderClient from "./HeaderClient";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  if (isLogin) {
    // Tela de login — sem sidebar, sem header
    return <>{children}</>;
  }

  return (
    <div className="cv-root">
      <Sidebar />
      <div className="cv-main">
        <HeaderClient />
        {children}
      </div>
    </div>
  );
}
