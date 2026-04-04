import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PedAI - PDV + WhatsApp Inteligente",
  description: "Plataforma de pedidos unificada com IA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-gray-50 text-gray-900" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
