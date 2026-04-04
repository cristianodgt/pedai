"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  Settings,
  LogOut,
  Monitor,
  Search,
  Bell,
  MessageCircle,
  Armchair,
} from "lucide-react";

const navItems = [
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/pdv", label: "PDV", icon: Monitor },
  { href: "/admin/mesas", label: "Mesas", icon: Armchair },
  { href: "/admin/cardapio", label: "Cardápio", icon: UtensilsCrossed },
  { href: "/admin/conversas", label: "Mensagens", icon: MessageCircle },
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/config", label: "Configurações", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen" style={{ backgroundColor: "#f8f9fb" }}>
      {/* Sidebar */}
      <aside
        className="w-64 flex flex-col"
        style={{ backgroundColor: "#ffffff" }}
      >
        <div className="px-6 py-6">
          <h1
            className="text-xl font-bold"
            style={{ color: "#EA580C" }}
          >
            PedAI
          </h1>
        </div>

        <nav className="flex-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 py-3 px-6 text-sm transition-colors"
                style={
                  active
                    ? {
                        color: "#EA580C",
                        fontWeight: 500,
                        borderLeft: "3px solid #EA580C",
                      }
                    : {
                        color: "#6b7280",
                        borderLeft: "3px solid transparent",
                      }
                }
                onMouseEnter={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      "transparent";
                }}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4">
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/login";
            }}
            className="flex items-center gap-3 py-3 px-6 text-sm transition-colors w-full"
            style={{ color: "#6b7280" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                "#f3f4f6";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                "transparent";
            }}
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header bar */}
        <header
          className="h-16 flex items-center justify-between px-6"
          style={{ backgroundColor: "#ffffff" }}
        >
          {/* Left: Search */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "#9ca3af" }}
            />
            <input
              type="text"
              placeholder="Buscar pedido..."
              className="rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none"
              style={{
                backgroundColor: "#f3f4f6",
                color: "#191c1e",
                border: "none",
                width: "18rem",
              }}
            />
          </div>

          {/* Middle: AO VIVO */}
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: "#22c55e" }}
            />
            <span
              className="text-sm font-semibold"
              style={{ color: "#22c55e" }}
            >
              AO VIVO
            </span>
          </div>

          {/* Right: Bell + user info + avatar */}
          <div className="flex items-center gap-4">
            <button
              className="transition-colors"
              style={{ color: "#6b7280" }}
            >
              <Bell size={20} />
            </button>
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold" style={{ color: "#191c1e" }}>
                Cozinha Central
              </span>
              <span className="text-xs" style={{ color: "#9ca3af" }}>
                GERENTE DE TURNO
              </span>
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{
                background: "linear-gradient(135deg, #92400e, #b45309)",
              }}
            >
              C
            </div>
          </div>
        </header>

        <main
          className="flex-1 overflow-auto p-6"
          style={{ backgroundColor: "#f8f9fb" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
