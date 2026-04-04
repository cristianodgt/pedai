"use client";

import { useEffect, useState, useRef } from "react";
import {
  MessageCircle,
  Search,
  Phone,
  Clock,
  ArrowLeft,
  XCircle,
  RefreshCw,
  MapPin,
  MoreVertical,
  Send,
  Plus,
  Bot,
  Hand,
  BarChart3,
} from "lucide-react";

type Message = {
  type: string;
  content: string;
  sender: "customer" | "bot" | "agent";
  timestamp: string;
};

type Conversation = {
  id: string;
  tenant_id: string;
  session_id: string | null;
  customer_phone: string | null;
  customer_name: string | null;
  channel: string;
  messages: Message[];
  status: string;
  last_message_at: string;
  created_at: string;
};

function timeAgo(date: string) {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) {
    return new Date(date).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (diff < 172800) return "Ontem";
  return `${Math.floor(diff / 86400)}d`;
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isToday(date: string) {
  const d = new Date(date);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function getInitial(name: string | null) {
  return (name || "?")[0].toUpperCase();
}

export default function ConversasPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [aiActive, setAiActive] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    params.set("limit", "50");

    const res = await fetch(`/api/conversations?${params}`);
    if (res.ok) {
      const data = await res.json();
      setConversations(data.conversations || []);
      setTotal(data.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 15000);
    return () => clearInterval(interval);
  }, [search, statusFilter]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selected]);

  const closeConversation = async (id: string) => {
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    });
    fetchConversations();
    if (selected?.id === id) setSelected(null);
  };

  const lastMessage = (c: Conversation) => {
    if (!c.messages || c.messages.length === 0) return "Sem mensagens";
    const last = c.messages[c.messages.length - 1];
    const prefix = last.sender === "bot" ? "Bot: " : "";
    const text = last.content || "";
    return prefix + (text.length > 45 ? text.slice(0, 45) + "..." : text);
  };

  const activeCount = conversations.filter(
    (c) => c.status === "active"
  ).length;

  const needsHuman = (c: Conversation) => {
    if (!c.messages || c.messages.length === 0) return false;
    const last = c.messages[c.messages.length - 1];
    return last.sender === "customer" && c.messages.length > 6;
  };

  return (
    <div className="h-[calc(100vh-3rem)] flex bg-gray-100 rounded-xl overflow-hidden">
      {/* ====== LEFT COLUMN - Conversation List ====== */}
      <div
        className={`w-80 flex flex-col bg-white border-r border-gray-200 shrink-0 ${
          selected ? "hidden lg:flex" : "flex"
        }`}
      >
        {/* List Header */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold tracking-wider text-gray-700 uppercase">
                Conversas Ativas
              </h2>
              <span className="text-[10px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-full uppercase">
                {activeCount} novas
              </span>
            </div>
            <button
              onClick={() => {
                setLoading(true);
                fetchConversations();
              }}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"
              title="Atualizar"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar conversa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 focus:bg-white"
            />
          </div>

          {/* Status Filters */}
          <div className="flex gap-1 mt-2">
            {[
              { value: "", label: "Todas" },
              { value: "active", label: "Ativas" },
              { value: "closed", label: "Encerradas" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-2.5 py-1 text-[10px] font-medium rounded-full transition ${
                  statusFilter === f.value
                    ? "bg-amber-700 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loading && conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
              <p className="text-xs">Carregando...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <MessageCircle size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-orange-50/50 transition ${
                  selected?.id === c.id ? "bg-orange-50 border-l-2 border-l-amber-700" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-amber-800 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {getInitial(c.customer_name)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {c.customer_name || c.customer_phone || "Desconhecido"}
                      </p>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                        {timeAgo(c.last_message_at)}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-500 truncate mt-0.5">
                      {lastMessage(c)}
                    </p>

                    {/* Status Badges */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {c.status === "active" && !needsHuman(c) && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full uppercase">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          AI Ativo
                        </span>
                      )}
                      {needsHuman(c) && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full uppercase">
                          Aguardando Humano
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[9px] font-medium bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full">
                        <svg
                          viewBox="0 0 24 24"
                          className="w-2.5 h-2.5 fill-green-600"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                        </svg>
                        WhatsApp
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ====== CENTER COLUMN - Chat Area ====== */}
      <div
        className={`flex-1 flex flex-col bg-gray-50 ${
          selected ? "flex" : "hidden lg:flex"
        }`}
      >
        {selected ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelected(null)}
                  className="lg:hidden p-1 hover:bg-gray-100 rounded"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="w-9 h-9 rounded-full bg-amber-800 flex items-center justify-center text-white font-bold text-sm">
                  {getInitial(selected.customer_name)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800 text-sm">
                      {selected.customer_name || "Desconhecido"}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      <svg
                        viewBox="0 0 24 24"
                        className="w-3 h-3 fill-green-600"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      </svg>
                      WhatsApp Business
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Phone size={10} />
                    {selected.customer_phone || "Sem telefone"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selected.status === "active" && (
                  <button
                    onClick={() => closeConversation(selected.id)}
                    className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium"
                    title="Encerrar conversa"
                  >
                    <XCircle size={14} className="inline mr-1" />
                    Encerrar
                  </button>
                )}
                <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                  <Search size={16} />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Date Separator */}
              {selected.messages && selected.messages.length > 0 && (
                <div className="flex items-center justify-center my-4">
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-200 px-4 py-1 rounded-full uppercase tracking-wider">
                    {isToday(selected.messages[0]?.timestamp || selected.created_at)
                      ? "Hoje"
                      : new Date(selected.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              )}

              {!selected.messages || selected.messages.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">
                  Sem mensagens nesta conversa
                </p>
              ) : (
                selected.messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.sender === "customer" ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                        msg.sender === "customer"
                          ? "bg-white text-gray-800 rounded-tl-md"
                          : "bg-amber-800 text-white rounded-tr-md"
                      }`}
                    >
                      {/* Sender Label */}
                      <div
                        className={`flex items-center gap-1 mb-1 ${
                          msg.sender === "customer"
                            ? "text-gray-400"
                            : "text-amber-200"
                        }`}
                      >
                        {msg.sender === "customer" ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            Cliente
                          </span>
                        ) : (
                          <>
                            <Bot size={10} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              {msg.sender === "bot" ? "IA PedAI" : "Atendente"}
                            </span>
                          </>
                        )}
                      </div>

                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>

                      <p
                        className={`text-[10px] mt-1.5 text-right ${
                          msg.sender === "customer"
                            ? "text-gray-300"
                            : "text-amber-300"
                        }`}
                      >
                        {msg.timestamp ? formatTime(msg.timestamp) : ""}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="px-4 py-3 bg-white border-t border-gray-200">
              <div className="flex items-center gap-2">
                <button className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 shrink-0 transition">
                  <Plus size={18} />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Escreva uma mensagem..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:bg-white"
                    disabled
                  />
                </div>
                <button className="w-9 h-9 bg-amber-800 hover:bg-amber-900 rounded-full flex items-center justify-center text-white shrink-0 transition shadow-md">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageCircle size={48} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">
                Selecione uma conversa para visualizar
              </p>
              <p className="text-xs mt-1 text-gray-300">
                {total} conversas disponíveis
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ====== RIGHT COLUMN - Customer Details ====== */}
      {selected && (
        <div className="hidden xl:flex w-72 flex-col bg-white border-l border-gray-200 shrink-0 overflow-y-auto">
          {/* Customer Profile */}
          <div className="flex flex-col items-center pt-6 pb-4 border-b border-gray-100">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-amber-800 flex items-center justify-center text-white text-2xl font-bold">
                {getInitial(selected.customer_name)}
              </div>
              <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <h3 className="mt-3 font-bold text-gray-800 text-sm">
              {selected.customer_name || "Desconhecido"}
            </h3>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <Phone size={10} />
              {selected.customer_phone || "Sem telefone"}
            </p>
          </div>

          {/* Address Section */}
          <div className="px-4 py-3 border-b border-gray-100">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Endereco
            </h4>
            <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
              <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-600 leading-relaxed">
                Endereco nao cadastrado
              </p>
            </div>
          </div>

          {/* Last Order Section */}
          <div className="px-4 py-3 border-b border-gray-100">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Ultimo Pedido
            </h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-700">
                  #{selected.id.slice(0, 8).toUpperCase()}
                </p>
                <span className="text-[9px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase">
                  Em Rota
                </span>
              </div>
            </div>
          </div>

          {/* AI Assistant Section */}
          <div className="px-4 py-3 border-b border-gray-100">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Assistente IA
            </h4>
            <div className="bg-amber-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot size={16} className="text-amber-200" />
                  <span className="text-sm font-semibold text-white">
                    IA Ativa
                  </span>
                </div>
                <button
                  onClick={() => setAiActive(!aiActive)}
                  className={`w-10 h-5 rounded-full transition relative ${
                    aiActive ? "bg-green-400" : "bg-gray-400"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      aiActive ? "left-5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Intervene Button */}
          <div className="px-4 py-3 border-b border-gray-100">
            <button className="w-full flex items-center justify-center gap-2 bg-amber-800 hover:bg-amber-900 text-white font-bold py-3 rounded-xl transition shadow-md">
              <Hand size={18} />
              <span className="text-sm uppercase tracking-wide">Intervir Agora</span>
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-2 leading-relaxed">
              Ao intervir, a IA sera desativada temporariamente para este atendimento.
            </p>
          </div>

          {/* Customer Satisfaction */}
          <div className="px-4 py-3">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Satisfacao Cliente
            </h4>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-green-600">94%</span>
              <div className="flex-1 flex items-end gap-0.5 h-8">
                {[65, 78, 85, 70, 90, 94, 88].map((v, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-green-400 rounded-t-sm opacity-80"
                    style={{ height: `${v}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
