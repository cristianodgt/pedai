"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Utensils,
  Mail,
  Lock,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao fazer login");
        return;
      }

      router.push("/admin/pedidos");
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#f8f9fb", fontFamily: "'Inter', sans-serif" }}
    >
      {/* Logo + Title */}
      <div className="flex flex-col items-center mb-10">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ backgroundColor: "#8B2500" }}
        >
          <Utensils className="w-8 h-8 text-white" />
        </div>
        <h1
          className="text-4xl font-bold tracking-tight"
          style={{ color: "#8B2500" }}
        >
          PedAI
        </h1>
        <p className="text-base mt-1" style={{ color: "#5a4138" }}>
          O maestro da sua cozinha inteligente.
        </p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "#ffffff",
          borderTop: "4px solid #cc4900",
          border: "1px solid rgba(226, 191, 178, 0.15)",
          borderTopWidth: "4px",
          borderTopColor: "#cc4900",
        }}
      >
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* E-mail */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "#191c1e" }}
              >
                E-mail
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ color: "#8B2500" }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@restaurante.com"
                  className="w-full pl-12 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    backgroundColor: "#F0EEEB",
                    color: "#191c1e",
                    border: "none",
                    borderBottom: "2px solid transparent",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderBottomColor = "#a33900")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderBottomColor = "transparent")
                  }
                  required
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "#191c1e" }}
              >
                Senha
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ color: "#8B2500" }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    backgroundColor: "#F0EEEB",
                    color: "#191c1e",
                    border: "none",
                    borderBottom: "2px solid transparent",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderBottomColor = "#a33900")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderBottomColor = "transparent")
                  }
                  required
                />
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: "#a33900" }}
                />
                <span className="text-sm" style={{ color: "#5a4138" }}>
                  Lembrar de mim
                </span>
              </label>
              <a
                href="#"
                className="text-sm font-semibold transition-colors hover:opacity-80"
                style={{ color: "#C4501A" }}
              >
                Esqueci minha senha
              </a>
            </div>

            {/* Error */}
            {error && (
              <p
                className="text-sm p-3 rounded-xl"
                style={{
                  color: "#943030",
                  backgroundColor: "#fdf2f2",
                }}
              >
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3.5 rounded-xl font-semibold text-base transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #a33900, #cc4900)",
              }}
            >
              {loading ? "Entrando..." : "Entrar"}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          {/* Separator */}
          <div
            className="my-6"
            style={{ borderTop: "1px solid #edeef0" }}
          />

          {/* Sign up */}
          <p className="text-center text-sm" style={{ color: "#5a4138" }}>
            Ainda n&atilde;o tem uma conta?{" "}
            <a
              href="#"
              className="font-semibold transition-colors hover:opacity-80"
              style={{ color: "#C4501A" }}
            >
              Solicite acesso
            </a>
          </p>
        </div>
      </div>

      {/* Footer badges */}
      <div className="mt-10 flex flex-col items-center gap-5">
        <div className="flex flex-wrap justify-center gap-8">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#8B2500" }}
            >
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "#191c1e" }}
              >
                Performance
              </p>
              <p className="text-xs" style={{ color: "#5a4138" }}>
                Operacao Agil
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#8B2500" }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "#191c1e" }}
              >
                IA Integrada
              </p>
              <p className="text-xs" style={{ color: "#5a4138" }}>
                Gestao Inteligente
              </p>
            </div>
          </div>
        </div>
        <p className="text-xs" style={{ color: "#5a4138", opacity: 0.6 }}>
          &copy; 2024 PedAI Culinary Systems.
        </p>
      </div>
    </div>
  );
}
