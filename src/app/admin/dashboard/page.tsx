"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  MessageCircle,
  Monitor,
  BarChart3,
  Package,
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

const paymentLabels: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  cartao_credito: "Credito",
  cartao_debito: "Debito",
  nao_informado: "N/I",
};

function currency(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function BarChartSimple({ data, maxVal }: { data: number[]; maxVal: number }) {
  const peak = maxVal || 1;
  // Only show hours 6-23
  const hours = data.slice(6, 24);
  return (
    <div className="flex items-end gap-1 h-32">
      {hours.map((val, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-orange-400 rounded-t transition-all min-h-[2px]"
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <ShoppingCart size={16} className="text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">Pedidos Hoje</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.today.total}</p>
          <p className="text-xs text-gray-400 mt-1">
            {stats.today.active} ativos
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign size={16} className="text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Faturamento Hoje</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {currency(stats.today.revenue)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Ticket medio: {currency(stats.today.ticketMedio)}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Semana</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {currency(stats.week.revenue)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {stats.week.total} pedidos
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 size={16} className="text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Mes</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {currency(stats.month.revenue)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {stats.month.total} pedidos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Orders by hour chart */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-orange-600" />
            Pedidos por Hora (Hoje)
          </h3>
          {stats.today.total === 0 ? (
            <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
              Nenhum pedido hoje ainda
            </div>
          ) : (
            <BarChartSimple data={stats.today.byHour} maxVal={maxHour} />
          )}
        </div>

        {/* Channel breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Por Canal</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <MessageCircle size={14} className="text-green-600" />
                <span className="text-sm text-gray-600">WhatsApp</span>
              </div>
              <span className="font-bold text-gray-900">
                {stats.today.byChannel.WHATSAPP}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <Monitor size={14} className="text-blue-600" />
                <span className="text-sm text-gray-600">PDV</span>
              </div>
              <span className="font-bold text-gray-900">
                {stats.today.byChannel.PDV}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <Monitor size={14} className="text-red-600" />
                <span className="text-sm text-gray-600">iFood</span>
              </div>
              <span className="font-bold text-gray-900">
                {stats.today.byChannel.IFOOD}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100 mt-4 pt-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Pagamento</h4>
            <div className="space-y-1.5">
              {Object.entries(stats.today.byPayment).map(([key, count]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {paymentLabels[key] || key}
                  </span>
                  <span className="font-medium text-gray-900">{count}</span>
                </div>
              ))}
              {Object.keys(stats.today.byPayment).length === 0 && (
                <span className="text-xs text-gray-400">Sem dados</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top products */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package size={18} className="text-orange-600" />
          Produtos Mais Vendidos (Mes)
        </h3>
        {stats.topProducts.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            Nenhuma venda este mes
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Produto</th>
                  <th className="pb-2 font-medium text-right">Qtd</th>
                  <th className="pb-2 font-medium text-right">Faturamento</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.map((p, i) => (
                  <tr key={p.name} className="border-b border-gray-50">
                    <td className="py-2 text-gray-400">{i + 1}</td>
                    <td className="py-2 font-medium text-gray-900">{p.name}</td>
                    <td className="py-2 text-right text-gray-600">{p.qty}</td>
                    <td className="py-2 text-right font-medium text-orange-600">
                      {currency(p.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
