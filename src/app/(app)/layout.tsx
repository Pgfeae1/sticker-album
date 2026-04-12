import { createClient } from "@/lib/supabase-server";
import LogoutButton from "@/components/auth/LogoutButton";
import Link from "next/link";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚽</span>
            <span className="font-bold text-slate-800">Meu Álbum</span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              // Usuário logado: mostra email e botão sair
              <>
                <span className="text-sm text-slate-500 hidden sm:block">
                  {user.email}
                </span>
                <LogoutButton />
              </>
            ) : (
              // Usuário sem conta: mostra links de login e registro
              <>
                <Link
                  href="/login"
                  className="text-sm text-slate-600 hover:text-slate-900"
                >
                  Entrar
                </Link>
                <Link
                  href="/registro"
                  className="text-sm bg-slate-800 text-white px-4 py-1.5 rounded-full hover:bg-slate-700 transition-colors"
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
