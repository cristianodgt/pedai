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
            className="w-full bg-[#A0522D] rounded-t-sm transition-all min-h-[2px]"
            style={{ height: `${(val / peak) * 100}%` }}
            title={`${i + 6}h: ${val} pedidos`}
          />
          {(i + 6) % 3 === 0 && (
            <span className="text-[10px] text-gray-400">{i + 6}h</span>
          )}
        </div>
      ))}
    </div>
  );
}

function DonutChart({ channels, total }: { channels: { WHATSAPP: number; PDV: number; IFOOD: number }; total: number }) {
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
              #3b82f6 ${whatsappDeg}deg ${whatsappDeg + pdvDeg}deg,
              #ef4444 ${whatsappDeg + pdvDeg}deg 360deg
            )`,
          }}
        />
        <div className="absolute inset-3 bg-white rounded-full flex flex-col items-center justify-center">
          <span className="text-xs text-gray-400 uppercase tracking-wide">Total</span>
          <span className="text-xl font-bold text-gray-900">{total}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 mt-4 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-gray-600">WhatsApp</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">{whatsappPct}%</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm text-gray-600">Balcao/PDV</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">{pdvPct}%</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm text-gray-600">iFood</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">{ifoodPct}%</span>
        </div>
      </div>
    </div>
  );
}

function getStockStatus(qty: number): { label: string; color: string } {
  if (qty >= 20) return { label: "EM ALTA", color: "bg-green-100 text-green-700" };
  if (qty <= 5) return { label: "CRITICO", color: "bg-red-100 text-red-700" };
  return { label: "NORMAL", color: "bg-gray-100 text-gray-600" };
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A0522D]" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-400 py-20">
        Erro ao carregar dashboard
      </div>
    );
  }

  const maxHour = Math.max(...stats.today.byHour);
  const totalChannelOrders = stats.today.byChannel.WHATSAPP + stats.today.byChannel.PDV + stats.today.byChannel.IFOOD;

  return (
    <div className="space-y-6 relative min-h-screen pb-20">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pedidos hoje */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <ShoppingCart size={20} className="text-orange-600" />
            </div>
            {stats.today.total > 0 && (
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                <TrendingUp size={12} />
                +{stats.today.active}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-1">Pedidos hoje</p>
          <p className="text-3xl font-bold text-gray-900">{stats.today.total}</p>
        </div>

        {/* Faturamento hoje */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign size={20} className="text-green-600" />
            </div>
            {stats.today.revenue > 0 && (
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                <TrendingUp size={12} />
                Ativo
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-1">Faturamento hoje</p>
          <p className="text-3xl font-bold text-gray-900">{currency(stats.today.revenue)}</p>
        </div>

        {/* Faturamento semana */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <BarChart3 size={20} className="text-blue-600" />
            </div>
            <span className="inline-flex items-center text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
              Estavel
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-1">Faturamento semana</p>
          <p className="text-3xl font-bold text-gray-900">{currency(stats.week.revenue)}</p>
        </div>

        {/* Faturamento mes */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} className="text-pink-600" />
            </div>
            {stats.month.revenue > 0 && (
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                <TrendingUp size={12} />
                +{stats.month.total}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-1">Faturamento mes</p>
          <p className="text-3xl font-bold text-gray-900">{currency(stats.month.revenue)}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders by hour chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Fluxo de Pedidos</h3>
            <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <Download size={14} />
              Exportar
            </button>
          </div>
          {stats.today.total === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
              Nenhum pedido hoje ainda
            </div>
          ) : (
            <BarChartSimple data={stats.today.byHour} maxVal={maxHour} />
          )}
        </div>

        {/* Channel breakdown donut */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Canais de Venda</h3>
          <DonutChart channels={stats.today.byChannel} total={totalChannelOrders} />
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Package size={18} className="text-[#A0522D]" />
            Top 10 Produtos Mais Vendidos
          </h3>
          <a href="#" className="text-sm text-[#A0522D] hover:text-[#8B4726] font-medium">
            Ver relatorio completo
          </a>
        </div>
        {stats.topProducts.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            Nenhuma venda este mes
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="pb-3 font-medium">Produto</th>
                  <th className="pb-3 font-medium">Categoria</th>
                  <th className="pb-3 font-medium text-right">Qtd. Vendida</th>
                  <th className="pb-3 font-medium text-right">Receita Bruta</th>
                  <th className="pb-3 font-medium text-right">Status Estoque</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.slice(0, 10).map((p, i) => {
                  const status = getStockStatus(p.qty);
                  return (
                    <tr key={p.name} className="border-b border-gray-50 last:border-b-0">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package size={14} className="text-gray-400" />
                          </div>
                          <span className="font-medium text-gray-900">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-gray-500">--</td>
                      <td className="py-3 text-right text-gray-700 font-medium">{p.qty}</td>
                      <td className="py-3 text-right font-semibold text-gray-900">
                        {currency(p.revenue)}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`inline-block text-[10px] font-bold px-2 py-1 rounded-full ${status.color}`}>
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
          className="flex items-center gap-2 px-5 py-3 bg-[#A0522D] text-white rounded-xl shadow-lg hover:bg-[#8B4726] transition font-medium text-sm"
        >
          <Plus size={18} />
          Novo Pedido PDV
        </a>
      </div>
    </div>
  );
}
