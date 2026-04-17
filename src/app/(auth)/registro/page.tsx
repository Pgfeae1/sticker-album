"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// O cadastro agora é feito automaticamente via Google OAuth.
// Esta rota redireciona para /login para não quebrar links antigos.
export default function RegistroPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, []);

  return null;
}
