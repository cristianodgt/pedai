"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  Clock,
  MapPin,
  Volume2,
  VolumeX,
  ChefHat,
  Timer,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  Truck,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  unit_price: string;
  total: string;
  details: Record<string, unknown> | null;
};

type Order = {
  id: string;
  code: string;
  channel: "WHATSAPP" | "PDV" | "IFOOD";
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED";
  type: "DELIVERY" | "PICKUP" | "DINE_IN";
  customer_name: string | null;
  customer_phone: string | null;
  address: string | null;
  neighborhood: string | null;
  payment_method: string | null;
  delivery_fee: string | null;
  subtotal: string;
  total: string;
  created_at: string;
  order_items: OrderItem[];
};

/* ── column config ── */
const columns = [
  {
    key: "PENDING",
    title: "Pendente",
    dot: "#EA580C",
    columnBg: "#fef7f4",
    cardBorder: "border-l-[3px] border-l-[#EA580C]",
    actionLabel: "Preparar",
    actionStyle: "bg-gradient-to-r from-[#a33900] to-[#cc4900] text-white hover:opacity-90",
    nextStatus: "PREPARING",
  },
  {
    key: "PREPARING",
    title: "Preparando",
    dot: "#2563eb",
    columnBg: "#eff6ff",
    cardBorder: "border-l-[3px] border-l-[#2563eb]",
    actionLabel: "Pronto",
    actionStyle: "bg-white text-[#2563eb] border-2 border-[#2563eb] hover:bg-blue-50",
    nextStatus: "READY",
  },
  {
    key: "READY",
    title: "Pronto",
    dot: "#16a34a",
    columnBg: "#f0fdf4",
    cardBorder: "border-l-[3px] border-l-[#16a34a]",
    actionLabel: "Entregue",
    actionStyle: "bg-[#16a34a] text-white hover:bg-[#15803d]",
    nextStatus: "DELIVERED",
  },
] as const;

/* ── channel badges ── */
const channelStyle: Record<string, { label: string; bg: string; text: string }> = {
  WHATSAPP: { label: "WhatsApp", bg: "#dcfce7", text: "#166534" },
  PDV: { label: "PDV", bg: "#dbeafe", text: "#1e40af" },
  IFOOD: { label: "iFood", bg: "#fee2e2", text: "#991b1b" },
};

const typeConfig: Record<string, { label: string; icon: typeof Truck }> = {
  DELIVERY: { label: "Entrega", icon: Truck },
  PICKUP: { label: "Retirada", icon: Store },
  DINE_IN: { label: "No local", icon: UtensilsCrossed },
};

