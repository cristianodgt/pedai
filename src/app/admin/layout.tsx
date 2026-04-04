"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Monitor,
  UtensilsCrossed,
  LayoutDashboard,
  Settings,
  LogOut,
  Bell,
} from "lucide-react";

const navItems = [
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/pdv", label: "PDV", icon: Monitor },
  { href: "/admin/cardapio", label: "Cardápio", icon: UtensilsCrossed },
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
      <aside className="w-64 flex flex-col bg-gray-100 border-r border-gray-200">
        {/* Logo */}
        <div className="px-6 py-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#a33900] to-[#cc4900]">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-[#191c1e]">PedAI</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 mt-2">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 py-3 px-6 text-sm transition-colors ${
                  active
                    ? "text-[#EA580C] font-semibold bg-orange-50 border-r-4 border-r-[#EA580C]"
                    : "text-[#6b7280] hover:text-[#191c1e] hover:bg-gray-200/60"
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sair */}
        <div className="border-t border-gray-200">
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/login";
            }}
            className="flex items-center gap-3 py-3 px-6 text-sm text-[#6b7280] hover:text-[#191c1e] w-full transition-colors"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header bar */}
        <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-gray-100">
          {/* Left: Ao vivo */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22c55e]" />
            </span>
            <span className="text-sm font-semibold text-[#22c55e]">
              Ao vivo
            </span>
          </div>

          {/* Right: Bell + profile */}
          <div className="flex items-center gap-4">
            <button className="relative text-[#6b7280] hover:text-[#191c1e] transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#EA580C]" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-[#191c1e]">
                  Cozinha Central
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#6b7280]">
                  GERENTE
                </span>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#a33900] to-[#cc4900] flex items-center justify-center text-white text-sm font-medium">
                C
              </div>
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
