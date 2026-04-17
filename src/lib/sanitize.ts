/**
 * src/lib/sanitize.ts
 *
 * Funções de sanitização de inputs do usuário.
 * Use antes de salvar qualquer dado digitado pelo usuário.
 */

/**
 * Remove caracteres de controle, tags HTML e espaços excessivos.
 * Usa para nomes de álbum e qualquer campo de texto livre.
 */
export function sanitizeText(value: string, maxLength = 100): string {
  return value
    .replace(/<[^>]*>/g, "") // remove tags HTML
    .replace(/[^\p{L}\p{N}\p{Z}\p{P}]/gu, "") // mantém letras, números, espaços e pontuação Unicode
    .trim()
    .slice(0, maxLength);
}

/**
 * Valida e sanitiza o nome de um álbum.
 * Retorna o nome limpo ou o padrão se inválido/vazio.
 */
export function sanitizeAlbumName(
  value: string,
  defaultName = "Meu álbum",
): string {
  const clean = sanitizeText(value, 40);
  return clean.length > 0 ? clean : defaultName;
}
