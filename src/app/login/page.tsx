"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UtensilsCrossed,
  Mail,
  Lock,
  ArrowRight,
  Zap,
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
    <div className="flex items-center justify-center min-h-screen bg-[#f3f4f6] font-[Inter,sans-serif] text-[#191c1e]">
      <div className="w-full max-w-md px-6">
        {/* Logo + Title */}
        <div className="mb-10 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-[#a33900] p-3 rounded-full shadow-lg">
              <UtensilsCrossed className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-[#a33900] tracking-tighter">
            PedAI
          </h1>
          <p className="text-[#5a4138] font-medium mt-2">
            O maestro da sua cozinha inteligente.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-[0.75rem] p-8 md:p-12 shadow-[0px_20px_40px_rgba(25,28,30,0.06)] relative overflow-hidden">
          {/* Top gradient bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#a33900] to-[#cc4900]" />

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* E-mail */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-[#5a4138] mb-2"
              >
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#8e7166]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@restaurante.com"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-[#e7e8ea] border-0 border-b-2 border-transparent focus:border-[#a33900] focus:ring-0 rounded-xl transition-all duration-200 placeholder:text-[#8e7166]/60 text-[#191c1e] font-medium outline-none"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-[#5a4138] mb-2"
              >
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#8e7166]" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-[#e7e8ea] border-0 border-b-2 border-transparent focus:border-[#a33900] focus:ring-0 rounded-xl transition-all duration-200 placeholder:text-[#8e7166]/60 text-[#191c1e] font-medium outline-none"
                />
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-[#e2bfb2] text-[#a33900] focus:ring-[#a33900]"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-xs font-medium text-[#5a4138]"
                >
                  Lembrar de mim
                </label>
              </div>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); alert("Entre em contato com o administrador do sistema."); }}
                className="text-xs font-bold text-[#a33900] hover:text-[#cc4900] transition-colors"
              >
                Esqueci minha senha
              </a>
            </div>

            {/* Error */}
            {error && (
              <div className="w-full px-3 py-2.5 text-sm rounded-xl bg-[#ffdad6] text-[#93000a] font-medium">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-br from-[#a33900] to-[#cc4900] text-white font-bold rounded-full shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:pointer-events-none"
            >
              <span>{loading ? "Entrando..." : "Entrar"}</span>
              {!loading && (
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </form>

          {/* Sign up */}
          <div className="mt-8 pt-8 border-t border-[#e2bfb2]/10 text-center">
            <p className="text-sm text-[#5a4138]">
              Ainda n&atilde;o tem uma conta?{" "}
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); alert("Entre em contato com o administrador para solicitar acesso."); }}
                className="text-[#a33900] font-bold hover:underline"
              >
                Solicite acesso
              </a>
            </p>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-12 grid grid-cols-2 gap-4">
          <div className="bg-[#f3f4f6] p-4 rounded-xl flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#e7e8ea] flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#a33900]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#5a4138] uppercase tracking-wider">
                Performance
              </p>
              <p className="text-xs font-semibold text-[#191c1e]">
                Operação Ágil
              </p>
            </div>
          </div>
          <div className="bg-[#f3f4f6] p-4 rounded-xl flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#e7e8ea] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#a33900]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#5a4138] uppercase tracking-wider">
                IA Integrada
              </p>
              <p className="text-xs font-semibold text-[#191c1e]">
                Gestão Inteligente
              </p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <footer className="mt-16 text-center">
          <p className="text-xs text-[#8e7166] font-medium">
            &copy; 2024 PedAI Culinary Systems. Todos os direitos reservados.
          </p>
        </footer>
      </div>
    </div>
  );
}
