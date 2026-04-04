"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  Clock,
  RefreshCw,
  CheckCircle2,
  MessageCircle,
  Play,
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

  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const preparingOrders = orders.filter((o) => o.status === "PREPARING");
  const readyOrders = orders.filter((o) => o.status === "READY");

  /* loading */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-[#a33900]" />
      </div>
    );
  }

  return (
    <div className="pb-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">

        {/* ═══ COLUMN: PENDENTE ═══ */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-black tracking-tight text-[#191c1e] uppercase">Pendente</h2>
            <span className="bg-[#ff9971] text-[#772f0f] px-2.5 py-0.5 rounded-full text-xs font-bold">
              {pendingOrders.length}
            </span>
          </div>

          {pendingOrders.map((order) => {
            const items = order.order_items || [];
            const mins = minsElapsed(order.created_at);

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm border border-transparent p-5"
              >
                {/* Top section */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 tracking-tighter uppercase mb-1 block">
                      #{order.code}
                    </span>
                    <span className="text-base font-bold text-[#191c1e]">
                      {order.customer_name || "Cliente"}
                    </span>
                  </div>
                  {order.channel === "WHATSAPP" && (
                    <span className="bg-[#25D366]/10 text-[#075E54] text-[10px] font-black px-2 py-1 rounded uppercase">
                      WhatsApp
                    </span>
                  )}
                  {order.channel === "PDV" && (
                    <span className="bg-[#d4e3ff] text-[#005da8] text-[10px] font-black px-2 py-1 rounded uppercase">
                      PDV
                    </span>
                  )}
                  {order.channel === "IFOOD" && (
                    <span className="bg-[#ffdad6] text-[#ba1a1a] text-[10px] font-black px-2 py-1 rounded uppercase">
                      iFood
                    </span>
                  )}
                </div>

                {/* Items */}
                <div className="mb-4 space-y-1">
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-[#5a4138] font-medium">{item.quantity}x {item.name}</span>
                      <span className="text-[#191c1e] font-bold">R$ {brl(item.total)}</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <span className="flex items-center gap-1 text-sm text-orange-600">
                    <Clock size={14} />
                    {mins < 1 ? "agora" : `${String(mins).padStart(2, "0")} min`}
                  </span>
                  <span className="text-lg font-black text-[#191c1e]">R$ {brl(order.total)}</span>
                </div>

                {/* Action */}
                <button
                  onClick={() => advance(order.id, "PREPARING")}
                  className="mt-5 w-full bg-gradient-to-br from-[#a33900] to-[#cc4900] text-white font-bold py-3 rounded-full shadow-md hover:opacity-90 active:scale-[0.98] cursor-pointer transition-all"
                >
                  Preparar
                </button>
              </div>
            );
          })}
        </section>

        {/* ═══ COLUMN: PREPARANDO ═══ */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-black tracking-tight text-[#191c1e] uppercase">Preparando</h2>
            <span className="bg-[#d4e3ff] text-[#005da8] px-2.5 py-0.5 rounded-full text-xs font-bold">
              {preparingOrders.length}
            </span>
          </div>

          {preparingOrders.map((order) => {
            const items = order.order_items || [];
            const mins = minsElapsed(order.created_at);
            const hasObs = items.some(
              (item) => item.details && typeof item.details === "object" && (item.details as Record<string, unknown>).observacao
            );

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-md border-l-4 border-[#005da8] p-5"
              >
                {/* Top section */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 tracking-tighter uppercase mb-1 block">
                      #{order.code}
                    </span>
                    <span className="text-base font-bold text-[#191c1e]">
                      {order.customer_name || "Cliente"}
                    </span>
                  </div>
                  {order.channel === "WHATSAPP" && (
                    <span className="bg-[#25D366]/10 text-[#075E54] text-[10px] font-black px-2 py-1 rounded uppercase">
                      WhatsApp
                    </span>
                  )}
                  {order.channel === "PDV" && (
                    <span className="bg-[#d4e3ff] text-[#005da8] text-[10px] font-black px-2 py-1 rounded uppercase">
                      PDV
                    </span>
                  )}
                  {order.channel === "IFOOD" && (
                    <span className="bg-[#ffdad6] text-[#ba1a1a] text-[10px] font-black px-2 py-1 rounded uppercase">
                      iFood
                    </span>
                  )}
                </div>

                {/* Items inside nested box */}
                <div className="bg-[#edeef0] rounded-lg p-3 mb-4">
                  <div className="space-y-1">
                    {items.map((item, i) => {
                      const obs =
                        item.details &&
                        typeof item.details === "object" &&
                        (item.details as Record<string, unknown>).observacao;
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-sm">
                            <span className="text-[#5a4138] font-medium">{item.quantity}x {item.name}</span>
                            <span className="text-[#191c1e] font-bold">R$ {brl(item.total)}</span>
                          </div>
                          {obs ? (
                            <p className="text-[10px] text-[#ba1a1a] font-bold uppercase">
                              Obs: {String(obs)}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <span className="flex items-center gap-1 text-sm text-[#005da8] font-bold">
                    <RefreshCw size={14} />
                    {mins < 1 ? "agora" : `${mins} min decorridos`}
                  </span>
                  <span className="text-lg font-black text-[#191c1e]">R$ {brl(order.total)}</span>
                </div>

                {/* Action */}
                <button
                  onClick={() => advance(order.id, "READY")}
                  className="mt-5 w-full bg-white border-2 border-[#005da8] text-[#005da8] font-bold py-3 rounded-full hover:bg-[#005da8]/5 active:scale-[0.98] cursor-pointer transition-all"
                >
                  Pronto
                </button>
              </div>
            );
          })}
        </section>

        {/* ═══ COLUMN: PRONTO ═══ */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-black tracking-tight text-[#191c1e] uppercase">Pronto</h2>
            <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
              {readyOrders.length}
            </span>
          </div>

          {readyOrders.map((order) => {
            const items = order.order_items || [];

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm border border-transparent p-5 opacity-80 hover:opacity-100 transition-opacity"
              >
                {/* Top section */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 tracking-tighter uppercase mb-1 block">
                      #{order.code}
                    </span>
                    <span className="text-base font-bold text-[#191c1e]">
                      {order.customer_name || "Cliente"}
                    </span>
                  </div>
                  {order.channel === "WHATSAPP" && (
                    <span className="bg-[#25D366]/10 text-[#075E54] text-[10px] font-black px-2 py-1 rounded uppercase">
                      WhatsApp
                    </span>
                  )}
                  {order.channel === "PDV" && (
                    <span className="bg-[#d4e3ff] text-[#005da8] text-[10px] font-black px-2 py-1 rounded uppercase">
                      PDV
                    </span>
                  )}
                  {order.channel === "IFOOD" && (
                    <span className="bg-[#ffdad6] text-[#ba1a1a] text-[10px] font-black px-2 py-1 rounded uppercase">
                      iFood
                    </span>
                  )}
                </div>

                {/* Items */}
                <div className="mb-4 space-y-1">
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-[#5a4138] font-medium">{item.quantity}x {item.name}</span>
                      <span className="text-[#191c1e] font-bold">R$ {brl(item.total)}</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <span className="flex items-center gap-1 text-sm text-green-600 font-bold">
                    <CheckCircle2 size={14} />
                    Aguardando retirada
                  </span>
                  <span className="text-lg font-black text-[#191c1e]">R$ {brl(order.total)}</span>
                </div>

                {/* Action */}
                <button
                  onClick={() => advance(order.id, "DELIVERED")}
                  className="mt-5 w-full bg-green-600 text-white font-bold py-3 rounded-full shadow-lg shadow-green-200 hover:bg-green-700 active:scale-[0.98] cursor-pointer transition-all"
                >
                  Entregue
                </button>
              </div>
            );
          })}
        </section>

      </div>

      {/* ═══ FIXED FOOTER BAR ═══ */}
      <footer className="fixed bottom-0 left-64 right-0 bg-white/60 backdrop-blur-md px-8 py-3 flex items-center justify-between border-t border-gray-100/50">
        <div className="flex gap-8 text-[10px] font-black text-[#5a4138] uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-600"></span>
            Ticket Médio: R$ {stats.ticket}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#005da8]"></span>
            Tempo Médio Prep: {stats.tempo} min
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Pedidos Concluídos: {stats.done}
          </div>
        </div>
        <div className="text-[10px] font-bold text-zinc-400">SISTEMA PEDAI V2.4.0</div>
      </footer>
    </div>
  );
}
