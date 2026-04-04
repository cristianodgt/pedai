"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  MessageCircle,
  Monitor,
  BarChart3,
  Package,
  Download,
  Plus,
} from "lucide-react";

type Stats = {
  today: {
    total: number;
    active: number;
    revenue: number;
    ticketMedio: number;
    byChannel: { WHATSAPP: number; PDV: number; IFOOD: number };
    byStatus: Record<string, number>;
    byPayment: Record<string, number>;
    byHour: number[];
  };
  week: { total: number; revenue: number };
  month: { total: number; revenue: number };
  topProducts: { name: string; qty: number; revenue: number }[];
};

function currency(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function BarChartSimple({ data, maxVal }: { data: number[]; maxVal: number }) {
  const peak = maxVal || 1;
  const hours = data.slice(6, 24);
  return (
    <div className="flex items-end gap-1 h-40">
      {hours.map((val, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t transition-all min-h-[2px]"
            style={{
              height: `${(val / peak) * 100}%`,
              background: "linear-gradient(180deg, #a33900, #cc4900)",
            }}
            title={`${i + 6}h: ${val} pedidos`}
          />
          {(i + 6) % 3 === 0 && (
            <span className="text-[10px]" style={{ color: "#5a4138" }}>
              {i + 6}h
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function DonutChart({
  channels,
  total,
}: {
  channels: { WHATSAPP: number; PDV: number; IFOOD: number };
  total: number;
}) {
  const totalOrders = channels.WHATSAPP + channels.PDV + channels.IFOOD || 1;
  const whatsappPct = Math.round((channels.WHATSAPP / totalOrders) * 100);
  const pdvPct = Math.round((channels.PDV / totalOrders) * 100);
  const ifoodPct = 100 - whatsappPct - pdvPct;

  const whatsappDeg = (whatsappPct / 100) * 360;
  const pdvDeg = (pdvPct / 100) * 360;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <div
          className="w-full h-full rounded-full"
          style={{
            background: `conic-gradient(
              #22c55e 0deg ${whatsappDeg}deg,
              #0066cc ${whatsappDeg}deg ${whatsappDeg + pdvDeg}deg,
              #cc4900 ${whatsappDeg + pdvDeg}deg 360deg
            )`,
          }}
        />
        <div
          className="absolute inset-3 rounded-full flex flex-col items-center justify-center"
          style={{ backgroundColor: "#ffffff" }}
        >
          <span
            className="text-[10px] uppercase tracking-widest font-medium"
            style={{ color: "#5a4138" }}
          >
            Total
          </span>
          <span
            className="text-xl font-bold"
            style={{ color: "#191c1e" }}
          >
            {total}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-3 mt-5 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: "#22c55e" }}
            />
            <span className="text-sm" style={{ color: "#5a4138" }}>
              WhatsApp
            </span>
          </div>
          <span
            className="text-sm font-semibold"
            style={{ color: "#191c1e" }}
          >
            {whatsappPct}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: "#0066cc" }}
            />
            <span className="text-sm" style={{ color: "#5a4138" }}>
              Balcao/PDV
            </span>
          </div>
          <span
            className="text-sm font-semibold"
            style={{ color: "#191c1e" }}
          >
            {pdvPct}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: "#cc4900" }}
            />
            <span className="text-sm" style={{ color: "#5a4138" }}>
              iFood
            </span>
          </div>
          <span
            className="text-sm font-semibold"
            style={{ color: "#191c1e" }}
          >
            {ifoodPct}%
          </span>
        </div>
      </div>
    </div>
  );
}

function getStockStatus(qty: number): { label: string; bg: string; text: string } {
  if (qty >= 20)
    return { label: "EM ALTA", bg: "rgba(34,197,94,0.12)", text: "#15803d" };
  if (qty <= 5)
    return { label: "CRITICO", bg: "rgba(220,38,38,0.10)", text: "#b91c1c" };
  return { label: "NORMAL", bg: "rgba(217,169,78,0.14)", text: "#92600a" };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.error("Dashboard error:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div
          className="animate-spin rounded-full h-8 w-8"
          style={{ borderBottom: "2px solid #a33900" }}
        />
      </div>
    );
  }

  if (!stats) {
    return (
      <div
        className="text-center py-20"
        style={{ color: "#5a4138" }}
      >
        Erro ao carregar dashboard
      </div>
    );
  }

  const maxHour = Math.max(...stats.today.byHour);
  const totalChannelOrders =
    stats.today.byChannel.WHATSAPP +
    stats.today.byChannel.PDV +
    stats.today.byChannel.IFOOD;

  return (
    <div
      className="space-y-6 relative min-h-screen pb-20"
      style={{ backgroundColor: "#f8f9fb", fontFamily: "'Inter', sans-serif" }}
    >
      <h1
        className="text-2xl font-bold"
        style={{ color: "#191c1e" }}
      >
        Dashboard
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pedidos hoje */}
        <div className="rounded-xl p-5" style={{ backgroundColor: "#ffffff" }}>
          <div className="flex items-start justify-between mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(163,57,0,0.10)" }}
            >
              <ShoppingCart size={20} style={{ color: "#a33900" }} />
            </div>
            {stats.today.total > 0 && (
              <span
                className="inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "rgba(34,197,94,0.12)",
                  color: "#15803d",
                }}
              >
                <TrendingUp size={12} />
                +{stats.today.active}
              </span>
            )}
          </div>
          <p className="text-sm mb-1" style={{ color: "#5a4138" }}>
            Pedidos hoje
          </p>
          <p className="text-3xl font-bold" style={{ color: "#191c1e" }}>
            {stats.today.total}
          </p>
        </div>

        {/* Faturamento hoje */}
        <div className="rounded-xl p-5" style={{ backgroundColor: "#ffffff" }}>
          <div className="flex items-start justify-between mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(34,197,94,0.12)" }}
            >
              <DollarSign size={20} style={{ color: "#15803d" }} />
            </div>
            {stats.today.revenue > 0 && (
              <span
                className="inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "rgba(34,197,94,0.12)",
                  color: "#15803d",
                }}
              >
                <TrendingUp size={12} />
                Ativo
              </span>
            )}
          </div>
          <p className="text-sm mb-1" style={{ color: "#5a4138" }}>
            Faturamento hoje
          </p>
          <p className="text-3xl font-bold" style={{ color: "#191c1e" }}>
            {currency(stats.today.revenue)}
          </p>
        </div>

        {/* Faturamento semana */}
        <div className="rounded-xl p-5" style={{ backgroundColor: "#ffffff" }}>
          <div className="flex items-start justify-between mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(0,102,204,0.10)" }}
            >
              <BarChart3 size={20} style={{ color: "#0066cc" }} />
            </div>
            <span
              className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "#edeef0",
                color: "#5a4138",
              }}
            >
              Estavel
            </span>
          </div>
          <p className="text-sm mb-1" style={{ color: "#5a4138" }}>
            Faturamento semana
          </p>
          <p className="text-3xl font-bold" style={{ color: "#191c1e" }}>
            {currency(stats.week.revenue)}
          </p>
        </div>

        {/* Faturamento mes */}
        <div className="rounded-xl p-5" style={{ backgroundColor: "#ffffff" }}>
          <div className="flex items-start justify-between mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(163,57,0,0.08)" }}
            >
              <TrendingUp size={20} style={{ color: "#cc4900" }} />
            </div>
            {stats.month.revenue > 0 && (
              <span
                className="inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "rgba(34,197,94,0.12)",
                  color: "#15803d",
                }}
              >
                <TrendingUp size={12} />
                +{stats.month.total}
              </span>
            )}
          </div>
          <p className="text-sm mb-1" style={{ color: "#5a4138" }}>
            Faturamento mes
          </p>
          <p className="text-3xl font-bold" style={{ color: "#191c1e" }}>
            {currency(stats.month.revenue)}
          </p>
        </div>
      </div>

      {/* Charts Row — asymmetric 66/33 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders by hour chart — 66% */}
        <div
          className="lg:col-span-2 rounded-xl p-5"
          style={{ backgroundColor: "#ffffff" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: "#191c1e" }}>
              Fluxo de Pedidos
            </h3>
            <button
              className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider hover:opacity-70 transition px-3 py-1.5"
              style={{
                color: "#a33900",
                background: "none",
                border: "none",
              }}
            >
              <Download size={14} />
              Exportar
            </button>
          </div>
          {stats.today.total === 0 ? (
            <div
              className="h-40 flex items-center justify-center text-sm"
              style={{ color: "#5a4138" }}
            >
              Nenhum pedido hoje ainda
            </div>
          ) : (
            <BarChartSimple data={stats.today.byHour} maxVal={maxHour} />
          )}
        </div>

        {/* Channel breakdown donut — 33% */}
        <div className="rounded-xl p-5" style={{ backgroundColor: "#ffffff" }}>
          <h3
            className="font-semibold mb-4"
            style={{ color: "#191c1e" }}
          >
            Canais de Venda
          </h3>
          <DonutChart
            channels={stats.today.byChannel}
            total={totalChannelOrders}
          />
        </div>
      </div>

      {/* Top Products Table */}
      <div className="rounded-xl p-5" style={{ backgroundColor: "#ffffff" }}>
        <div className="flex items-center justify-between mb-4">
          <h3
            className="font-semibold flex items-center gap-2"
            style={{ color: "#191c1e" }}
          >
            <Package size={18} style={{ color: "#a33900" }} />
            Top 10 Produtos Mais Vendidos
          </h3>
          <a
            href="#"
            className="text-xs font-medium uppercase tracking-wider hover:opacity-70 transition"
            style={{ color: "#a33900" }}
          >
            Exportar
          </a>
        </div>
        {stats.topProducts.length === 0 ? (
          <div
            className="text-center text-sm py-8"
            style={{ color: "#5a4138" }}
          >
            Nenhuma venda este mes
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider">
                  <th
                    className="pb-4 font-medium"
                    style={{ color: "#5a4138" }}
                  >
                    Produto
                  </th>
                  <th
                    className="pb-4 font-medium"
                    style={{ color: "#5a4138" }}
                  >
                    Categoria
                  </th>
                  <th
                    className="pb-4 font-medium text-right"
                    style={{ color: "#5a4138" }}
                  >
                    Qtd. Vendida
                  </th>
                  <th
                    className="pb-4 font-medium text-right"
                    style={{ color: "#5a4138" }}
                  >
                    Receita Bruta
                  </th>
                  <th
                    className="pb-4 font-medium text-right"
                    style={{ color: "#5a4138" }}
                  >
                    Status Estoque
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.slice(0, 10).map((p, i) => {
                  const status = getStockStatus(p.qty);
                  return (
                    <tr
                      key={p.name}
                      style={{
                        backgroundColor:
                          i % 2 === 1 ? "#f8f9fb" : "transparent",
                      }}
                    >
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: "#edeef0" }}
                          >
                            <Package
                              size={14}
                              style={{ color: "#5a4138" }}
                            />
                          </div>
                          <span
                            className="font-medium"
                            style={{ color: "#191c1e" }}
                          >
                            {p.name}
                          </span>
                        </div>
                      </td>
                      <td
                        className="py-3.5"
                        style={{ color: "#5a4138" }}
                      >
                        --
                      </td>
                      <td
                        className="py-3.5 text-right font-medium"
                        style={{ color: "#191c1e" }}
                      >
                        {p.qty}
                      </td>
                      <td
                        className="py-3.5 text-right font-semibold"
                        style={{ color: "#191c1e" }}
                      >
                        {currency(p.revenue)}
                      </td>
                      <td className="py-3.5 text-right">
                        <span
                          className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-xl"
                          style={{
                            backgroundColor: status.bg,
                            color: status.text,
                          }}
                        >
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating action button */}
      <div className="fixed bottom-6 right-6 z-40">
        <a
          href="/admin/pdv"
          className="flex items-center gap-2 px-5 py-3 text-white rounded-xl hover:opacity-90 transition font-medium text-sm"
          style={{
            background: "linear-gradient(135deg, #a33900, #cc4900)",
          }}
        >
          <Plus size={18} />
          Novo Pedido PDV
        </a>
      </div>
    </div>
  );
}
