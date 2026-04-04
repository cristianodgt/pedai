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
        <div className="px-5 py-7">
          <div className="flex items-center gap-2">
            <UtensilsCrossed size={24} style={{ color: "#a33900" }} />
            <h1
              className="text-2xl font-bold"
              style={{ color: "#a33900" }}
            >
              PedAI
            </h1>
          </div>
        </div>

        <nav className="flex-1 py-2">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 py-3 px-5 text-sm transition-colors"
                style={
                  active
                    ? {
                        color: "#cc4900",
                        fontWeight: 500,
                        backgroundColor: "rgba(204,73,0,0.05)",
                        borderLeft: "3px solid #cc4900",
                      }
                    : {
                        color: "#5a4138",
                        borderLeft: "3px solid transparent",
                      }
                }
                onMouseEnter={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      "#edeef0";
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
            className="flex items-center gap-3 py-3 px-5 text-sm transition-colors w-full"
            style={{
              color: "#5a4138",
              borderRadius: "0.75rem",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                "#edeef0";
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
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "#5a4138" }}
            />
            <input
              type="text"
              placeholder="Buscar..."
              className="rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none"
              style={{
                backgroundColor: "#edeef0",
                color: "#191c1e",
                border: "none",
                borderBottom: "2px solid transparent",
                width: "16rem",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderBottomColor = "#a33900";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderBottomColor = "transparent";
              }}
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              className="transition-colors"
              style={{ color: "#5a4138" }}
            >
              <Bell size={20} />
            </button>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{
                background: "linear-gradient(135deg, #a33900, #cc4900)",
              }}
            >
              U
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
