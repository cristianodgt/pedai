"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Clock, MessageCircle, Monitor, Volume2, VolumeX, ChevronDown, ChevronUp, Utensils, GripVertical, SlidersHorizontal, Plus, TrendingUp } from "lucide-react";
import Link from "next/link";
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
  {
    key: "PENDING",
    label: "PENDENTE",
    dotColor: "#EA580C",
  },
  {
    key: "PREPARING",
    label: "PREPARANDO",
    dotColor: "#F59E0B",
  },
  {
    key: "READY",
    label: "PRONTO",
    dotColor: "#0284C7",
  },
] as const;

const channelConfig = {
  WHATSAPP: { label: "WHATSAPP", bg: "bg-emerald-100", text: "text-emerald-700", icon: MessageCircle },
  PDV: { label: "PDV", bg: "bg-blue-100", text: "text-blue-700", icon: Monitor },
  IFOOD: { label: "IFOOD", bg: "bg-red-100", text: "text-red-700", icon: Utensils },
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
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h${mins % 60}min`;
}

function getMinutesElapsed(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / 60000);
}

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const audioRef = useRef<AudioContext | null>(null);
  const orderIdsRef = useRef<Set<string>>(new Set());

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioRef.current) {
        audioRef.current = new AudioContext();
      }
      const ctx = audioRef.current;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
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

        // Check for new orders
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
    // Optimistic: refetch immediately
    fetchOrders();
  }

  useEffect(() => {
    fetchOrders();

    // Supabase Realtime subscription
    const channel = supabaseBrowser
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log("Realtime event:", payload.eventType);
          if (payload.eventType === "INSERT") {
            playNotificationSound();
          }
          // Refetch full list to get order_items
          fetchOrders();
        }
      )
      .subscribe();

    // Update "time ago" every 30s
    const timer = setInterval(() => setNow(Date.now()), 30000);

    return () => {
      supabaseBrowser.removeChannel(channel);
      clearInterval(timer);
    };
  }, [fetchOrders, playNotificationSound]);

  // Stats calculations
  const stats = useMemo(() => {
    const delivered = orders.filter((o) => o.status === "DELIVERED");
    const totalRevenue = delivered.reduce((sum, o) => sum + parseFloat(o.total), 0);
    const ticketMedio = delivered.length > 0 ? totalRevenue / delivered.length : 0;

    // Average prep time approximation (use all non-pending orders)
    const prepOrders = orders.filter((o) => o.status === "READY" || o.status === "DELIVERED");
    const avgPrepTime = prepOrders.length > 0
      ? Math.round(prepOrders.reduce((sum, o) => sum + getMinutesElapsed(o.created_at), 0) / prepOrders.length)
      : 0;

    return {
      ticketMedio: ticketMedio.toFixed(2).replace(".", ","),
      tempoPrepMedio: avgPrepTime,
      pedidosConcluidos: delivered.length,
      totalRevenue: totalRevenue.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, "."),
      totalPedidos: orders.length,
    };
  }, [orders, now]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div
          className="animate-spin rounded-full h-8 w-8"
          style={{
            borderWidth: "2px",
            borderStyle: "solid",
            borderColor: "rgba(226,191,178,0.3)",
            borderTopColor: "#EA580C",
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 px-1">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#191c1e" }}>
            Fila de Pedidos
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
            Gerencie o fluxo da sua cozinha em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1.5 text-sm transition-colors px-3 py-2 rounded-xl"
            style={{ color: "#6b7280", border: "1px solid rgba(226,191,178,0.3)" }}
            title={soundEnabled ? "Desativar som" : "Ativar som"}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            style={{
              color: "#6b7280",
              border: "1px solid rgba(226,191,178,0.3)",
              backgroundColor: "#ffffff",
            }}
          >
            <SlidersHorizontal size={16} />
            Filtrar
          </button>
          <Link
            href="/admin/pdv"
            className="flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-full text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#EA580C" }}
          >
            <Plus size={16} />
            Novo Pedido
          </Link>
        </div>
      </div>

      {/* Main area: Kanban + Metrics sidebar */}
      <div className="flex gap-5 flex-1 min-h-0">
        {/* Kanban columns */}
        <div className="flex gap-4 flex-1 min-h-0">
          {statusColumns.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.key);
            return (
              <div
                key={col.key}
                className="flex flex-col flex-1 min-h-0 rounded-xl p-3"
                style={{ border: "1px solid rgba(226,191,178,0.15)" }}
              >
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: col.dotColor }}
                  />
                  <h2
                    className="text-xs font-bold tracking-widest uppercase"
                    style={{ color: "#191c1e" }}
                  >
                    {col.label}
                  </h2>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center"
                    style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}
                  >
                    {colOrders.length}
                  </span>
                </div>

                {/* Column body */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {/* Empty state for PRONTO column */}
                  {colOrders.length === 0 && col.key === "READY" && (
                    <div
                      className="flex flex-col items-center justify-center py-12 px-4 rounded-xl"
                      style={{
                        border: "2px dashed rgba(226,191,178,0.3)",
                      }}
                    >
                      <Utensils size={40} style={{ color: "#d1d5db" }} />
                      <p className="font-bold text-sm mt-3" style={{ color: "#6b7280" }}>
                        Nenhum pedido pronto
                      </p>
                      <p className="text-[10px] font-semibold tracking-wider uppercase mt-1" style={{ color: "#9ca3af" }}>
                        ARRASTE PARA CÁ QUANDO FINALIZAR
                      </p>
                    </div>
                  )}
                  {colOrders.length === 0 && col.key !== "READY" && (
                    <div
                      className="flex flex-col items-center justify-center py-12 px-4 rounded-xl text-sm"
                      style={{ color: "#9ca3af" }}
                    >
                      Nenhum pedido
                    </div>
                  )}

                  {colOrders.map((order) => {
                    const ch = channelConfig[order.channel];
                    const ChannelIcon = ch.icon;
                    const isExpanded = expandedOrder === order.id;
                    const items = order.order_items || [];
                    const minutesElapsed = getMinutesElapsed(order.created_at);

                    // Check for observations in items
                    const itemsWithObs = items.filter(
                      (item) =>
                        item.details &&
                        typeof item.details === "object" &&
                        (item.details as Record<string, unknown>).observacao
                    );

                    // Items as comma-separated text
                    const itemsText = items
                      .map((item) => `${item.quantity}x ${item.name}`)
                      .join(", ");

                    return (
                      <div
                        key={order.id}
                        className="rounded-xl p-4 transition-colors"
                        style={{
                          backgroundColor: "#ffffff",
                          border: "1px solid rgba(226,191,178,0.15)",
                          borderLeft: col.key === "PENDING" ? "3px solid #EA580C" : "1px solid rgba(226,191,178,0.15)",
                        }}
                      >
                        {/* Top row: grip + code + channel + time */}
                        <div className="flex items-center gap-2 mb-2">
                          <GripVertical size={16} style={{ color: "#d1d5db" }} className="flex-shrink-0 cursor-grab" />
                          <span
                            className="font-mono font-bold text-sm"
                            style={{ color: "#191c1e" }}
                          >
                            {order.code}
                          </span>
                          <span
                            className={`${ch.bg} ${ch.text} text-[10px] font-bold px-2 py-0.5 rounded-full uppercase`}
                          >
                            {ch.label}
                          </span>
                          <div className="ml-auto flex items-center gap-1 text-xs" style={{ color: "#6b7280" }}>
                            <Clock size={12} />
                            {timeAgo(order.created_at)}
                          </div>
                        </div>

                        {/* Customer name */}
                        {order.customer_name && (
                          <p
                            className="font-bold text-sm mb-1.5"
                            style={{ color: "#191c1e" }}
                          >
                            {order.customer_name}
                          </p>
                        )}

                        {/* Items as comma-separated text */}
                        <p className="text-sm mb-3 leading-relaxed" style={{ color: "#6b7280" }}>
                          {itemsText}
                        </p>

                        {/* Observations box */}
                        {itemsWithObs.length > 0 && (
                          <div
                            className="rounded-xl p-2.5 mb-3 text-xs"
                            style={{
                              backgroundColor: "rgba(234, 88, 12, 0.06)",
                              border: "1px solid rgba(226, 191, 178, 0.15)",
                            }}
                          >
                            {itemsWithObs.map((item, i) => {
                              const obs = (item.details as Record<string, unknown>)?.observacao;
                              return obs ? (
                                <p
                                  key={i}
                                  className="font-semibold"
                                  style={{ color: "#EA580C" }}
                                >
                                  OBS: {String(obs).toUpperCase()}
                                </p>
                              ) : null;
                            })}
                          </div>
                        )}

                        {/* Expanded details */}
                        {isExpanded && (
                          <div
                            className="pt-2 mb-3 space-y-1 text-sm"
                            style={{
                              borderTop: "1px solid rgba(226, 191, 178, 0.15)",
                              color: "#6b7280",
                            }}
                          >
                            {order.customer_phone && (
                              <div className="flex items-center gap-1.5">
                                <MessageCircle size={13} />
                                {order.customer_phone}
                              </div>
                            )}
                            {order.address && (
                              <div>
                                Endere\u00e7o: {order.address}
                                {order.neighborhood
                                  ? `, ${order.neighborhood}`
                                  : ""}
                              </div>
                            )}
                            {order.payment_method && (
                              <div>Pagamento: {order.payment_method}</div>
                            )}
                            {order.delivery_fee &&
                              parseFloat(order.delivery_fee) > 0 && (
                                <div>
                                  Taxa entrega: R${" "}
                                  {parseFloat(order.delivery_fee).toFixed(2).replace(".", ",")}
                                </div>
                              )}
                            <div
                              className="text-xs px-2 py-1 rounded-xl inline-block"
                              style={{
                                backgroundColor: "#f3f4f6",
                                color: "#6b7280",
                              }}
                            >
                              {typeLabels[order.type] || order.type}
                            </div>
                            {/* Individual items with prices when expanded */}
                            <div className="pt-2 space-y-0.5">
                              {items.map((item, i) => (
                                <div key={i} className="flex justify-between text-xs">
                                  <span>{item.quantity}x {item.name}</span>
                                  <span className="ml-2 whitespace-nowrap opacity-70">
                                    R$ {parseFloat(item.unit_price).toFixed(2).replace(".", ",")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Bottom row: price + actions */}
                        <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid rgba(226,191,178,0.1)" }}>
                          <span className="font-bold text-sm" style={{ color: "#EA580C" }}>
                            R$ {parseFloat(order.total).toFixed(2).replace(".", ",")}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                setExpandedOrder(isExpanded ? null : order.id)
                              }
                              className="text-[11px] font-bold tracking-wide uppercase transition-colors hover:opacity-80"
                              style={{ color: "#6b7280" }}
                            >
                              VER DETALHES
                            </button>
                            {col.key === "PREPARING" && (
                              <button
                                onClick={() => updateStatus(order.id, "READY")}
                                className="text-[11px] font-bold tracking-wide uppercase px-3 py-1 rounded-lg transition-colors hover:opacity-90"
                                style={{
                                  border: "1.5px solid rgba(226,191,178,0.35)",
                                  color: "#EA580C",
                                }}
                              >
                                EXPEDIR
                              </button>
                            )}
                            {col.key === "PENDING" && (
                              <button
                                onClick={() => updateStatus(order.id, "PREPARING")}
                                className="text-[11px] font-bold tracking-wide uppercase px-3 py-1 rounded-lg text-white transition-opacity hover:opacity-90"
                                style={{ backgroundColor: "#EA580C" }}
                              >
                                PREPARAR
                              </button>
                            )}
                            {col.key === "READY" && (
                              <button
                                onClick={() => updateStatus(order.id, "DELIVERED")}
                                className="text-[11px] font-bold tracking-wide uppercase px-3 py-1 rounded-lg transition-colors hover:opacity-90"
                                style={{
                                  border: "1.5px solid rgba(226,191,178,0.35)",
                                  color: "#0284C7",
                                }}
                              >
                                ENTREGUE
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right sidebar - Metrics */}
        <div className="w-64 flex-shrink-0 space-y-4">
          <h3 className="text-[11px] font-bold tracking-widest uppercase px-1" style={{ color: "#191c1e" }}>
            MÉTRICAS DE HOJE
          </h3>

          {/* Metric cards row */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: "#ffffff", border: "1px solid rgba(226,191,178,0.15)" }}
            >
              <p className="text-[10px] font-bold tracking-wider uppercase mb-1" style={{ color: "#6b7280" }}>
                PEDIDOS
              </p>
              <p className="text-2xl font-bold" style={{ color: "#EA580C" }}>
                {stats.totalPedidos}
              </p>
            </div>
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: "#ffffff", border: "1px solid rgba(226,191,178,0.15)" }}
            >
              <p className="text-[10px] font-bold tracking-wider uppercase mb-1" style={{ color: "#6b7280" }}>
                TEMPO MÉDIO
              </p>
              <p className="text-2xl font-bold" style={{ color: "#0284C7" }}>
                {stats.tempoPrepMedio}m
              </p>
            </div>
          </div>

          {/* Revenue card */}
          <div
            className="rounded-xl p-5 relative overflow-hidden"
            style={{ backgroundColor: "#0284C7" }}
          >
            <TrendingUp
              size={20}
              className="absolute top-4 right-4"
              style={{ color: "rgba(255,255,255,0.4)" }}
            />
            <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>
              FATURAMENTO LIVE
            </p>
            <p className="text-2xl font-bold text-white">
              R$ {stats.totalRevenue}
            </p>
          </div>

          {/* Completed orders */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "#ffffff", border: "1px solid rgba(226,191,178,0.15)" }}
          >
            <p className="text-[10px] font-bold tracking-wider uppercase mb-1" style={{ color: "#6b7280" }}>
              CONCLUÍDOS
            </p>
            <p className="text-2xl font-bold" style={{ color: "#191c1e" }}>
              {stats.pedidosConcluidos}
            </p>
          </div>

          {/* Ticket medio */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "#ffffff", border: "1px solid rgba(226,191,178,0.15)" }}
          >
            <p className="text-[10px] font-bold tracking-wider uppercase mb-1" style={{ color: "#6b7280" }}>
              TICKET MÉDIO
            </p>
            <p className="text-lg font-bold" style={{ color: "#191c1e" }}>
              R$ {stats.ticketMedio}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
