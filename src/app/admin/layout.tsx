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
    <div className="flex h-screen bg-[#F5F5F0]">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <UtensilsCrossed size={24} className="text-[#8B2500]" />
            <h1 className="text-2xl font-bold text-[#8B2500]">PedAI</h1>
          </div>
        </div>

        <nav className="flex-1 py-2">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 py-3 px-4 text-sm transition ${
                  active
                    ? "text-[#C4501A] font-medium bg-orange-50 border-l-3 border-[#C4501A]"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
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
            className="flex items-center gap-3 py-3 px-4 text-sm text-gray-500 hover:bg-gray-50 transition w-full"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header bar */}
        <header className="bg-white h-16 flex items-center justify-between px-6 shadow-sm">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="bg-gray-100 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 w-64"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-gray-600 transition">
              <Bell size={20} />
            </button>
            <div className="w-8 h-8 rounded-full bg-[#C4501A] flex items-center justify-center text-white text-sm font-medium">
              U
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
