"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ClipboardList,
  Monitor,
  UtensilsCrossed,
  LayoutDashboard,
  Settings,
  LogOut,
  Bell,
  Volume2,
  VolumeX,
  MessageCircle,
  Armchair,
} from "lucide-react";

const navItems = [
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/pdv", label: "PDV", icon: Monitor },
  { href: "/admin/cardapio", label: "Cardápio", icon: UtensilsCrossed },
  { href: "/admin/conversas", label: "Mensagens", icon: MessageCircle },
  { href: "/admin/mesas", label: "Mesas", icon: Armchair },
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/config", label: "Configurações", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [soundOn, setSoundOn] = useState(true);

  return (
    <>
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 border-r-0 bg-gray-100 flex flex-col py-6 z-50">
        {/* Logo */}
        <div className="px-6 mb-10">
          <h1 className="text-2xl font-black text-orange-600 tracking-tighter">
            PedAI
          </h1>
        </div>

        {/* Nav */}
        <nav className="flex-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                  active
                    ? "text-orange-600 font-bold border-r-4 border-orange-600 bg-orange-50"
                    : "text-zinc-500 font-medium hover:bg-gray-200"
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sair */}
        <div>
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/login";
            }}
            className="flex items-center gap-3 px-4 py-3 text-zinc-500 font-medium hover:bg-gray-200 w-full transition-colors"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="ml-64 min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between px-8 py-4">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {/* Ao vivo indicator */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <span className="text-sm font-semibold text-green-600">
                Ao vivo
              </span>
            </div>

            {/* Som toggle pill */}
            <button
              onClick={() => setSoundOn(!soundOn)}
              className="bg-gray-100 rounded-full px-4 py-1.5 flex items-center gap-2 transition-colors hover:bg-gray-200"
            >
              {soundOn ? (
                <Volume2 size={16} className="text-zinc-600" />
              ) : (
                <VolumeX size={16} className="text-zinc-400" />
              )}
              <span className="text-sm text-zinc-600">
                Som {soundOn ? "ativado" : "desativado"}
              </span>
              <div
                className={`w-8 h-4 rounded-full relative transition-colors ${
                  soundOn ? "bg-orange-500" : "bg-zinc-300"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
                    soundOn ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </div>
            </button>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Notifications bell */}
            <button onClick={() => window.location.href='/admin/pedidos'} className="relative text-zinc-500 hover:text-zinc-800 transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500" />
            </button>

            {/* Profile section */}
            <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white text-sm font-bold">
                C
              </div>
              <button onClick={() => window.location.href='/admin/config'}>
                <Settings size={18} className="text-zinc-400 hover:text-zinc-700 transition-colors" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-8 flex-1">
          {children}
        </main>
      </div>
    </>
  );
}
