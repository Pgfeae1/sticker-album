/**
 * src/lib/env.ts
 *
 * Valida as variáveis de ambiente obrigatórias na inicialização.
 * Roda apenas no servidor (Server Components / Route Handlers).
 * Se uma variável estiver faltando, a aplicação não sobe — melhor
 * falhar na inicialização do que em produção com erro críptico.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[env] Variável de ambiente obrigatória não encontrada: ${name}\n` +
        `Verifique seu .env.local (desenvolvimento) ou as variáveis de ambiente da Vercel (produção).`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
} as const;

/**
 * Garante que as variáveis estejam presentes na build.
 * Importe este arquivo em qualquer Server Component raiz para
 * disparar a validação cedo (ex: src/app/layout.tsx).
 *
 * Exemplo de uso em layout.tsx:
 *   import "@/lib/env"; // valida env vars na inicialização
 */
