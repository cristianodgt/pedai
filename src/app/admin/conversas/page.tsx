"use client";

import { useEffect, useState, useRef } from "react";
import {
  MessageCircle,
  Search,
  Phone,
  User,
  Clock,
  ArrowLeft,
  XCircle,
  CheckCircle,
  RefreshCw,
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
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ConversasPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
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
    return prefix + (text.length > 60 ? text.slice(0, 60) + "..." : text);
  };

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {selected && (
            <button
              onClick={() => setSelected(null)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-800">
            <MessageCircle className="inline mr-2 mb-1" size={24} />
            Conversas WhatsApp
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{total} conversas</span>
          <button
            onClick={() => { setLoading(true); fetchConversations(); }}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Atualizar"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Conversations List */}
        <div
          className={`w-full lg:w-96 flex flex-col bg-white rounded-xl border border-gray-200 ${
            selected ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Search & Filter */}
          <div className="p-3 border-b border-gray-100 space-y-2">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Buscar por nome ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div className="flex gap-1">
              {[
                { value: "", label: "Todas" },
                { value: "active", label: "Ativas" },
                { value: "closed", label: "Encerradas" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-3 py-1 text-xs rounded-full ${
                    statusFilter === f.value
                      ? "bg-orange-100 text-orange-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading && conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                Carregando...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma conversa encontrada</p>
                <p className="text-xs mt-1">
                  As conversas aparecerão aqui quando clientes enviarem mensagens via WhatsApp
                </p>
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`w-full text-left p-3 border-b border-gray-50 hover:bg-gray-50 transition ${
                    selected?.id === c.id ? "bg-orange-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                          c.status === "active" ? "bg-green-500" : "bg-gray-400"
                        }`}
                      >
                        {(c.customer_name || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {c.customer_name || c.customer_phone || "Desconhecido"}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {c.customer_phone || ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-[10px] text-gray-400">
                        {timeAgo(c.last_message_at)}
                      </p>
                      {c.messages && c.messages.length > 0 && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                          {c.messages.length}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {lastMessage(c)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat View */}
        <div
          className={`flex-1 flex flex-col bg-white rounded-xl border border-gray-200 ${
            selected ? "flex" : "hidden lg:flex"
          }`}
        >
          {selected ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelected(null)}
                    className="lg:hidden p-1 hover:bg-gray-100 rounded"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      selected.status === "active"
                        ? "bg-green-500"
                        : "bg-gray-400"
                    }`}
                  >
                    {(selected.customer_name || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {selected.customer_name || "Desconhecido"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {selected.customer_phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={10} />
                          {selected.customer_phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {formatDate(selected.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      selected.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {selected.status === "active" ? "Ativa" : "Encerrada"}
                  </span>
                  {selected.status === "active" && (
                    <button
                      onClick={() => closeConversation(selected.id)}
                      className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-full hover:bg-red-100"
                      title="Encerrar conversa"
                    >
                      <XCircle size={14} className="inline mr-1" />
                      Encerrar
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {(!selected.messages || selected.messages.length === 0) ? (
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
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          msg.sender === "customer"
                            ? "bg-white border border-gray-200 text-gray-800"
                            : msg.sender === "bot"
                            ? "bg-orange-500 text-white"
                            : "bg-blue-500 text-white"
                        }`}
                      >
                        {msg.sender !== "customer" && (
                          <p className="text-[10px] opacity-70 mb-0.5">
                            {msg.sender === "bot" ? "Bot" : "Atendente"}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            msg.sender === "customer"
                              ? "text-gray-400"
                              : "opacity-70"
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

              {/* Info footer */}
              <div className="p-3 border-t border-gray-200 bg-white text-center">
                <p className="text-xs text-gray-400">
                  Conversas gerenciadas pelo bot IA via WhatsApp
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageCircle size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Selecione uma conversa para visualizar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
