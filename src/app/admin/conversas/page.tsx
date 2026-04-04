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
    <div
      className="h-[calc(100vh-3rem)] flex overflow-hidden"
      style={{ background: "#f8f9fb", borderRadius: "0.75rem" }}
    >
      {/* ====== LEFT COLUMN - Conversation List ====== */}
      <div
        className={`w-80 flex flex-col shrink-0 ${
          selected ? "hidden lg:flex" : "flex"
        }`}
        style={{ background: "#ffffff" }}
      >
        {/* List Header */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2
                className="text-xs font-bold tracking-wider uppercase"
                style={{ color: "#191c1e" }}
              >
                Conversas Ativas
              </h2>
              <span
                className="text-[10px] font-bold px-2 py-0.5 uppercase"
                style={{
                  background: "rgba(22,163,74,0.1)",
                  color: "#16a34a",
                  borderRadius: "0.75rem",
                }}
              >
                {activeCount} novas
              </span>
            </div>
            <button
              onClick={() => {
                setLoading(true);
                fetchConversations();
              }}
              className="p-1.5 transition"
              style={{ color: "#5a4138", borderRadius: "0.75rem" }}
              title="Atualizar"
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#edeef0")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "#5a4138" }}
            />
            <input
              type="text"
              placeholder="Buscar conversa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs focus:outline-none"
              style={{
                background: "#edeef0",
                border: "none",
                borderRadius: "0.75rem",
                color: "#191c1e",
                borderBottom: "2px solid transparent",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderBottomColor = "#a33900")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderBottomColor = "transparent")
              }
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
                className="px-2.5 py-1 text-[10px] font-medium transition"
                style={{
                  borderRadius: "0.75rem",
                  background:
                    statusFilter === f.value ? "#a33900" : "#edeef0",
                  color: statusFilter === f.value ? "#ffffff" : "#5a4138",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loading && conversations.length === 0 ? (
            <div className="p-8 text-center" style={{ color: "#5a4138" }}>
              <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
              <p className="text-xs">Carregando...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center" style={{ color: "#5a4138" }}>
              <MessageCircle
                size={28}
                className="mx-auto mb-2"
                style={{ opacity: 0.3 }}
              />
              <p className="text-xs">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className="w-full text-left px-4 py-3 transition"
                style={{
                  background:
                    selected?.id === c.id
                      ? "rgba(204,73,0,0.05)"
                      : "transparent",
                  border: "none",
                }}
                onMouseEnter={(e) => {
                  if (selected?.id !== c.id)
                    e.currentTarget.style.background = "rgba(204,73,0,0.03)";
                }}
                onMouseLeave={(e) => {
                  if (selected?.id !== c.id)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{
                      borderRadius: "50%",
                      background: "#edeef0",
                      color: "#5a4138",
                    }}
                  >
                    {getInitial(c.customer_name)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: "#191c1e" }}
                      >
                        {c.customer_name || c.customer_phone || "Desconhecido"}
                      </p>
                      <span
                        className="text-[10px] shrink-0 ml-2"
                        style={{ color: "#5a4138" }}
                      >
                        {timeAgo(c.last_message_at)}
                      </span>
                    </div>

                    <p
                      className="text-[11px] truncate mt-0.5"
                      style={{ color: "#5a4138" }}
                    >
                      {lastMessage(c)}
                    </p>

                    {/* Status Badges */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {c.status === "active" && !needsHuman(c) && (
                        <span
                          className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 uppercase"
                          style={{
                            background: "rgba(22,163,74,0.1)",
                            color: "#16a34a",
                            borderRadius: "0.75rem",
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5"
                            style={{
                              background: "#16a34a",
                              borderRadius: "50%",
                              display: "inline-block",
                            }}
                          />
                          AI Ativo
                        </span>
                      )}
                      {needsHuman(c) && (
                        <span
                          className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 uppercase"
                          style={{
                            background: "rgba(217,119,6,0.1)",
                            color: "#b45309",
                            borderRadius: "0.75rem",
                          }}
                        >
                          Aguardando Humano
                        </span>
                      )}
                      <span
                        className="inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5"
                        style={{
                          background: "rgba(22,163,74,0.06)",
                          color: "#16a34a",
                          borderRadius: "0.75rem",
                        }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="w-2.5 h-2.5"
                          style={{ fill: "#16a34a" }}
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
        className={`flex-1 flex flex-col ${
          selected ? "flex" : "hidden lg:flex"
        }`}
        style={{ background: "#f8f9fb" }}
      >
        {selected ? (
          <>
            {/* Chat Header */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ background: "#ffffff" }}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelected(null)}
                  className="lg:hidden p-1 transition"
                  style={{ borderRadius: "0.75rem", color: "#191c1e" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#edeef0")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <ArrowLeft size={18} />
                </button>
                <div
                  className="w-9 h-9 flex items-center justify-center text-white font-bold text-sm"
                  style={{
                    borderRadius: "50%",
                    background: "#edeef0",
                    color: "#5a4138",
                  }}
                >
                  {getInitial(selected.customer_name)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p
                      className="font-semibold text-sm"
                      style={{ color: "#191c1e" }}
                    >
                      {selected.customer_name || "Desconhecido"}
                    </p>
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5"
                      style={{
                        background: "rgba(22,163,74,0.1)",
                        color: "#16a34a",
                        borderRadius: "0.75rem",
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="w-3 h-3"
                        style={{ fill: "#16a34a" }}
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      </svg>
                      WhatsApp Business
                    </span>
                  </div>
                  <p
                    className="text-xs flex items-center gap-1"
                    style={{ color: "#5a4138" }}
                  >
                    <Phone size={10} />
                    {selected.customer_phone || "Sem telefone"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selected.status === "active" && (
                  <button
                    onClick={() => closeConversation(selected.id)}
                    className="text-xs px-3 py-1.5 font-medium transition"
                    style={{
                      background: "rgba(220,38,38,0.08)",
                      color: "#dc2626",
                      borderRadius: "0.75rem",
                      border: "none",
                    }}
                    title="Encerrar conversa"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(220,38,38,0.14)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(220,38,38,0.08)")
                    }
                  >
                    <XCircle size={14} className="inline mr-1" />
                    Encerrar
                  </button>
                )}
                <button
                  className="p-2 transition"
                  style={{ color: "#5a4138", borderRadius: "0.75rem" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#edeef0")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <Search size={16} />
                </button>
                <button
                  className="p-2 transition"
                  style={{ color: "#5a4138", borderRadius: "0.75rem" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#edeef0")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Date Separator */}
              {selected.messages && selected.messages.length > 0 && (
                <div className="flex items-center justify-center my-4">
                  <span
                    className="text-[10px] font-bold px-4 py-1 uppercase tracking-wider"
                    style={{
                      color: "#5a4138",
                      background: "#edeef0",
                      borderRadius: "0.75rem",
                    }}
                  >
                    {isToday(
                      selected.messages[0]?.timestamp || selected.created_at
                    )
                      ? "Hoje"
                      : new Date(selected.created_at).toLocaleDateString(
                          "pt-BR"
                        )}
                  </span>
                </div>
              )}

              {!selected.messages || selected.messages.length === 0 ? (
                <p
                  className="text-center text-sm py-8"
                  style={{ color: "#5a4138" }}
                >
                  Sem mensagens nesta conversa
                </p>
              ) : (
                selected.messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex items-end gap-2 ${
                      msg.sender === "customer"
                        ? "justify-start"
                        : "justify-end"
                    }`}
                  >
                    {/* Customer avatar on left */}
                    {msg.sender === "customer" && (
                      <div
                        className="w-7 h-7 flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{
                          borderRadius: "50%",
                          background: "#edeef0",
                          color: "#5a4138",
                        }}
                      >
                        {getInitial(selected.customer_name)}
                      </div>
                    )}

                    <div
                      className="max-w-[70%] px-4 py-3"
                      style={{
                        borderRadius:
                          msg.sender === "customer"
                            ? "0.25rem 0.75rem 0.75rem 0.75rem"
                            : "0.75rem 0.25rem 0.75rem 0.75rem",
                        background:
                          msg.sender === "customer"
                            ? "#ffffff"
                            : "linear-gradient(135deg, #a33900, #cc4900)",
                        color:
                          msg.sender === "customer" ? "#191c1e" : "#ffffff",
                      }}
                    >
                      {/* Sender Label */}
                      <div className="flex items-center gap-1 mb-1">
                        {msg.sender === "customer" ? (
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: "#5a4138" }}
                          >
                            Cliente
                          </span>
                        ) : (
                          <>
                            <Bot
                              size={10}
                              style={{ color: "rgba(255,255,255,0.7)" }}
                            />
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider"
                              style={{ color: "rgba(255,255,255,0.7)" }}
                            >
                              {msg.sender === "bot" ? "IA PedAI" : "Atendente"}
                            </span>
                          </>
                        )}
                      </div>

                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>

                      <p
                        className="text-[10px] mt-1.5 text-right"
                        style={{
                          color:
                            msg.sender === "customer"
                              ? "#5a4138"
                              : "rgba(255,255,255,0.6)",
                        }}
                      >
                        {msg.timestamp ? formatTime(msg.timestamp) : ""}
                      </p>
                    </div>

                    {/* Bot avatar on right */}
                    {msg.sender !== "customer" && (
                      <div
                        className="w-7 h-7 flex items-center justify-center shrink-0"
                        style={{
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #a33900, #cc4900)",
                        }}
                      >
                        <Bot size={12} style={{ color: "#ffffff" }} />
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="px-4 py-3" style={{ background: "#ffffff" }}>
              <div className="flex items-center gap-2">
                <button
                  className="w-9 h-9 flex items-center justify-center shrink-0 transition"
                  style={{
                    background: "#edeef0",
                    borderRadius: "50%",
                    color: "#5a4138",
                    border: "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#e2bfb2")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#edeef0")
                  }
                >
                  <Plus size={18} />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Escreva uma mensagem..."
                    className="w-full px-4 py-2.5 text-sm focus:outline-none"
                    style={{
                      background: "#edeef0",
                      border: "none",
                      borderBottom: "2px solid transparent",
                      borderRadius: "0.75rem",
                      color: "#191c1e",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderBottomColor = "#a33900")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderBottomColor = "transparent")
                    }
                    disabled
                  />
                </div>
                <button
                  className="w-9 h-9 flex items-center justify-center text-white shrink-0 transition"
                  style={{
                    background: "linear-gradient(135deg, #a33900, #cc4900)",
                    borderRadius: "50%",
                    border: "none",
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div
            className="flex-1 flex items-center justify-center"
            style={{ color: "#5a4138" }}
          >
            <div className="text-center">
              <MessageCircle
                size={48}
                className="mx-auto mb-3"
                style={{ opacity: 0.2 }}
              />
              <p className="text-sm font-medium">
                Selecione uma conversa para visualizar
              </p>
              <p className="text-xs mt-1" style={{ color: "#5a4138", opacity: 0.6 }}>
                {total} conversas disponíveis
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ====== RIGHT COLUMN - Customer Details ====== */}
      {selected && (
        <div
          className="hidden xl:flex w-72 flex-col shrink-0 overflow-y-auto"
          style={{ background: "#ffffff" }}
        >
          {/* Customer Profile */}
          <div className="flex flex-col items-center pt-6 pb-4">
            <div className="relative">
              <div
                className="w-20 h-20 flex items-center justify-center text-2xl font-bold"
                style={{
                  borderRadius: "50%",
                  background: "#edeef0",
                  color: "#5a4138",
                }}
              >
                {getInitial(selected.customer_name)}
              </div>
              <div
                className="absolute bottom-1 right-1 w-4 h-4"
                style={{
                  background: "#16a34a",
                  borderRadius: "50%",
                  border: "2px solid #ffffff",
                }}
              />
            </div>
            <h3
              className="mt-3 font-bold text-sm"
              style={{ color: "#191c1e" }}
            >
              {selected.customer_name || "Desconhecido"}
            </h3>
            <p
              className="text-xs flex items-center gap-1 mt-0.5"
              style={{ color: "#5a4138" }}
            >
              <Phone size={10} />
              {selected.customer_phone || "Sem telefone"}
            </p>
          </div>

          {/* Spacing separator */}
          <div className="h-2" style={{ background: "#f8f9fb" }} />

          {/* Address Section */}
          <div className="px-4 py-3">
            <h4
              className="text-[10px] font-bold uppercase tracking-wider mb-2"
              style={{ color: "#5a4138" }}
            >
              Endereco
            </h4>
            <div
              className="flex items-start gap-2 p-3"
              style={{ background: "#edeef0", borderRadius: "0.75rem" }}
            >
              <MapPin
                size={14}
                className="shrink-0 mt-0.5"
                style={{ color: "#5a4138" }}
              />
              <p className="text-xs leading-relaxed" style={{ color: "#5a4138" }}>
                Endereco nao cadastrado
              </p>
            </div>
          </div>

          {/* Spacing separator */}
          <div className="h-2" style={{ background: "#f8f9fb" }} />

          {/* Last Order Section */}
          <div className="px-4 py-3">
            <h4
              className="text-[10px] font-bold uppercase tracking-wider mb-2"
              style={{ color: "#5a4138" }}
            >
              Ultimo Pedido
            </h4>
            <div className="p-3" style={{ background: "#edeef0", borderRadius: "0.75rem" }}>
              <div className="flex items-center justify-between">
                <p
                  className="text-xs font-medium"
                  style={{ color: "#191c1e" }}
                >
                  #{selected.id.slice(0, 8).toUpperCase()}
                </p>
                <span
                  className="text-[9px] font-bold px-2 py-0.5 uppercase"
                  style={{
                    background: "rgba(22,163,74,0.1)",
                    color: "#16a34a",
                    borderRadius: "0.75rem",
                  }}
                >
                  Em Rota
                </span>
              </div>
            </div>
          </div>

          {/* Spacing separator */}
          <div className="h-2" style={{ background: "#f8f9fb" }} />

          {/* AI Assistant Section */}
          <div className="px-4 py-3">
            <h4
              className="text-[10px] font-bold uppercase tracking-wider mb-2"
              style={{ color: "#5a4138" }}
            >
              Assistente IA
            </h4>
            <div
              className="p-4"
              style={{
                background: "linear-gradient(135deg, #a33900, #cc4900)",
                borderRadius: "0.75rem",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot
                    size={16}
                    style={{ color: "rgba(255,255,255,0.7)" }}
                  />
                  <span className="text-sm font-semibold text-white">
                    IA Ativa
                  </span>
                </div>
                <button
                  onClick={() => setAiActive(!aiActive)}
                  className="w-10 h-5 transition relative"
                  style={{
                    borderRadius: "0.75rem",
                    background: aiActive ? "#cc4900" : "rgba(255,255,255,0.3)",
                    border: aiActive
                      ? "2px solid rgba(255,255,255,0.5)"
                      : "2px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 transition-transform"
                    style={{
                      borderRadius: "50%",
                      background: "#ffffff",
                      left: aiActive ? "20px" : "2px",
                    }}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Spacing separator */}
          <div className="h-2" style={{ background: "#f8f9fb" }} />

          {/* Intervene Button */}
          <div className="px-4 py-3">
            <button
              className="w-full flex items-center justify-center gap-2 text-white font-bold py-3 transition"
              style={{
                background: "linear-gradient(135deg, #a33900, #cc4900)",
                borderRadius: "0.75rem",
                border: "none",
              }}
            >
              <Hand size={18} />
              <span className="text-sm uppercase tracking-wide">
                Intervir Agora
              </span>
            </button>
            <p
              className="text-[10px] text-center mt-2 leading-relaxed"
              style={{ color: "#5a4138" }}
            >
              Ao intervir, a IA sera desativada temporariamente para este
              atendimento.
            </p>
          </div>

          {/* Spacing separator */}
          <div className="h-2" style={{ background: "#f8f9fb" }} />

          {/* Customer Satisfaction */}
          <div className="px-4 py-3">
            <h4
              className="text-[10px] font-bold uppercase tracking-wider mb-2"
              style={{ color: "#5a4138" }}
            >
              Satisfacao Cliente
            </h4>
            <div className="flex items-center gap-3">
              <span
                className="text-3xl font-bold"
                style={{ color: "#16a34a" }}
              >
                94%
              </span>
              <div className="flex-1 flex items-end gap-0.5 h-8">
                {[65, 78, 85, 70, 90, 94, 88].map((v, i) => (
                  <div
                    key={i}
                    className="flex-1"
                    style={{
                      height: `${v}%`,
                      background:
                        v >= 90
                          ? "#16a34a"
                          : v >= 75
                          ? "#a33900"
                          : "#cc4900",
                      borderRadius: "0.25rem 0.25rem 0 0",
                      opacity: 0.8,
                    }}
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
