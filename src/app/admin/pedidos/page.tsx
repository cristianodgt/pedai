"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Clock, User, MessageCircle, Monitor, Volume2, VolumeX, ChevronDown, ChevronUp } from "lucide-react";
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
  { key: "PENDING", label: "Pendente", color: "bg-yellow-100 text-yellow-800", border: "border-yellow-300" },
  { key: "PREPARING", label: "Preparando", color: "bg-blue-100 text-blue-800", border: "border-blue-300" },
  { key: "READY", label: "Pronto", color: "bg-green-100 text-green-800", border: "border-green-300" },
] as const;

const channelConfig = {
  WHATSAPP: { label: "WhatsApp", color: "bg-green-500", icon: MessageCircle },
  PDV: { label: "PDV", color: "bg-blue-500", icon: Monitor },
  IFOOD: { label: "iFood", color: "bg-red-500", icon: Monitor },
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fila de Pedidos</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
            title={soundEnabled ? "Desativar som" : "Ativar som"}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            {soundEnabled ? "Som ativo" : "Som mudo"}
          </button>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-500">Ao vivo</span>
          </div>
          <span className="text-sm text-gray-500">
            {orders.length} pedido(s)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statusColumns.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.key);
          return (
            <div key={col.key}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${col.color}`}>
                  {col.label}
                </span>
                <span className="text-sm text-gray-400">{colOrders.length}</span>
              </div>

              <div className="space-y-3 min-h-[200px]">
                {colOrders.length === 0 && (
                  <div className={`border-2 border-dashed ${col.border} rounded-lg p-8 text-center text-gray-400 text-sm`}>
                    Nenhum pedido
                  </div>
                )}
                {colOrders.map((order) => {
                  const ch = channelConfig[order.channel];
                  const isExpanded = expandedOrder === order.id;
                  const items = order.order_items || [];
                  return (
                    <div
                      key={order.id}
                      className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition ${
                        col.key === "PENDING" && order.channel === "WHATSAPP"
                          ? "ring-2 ring-green-200"
                          : ""
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{order.code}</span>
                          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            {typeLabels[order.type] || order.type}
                          </span>
                        </div>
                        <span className={`${ch.color} text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1`}>
                          <ch.icon size={12} />
                          {ch.label}
                        </span>
                      </div>

                      {/* Customer */}
                      {order.customer_name && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-1">
                          <User size={14} />
                          {order.customer_name}
                        </div>
                      )}

                      {/* Items summary */}
                      <div className="text-sm text-gray-500 mb-2">
                        {items.slice(0, isExpanded ? items.length : 3).map((item, i) => (
                          <div key={i} className="flex justify-between">
                            <span>{item.quantity}x {item.name}</span>
                            <span className="text-gray-400">R$ {parseFloat(item.total).toFixed(2)}</span>
                          </div>
                        ))}
                        {!isExpanded && items.length > 3 && (
                          <span className="text-xs text-gray-400">+{items.length - 3} item(s)</span>
                        )}
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 pt-2 mb-2 space-y-1 text-sm text-gray-500">
                          {order.customer_phone && (
                            <div className="flex items-center gap-1.5">
                              <MessageCircle size={13} />
                              {order.customer_phone}
                            </div>
                          )}
                          {order.address && (
                            <div>Endere\u00e7o: {order.address}{order.neighborhood ? `, ${order.neighborhood}` : ""}</div>
                          )}
                          {order.payment_method && (
                            <div>Pagamento: {order.payment_method}</div>
                          )}
                          {order.delivery_fee && parseFloat(order.delivery_fee) > 0 && (
                            <div>Taxa entrega: R$ {parseFloat(order.delivery_fee).toFixed(2)}</div>
                          )}
                        </div>
                      )}

                      {/* Toggle expand */}
                      <button
                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5 mb-2"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {isExpanded ? "Menos" : "Detalhes"}
                      </button>

                      {/* Footer */}
                      <div className="flex items-center justify-between border-t pt-3">
                        <div>
                          <span className="font-bold text-orange-600">
                            R$ {parseFloat(order.total).toFixed(2)}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                            <Clock size={12} />
                            {timeAgo(order.created_at)}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {col.key === "PENDING" && (
                            <button
                              onClick={() => updateStatus(order.id, "PREPARING")}
                              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 font-medium"
                            >
                              Preparar
                            </button>
                          )}
                          {col.key === "PREPARING" && (
                            <button
                              onClick={() => updateStatus(order.id, "READY")}
                              className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 font-medium"
                            >
                              Pronto
                            </button>
                          )}
                          {col.key === "READY" && (
                            <button
                              onClick={() => updateStatus(order.id, "DELIVERED")}
                              className="text-xs bg-gray-600 text-white px-3 py-1.5 rounded hover:bg-gray-700 font-medium"
                            >
                              Entregue
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
    </div>
  );
}
