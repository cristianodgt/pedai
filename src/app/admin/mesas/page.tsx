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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    <Card className="flex-1 min-w-[180px]">
      <CardContent className="flex items-center gap-4 px-5 py-4 pt-4">
        <div
          className="w-11 h-11 flex items-center justify-center shrink-0 rounded-full"
          style={{ background: iconBg }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[#5a4138]">
            {label}
          </p>
          <p className="text-xl font-bold text-[#191c1e]">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
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
      <Card className="bg-[#edeef0] outline outline-2 -outline-offset-2 outline-[rgba(226,191,178,0.15)]">
        <CardContent className="flex flex-col items-center justify-center gap-3 min-h-[180px] p-5 pt-5">
          <span className="text-3xl font-bold text-[#5a4138]">
            {String(table.number).padStart(2, "0")}
          </span>
          <Badge variant="outline">LIVRE</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction(table.id, "abrir")}
            className="mt-1"
          >
            Abrir Mesa
          </Button>
        </CardContent>
      </Card>
    );
  }

  /* --- OCUPADA -------------------------------------------------- */
  if (status === "OCUPADA") {
    return (
      <Card className="bg-gradient-to-br from-[#a33900] to-[#cc4900] text-white">
        <CardContent className="flex flex-col items-center justify-center gap-2 min-h-[180px] p-5 pt-5">
          <span className="text-3xl font-bold">
            {String(table.number).padStart(2, "0")}
          </span>
          <Badge variant="default" className="opacity-90">OCUPADA</Badge>
          <span className="text-lg font-bold">
            {table.amount !== undefined ? currency(table.amount) : "\u2014"}
          </span>
          <span className="flex items-center gap-1 text-xs opacity-80">
            <Clock className="w-3.5 h-3.5" />
            {table.timer ?? "\u2014"}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onAction(table.id, "comanda")}
            className="mt-1 bg-white text-[#a33900] hover:bg-[#edeef0]"
          >
            Ver Comanda
          </Button>
        </CardContent>
      </Card>
    );
  }

  /* --- FECHAMENTO ----------------------------------------------- */
  if (status === "FECHAMENTO") {
    const isPaid = table.paymentNote?.toLowerCase().includes("pago");
    return (
      <Card className="bg-[rgba(204,73,0,0.08)]">
        <CardContent className="flex flex-col items-center justify-center gap-2 min-h-[180px] p-5 pt-5">
          <span className="text-3xl font-bold text-[#191c1e]">
            {String(table.number).padStart(2, "0")}
          </span>
          <Badge variant="warning">FECHAMENTO</Badge>
          <span className="text-lg font-bold text-[#191c1e]">
            {table.amount !== undefined ? currency(table.amount) : "\u2014"}
          </span>
          <span className="text-xs text-[#5a4138]">
            {table.paymentNote ?? "Aguardando"}
          </span>
          <Button
            variant="default"
            size="sm"
            onClick={() => onAction(table.id, isPaid ? "liberar" : "fechar")}
            className="mt-1"
          >
            {isPaid ? "Liberar Mesa" : "Fechar Conta"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  /* --- LIMPEZA -------------------------------------------------- */
  return (
    <Card className="bg-[#edeef0]">
      <CardContent className="flex flex-col items-center justify-center gap-3 min-h-[180px] p-5 pt-5">
        <span className="text-3xl font-bold text-[#9ca3af]">
          {String(table.number).padStart(2, "0")}
        </span>
        <Badge variant="secondary">LIMPEZA</Badge>
        <span className="text-xs text-[#9ca3af]">
          Em andamento
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled
          className="mt-1"
        >
          Aguarde
        </Button>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Legend dot                                                         */
/* ------------------------------------------------------------------ */

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-3 h-3 inline-block rounded-full"
        style={{ background: color }}
      />
      <span className="text-xs text-[#5a4138]">
        {label}
      </span>
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
    <div className="space-y-6 bg-[#f8f9fb] min-h-full">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Mesas Livres"
          value={String(livres)}
          icon={Armchair}
          iconBg="#a33900"
        />
        <KpiCard
          label="Ocupadas"
          value={String(ocupadas)}
          icon={Users}
          iconBg="#cc4900"
        />
        <KpiCard
          label="Aguardando Pgto"
          value={String(aguardando)}
          icon={Receipt}
          iconBg="#cc4900"
        />
        <KpiCard
          label="Ocupacao"
          value={`${ocupacaoPct}%`}
          icon={PieChart}
          iconBg="#a33900"
        />
      </div>

      {/* Map header */}
      <div className="p-6 bg-[#edeef0] rounded-[0.75rem]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="text-lg font-bold text-[#191c1e]">
            Mapa de Mesas — Salao Principal
          </h2>
          <div className="flex items-center gap-4 flex-wrap">
            <LegendDot color="#edeef0" label="Livre" />
            <LegendDot color="#a33900" label="Ocupada" />
            <LegendDot color="rgba(204, 73, 0, 0.25)" label="Pagamento" />
            <LegendDot color="#dcdee0" label="Limpeza" />
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
