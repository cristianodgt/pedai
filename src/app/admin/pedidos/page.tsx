"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Clock, User, MessageCircle, Monitor, Volume2, VolumeX, ChevronDown, ChevronUp, Utensils, Play } from "lucide-react";
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
    badgeBg: "bg-[#ff9971]/20",
    badgeText: "text-[#a33900]",
    emptyBg: "bg-[#ff9971]/10",
  },
  {
    key: "PREPARING",
    label: "PREPARANDO",
    badgeBg: "bg-[#c2e0f4]/40",
    badgeText: "text-[#2b6a99]",
    emptyBg: "bg-[#c2e0f4]/20",
  },
  {
    key: "READY",
    label: "PRONTO",
    badgeBg: "bg-[#b8e6c8]/40",
    badgeText: "text-[#2d7a4f]",
    emptyBg: "bg-[#b8e6c8]/20",
  },
] as const;

const channelConfig = {
  WHATSAPP: { label: "WHATSAPP", bg: "bg-[#dcf5e3]", text: "text-[#1d6b38]", icon: MessageCircle },
  PDV: { label: "PDV", bg: "bg-[#dce8f5]", text: "text-[#2b5a8a]", icon: Monitor },
  IFOOD: { label: "IFOOD", bg: "bg-[#ff9971]/20", text: "text-[#a33900]", icon: Utensils },
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
    };
  }, [orders, now]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-[#f8f9fb]">
        <div
          className="animate-spin rounded-full h-8 w-8"
          style={{
            borderWidth: "2px",
            borderStyle: "solid",
            borderColor: "#e2bfb2",
            borderTopColor: "#a33900",
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f8f9fb]">
      {/* Header area */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: "#4caf50" }}
            />
            <span className="text-sm font-semibold tracking-wide uppercase" style={{ color: "#5a4138" }}>
              AO VIVO
            </span>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: "#5a4138" }}
            title={soundEnabled ? "Desativar som" : "Ativar som"}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{soundEnabled ? "Som ativado" : "Som desativado"}</span>
          </button>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
        {statusColumns.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.key);
          return (
            <div
              key={col.key}
              className="flex flex-col min-h-0 rounded-[0.75rem] p-3"
              style={{ backgroundColor: "#edeef0" }}
            >
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3">
                <h2
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: "#5a4138" }}
                >
                  {col.label}
                </h2>
                <span
                  className={`${col.badgeBg} ${col.badgeText} text-xs font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center`}
                >
                  {colOrders.length}
                </span>
              </div>

              {/* Column body */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {colOrders.length === 0 && (
                  <div
                    className={`${col.emptyBg} rounded-[0.75rem] p-8 text-center text-sm`}
                    style={{ color: "#5a4138" }}
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
                  const timerStyle =
                    col.key === "PENDING" && minutesElapsed > 5
                      ? { color: "#a33900" }
                      : { color: "#5a4138" };

                  // Check for observations in items
                  const itemsWithObs = items.filter(
                    (item) =>
                      item.details &&
                      typeof item.details === "object" &&
                      (item.details as Record<string, unknown>).observacao
                  );

                  return (
                    <div
                      key={order.id}
                      className="rounded-[0.75rem] p-4 transition-colors"
                      style={{ backgroundColor: "#ffffff" }}
                    >
                      {/* Top row: code + channel */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="font-mono font-bold text-sm"
                          style={{ color: "#191c1e" }}
                        >
                          {order.code}
                        </span>
                        <span
                          className={`${ch.bg} ${ch.text} text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase`}
                        >
                          <ChannelIcon size={11} />
                          {ch.label}
                        </span>
                      </div>

                      {/* Customer name */}
                      {order.customer_name && (
                        <p
                          className="font-bold text-sm mb-2"
                          style={{ color: "#191c1e" }}
                        >
                          {order.customer_name}
                        </p>
                      )}

                      {/* Items list */}
                      <div className="text-sm mb-2 space-y-0.5" style={{ color: "#5a4138" }}>
                        {items
                          .slice(0, isExpanded ? items.length : 3)
                          .map((item, i) => (
                            <div key={i} className="flex justify-between">
                              <span>
                                {item.quantity}x {item.name}
                              </span>
                              <span className="ml-2 whitespace-nowrap opacity-70">
                                R$ {parseFloat(item.unit_price).toFixed(2).replace(".", ",")}
                              </span>
                            </div>
                          ))}
                        {!isExpanded && items.length > 3 && (
                          <span className="text-xs opacity-60">
                            +{items.length - 3} item(s)
                          </span>
                        )}
                      </div>

                      {/* Observations box */}
                      {itemsWithObs.length > 0 && (
                        <div
                          className="rounded-[0.75rem] p-2.5 mb-2 text-xs"
                          style={{
                            backgroundColor: "rgba(255, 153, 113, 0.12)",
                            border: "1px solid rgba(226, 191, 178, 0.15)",
                          }}
                        >
                          <p className="font-bold mb-1" style={{ color: "#5a4138" }}>
                            ITENS
                          </p>
                          <ul
                            className="list-disc list-inside space-y-0.5"
                            style={{ color: "#5a4138" }}
                          >
                            {itemsWithObs.map((item, i) => (
                              <li key={i}>{item.name}</li>
                            ))}
                          </ul>
                          {itemsWithObs.map((item, i) => {
                            const obs = (item.details as Record<string, unknown>)?.observacao;
                            return obs ? (
                              <p
                                key={i}
                                className="font-semibold mt-1"
                                style={{ color: "#a33900" }}
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
                          className="pt-2 mb-2 space-y-1 text-sm"
                          style={{
                            borderTop: "1px solid rgba(226, 191, 178, 0.15)",
                            color: "#5a4138",
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
                                {parseFloat(order.delivery_fee).toFixed(2)}
                              </div>
                            )}
                          <div
                            className="text-xs px-2 py-1 rounded-[0.75rem] inline-block"
                            style={{
                              backgroundColor: "#edeef0",
                              color: "#5a4138",
                            }}
                          >
                            {typeLabels[order.type] || order.type}
                          </div>
                        </div>
                      )}

                      {/* Toggle expand */}
                      <button
                        onClick={() =>
                          setExpandedOrder(isExpanded ? null : order.id)
                        }
                        className="text-xs flex items-center gap-0.5 mb-3 transition-colors hover:opacity-80"
                        style={{ color: "#5a4138" }}
                      >
                        {isExpanded ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                        {isExpanded ? "Menos" : "Detalhes"}
                      </button>

                      {/* Bottom row: timer + total */}
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="flex items-center gap-1 text-xs font-medium"
                          style={timerStyle}
                        >
                          <Clock size={14} />
                          {timeAgo(order.created_at)}
                        </div>
                        <span className="font-bold" style={{ color: "#191c1e" }}>
                          R$ {parseFloat(order.total).toFixed(2).replace(".", ",")}
                        </span>
                      </div>

                      {/* Action button */}
                      {col.key === "PENDING" && (
                        <button
                          onClick={() => updateStatus(order.id, "PREPARING")}
                          className="w-full text-white font-semibold py-2 rounded-[0.75rem] transition-opacity hover:opacity-90 flex items-center justify-center gap-2 text-sm"
                          style={{
                            background: "linear-gradient(135deg, #a33900, #cc4900)",
                          }}
                        >
                          <Play size={14} fill="currentColor" />
                          Preparar
                        </button>
                      )}
                      {col.key === "PREPARING" && (
                        <button
                          onClick={() => updateStatus(order.id, "READY")}
                          className="w-full font-semibold py-2 rounded-[0.75rem] transition-colors hover:opacity-90 text-sm"
                          style={{
                            backgroundColor: "transparent",
                            border: "1.5px solid rgba(226, 191, 178, 0.35)",
                            color: "#a33900",
                          }}
                        >
                          Pronto
                        </button>
                      )}
                      {col.key === "READY" && (
                        <button
                          onClick={() => updateStatus(order.id, "DELIVERED")}
                          className="w-full font-semibold py-2 rounded-[0.75rem] transition-colors hover:opacity-90 text-sm"
                          style={{
                            backgroundColor: "#b8e6c8",
                            color: "#1d5a33",
                          }}
                        >
                          Entregue
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom stats bar */}
      <div
        className="mt-4 rounded-[0.75rem] py-3 px-6 flex items-center justify-center gap-8 flex-wrap"
        style={{ backgroundColor: "#ffffff" }}
      >
        <div className="flex items-center gap-2 text-sm" style={{ color: "#5a4138" }}>
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "#ff9971" }}
          />
          <span className="font-semibold tracking-wide">TICKET M\u00c9DIO:</span>
          <span>R$ {stats.ticketMedio}</span>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: "#5a4138" }}>
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "#6ba3d6" }}
          />
          <span className="font-semibold tracking-wide">TEMPO M\u00c9DIO PREP:</span>
          <span>{stats.tempoPrepMedio} MIN</span>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: "#5a4138" }}>
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "#5cb87a" }}
          />
          <span className="font-semibold tracking-wide">PEDIDOS CONCLU\u00cdDOS:</span>
          <span>{stats.pedidosConcluidos}</span>
        </div>
        <div
          className="ml-auto text-xs font-mono"
          style={{ color: "#5a4138", opacity: 0.5 }}
        >
          SISTEMA PEDAI V2.4.0
        </div>
      </div>
    </div>
  );
}
