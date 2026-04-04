"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  Clock,
  MessageCircle,
  Volume2,
  VolumeX,
  ChefHat,
  Timer,
  CheckCircle2,
  TrendingUp,
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

const statusColumns = [
  { key: "PENDING", label: "Pendente", color: "#EA580C", bgDot: "#EA580C" },
  { key: "PREPARING", label: "Preparando", color: "#2563eb", bgDot: "#2563eb" },
  { key: "READY", label: "Pronto", color: "#16a34a", bgDot: "#16a34a" },
] as const;

const channelConfig: Record<string, { label: string; bg: string; text: string }> = {
  WHATSAPP: { label: "WhatsApp", bg: "bg-green-100", text: "text-green-700" },
  PDV: { label: "PDV", bg: "bg-blue-100", text: "text-blue-700" },
  IFOOD: { label: "iFood", bg: "bg-red-100", text: "text-red-700" },
};

const typeLabels: Record<string, string> = {
  DELIVERY: "Entrega",
  PICKUP: "Retirada",
  DINE_IN: "Local",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}min`;
}

function getMinutesElapsed(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

function formatBRL(value: string | number) {
  return parseFloat(String(value)).toFixed(2).replace(".", ",");
}

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [now, setNow] = useState(Date.now());
  const audioRef = useRef<AudioContext | null>(null);
  const orderIdsRef = useRef<Set<string>>(new Set());

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioRef.current) audioRef.current = new AudioContext();
      const ctx = audioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.error("Sound error:", e);
    }
  }, [soundEnabled]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        const fetched: Order[] = data.orders || [];
        setOrders(fetched);
        const newIds = new Set(fetched.map((o) => o.id));
        if (orderIdsRef.current.size > 0) {
          for (const id of newIds) {
            if (!orderIdsRef.current.has(id)) {
              playNotificationSound();
              break;
            }
          }
        }
        orderIdsRef.current = newIds;
      }
    } catch (e) {
      console.error("Fetch orders error:", e);
    } finally {
      setLoading(false);
    }
  }, [playNotificationSound]);

  async function updateStatus(orderId: string, status: string) {
    await fetch(`/api/orders/${orderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchOrders();
  }

  useEffect(() => {
    fetchOrders();
    const channel = supabaseBrowser
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          if (payload.eventType === "INSERT") playNotificationSound();
          fetchOrders();
        }
      )
      .subscribe();
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => {
      supabaseBrowser.removeChannel(channel);
      clearInterval(timer);
    };
  }, [fetchOrders, playNotificationSound]);

  const stats = useMemo(() => {
    const delivered = orders.filter((o) => o.status === "DELIVERED");
    const totalRevenue = delivered.reduce((sum, o) => sum + parseFloat(o.total), 0);
    const ticketMedio = delivered.length > 0 ? totalRevenue / delivered.length : 0;
    const prepOrders = orders.filter((o) => o.status === "READY" || o.status === "DELIVERED");
    const avgPrepTime =
      prepOrders.length > 0
        ? Math.round(prepOrders.reduce((sum, o) => sum + getMinutesElapsed(o.created_at), 0) / prepOrders.length)
        : 0;
    return {
      ticketMedio: formatBRL(ticketMedio),
      tempoPrepMedio: avgPrepTime,
      pedidosConcluidos: delivered.length,
    };
  }, [orders, now]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-[#EA580C]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#191c1e]">Fila de Pedidos</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">
            Gerencie o fluxo da sua cozinha em tempo real
          </p>
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            soundEnabled
              ? "bg-green-50 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          {soundEnabled ? "Som ativado" : "Som desativado"}
        </button>
      </div>

      {/* Kanban - 3 equal columns */}
      <div className="grid grid-cols-3 gap-5 flex-1 min-h-0 pb-20">
        {statusColumns.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.key);
          return (
            <div key={col.key} className="flex flex-col min-h-0">
              {/* Column header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: col.bgDot }}
                  />
                  <span className="text-sm font-semibold text-[#191c1e]">
                    {col.label}
                  </span>
                </div>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: col.color + "15",
                    color: col.color,
                  }}
                >
                  {colOrders.length}
                </span>
              </div>

              {/* Column body */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {colOrders.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
                    <ChefHat size={32} className="mb-2 opacity-40" />
                    <p className="text-sm">Nenhum pedido</p>
                  </div>
                )}

                {colOrders.map((order) => {
                  const items = order.order_items || [];
                  const ch = channelConfig[order.channel] || channelConfig.PDV;
                  const mins = getMinutesElapsed(order.created_at);

                  return (
                    <div
                      key={order.id}
                      className={`bg-white rounded-xl p-4 ${
                        col.key === "PREPARING"
                          ? "border-l-4 border-l-blue-500"
                          : ""
                      }`}
                    >
                      {/* Top: code + channel + time */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#191c1e]">
                            #{order.code}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ch.bg} ${ch.text}`}
                          >
                            {ch.label}
                          </span>
                        </div>
                        <span
                          className={`flex items-center gap-1 text-xs ${
                            mins > 10
                              ? "text-red-500 font-semibold"
                              : "text-[#6b7280]"
                          }`}
                        >
                          <Clock size={12} />
                          {timeAgo(order.created_at)}
                        </span>
                      </div>

                      {/* Customer */}
                      {order.customer_name && (
                        <p className="text-sm font-semibold text-[#191c1e] mb-1">
                          {order.customer_name}
                        </p>
                      )}

                      {/* Type badge */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-[#6b7280]">
                          {typeLabels[order.type] || order.type}
                        </span>
                        {order.payment_method && (
                          <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-[#6b7280]">
                            {order.payment_method}
                          </span>
                        )}
                      </div>

                      {/* Items list with individual prices */}
                      <div className="space-y-1.5 mb-3">
                        {items.map((item, i) => {
                          const obs =
                            item.details &&
                            typeof item.details === "object" &&
                            (item.details as Record<string, unknown>).observacao;
                          return (
                            <div key={i}>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-[#191c1e]">
                                  {item.quantity}x {item.name}
                                </span>
                                <span className="text-sm text-[#6b7280] ml-2">
                                  R$ {formatBRL(item.total)}
                                </span>
                              </div>
                              {obs && (
                                <p className="text-xs text-[#EA580C] font-medium mt-0.5 ml-4">
                                  Obs: {String(obs)}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Delivery info */}
                      {order.address && (
                        <div className="text-xs text-[#6b7280] mb-3 flex items-start gap-1.5">
                          <MessageCircle size={12} className="mt-0.5 flex-shrink-0" />
                          <span>
                            {order.address}
                            {order.neighborhood ? `, ${order.neighborhood}` : ""}
                          </span>
                        </div>
                      )}

                      {/* Separator */}
                      <div className="border-t border-gray-100 pt-3">
                        {/* Total */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-[#6b7280] uppercase tracking-wider font-medium">
                            Total
                          </span>
                          <span className="text-base font-bold text-[#191c1e]">
                            R$ {formatBRL(order.total)}
                          </span>
                        </div>

                        {/* Action button - full width */}
                        {col.key === "PENDING" && (
                          <button
                            onClick={() => updateStatus(order.id, "PREPARING")}
                            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#a33900] to-[#cc4900] hover:opacity-90 transition-opacity cursor-pointer"
                          >
                            Preparar
                          </button>
                        )}
                        {col.key === "PREPARING" && (
                          <button
                            onClick={() => updateStatus(order.id, "READY")}
                            className="w-full py-2.5 rounded-xl text-sm font-semibold text-[#2563eb] border-2 border-[#2563eb] bg-transparent hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            Pronto
                          </button>
                        )}
                        {col.key === "READY" && (
                          <button
                            onClick={() => updateStatus(order.id, "DELIVERED")}
                            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-[#16a34a] hover:bg-[#15803d] transition-colors cursor-pointer"
                          >
                            Entregue
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fixed footer bar with metrics */}
      <div className="fixed bottom-0 left-64 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-center gap-12 px-6 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
            <TrendingUp size={16} className="text-[#EA580C]" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#6b7280] leading-none">
              Ticket Médio
            </p>
            <p className="text-sm font-bold text-[#191c1e]">
              R$ {stats.ticketMedio}
            </p>
          </div>
        </div>

        <div className="w-px h-8 bg-gray-200" />

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Timer size={16} className="text-[#2563eb]" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#6b7280] leading-none">
              Tempo Médio
            </p>
            <p className="text-sm font-bold text-[#191c1e]">
              {stats.tempoPrepMedio}min
            </p>
          </div>
        </div>

        <div className="w-px h-8 bg-gray-200" />

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
            <CheckCircle2 size={16} className="text-[#16a34a]" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#6b7280] leading-none">
              Pedidos Concluídos
            </p>
            <p className="text-sm font-bold text-[#191c1e]">
              {stats.pedidosConcluidos}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
