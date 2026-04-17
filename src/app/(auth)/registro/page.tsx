"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// O registro agora é feito automaticamente via Google OAuth na primeira vez
// que o usuário faz login. Esta rota existe apenas para redirecionar links antigos.
export default function RegistroPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, []);
  return null;
}
