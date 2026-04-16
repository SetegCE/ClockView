"use client";

// Sidebar de navegação — links para cada rota do ClockView

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

const ITENS = [
  { href: "/dashboard",      icon: "bi-grid-1x2-fill",  title: "Dashboard" },
  { href: "/colaboradores",  icon: "bi-people-fill",    title: "Colaboradores" },
  { href: "/projetos",       icon: "bi-folder2-open",   title: "Projetos" },
  { href: "/calendario",     icon: "bi-calendar3",      title: "Calendário" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="cv-sidebar">
      {/* Logo SETEG */}
      <Link href="/dashboard" title="ClockView" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 0" }}>
        <Image
          src="/logo-seteg.png"
          alt="SETEG"
          width={40}
          height={40}
          style={{ objectFit: "contain" }}
        />
      </Link>
      <div className="cv-sidebar-divider" />

      {ITENS.map((item) => {
        const ativo = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="cv-sidebar-btn"
            title={item.title}
            style={ativo ? { color: "#2563eb", background: "#eff6ff" } : undefined}
          >
            <i className={`bi ${item.icon}`} />
          </Link>
        );
      })}

      <div className="cv-sidebar-spacer" />

      {/* Botão de logout */}
      <button
        className="cv-sidebar-btn"
        title="Sair"
        onClick={handleLogout}
        style={{ color: "#ef4444" }}
      >
        <i className="bi bi-box-arrow-right" />
      </button>
    </aside>
  );
}
