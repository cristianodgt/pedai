"use client";

import { useState } from "react";
import {
  Users,
  CreditCard,
  Clock,
  ChefHat,
  Armchair,
  PieChart,
  Receipt,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TableStatus = "LIVRE" | "OCUPADA" | "FECHAMENTO" | "LIMPEZA";

type Table = {
  id: number;
  number: number;
  status: TableStatus;
  amount?: number;
  timer?: string;
  paymentNote?: string; // "Aguardando" | "Pago em Dinheiro" etc.
};

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const initialTables: Table[] = [
  { id: 1, number: 1, status: "OCUPADA", amount: 187.5, timer: "01h 15m" },
  { id: 2, number: 2, status: "LIVRE" },
  { id: 3, number: 3, status: "FECHAMENTO", amount: 234.0, paymentNote: "Aguardando" },
  { id: 4, number: 4, status: "OCUPADA", amount: 92.0, timer: "00h 42m" },
  { id: 5, number: 5, status: "LIMPEZA" },
  { id: 6, number: 6, status: "LIVRE" },
  { id: 7, number: 7, status: "OCUPADA", amount: 315.8, timer: "02h 05m" },
  { id: 8, number: 8, status: "FECHAMENTO", amount: 156.0, paymentNote: "Pago em Dinheiro" },
  { id: 9, number: 9, status: "LIVRE" },
  { id: 10, number: 10, status: "LIVRE" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function currency(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

/* ------------------------------------------------------------------ */
/*  KPI Card                                                           */
/* ------------------------------------------------------------------ */

function KpiCard({
  label,
  value,
  icon: Icon,
  iconBg,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  iconBg: string;
}) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-xl shadow-sm px-5 py-4 flex-1 min-w-[180px]">
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
        style={{ background: iconBg }}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
          {label}
        </p>
        <p className="text-xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Table Card                                                         */
/* ------------------------------------------------------------------ */

function TableCard({
  table,
  onAction,
}: {
  table: Table;
  onAction: (id: number, action: string) => void;
}) {
  const { status } = table;

  /* --- LIVRE ---------------------------------------------------- */
  if (status === "LIVRE") {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 flex flex-col items-center justify-center gap-3 bg-white/60 min-h-[180px]">
        <span className="text-3xl font-bold text-gray-400">
          {String(table.number).padStart(2, "0")}
        </span>
        <span className="text-xs font-semibold text-gray-400 tracking-widest">
          LIVRE
        </span>
        <button
          onClick={() => onAction(table.id, "abrir")}
          className="mt-1 px-4 py-1.5 text-sm font-medium rounded-lg border-2 border-[#A0522D] text-[#A0522D] hover:bg-[#A0522D] hover:text-white transition-colors"
        >
          Abrir Mesa
        </button>
      </div>
    );
  }

  /* --- OCUPADA -------------------------------------------------- */
  if (status === "OCUPADA") {
    return (
      <div className="rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-white min-h-[180px] bg-[#A0522D] shadow-sm">
        <span className="text-3xl font-bold">
          {String(table.number).padStart(2, "0")}
        </span>
        <span className="text-[10px] font-semibold tracking-widest opacity-80">
          OCUPADA
        </span>
        <span className="text-lg font-bold">
          {table.amount !== undefined ? currency(table.amount) : "—"}
        </span>
        <span className="flex items-center gap-1 text-xs opacity-80">
          <Clock className="w-3.5 h-3.5" />
          {table.timer ?? "—"}
        </span>
        <button
          onClick={() => onAction(table.id, "comanda")}
          className="mt-1 px-4 py-1.5 text-sm font-medium rounded-lg bg-white text-[#A0522D] hover:bg-gray-100 transition-colors"
        >
          Ver Comanda
        </button>
      </div>
    );
  }

  /* --- FECHAMENTO ----------------------------------------------- */
  if (status === "FECHAMENTO") {
    const isPaid = table.paymentNote?.toLowerCase().includes("pago");
    return (
      <div className="rounded-xl p-5 flex flex-col items-center justify-center gap-2 min-h-[180px] bg-orange-50 border border-orange-200 shadow-sm">
        <span className="text-3xl font-bold text-orange-700">
          {String(table.number).padStart(2, "0")}
        </span>
        <span className="text-[10px] font-semibold tracking-widest text-orange-500">
          FECHAMENTO
        </span>
        <span className="text-lg font-bold text-orange-800">
          {table.amount !== undefined ? currency(table.amount) : "—"}
        </span>
        <span className="text-xs text-orange-600">
          {table.paymentNote ?? "Aguardando"}
        </span>
        <button
          onClick={() => onAction(table.id, isPaid ? "liberar" : "fechar")}
          className="mt-1 px-4 py-1.5 text-sm font-medium rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
        >
          {isPaid ? "Liberar Mesa" : "Fechar Conta"}
        </button>
      </div>
    );
  }

  /* --- LIMPEZA -------------------------------------------------- */
  return (
    <div className="rounded-xl p-5 flex flex-col items-center justify-center gap-3 min-h-[180px] bg-gray-100 border border-gray-200 shadow-sm">
      <span className="text-3xl font-bold text-gray-400">
        {String(table.number).padStart(2, "0")}
      </span>
      <span className="text-[10px] font-semibold tracking-widest text-gray-400">
        LIMPEZA
      </span>
      <span className="text-xs text-gray-500">Em andamento</span>
      <button
        disabled
        className="mt-1 px-4 py-1.5 text-sm font-medium rounded-lg bg-gray-300 text-gray-500 cursor-not-allowed"
      >
        Aguarde
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Legend dot                                                         */
/* ------------------------------------------------------------------ */

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-3 h-3 rounded-full inline-block border border-gray-200"
        style={{ background: color }}
      />
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function MesasPage() {
  const [tables, setTables] = useState<Table[]>(initialTables);

  /* derived KPIs */
  const livres = tables.filter((t) => t.status === "LIVRE").length;
  const ocupadas = tables.filter((t) => t.status === "OCUPADA").length;
  const aguardando = tables.filter((t) => t.status === "FECHAMENTO").length;
  const total = tables.length || 1;
  const ocupacaoPct = Math.round(
    ((ocupadas + aguardando) / total) * 100
  );

  /* actions */
  function handleAction(id: number, action: string) {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;

        switch (action) {
          case "abrir":
            return {
              ...t,
              status: "OCUPADA" as TableStatus,
              amount: 0,
              timer: "00h 00m",
              paymentNote: undefined,
            };
          case "comanda":
            // In a real app this would open the order detail.
            // For now, move to FECHAMENTO as a demo.
            return {
              ...t,
              status: "FECHAMENTO" as TableStatus,
              paymentNote: "Aguardando",
            };
          case "fechar":
            return {
              ...t,
              status: "FECHAMENTO" as TableStatus,
              paymentNote: "Pago em Dinheiro",
            };
          case "liberar":
            return {
              ...t,
              status: "LIMPEZA" as TableStatus,
              amount: undefined,
              timer: undefined,
              paymentNote: undefined,
            };
          default:
            return t;
        }
      })
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Mesas Livres"
          value={String(livres)}
          icon={Armchair}
          iconBg="#A0522D"
        />
        <KpiCard
          label="Ocupadas"
          value={String(ocupadas)}
          icon={Users}
          iconBg="#8B3A2A"
        />
        <KpiCard
          label="Aguardando Pgto"
          value={String(aguardando)}
          icon={Receipt}
          iconBg="#D97706"
        />
        <KpiCard
          label="Ocupação"
          value={`${ocupacaoPct}%`}
          icon={PieChart}
          iconBg="#A0522D"
        />
      </div>

      {/* Map header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="text-lg font-bold text-gray-800">
            Mapa de Mesas — Salão Principal
          </h2>
          <div className="flex items-center gap-4 flex-wrap">
            <LegendDot color="#ffffff" label="Livre" />
            <LegendDot color="#DC2626" label="Ocupada" />
            <LegendDot color="#F97316" label="Pagamento" />
            <LegendDot color="#9CA3AF" label="Limpeza" />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onAction={handleAction}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
