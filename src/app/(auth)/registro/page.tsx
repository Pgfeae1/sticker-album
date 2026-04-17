"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Cadastro agora é via Google OAuth — esta rota só redireciona.
export default function RegistroPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
