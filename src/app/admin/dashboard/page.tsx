"use client";

import { useEffect, useState } from "react";
import {
  ClipboardList,
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Package,
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

function getBarColor(ratio: number): string {
  if (ratio >= 0.9) return "bg-[#a33900]";
  if (ratio >= 0.7) return "bg-orange-500";
  if (ratio >= 0.5) return "bg-orange-400";
  if (ratio >= 0.3) return "bg-orange-300";
  if (ratio >= 0.15) return "bg-orange-200";
  return "bg-orange-100";
}

function BarChartSimple({ data, maxVal }: { data: number[]; maxVal: number }) {
  const peak = maxVal || 1;
  const hours = data.slice(6, 24);
  return (
    <div className="h-64 flex items-end justify-between gap-2 px-4">
      {hours.map((val, i) => {
        const ratio = val / peak;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div
              className={`w-full rounded-t-lg transition-all hover:opacity-80 min-h-[2px] ${getBarColor(ratio)}`}
              style={{ height: `${(val / peak) * 100}%` }}
              title={`${i + 6}h: ${val} pedidos`}
            />
            <span className="text-[10px] font-bold text-zinc-400">
              {i + 6}h
            </span>
          </div>
        );
      })}
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

  // SVG donut calculations (circumference = 2 * PI * 40 = ~251.2)
  const circumference = 2 * Math.PI * 40;
  const whatsappLen = (whatsappPct / 100) * circumference;
  const pdvLen = (pdvPct / 100) * circumference;
  const ifoodLen = (ifoodPct / 100) * circumference;

  const whatsappOffset = 0;
  const pdvOffset = whatsappLen;
  const ifoodOffset = whatsappLen + pdvLen;

  return (
    <div className="flex-1 flex flex-col items-center">
      <div className="relative flex items-center justify-center py-4">
        <svg
          className="w-48 h-48 transform -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="#edeef0"
            strokeWidth="12"
          />
          {/* WhatsApp segment */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="#a33900"
            strokeWidth="12"
            strokeDasharray={`${whatsappLen} ${circumference - whatsappLen}`}
            strokeDashoffset={0}
          />
          {/* PDV segment */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="#005da8"
            strokeWidth="12"
            strokeDasharray={`${pdvLen} ${circumference - pdvLen}`}
            strokeDashoffset={-whatsappLen}
          />
          {/* iFood segment */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="#ff9971"
            strokeWidth="12"
            strokeDasharray={`${ifoodLen} ${circumference - ifoodLen}`}
            strokeDashoffset={-(whatsappLen + pdvLen)}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-xs font-bold text-[#5a4138]">TOTAL</span>
          <span className="text-xl font-black text-[#191c1e]">{total}</span>
        </div>
      </div>
      <div className="mt-6 space-y-3 w-full">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#a33900]" />
            <span className="font-medium text-[#191c1e]">WhatsApp</span>
          </div>
          <span className="font-bold">{whatsappPct}%</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff9971]" />
            <span className="font-medium text-[#191c1e]">Balcao/PDV</span>
          </div>
          <span className="font-bold">{pdvPct}%</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#005da8]" />
            <span className="font-medium text-[#191c1e]">iFood</span>
          </div>
          <span className="font-bold">{ifoodPct}%</span>
        </div>
      </div>
    </div>
  );
}

function getStockBadge(qty: number): {
  label: string;
  className: string;
} {
  if (qty >= 20)
    return {
      label: "EM ALTA",
      className: "bg-[#d4e3ff] text-[#005da8]",
    };
  if (qty <= 5)
    return {
      label: "CRITICO",
      className: "bg-[#ff9971] text-white",
    };
  return {
    label: "NORMAL",
    className: "bg-[#edeef0] text-[#5a4138]",
  };
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#a33900]" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 text-[#5a4138]">
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
    <div className="space-y-8">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Pedidos hoje */}
        <div className="bg-white p-6 rounded-xl transition-all hover:translate-y-[-2px]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#ffdbce] rounded-xl text-[#a33900]">
              <ClipboardList size={24} />
            </div>
            {stats.today.total > 0 ? (
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg flex items-center gap-1">
                <TrendingUp size={12} />
                +{stats.today.active}
              </span>
            ) : (
              <span className="text-xs font-bold text-[#5a4138] bg-[#edeef0] px-2 py-1 rounded-lg">
                0
              </span>
            )}
          </div>
          <p className="text-[#5a4138] text-sm font-medium">Pedidos hoje</p>
          <h2 className="text-3xl font-extrabold text-[#191c1e] tracking-tight mt-1">
            {stats.today.total}
          </h2>
        </div>

        {/* Faturamento hoje */}
        <div className="bg-white p-6 rounded-xl transition-all hover:translate-y-[-2px]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#ffdbce] rounded-xl text-[#974726]">
              <DollarSign size={24} />
            </div>
            {stats.today.revenue > 0 ? (
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg flex items-center gap-1">
                <TrendingUp size={12} />
                Ativo
              </span>
            ) : (
              <span className="text-xs font-bold text-[#5a4138] bg-[#edeef0] px-2 py-1 rounded-lg">
                --
              </span>
            )}
          </div>
          <p className="text-[#5a4138] text-sm font-medium">Faturamento hoje</p>
          <h2 className="text-3xl font-extrabold text-[#191c1e] tracking-tight mt-1">
            {currency(stats.today.revenue)}
          </h2>
        </div>

        {/* Faturamento semana */}
        <div className="bg-white p-6 rounded-xl transition-all hover:translate-y-[-2px]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#d4e3ff] rounded-xl text-[#005da8]">
              <Calendar size={24} />
            </div>
            <span className="text-xs font-bold text-[#5a4138] bg-[#edeef0] px-2 py-1 rounded-lg">
              Estavel
            </span>
          </div>
          <p className="text-[#5a4138] text-sm font-medium">Faturamento semana</p>
          <h2 className="text-3xl font-extrabold text-[#191c1e] tracking-tight mt-1">
            {currency(stats.week.revenue)}
          </h2>
        </div>

        {/* Faturamento mes */}
        <div className="bg-white p-6 rounded-xl transition-all hover:translate-y-[-2px]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-100 rounded-xl text-orange-700">
              <BarChart3 size={24} />
            </div>
            {stats.month.revenue > 0 ? (
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg flex items-center gap-1">
                <TrendingUp size={12} />
                +{stats.month.total}
              </span>
            ) : (
              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg flex items-center gap-1">
                <TrendingDown size={12} />
                0
              </span>
            )}
          </div>
          <p className="text-[#5a4138] text-sm font-medium">Faturamento mes</p>
          <h2 className="text-3xl font-extrabold text-[#191c1e] tracking-tight mt-1">
            {currency(stats.month.revenue)}
          </h2>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-12 gap-8">
        {/* Bar Chart: Orders per Hour (col-span-8) */}
        <div className="col-span-12 lg:col-span-8 bg-white p-8 rounded-xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-[#191c1e]">
                Fluxo de Pedidos
              </h3>
              <p className="text-sm text-[#5a4138]">
                Volume de pedidos por hora (Hoje)
              </p>
            </div>
            <button className="px-3 py-1 text-xs font-semibold bg-[#edeef0] text-[#191c1e] rounded-lg hover:bg-[#e1e2e4] transition-colors">
              Exportar
            </button>
          </div>
          {stats.today.total === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-[#5a4138]">
              Nenhum pedido hoje ainda
            </div>
          ) : (
            <BarChartSimple data={stats.today.byHour} maxVal={maxHour} />
          )}
        </div>

        {/* Donut Chart: Channel Breakdown (col-span-4) */}
        <div className="col-span-12 lg:col-span-4 bg-white p-8 rounded-xl flex flex-col">
          <h3 className="text-lg font-bold text-[#191c1e] mb-6">
            Canais de Venda
          </h3>
          <DonutChart
            channels={stats.today.byChannel}
            total={totalChannelOrders}
          />
        </div>

        {/* Top Products Table (col-span-12) */}
        <div className="col-span-12 bg-white rounded-xl overflow-hidden">
          <div className="p-8 flex items-center justify-between border-b border-[#edeef0]">
            <h3 className="text-lg font-bold text-[#191c1e]">
              Top 10 Produtos Mais Vendidos
            </h3>
            <button className="text-sm font-semibold text-[#a33900] hover:underline">
              Ver relatorio completo
            </button>
          </div>
          {stats.topProducts.length === 0 ? (
            <div className="text-center text-sm py-12 text-[#5a4138]">
              Nenhuma venda este mes
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#f3f4f6] text-xs font-bold text-[#5a4138] uppercase tracking-wider">
                  <tr>
                    <th className="px-8 py-4">Produto</th>
                    <th className="px-8 py-4">Categoria</th>
                    <th className="px-8 py-4">Qtd. Vendida</th>
                    <th className="px-8 py-4">Receita Bruta</th>
                    <th className="px-8 py-4">Status Estoque</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edeef0]">
                  {stats.topProducts.slice(0, 10).map((p) => {
                    const status = getStockBadge(p.qty);
                    return (
                      <tr
                        key={p.name}
                        className="hover:bg-[#f3f4f6] transition-colors"
                      >
                        <td className="px-8 py-5 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-[#edeef0] flex items-center justify-center flex-shrink-0">
                            <Package size={16} className="text-[#5a4138]" />
                          </div>
                          <span className="font-semibold text-[#191c1e]">
                            {p.name}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-[#5a4138]">
                          --
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-[#191c1e]">
                          {p.qty} unidades
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-[#191c1e]">
                          {currency(p.revenue)}
                        </td>
                        <td className="px-8 py-5">
                          <span
                            className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase ${status.className}`}
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
      </div>

      {/* Floating Action Button */}
      <a
        href="/admin/pdv"
        className="fixed bottom-8 right-8 bg-[#a33900] text-white p-4 rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40"
      >
        <Plus size={20} />
        <span className="ml-2 font-bold pr-2">Novo Pedido PDV</span>
      </a>
    </div>
  );
}
