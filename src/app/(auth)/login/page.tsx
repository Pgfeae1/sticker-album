"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  // Se já estiver logado, vai para os álbuns
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/albuns");
    });
  }, []);

  async function handleGoogleLogin() {
    setErro("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/albuns`,
      },
    });

    if (error) {
      setErro(error.message);
      setLoading(false);
    }
    // Sucesso: Supabase redireciona automaticamente → não precisamos fazer nada
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>
          Entre com sua conta Google para salvar e sincronizar seu álbum em
          qualquer dispositivo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Botão Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3
            border border-slate-300 rounded-xl py-3 px-4
            text-sm font-medium text-slate-700 bg-white
            hover:bg-slate-50 active:bg-slate-100
            transition-colors disabled:opacity-50 disabled:cursor-not-allowed
            shadow-sm"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          {loading ? "Redirecionando..." : "Continuar com Google"}
        </button>

        {erro && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md text-center">
            {erro}
          </p>
        )}

        <p className="text-xs text-slate-400 text-center">
          Ao entrar, você concorda que seus dados de álbum serão salvos na
          nuvem.
        </p>

        {/* Voltar sem entrar */}
        <button
          type="button"
          onClick={() => router.push("/albuns")}
          className="w-full text-sm text-slate-400 hover:text-slate-600 transition-colors py-1"
        >
          Continuar sem conta
        </button>
      </CardContent>
    </Card>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
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
