"use client";

import { useState } from "react";
import {
  Armchair,
  Users,
  CreditCard,
  PieChart,
  Clock,
  Bell,
  Plus,
  Printer,
  ChevronRight,
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
};

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const initialTables: Table[] = [
  { id: 1, number: 1, status: "OCUPADA", amount: 187.5, timer: "01h 15m" },
  { id: 2, number: 2, status: "LIVRE" },
  { id: 3, number: 3, status: "FECHAMENTO", amount: 234.0 },
  { id: 4, number: 4, status: "OCUPADA", amount: 92.0, timer: "00h 42m" },
  { id: 5, number: 5, status: "LIMPEZA" },
  { id: 6, number: 6, status: "LIVRE" },
  { id: 7, number: 7, status: "OCUPADA", amount: 315.8, timer: "02h 05m" },
  { id: 8, number: 8, status: "FECHAMENTO", amount: 156.0 },
  { id: 9, number: 9, status: "LIVRE" },
  { id: 10, number: 10, status: "LIVRE" },
];

const areas = ["Salão Principal", "Varanda", "VIP"];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function currency(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/* ------------------------------------------------------------------ */
/*  Legend Dot                                                         */
/* ------------------------------------------------------------------ */

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-3 h-3 inline-block rounded-full"
        style={{ background: color }}
      />
      <span className="text-xs text-[#5a4138]">{label}</span>
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

  /* --- OCUPADA -------------------------------------------------- */
  if (status === "OCUPADA") {
    return (
      <div className="relative overflow-hidden bg-[#a33900] text-white rounded-3xl p-5 min-h-[200px] flex flex-col justify-between">
        {/* Decorative circle */}
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />

        <div className="flex items-start justify-between relative z-10">
          <span className="text-3xl font-black">{pad(table.number)}</span>
          <Users className="w-5 h-5 opacity-80" />
        </div>

        <div className="flex flex-col gap-1 relative z-10">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
            Ocupada
          </span>
          <span className="text-xl font-bold">
            {table.amount !== undefined ? currency(table.amount) : "—"}
          </span>
          <span className="flex items-center gap-1 text-xs opacity-70">
            <Clock className="w-3.5 h-3.5" />
            {table.timer ?? "—"}
          </span>
        </div>

        <button
          onClick={() => onAction(table.id, "comanda")}
          className="relative z-10 mt-3 w-full py-2 text-sm font-semibold bg-white/20 backdrop-blur rounded-full hover:bg-white/30 transition-colors"
        >
          Ver Comanda
        </button>
      </div>
    );
  }

  /* --- LIVRE ----------------------------------------------------- */
  if (status === "LIVRE") {
    return (
      <div className="group bg-white border-2 border-dashed border-[#e2bfb2]/50 rounded-3xl p-5 min-h-[200px] flex flex-col items-center justify-center gap-3">
        <span className="text-3xl font-black text-[#5a4138]">
          {pad(table.number)}
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-[#8e7166]">
          Livre
        </span>
        <button
          onClick={() => onAction(table.id, "abrir")}
          className="mt-2 px-6 py-2 text-sm font-semibold rounded-full border-2 border-[#e2bfb2]/50 text-[#5a4138] group-hover:bg-[#a33900] group-hover:text-white group-hover:border-[#a33900] transition-colors"
        >
          Abrir Mesa
        </button>
      </div>
    );
  }

  /* --- FECHAMENTO ------------------------------------------------ */
  if (status === "FECHAMENTO") {
    return (
      <div className="relative overflow-hidden bg-[#ff9971] text-[#772f0f] rounded-3xl p-5 min-h-[200px] flex flex-col justify-between animate-pulse">
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />

        <div className="flex items-start justify-between relative z-10">
          <span className="text-3xl font-black">{pad(table.number)}</span>
          <CreditCard className="w-5 h-5 opacity-80" />
        </div>

        <div className="flex flex-col gap-1 relative z-10">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
            Fechamento
          </span>
          <span className="text-xl font-bold">
            {table.amount !== undefined ? currency(table.amount) : "—"}
          </span>
          <span className="flex items-center gap-1 text-xs opacity-80">
            <Bell className="w-3.5 h-3.5" />
            Aguardando
          </span>
        </div>

        <button
          onClick={() => onAction(table.id, "fechar")}
          className="relative z-10 mt-3 w-full py-2 text-sm font-semibold bg-[#772f0f] text-white rounded-full hover:bg-[#5c2410] transition-colors"
        >
          Fechar Conta
        </button>
      </div>
    );
  }

  /* --- LIMPEZA --------------------------------------------------- */
  return (
    <div className="bg-[#d9dadc] text-[#5a4138] opacity-80 rounded-3xl p-5 min-h-[200px] flex flex-col items-center justify-center gap-3">
      <span className="text-3xl font-black">{pad(table.number)}</span>
      <span className="text-xs font-semibold uppercase tracking-wider">
        Limpeza
      </span>
      <span className="text-xs opacity-70">Em andamento</span>
      <button
        disabled
        className="mt-2 px-6 py-2 text-sm font-semibold rounded-full bg-white/40 text-[#5a4138] cursor-not-allowed"
      >
        Aguarde
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function MesasPage() {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [activeArea, setActiveArea] = useState("Salão Principal");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [comandaTableId, setComandaTableId] = useState<number | null>(null);

  /* derived KPIs */
  const livres = tables.filter((t) => t.status === "LIVRE").length;
  const ocupadas = tables.filter((t) => t.status === "OCUPADA").length;
  const aguardando = tables.filter((t) => t.status === "FECHAMENTO").length;
  const total = tables.length || 1;
  const ocupacaoPct = Math.round(((ocupadas + aguardando) / total) * 100);

  /* actions */
  function handleAction(id: number, action: string) {
    if (action === "comanda") {
      setComandaTableId(id);
      return;
    }
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
            };
          case "fechar":
            return {
              ...t,
              status: "LIMPEZA" as TableStatus,
              amount: undefined,
              timer: undefined,
            };
          case "payment":
            return {
              ...t,
              status: "FECHAMENTO" as TableStatus,
            };
          default:
            return t;
        }
      })
    );
  }

  function handleAddTable() {
    const num = parseInt(newTableNumber, 10);
    if (!num || num <= 0) return;
    const newId = Math.max(...tables.map((t) => t.id)) + 1;
    setTables((prev) => [...prev, { id: newId, number: num, status: "LIVRE" }]);
    setNewTableNumber("");
    setShowAddModal(false);
  }

  const comandaTable = tables.find((t) => t.id === comandaTableId);

  /* team avatars (mock initials) */
  const teamMembers = ["RC", "JS", "ML", "AF"];

  return (
    <>
      <div className="space-y-6">
        {/* ---- HEADER: Area selector pills ---- */}
        <div className="flex items-center gap-3 flex-wrap">
          {areas.map((area) => (
            <button
              key={area}
              onClick={() => setActiveArea(area)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                activeArea === area
                  ? "bg-white shadow-md border border-orange-100 text-[#191c1e]"
                  : "bg-transparent text-[#5a4138] hover:bg-white/60"
              }`}
            >
              {area}
            </button>
          ))}
        </div>

        {/* ---- SUMMARY STATS (4-column grid) ---- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Mesas Livres */}
          <div className="bg-white rounded-3xl shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 flex items-center justify-center rounded-full bg-[#a33900]">
              <Armchair className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#5a4138]">
                Mesas Livres
              </p>
              <p className="text-2xl font-bold text-[#191c1e]">{pad(livres)}</p>
            </div>
          </div>

          {/* Ocupadas */}
          <div className="bg-white rounded-3xl shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 flex items-center justify-center rounded-full bg-[#cc4900]">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#5a4138]">
                Ocupadas
              </p>
              <p className="text-2xl font-bold text-[#a33900]">
                {pad(ocupadas)}
              </p>
            </div>
          </div>

          {/* Aguardando Pgto */}
          <div className="bg-white rounded-3xl shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 flex items-center justify-center rounded-full bg-[#ff9971]">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#5a4138]">
                Aguardando Pgto
              </p>
              <p className="text-2xl font-bold text-[#974726]">
                {pad(aguardando)}
              </p>
            </div>
          </div>

          {/* Ocupação */}
          <div className="bg-white rounded-3xl shadow-sm p-5 flex items-center gap-4 border-l-4 border-[#a33900]">
            <div className="w-11 h-11 flex items-center justify-center rounded-full bg-[#a33900]">
              <PieChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#5a4138]">
                Ocupação
              </p>
              <p className="text-2xl font-bold text-[#191c1e]">
                {ocupacaoPct}%
              </p>
            </div>
          </div>
        </div>

        {/* ---- TABLE MAP ---- */}
        <div className="bg-[#f3f4f6] rounded-3xl p-8">
          {/* Map header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h2 className="text-lg font-bold text-[#191c1e]">
              Mapa de Mesas — {activeArea}
            </h2>
            <div className="flex items-center gap-5 flex-wrap">
              <LegendDot color="#22c55e" label="Livre" />
              <LegendDot color="#a33900" label="Ocupada" />
              <LegendDot color="#ff9971" label="Pagamento" />
              <LegendDot color="#d9dadc" label="Limpeza" />
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

        {/* ---- BOTTOM INFO BAR ---- */}
        <div className="bg-white rounded-3xl shadow-sm p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Team avatars overlapping */}
            <div className="flex -space-x-3">
              {teamMembers.map((initials, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-full bg-[#a33900] text-white text-xs font-bold flex items-center justify-center border-2 border-white"
                >
                  {initials}
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#191c1e]">
                Equipe de Atendimento — {activeArea}
              </p>
              <p className="text-xs text-[#5a4138]">
                4 garçons ativos &bull; Média de permanência: 52min
              </p>
            </div>
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#a33900] border border-[#e2bfb2] rounded-full hover:bg-[#a33900] hover:text-white transition-colors">
            <Printer className="w-4 h-4" />
            Imprimir Mapa
          </button>
        </div>
      </div>

      {/* ---- FAB BUTTON ---- */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-[#a33900] text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-[#cc4900] transition-colors z-50"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* ---- ADD TABLE MODAL ---- */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-bold text-[#191c1e] mb-4">Adicionar Mesa</h2>
            <label className="block text-sm font-semibold text-[#5a4138] mb-2">
              Número da Mesa
            </label>
            <input
              type="number"
              min={1}
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(e.target.value)}
              placeholder="Ex: 11"
              className="w-full px-4 py-3 border border-[#e2bfb2] rounded-xl text-[#191c1e] outline-none focus:border-[#a33900] mb-6"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowAddModal(false); setNewTableNumber(""); }}
                className="flex-1 py-2.5 rounded-full border border-[#e2bfb2] text-[#5a4138] font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddTable}
                className="flex-1 py-2.5 rounded-full bg-[#a33900] text-white font-semibold hover:bg-[#cc4900] transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- COMANDA MODAL ---- */}
      {comandaTableId !== null && comandaTable && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-bold text-[#191c1e] mb-1">
              Comanda — Mesa {pad(comandaTable.number)}
            </h2>
            <p className="text-xs text-[#5a4138] mb-5">Em atendimento</p>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-[#191c1e] font-medium">1x Prato Principal</span>
                <span className="font-bold">R$ 45,00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#191c1e] font-medium">2x Bebida</span>
                <span className="font-bold">R$ 18,00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#191c1e] font-medium">1x Sobremesa</span>
                <span className="font-bold">R$ 22,00</span>
              </div>
              <div className="border-t border-[#edeef0] pt-3 flex justify-between font-bold text-[#191c1e]">
                <span>Total</span>
                <span>{comandaTable.amount !== undefined && comandaTable.amount > 0 ? currency(comandaTable.amount) : "R$ 85,00"}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setComandaTableId(null)}
                className="flex-1 py-2.5 rounded-full border border-[#e2bfb2] text-[#5a4138] font-semibold hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  handleAction(comandaTableId, "payment");
                  setComandaTableId(null);
                }}
                className="flex-1 py-2.5 rounded-full bg-[#a33900] text-white font-semibold hover:bg-[#cc4900] transition-colors"
              >
                Fechar Conta
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
