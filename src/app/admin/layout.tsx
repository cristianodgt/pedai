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
import { Input } from "@/components/ui/input";

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
    <div className="flex h-screen bg-[#f8f9fb]">
      {/* Sidebar */}
      <aside className="w-56 flex flex-col bg-white">
        <div className="px-6 py-5">
          <h1 className="text-xl font-bold text-[#EA580C]">PedAI</h1>
        </div>

        <nav className="flex-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 py-2.5 px-6 text-sm ${
                  active
                    ? "text-[#EA580C] font-medium border-l-[3px] border-l-[#EA580C]"
                    : "text-[#6b7280] border-l-[3px] border-l-transparent"
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div>
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/login";
            }}
            className="flex items-center gap-3 py-2.5 px-6 text-sm text-[#6b7280] w-full"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header bar */}
        <header className="h-14 flex items-center justify-between px-6 bg-white">
          {/* Left: Search */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] z-10"
            />
            <Input
              type="text"
              placeholder="Buscar pedido..."
              className="w-72 rounded-full bg-[#f3f4f6] pl-10 pr-4"
            />
          </div>

          {/* Middle: AO VIVO */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#22c55e]">
              AO VIVO
            </span>
          </div>

          {/* Right: Bell + user info + avatar */}
          <div className="flex items-center gap-4">
            <button className="text-[#6b7280]">
              <Bell size={20} />
            </button>
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-[#191c1e]">
                Cozinha Central
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#6b7280]">
                GERENTE DE TURNO
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#a33900] to-[#cc4900] flex items-center justify-center text-white text-sm font-medium">
              C
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-[#f8f9fb]">
          {children}
        </main>
      </div>
    </div>
  );
}