/* ── helpers ── */
function timeAgo(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

function minsElapsed(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

function brl(v: string | number) {
  return parseFloat(String(v))
    .toFixed(2)
    .replace(".", ",");
}

/* ══════════════════════════════════════════════ */

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [, setTick] = useState(0);
  const audioRef = useRef<AudioContext | null>(null);
  const knownIds = useRef<Set<string>>(new Set());

  /* sound */
  const beep = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioRef.current) audioRef.current = new AudioContext();
      const ctx = audioRef.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.setValueAtTime(880, ctx.currentTime);
      o.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      o.start(ctx.currentTime);
      o.stop(ctx.currentTime + 0.4);
    } catch {}
  }, [soundEnabled]);

  /* fetch */
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/orders");
      if (!r.ok) return;
      const d = await r.json();
      const list: Order[] = d.orders || [];
      setOrders(list);
      const ids = new Set(list.map((o) => o.id));
      if (knownIds.current.size > 0) {
        for (const id of ids) {
          if (!knownIds.current.has(id)) { beep(); break; }
        }
      }
      knownIds.current = ids;
    } catch {} finally { setLoading(false); }
  }, [beep]);

  async function advance(id: string, status: string) {
    await fetch(`/api/orders/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  useEffect(() => {
    load();
    const ch = supabaseBrowser
      .channel("orders-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (p) => {
        if (p.eventType === "INSERT") beep();
        load();
      })
      .subscribe();
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => { supabaseBrowser.removeChannel(ch); clearInterval(t); };
  }, [load, beep]);

  /* stats */
  const stats = useMemo(() => {
    const done = orders.filter((o) => o.status === "DELIVERED");
    const rev = done.reduce((s, o) => s + parseFloat(o.total), 0);
    const tk = done.length ? rev / done.length : 0;
    const prep = orders.filter((o) => o.status === "READY" || o.status === "DELIVERED");
    const avg = prep.length
      ? Math.round(prep.reduce((s, o) => s + minsElapsed(o.created_at), 0) / prep.length)
      : 0;
    return { ticket: brl(tk), tempo: avg, done: done.length };
  }, [orders]);

  /* loading */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-[#EA580C]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[1.65rem] font-extrabold tracking-tight text-[#191c1e]">
            Fila de Pedidos
          </h1>
          <p className="text-[13px] text-[#7c7c7c] mt-0.5 font-medium">
            Gerencie o fluxo da sua cozinha em tempo real
          </p>
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
            soundEnabled
              ? "bg-green-50 text-green-700 ring-1 ring-green-200"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          {soundEnabled ? "Som ativado" : "Som desativado"}
        </button>
      </div>

      {/* ── Kanban ── */}
      <div className="grid grid-cols-3 gap-4 flex-1 min-h-0 pb-[72px]">
        {columns.map((col) => {
          const list = orders.filter((o) => o.status === col.key);
          return (
            <div
              key={col.key}
              className="flex flex-col min-h-0 rounded-2xl overflow-hidden"
              style={{ backgroundColor: col.columnBg }}
            >
              {/* Column head */}
              <div className="flex items-center justify-between px-4 pt-4 pb-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-[10px] h-[10px] rounded-full ring-[3px] ring-opacity-20"
                    style={{
                      backgroundColor: col.dot,
                      boxShadow: `0 0 0 3px ${col.dot}30`,
                    }}
                  />
                  <span className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#3d3d3d]">
                    {col.title}
                  </span>
                </div>
                <span
                  className="text-[12px] font-bold min-w-[26px] text-center py-0.5 px-2 rounded-full"
                  style={{
                    backgroundColor: col.dot + "18",
                    color: col.dot,
                  }}
                >
                  {String(list.length).padStart(2, "0")}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3">
                {list.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                    <ChefHat size={36} strokeWidth={1.5} />
                    <p className="text-[13px] font-medium mt-2 text-gray-400">
                      Nenhum pedido
                    </p>
                  </div>
                )}

                {list.map((order) => {
                  const items = order.order_items || [];
                  const ch = channelStyle[order.channel] || channelStyle.PDV;
                  const mins = minsElapsed(order.created_at);
                  const urgent = mins > 10;
                  const tc = typeConfig[order.type] || typeConfig.PICKUP;
                  const TypeIcon = tc.icon;

                  return (
                    <div
                      key={order.id}
                      className={`bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${col.cardBorder}`}
                    >
                      {/* Row 1: code + badge + time */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-extrabold text-[14px] text-[#191c1e]">
                            #{order.code}
                          </span>
                          <span
                            className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-[3px] rounded-full"
                            style={{ backgroundColor: ch.bg, color: ch.text }}
                          >
                            {ch.label}
                          </span>
                        </div>
                        <span
                          className={`flex items-center gap-1 text-[12px] font-semibold ${
                            urgent ? "text-red-500" : "text-[#9ca3af]"
                          }`}
                        >
                          <Clock size={13} strokeWidth={2.5} />
                          {timeAgo(order.created_at)}
                        </span>
                      </div>

                      {/* Customer name */}
                      {order.customer_name && (
                        <p className="text-[15px] font-bold text-[#191c1e] mb-1 leading-snug">
                          {order.customer_name}
                        </p>
                      )}

                      {/* Type + payment pills */}
                      <div className="flex items-center gap-1.5 mb-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-[3px] rounded-full bg-[#f3f4f6] text-[#6b7280]">
                          <TypeIcon size={11} strokeWidth={2.5} />
                          {tc.label}
                        </span>
                        {order.payment_method && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-[3px] rounded-full bg-[#f3f4f6] text-[#6b7280]">
                            <CreditCard size={11} strokeWidth={2.5} />
                            {order.payment_method}
                          </span>
                        )}
                      </div>

                      {/* ── Items ── */}
                      <div className="space-y-2 mb-3">
                        {items.map((item, i) => {
                          const obs =
                            item.details &&
                            typeof item.details === "object" &&
                            (item.details as Record<string, unknown>).observacao;
                          return (
                            <div key={i} className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <span className="text-[13px] font-medium text-[#191c1e] leading-snug">
                                  <span className="text-[#EA580C] font-bold">{item.quantity}x</span>{" "}
                                  {item.name}
                                </span>
                                {obs && (
                                  <p className="text-[11px] text-[#EA580C] font-semibold mt-0.5 italic">
                                    → {String(obs)}
                                  </p>
                                )}
                              </div>
                              <span className="text-[13px] font-semibold text-[#7c7c7c] whitespace-nowrap tabular-nums">
                                R$ {brl(item.total)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Address */}
                      {order.address && (
                        <div className="flex items-start gap-1.5 mb-3 text-[12px] text-[#7c7c7c]">
                          <MapPin size={13} className="mt-[1px] flex-shrink-0 text-[#EA580C]" />
                          <span className="leading-snug">
                            {order.address}
                            {order.neighborhood ? `, ${order.neighborhood}` : ""}
                          </span>
                        </div>
                      )}

                      {/* ── Divider + Total + Action ── */}
                      <div className="border-t border-[#f0f0f0] pt-3 mt-1">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#ababab]">
                            Total
                          </span>
                          <span className="text-[17px] font-extrabold text-[#191c1e] tabular-nums">
                            R$ {brl(order.total)}
                          </span>
                        </div>

                        <button
                          onClick={() => advance(order.id, col.nextStatus)}
                          className={`w-full py-2.5 rounded-xl text-[13px] font-bold tracking-wide cursor-pointer transition-all active:scale-[0.98] ${col.actionStyle}`}
                        >
                          {col.actionLabel}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer metrics bar ── */}
      <div className="fixed bottom-0 left-64 right-0 h-[64px] bg-white/95 backdrop-blur-sm border-t border-[#eee] flex items-center justify-center gap-10 px-6 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
            <TrendingUp size={18} className="text-[#EA580C]" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#ababab] leading-none mb-0.5">
              Ticket Médio
            </p>
            <p className="text-[15px] font-extrabold text-[#191c1e] tabular-nums">
              R$ {stats.ticket}
            </p>
          </div>
        </div>

        <div className="w-px h-8 bg-[#eee]" />

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <Timer size={18} className="text-[#2563eb]" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#ababab] leading-none mb-0.5">
              Tempo Médio
            </p>
            <p className="text-[15px] font-extrabold text-[#191c1e] tabular-nums">
              {stats.tempo} min
            </p>
          </div>
        </div>

        <div className="w-px h-8 bg-[#eee]" />

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
            <CheckCircle2 size={18} className="text-[#16a34a]" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#ababab] leading-none mb-0.5">
              Concluídos
            </p>
            <p className="text-[15px] font-extrabold text-[#191c1e] tabular-nums">
              {stats.done}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
