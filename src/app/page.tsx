import { redirect } from "next/navigation";

// A página inicial redireciona para os álbuns.
// Se não estiver logado, o layout de (app) vai redirecionar para /login.
export default function Home() {
  redirect("/albuns");
}
