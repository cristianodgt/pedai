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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";

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
            className="w-full rounded-t transition-all min-h-[2px] bg-gradient-to-b from-[#a33900] to-[#cc4900]"
            style={{ height: `${(val / peak) * 100}%` }}
            title={`${i + 6}h: ${val} pedidos`}
          />
          {(i + 6) % 3 === 0 && (
            <span className="text-[10px] text-[#5a4138]">{i + 6}h</span>
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
        <div className="absolute inset-3 rounded-full flex flex-col items-center justify-center bg-white">
          <span className="text-[10px] uppercase tracking-widest font-medium text-[#5a4138]">
            Total
          </span>
          <span className="text-xl font-bold text-[#191c1e]">
            {total}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-3 mt-5 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-[#5a4138]">WhatsApp</span>
          </div>
          <span className="text-sm font-semibold text-[#191c1e]">
            {whatsappPct}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#0066cc]" />
            <span className="text-sm text-[#5a4138]">Balcao/PDV</span>
          </div>
          <span className="text-sm font-semibold text-[#191c1e]">
            {pdvPct}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#cc4900]" />
            <span className="text-sm text-[#5a4138]">iFood</span>
          </div>
          <span className="text-sm font-semibold text-[#191c1e]">
            {ifoodPct}%
          </span>
        </div>
      </div>
    </div>
  );
}

function getStockBadgeVariant(qty: number): {
  label: string;
  variant: "success" | "danger" | "warning";
} {
  if (qty >= 20) return { label: "EM ALTA", variant: "success" };
  if (qty <= 5) return { label: "CRITICO", variant: "danger" };
  return { label: "NORMAL", variant: "warning" };
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
    <div className="space-y-6 relative min-h-screen pb-20 bg-[#f8f9fb] font-[Inter]">
      <h1 className="text-2xl font-bold text-[#191c1e]">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pedidos hoje */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#a33900]/10">
                <ShoppingCart size={20} className="text-[#a33900]" />
              </div>
              {stats.today.total > 0 && (
                <Badge variant="success" className="gap-0.5">
                  <TrendingUp size={12} />
                  +{stats.today.active}
                </Badge>
              )}
            </div>
            <p className="text-sm mb-1 text-[#5a4138]">Pedidos hoje</p>
            <p className="text-3xl font-bold text-[#191c1e]">
              {stats.today.total}
            </p>
          </CardContent>
        </Card>

        {/* Faturamento hoje */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-500/10">
                <DollarSign size={20} className="text-green-700" />
              </div>
              {stats.today.revenue > 0 && (
                <Badge variant="success" className="gap-0.5">
                  <TrendingUp size={12} />
                  Ativo
                </Badge>
              )}
            </div>
            <p className="text-sm mb-1 text-[#5a4138]">Faturamento hoje</p>
            <p className="text-3xl font-bold text-[#191c1e]">
              {currency(stats.today.revenue)}
            </p>
          </CardContent>
        </Card>

        {/* Faturamento semana */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#0066cc]/10">
                <BarChart3 size={20} className="text-[#0066cc]" />
              </div>
              <Badge variant="secondary">Estavel</Badge>
            </div>
            <p className="text-sm mb-1 text-[#5a4138]">Faturamento semana</p>
            <p className="text-3xl font-bold text-[#191c1e]">
              {currency(stats.week.revenue)}
            </p>
          </CardContent>
        </Card>

        {/* Faturamento mes */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#a33900]/[0.08]">
                <TrendingUp size={20} className="text-[#cc4900]" />
              </div>
              {stats.month.revenue > 0 && (
                <Badge variant="success" className="gap-0.5">
                  <TrendingUp size={12} />
                  +{stats.month.total}
                </Badge>
              )}
            </div>
            <p className="text-sm mb-1 text-[#5a4138]">Faturamento mes</p>
            <p className="text-3xl font-bold text-[#191c1e]">
              {currency(stats.month.revenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row -- asymmetric 66/33 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders by hour chart -- 66% */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Fluxo de Pedidos</CardTitle>
            <Button variant="ghost" size="xs" className="text-[#a33900] uppercase tracking-wider">
              <Download size={14} />
              Exportar
            </Button>
          </CardHeader>
          <CardContent>
            {stats.today.total === 0 ? (
              <div className="h-40 flex items-center justify-center text-sm text-[#5a4138]">
                Nenhum pedido hoje ainda
              </div>
            ) : (
              <BarChartSimple data={stats.today.byHour} maxVal={maxHour} />
            )}
          </CardContent>
        </Card>

        {/* Channel breakdown donut -- 33% */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Canais de Venda</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              channels={stats.today.byChannel}
              total={totalChannelOrders}
            />
          </CardContent>
        </Card>
      </div>

      {/* Top Products Table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Package size={18} className="text-[#a33900]" />
            Top 10 Produtos Mais Vendidos
          </CardTitle>
          <Button variant="ghost" size="xs" className="text-[#a33900] uppercase tracking-wider">
            Exportar
          </Button>
        </CardHeader>
        <CardContent>
          {stats.topProducts.length === 0 ? (
            <div className="text-center text-sm py-8 text-[#5a4138]">
              Nenhuma venda este mes
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider">
                    <th className="pb-4 font-medium text-[#5a4138]">Produto</th>
                    <th className="pb-4 font-medium text-[#5a4138]">Categoria</th>
                    <th className="pb-4 font-medium text-right text-[#5a4138]">Qtd. Vendida</th>
                    <th className="pb-4 font-medium text-right text-[#5a4138]">Receita Bruta</th>
                    <th className="pb-4 font-medium text-right text-[#5a4138]">Status Estoque</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topProducts.slice(0, 10).map((p, i) => {
                    const status = getStockBadgeVariant(p.qty);
                    return (
                      <tr
                        key={p.name}
                        className={i % 2 === 1 ? "bg-[#f8f9fb]" : ""}
                      >
                        <td className="py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#edeef0]">
                              <Package size={14} className="text-[#5a4138]" />
                            </div>
                            <span className="font-medium text-[#191c1e]">
                              {p.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 text-[#5a4138]">--</td>
                        <td className="py-3.5 text-right font-medium text-[#191c1e]">
                          {p.qty}
                        </td>
                        <td className="py-3.5 text-right font-semibold text-[#191c1e]">
                          {currency(p.revenue)}
                        </td>
                        <td className="py-3.5 text-right">
                          <Badge variant={status.variant} className="text-[10px] font-bold">
                            {status.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating action button */}
      <div className="fixed bottom-6 right-6 z-40">
        <a
          href="/admin/pdv"
          className={buttonVariants({ variant: "default", size: "lg", className: "gap-2" })}
        >
          <Plus size={18} />
          Novo Pedido PDV
        </a>
      </div>
    </div>
  );
}
