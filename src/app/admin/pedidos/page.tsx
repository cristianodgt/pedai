"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  Clock,
  MessageCircle,
  Monitor,
  Volume2,
  VolumeX,
  Utensils,
  GripVertical,
  SlidersHorizontal,
  Plus,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    dotColor: "#f59e0b",
  },
  {
    key: "READY",
    label: "PRONTO",
    dotColor: "#3b82f6",
  },
] as const;

const channelBadgeVariant: Record<string, "whatsapp" | "pdv" | "ifood"> = {
  WHATSAPP: "whatsapp",
  PDV: "pdv",
  IFOOD: "ifood",
};

const channelShortLabel: Record<string, string> = {
  WHATSAPP: "WA",
  PDV: "PDV",
  IFOOD: "IF",
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
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h${mins % 60}m`;
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
    const avgPrepTime =
      prepOrders.length > 0
        ? Math.round(
            prepOrders.reduce((sum, o) => sum + getMinutesElapsed(o.created_at), 0) /
              prepOrders.length
          )
        : 0;

    return {
      ticketMedio: ticketMedio.toFixed(2).replace(".", ","),
      tempoPrepMedio: avgPrepTime,
      pedidosConcluidos: delivered.length,
      totalRevenue: totalRevenue
        .toFixed(2)
        .replace(".", ",")
        .replace(/\B(?=(\d{3})+(?!\d))/g, "."),
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
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#191c1e]">Fila de Pedidos</h1>
            <p className="text-sm text-[#6b7280] mt-1">
              Gerencie o fluxo da sua cozinha em tempo real.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Desativar som" : "Ativar som"}
            className="text-[#6b7280] ml-1"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <SlidersHorizontal size={16} />
            Filtrar
          </Button>
          <Link href="/admin/pdv">
            <Button variant="default">
              <Plus size={16} />
              + Novo Pedido
            </Button>
          </Link>
        </div>
      </div>

      {/* Main area: Kanban + Metrics sidebar */}
      <div className="flex gap-5 flex-1 min-h-0">
        {/* Kanban columns */}
        <div className="flex gap-5 flex-1 min-h-0">
          {statusColumns.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.key);
            return (
              <div key={col.key} className="flex flex-col flex-1 min-h-0">
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: col.dotColor }}
                  />
                  <span className="uppercase tracking-wider text-xs font-bold text-[#5a4138]">
                    {col.label}
                  </span>
                  <Badge variant="secondary" className="text-xs min-w-[22px] text-center">
                    {String(colOrders.length).padStart(2, "0")}
                  </Badge>
                </div>

                {/* Column body */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {/* Empty state for PRONTO column */}
                  {colOrders.length === 0 && col.key === "READY" && (
                    <div
                      className="flex flex-col items-center justify-center flex-1 py-16 px-4 rounded-[0.75rem]"
                      style={{
                        border: "2px dashed rgba(226,191,178,0.25)",
                      }}
                    >
                      <Utensils size={40} className="text-[#c9c5c2]" />
                      <p className="font-semibold text-sm mt-3 text-[#191c1e]">
                        Nenhum pedido pronto
                      </p>
                      <p className="text-[10px] tracking-widest uppercase mt-1 text-[#9ca3af]">
                        ARRASTE PARA CÁ QUANDO FINALIZAR
                      </p>
                    </div>
                  )}
                  {colOrders.length === 0 && col.key !== "READY" && (
                    <div className="flex flex-col items-center justify-center py-12 px-4 rounded-[0.75rem] text-sm text-[#9ca3af]">
                      Nenhum pedido
                    </div>
                  )}

                  {colOrders.map((order) => {
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
                      <Card
                        key={order.id}
                        className={`border border-[rgba(226,191,178,0.15)] p-4 ${
                          col.key === "PENDING" ? "border-l-[3px] border-l-[#EA580C]" : ""
                        }`}
                      >
                        {/* Top row: grip + code + channel + time */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical
                              size={14}
                              className="text-[#c9c5c2] flex-shrink-0 cursor-grab"
                            />
                            <span className="font-mono font-bold text-sm text-[#191c1e]">
                              #{order.code}
                            </span>
                            <Badge variant={channelBadgeVariant[order.channel]}>
                              {channelShortLabel[order.channel]}
                            </Badge>
                          </div>
                          <div
                            className={`flex items-center gap-1 text-xs ${
                              minutesElapsed > 5 ? "text-[#EA580C]" : "text-[#6b7280]"
                            }`}
                          >
                            <Clock size={12} />
                            {timeAgo(order.created_at)}
                          </div>
                        </div>

                        {/* Customer name */}
                        {order.customer_name && (
                          <p className="font-semibold text-sm text-[#191c1e] mt-2">
                            {order.customer_name}
                          </p>
                        )}

                        {/* Items as comma-separated text */}
                        <p className="text-sm text-[#6b7280] mt-1 leading-relaxed">
                          {itemsText}
                        </p>

                        {/* Observations box */}
                        {itemsWithObs.length > 0 && (
                          <div
                            className="rounded-[0.75rem] p-2.5 mt-2 text-xs"
                            style={{
                              backgroundColor: "rgba(234, 88, 12, 0.06)",
                              border: "1px solid rgba(226, 191, 178, 0.15)",
                            }}
                          >
                            {itemsWithObs.map((item, i) => {
                              const obs = (item.details as Record<string, unknown>)?.observacao;
                              return obs ? (
                                <p key={i} className="font-semibold text-[#EA580C]">
                                  OBS: {String(obs).toUpperCase()}
                                </p>
                              ) : null;
                            })}
                          </div>
                        )}

                        {/* Expanded details */}
                        {isExpanded && (
                          <div
                            className="pt-2 mt-2 space-y-1 text-sm"
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
                                Endereço: {order.address}
                                {order.neighborhood ? `, ${order.neighborhood}` : ""}
                              </div>
                            )}
                            {order.payment_method && (
                              <div>Pagamento: {order.payment_method}</div>
                            )}
                            {order.delivery_fee && parseFloat(order.delivery_fee) > 0 && (
                              <div>
                                Taxa entrega: R${" "}
                                {parseFloat(order.delivery_fee)
                                  .toFixed(2)
                                  .replace(".", ",")}
                              </div>
                            )}
                            <div className="text-xs px-2 py-1 rounded-[0.75rem] inline-block bg-[#f3f4f6] text-[#6b7280]">
                              {typeLabels[order.type] || order.type}
                            </div>
                            {/* Individual items with prices when expanded */}
                            <div className="pt-2 space-y-0.5">
                              {items.map((item, i) => (
                                <div key={i} className="flex justify-between text-xs">
                                  <span>
                                    {item.quantity}x {item.name}
                                  </span>
                                  <span className="ml-2 whitespace-nowrap opacity-70">
                                    R${" "}
                                    {parseFloat(item.unit_price)
                                      .toFixed(2)
                                      .replace(".", ",")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Bottom row: price + actions */}
                        <div className="flex items-center justify-between mt-3">
                          <span className="font-bold text-[#EA580C]">
                            R$ {parseFloat(order.total).toFixed(2).replace(".", ",")}
                          </span>
                          <div className="flex items-center gap-2">
                            {col.key === "PENDING" && (
                              <>
                                <button
                                  onClick={() =>
                                    setExpandedOrder(isExpanded ? null : order.id)
                                  }
                                  className="text-xs font-semibold text-[#5a4138] uppercase tracking-wide cursor-pointer hover:opacity-80"
                                >
                                  VER DETALHES
                                </button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => updateStatus(order.id, "PREPARING")}
                                >
                                  PREPARAR
                                </Button>
                              </>
                            )}
                            {col.key === "PREPARING" && (
                              <>
                                <button
                                  onClick={() =>
                                    setExpandedOrder(isExpanded ? null : order.id)
                                  }
                                  className="text-xs font-semibold text-[#5a4138] uppercase tracking-wide cursor-pointer hover:opacity-80"
                                >
                                  VER DETALHES
                                </button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateStatus(order.id, "READY")}
                                >
                                  EXPEDIR
                                </Button>
                              </>
                            )}
                            {col.key === "READY" && (
                              <>
                                <button
                                  onClick={() =>
                                    setExpandedOrder(isExpanded ? null : order.id)
                                  }
                                  className="text-xs font-semibold text-[#5a4138] uppercase tracking-wide cursor-pointer hover:opacity-80"
                                >
                                  VER DETALHES
                                </button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => updateStatus(order.id, "DELIVERED")}
                                >
                                  ENTREGUE
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right sidebar - Metrics */}
        <div className="w-[280px] flex-shrink-0 space-y-3">
          <h3 className="uppercase text-xs font-bold tracking-wider text-[#191c1e] mb-3 px-1">
            MÉTRICAS DE HOJE
          </h3>

          {/* Metric cards row: Pedidos + Tempo Medio */}
          <div className="grid grid-cols-2 gap-2">
            <Card className="border border-[rgba(226,191,178,0.15)] p-4">
              <p className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-1">
                PEDIDOS
              </p>
              <p className="text-2xl font-bold text-[#EA580C]">{stats.totalPedidos}</p>
            </Card>
            <Card className="border border-[rgba(226,191,178,0.15)] p-4">
              <p className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-1">
                TEMPO MÉDIO
              </p>
              <p className="text-2xl font-bold text-[#3b82f6]">{stats.tempoPrepMedio}m</p>
            </Card>
          </div>

          {/* Revenue card */}
          <div className="bg-[#0284c7] text-white p-4 rounded-[0.75rem] relative overflow-hidden">
            <div className="flex items-start justify-between">
              <p className="text-[10px] uppercase tracking-wider opacity-70">
                FATURAMENTO LIVE
              </p>
              <TrendingUp size={18} className="opacity-40" />
            </div>
            <p className="text-xl font-bold mt-1">R$ {stats.totalRevenue}</p>
          </div>

          {/* Concluidos + Ticket Medio */}
          <div className="grid grid-cols-2 gap-2">
            <Card className="border border-[rgba(226,191,178,0.15)] p-4">
              <p className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-1">
                CONCLUÍDOS
              </p>
              <p className="text-2xl font-bold text-[#16a34a]">{stats.pedidosConcluidos}</p>
            </Card>
            <Card className="border border-[rgba(226,191,178,0.15)] p-4">
              <p className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-1">
                TICKET MÉDIO
              </p>
              <p className="text-2xl font-bold text-[#EA580C]">R$ {stats.ticketMedio}</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
