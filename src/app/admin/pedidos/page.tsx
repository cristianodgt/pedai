"use client";

import { useEffect, useState } from "react";
import { Clock, MapPin, Phone, User, MessageCircle, Monitor } from "lucide-react";

type Order = {
  id: string;
  code: string;
  channel: "WHATSAPP" | "PDV" | "IFOOD";
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED";
  type: "DELIVERY" | "PICKUP" | "DINE_IN";
  customerName: string | null;
  customerPhone: string | null;
  total: string;
  createdAt: string;
  items: { name: string; quantity: number; total: string }[];
};

const statusColumns = [
  { key: "PENDING", label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  { key: "PREPARING", label: "Preparando", color: "bg-blue-100 text-blue-800" },
  { key: "READY", label: "Pronto", color: "bg-green-100 text-green-800" },
] as const;

const channelConfig = {
  WHATSAPP: { label: "WhatsApp", color: "bg-green-500", icon: MessageCircle },
  PDV: { label: "PDV", color: "bg-blue-500", icon: Monitor },
  IFOOD: { label: "iFood", color: "bg-red-500", icon: Monitor },
};

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchOrders() {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error("Fetch orders error:", e);
    } finally {
      setLoading(false);
    }
  }

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
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

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
        <span className="text-sm text-gray-500">
          {orders.length} pedido(s) ativos
        </span>
      </div>

      <div className="grid grid-cols-3 gap-6">
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

              <div className="space-y-3">
                {colOrders.length === 0 && (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400 text-sm">
                    Nenhum pedido
                  </div>
                )}
                {colOrders.map((order) => {
                  const ch = channelConfig[order.channel];
                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-gray-900">{order.code}</span>
                        <span className={`${ch.color} text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1`}>
                          <ch.icon size={12} />
                          {ch.label}
                        </span>
                      </div>

                      {order.customerName && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-1">
                          <User size={14} />
                          {order.customerName}
                        </div>
                      )}

                      <div className="text-sm text-gray-500 mb-3">
                        {order.items.map((item, i) => (
                          <div key={i}>
                            {item.quantity}x {item.name}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between border-t pt-3">
                        <span className="font-bold text-orange-600">
                          R$ {parseFloat(order.total).toFixed(2)}
                        </span>
                        <div className="flex gap-1">
                          {col.key === "PENDING" && (
                            <button
                              onClick={() => updateStatus(order.id, "PREPARING")}
                              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                            >
                              Preparar
                            </button>
                          )}
                          {col.key === "PREPARING" && (
                            <button
                              onClick={() => updateStatus(order.id, "READY")}
                              className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                            >
                              Pronto
                            </button>
                          )}
                          {col.key === "READY" && (
                            <button
                              onClick={() => updateStatus(order.id, "DELIVERED")}
                              className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
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
