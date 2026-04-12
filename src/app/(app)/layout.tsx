import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verifica a sessão no servidor (mais seguro que no cliente)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Se não há usuário logado, manda para o login
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header da aplicação */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚽</span>
            <span className="font-bold text-slate-800">Meu Álbum</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Conteúdo da página */}
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

// Componente de logout — precisa ser client porque usa onClick
function LogoutButton() {
  return <LogoutButtonClient />;
}

// Separado para não tornar o layout inteiro um Client Component
import LogoutButtonClient from "@/components/auth/LogoutButton";
