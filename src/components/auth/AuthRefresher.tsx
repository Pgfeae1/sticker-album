"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

/**
 * Componente invisível que escuta mudanças de autenticação.
 * Quando o usuário faz login via OAuth (Google), o Supabase dispara
 * SIGNED_IN e chamamos router.refresh() para que o Server Component
 * do layout releia a sessão e exiba avatar/nome imediatamente.
 */
export function AuthRefresher() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
