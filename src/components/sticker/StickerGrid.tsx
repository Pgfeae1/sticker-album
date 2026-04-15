"use client";

import { useState, useMemo } from "react";
import { useStickers, type FilterType } from "@/hooks/useStickers";
import { StickerCard } from "./StickerCard";
import { SaveDialog } from "./SaveDialog";

const FILTROS: { value: FilterType; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "possuidas", label: "Possuídas" },
  { value: "faltando", label: "Faltando" },
  { value: "repetidas", label: "Repetidas" },
];

export function StickerGrid({
  userAlbumId,
  albumId,
  isLocal,
}: {
  userAlbumId: string;
  albumId: string;
  isLocal: boolean;
}) {
  const {
    stickers,
    loading,
    isSaving,
    saveSuccess,
    updateSticker,
    saveToSupabase,
  } = useStickers(userAlbumId, albumId, isLocal);

  const [filtro, setFiltro] = useState<FilterType>("todas");
  const [busca, setBusca] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  // Grupos retraídos: Set com os nomes das seções retraídas
  const [gruposRetraidos, setGruposRetraidos] = useState<Set<string>>(
    new Set(),
  );
  // Estado do modal de compartilhamento
  const [shareModal, setShareModal] = useState<{
    open: boolean;
    tipo: "faltantes" | "repetidas" | null;
    texto: string;
  }>({ open: false, tipo: null, texto: "" });
  // Feedback de cópia
  const [copiado, setCopiado] = useState(false);

  async function handleSave() {
    const result = await saveToSupabase();
    if (result === "not-logged") {
      setShowDialog(true);
    }
  }

  // Alterna retrair/expandir um grupo
  function toggleGrupo(secao: string) {
    setGruposRetraidos((prev) => {
      const novo = new Set(prev);
      if (novo.has(secao)) {
        novo.delete(secao);
      } else {
        novo.add(secao);
      }
      return novo;
    });
  }

  // Ao pesquisar, reseta os grupos retraídos
  function handleBusca(valor: string) {
    setBusca(valor);
    if (valor.trim()) {
      setGruposRetraidos(new Set());
    }
  }

  // Gera o texto de compartilhamento
  function gerarTextoCompartilhamento(tipo: "faltantes" | "repetidas"): string {
    const siteUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://seusite.com";

    if (tipo === "faltantes") {
      const faltantes = stickers
        .filter((s) => !s.owned)
        .map((s) => s.number)
        .join(", ");

      return (
        `Minhas figurinhas faltantes:\n` +
        `${faltantes || "Nenhuma faltante!"}\n\n` +
        `Gerencie o seu álbum também pelo site: ${siteUrl}`
      );
    } else {
      const repetidas = stickers
        .filter((s) => s.quantity > 1)
        .map((s) => `${s.number}: ${s.quantity - 1}`)
        .join(", ");

      return (
        `Minhas figurinhas repetidas:\n` +
        `${repetidas || "Nenhuma repetida!"}\n\n` +
        `Gerencie o seu álbum também pelo site: ${siteUrl}`
      );
    }
  }

  function abrirShareModal(tipo: "faltantes" | "repetidas") {
    const texto = gerarTextoCompartilhamento(tipo);
    setShareModal({ open: true, tipo, texto });
    setCopiado(false);
  }

  async function copiarTexto() {
    try {
      await navigator.clipboard.writeText(shareModal.texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // fallback para browsers sem clipboard API
      const el = document.createElement("textarea");
      el.value = shareModal.texto;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  }

  async function compartilharNativo() {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareModal.texto });
      } catch {
        // usuário cancelou ou não suportado
      }
    }
  }

  const agrupadas = useMemo(() => {
    const filtradas = stickers
      .filter((s) => {
        if (filtro === "possuidas") return s.owned;
        if (filtro === "faltando") return !s.owned;
        if (filtro === "repetidas") return s.quantity > 1;
        return true;
      })
      .filter((s) => {
        if (!busca) return true;
        const q = busca.toLowerCase();
        return (
          s.number.toLowerCase().includes(q) ||
          s.player_name?.toLowerCase().includes(q) ||
          s.section.toLowerCase().includes(q)
        );
      });

    return filtradas.reduce<Record<string, typeof filtradas>>((acc, s) => {
      acc[s.section] = acc[s.section] ?? [];
      acc[s.section].push(s);
      return acc;
    }, {});
  }, [stickers, filtro, busca]);

  const total = stickers.length;
  const possuidas = stickers.filter((s) => s.owned).length;
  const progresso = total ? Math.round((possuidas / total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400 animate-pulse">Carregando figurinhas...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Barra de progresso + botão salvar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="font-medium text-slate-700">
              {possuidas} de {total} figurinhas
            </span>
            <span className="font-bold text-green-600 ml-3">{progresso}%</span>
          </div>

          {/* Botão salvar */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`
              flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium
              transition-all duration-200
              ${
                saveSuccess
                  ? "bg-green-500 text-white"
                  : "bg-slate-800 text-white hover:bg-slate-700 active:scale-95"
              }
              ${isSaving ? "opacity-60 cursor-not-allowed" : ""}
            `}
          >
            {isSaving ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : saveSuccess ? (
              <>✓ Salvo!</>
            ) : (
              <>💾 Salvar progresso</>
            )}
          </button>
        </div>

        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${progresso}%` }}
          />
        </div>
      </div>

      {/* Botões de compartilhamento */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => abrirShareModal("faltantes")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
            border border-slate-200 bg-white text-slate-600
            hover:border-slate-400 hover:text-slate-800 transition-all"
        >
          📤 Compartilhar faltantes
        </button>
        <button
          onClick={() => abrirShareModal("repetidas")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
            border border-slate-200 bg-white text-slate-600
            hover:border-slate-400 hover:text-slate-800 transition-all"
        >
          🔁 Compartilhar repetidas
        </button>
      </div>

      {/* Filtros + busca */}
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all
              ${
                filtro === f.value
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
              }`}
          >
            {f.label}
          </button>
        ))}
        <input
          type="text"
          placeholder="Buscar figurinha..."
          value={busca}
          onChange={(e) => handleBusca(e.target.value)}
          className="flex-1 min-w-[180px] px-4 py-1.5 rounded-full text-sm border border-slate-200 focus:outline-none focus:border-slate-400"
        />
      </div>

      {/* Grade por seção */}
      {Object.entries(agrupadas).map(([secao, items]) => {
        const retraido = gruposRetraidos.has(secao);
        return (
          <div key={secao} className="mb-8">
            {/* Cabeçalho do grupo — clicável para retrair */}
            <button
              onClick={() => toggleGrupo(secao)}
              className="w-full flex items-center gap-3 mb-3 group"
            >
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-700 transition-colors">
                {secao}
              </h3>
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400">
                {items.filter((s) => s.owned).length}/{items.length}
              </span>
              {/* Ícone de retrair/expandir */}
              <span
                className={`text-slate-400 group-hover:text-slate-600 transition-all duration-200 text-xs ${
                  retraido ? "rotate-0" : "rotate-180"
                }`}
                style={{ display: "inline-block" }}
              >
                ▲
              </span>
            </button>

            {/* Grid de figurinhas — some quando retraído */}
            {!retraido && (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {items.map((s) => (
                  <StickerCard
                    key={s.id}
                    sticker={s}
                    onUpdate={updateSticker}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {Object.keys(agrupadas).length === 0 && (
        <p className="text-center text-slate-400 py-16">
          Nenhuma figurinha encontrada para esse filtro.
        </p>
      )}

      {/* Modal de compartilhamento */}
      {shareModal.open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShareModal({ open: false, tipo: null, texto: "" })}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-slate-800 text-lg mb-1">
              {shareModal.tipo === "faltantes"
                ? "📤 Figurinhas faltantes"
                : "🔁 Figurinhas repetidas"}
            </h3>
            <p className="text-sm text-slate-500 mb-3">
              Copie o texto abaixo para compartilhar
            </p>

            {/* Texto gerado */}
            <textarea
              readOnly
              value={shareModal.texto}
              rows={8}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5
                bg-slate-50 text-slate-700 resize-none focus:outline-none focus:border-slate-400
                font-mono leading-relaxed"
            />

            {/* Botões de ação */}
            <div className="flex gap-2 mt-4">
              {/* Botão copiar */}
              <button
                onClick={copiarTexto}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${
                    copiado
                      ? "bg-green-500 text-white"
                      : "bg-slate-800 text-white hover:bg-slate-700"
                  }`}
              >
                {copiado ? "✓ Copiado!" : "📋 Copiar texto"}
              </button>

              {/* Botão compartilhar nativo (aparece só se suportado) */}
              {typeof navigator !== "undefined" &&
                typeof navigator.share === "function" && (
                  <button
                    onClick={compartilharNativo}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-slate-200
                    text-slate-600 hover:border-slate-400 hover:text-slate-800 transition-all"
                  >
                    🔗 Compartilhar
                  </button>
                )}
            </div>

            {/* Fechar */}
            <button
              onClick={() =>
                setShareModal({ open: false, tipo: null, texto: "" })
              }
              className="w-full mt-2 text-sm text-slate-400 hover:text-slate-600 py-1"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Pop-up de conta */}
      <SaveDialog open={showDialog} onClose={() => setShowDialog(false)} />
    </div>
  );
}
