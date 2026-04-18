import { createClient } from "@/lib/supabase-server";
import LogoutButton from "@/components/auth/LogoutButton";
import { AuthRefresher } from "@/components/auth/AuthRefresher";
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
      {/* AuthRefresher é invisível — só chama router.refresh() no login/logout */}
      <AuthRefresher />

      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚽</span>
            <span className="font-bold text-slate-800">Meu Álbum</span>
          </div>

          {/* Área do usuário */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                {/* Avatar — visível em todos os tamanhos */}
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url as string}
                    alt={(user.user_metadata?.full_name as string) ?? "Usuário"}
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  /* Fallback: inicial do nome/email quando não há avatar */
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-slate-600">
                      {(
                        (user.user_metadata?.full_name as string) ??
                        user.email ??
                        "?"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Nome — oculto em mobile, visível em sm+ */}
                <span className="hidden sm:block text-sm text-slate-500 max-w-[180px] truncate">
                  {(user.user_metadata?.full_name as string) ?? user.email}
                </span>

                <LogoutButton />
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 text-sm font-medium
                  bg-white border border-slate-300 text-slate-700
                  px-3 py-1.5 rounded-full hover:bg-slate-50
                  transition-colors shadow-sm"
              >
                <GoogleIcon />
                {/* Texto encurtado no mobile */}
                <span className="hidden sm:inline">Entrar com Google</span>
                <span className="sm:hidden">Entrar</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908C16.658 14.251 17.64 11.943 17.64 9.2z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
