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
  const [gruposRetraidos, setGruposRetraidos] = useState<Set<string>>(
    new Set(),
  );
  const [shareModal, setShareModal] = useState<{
    open: boolean;
    tipo: "faltantes" | "repetidas" | null;
    texto: string;
  }>({ open: false, tipo: null, texto: "" });
  const [copiado, setCopiado] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);

  async function handleSave() {
    const result = await saveToSupabase();
    if (result === "not-logged") setShowDialog(true);
  }

  function toggleGrupo(secao: string) {
    setGruposRetraidos((prev) => {
      const novo = new Set(prev);
      novo.has(secao) ? novo.delete(secao) : novo.add(secao);
      return novo;
    });
  }

  function handleBusca(valor: string) {
    setBusca(valor);
    if (valor.trim()) setGruposRetraidos(new Set());
  }

  function gerarTexto(tipo: "faltantes" | "repetidas"): string {
    const siteUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://seusite.com";

    if (tipo === "faltantes") {
      const lista = stickers
        .filter((s) => !s.owned)
        .map((s) => s.number)
        .join(", ");
      return (
        `Minhas figurinhas faltantes:\n${lista || "Nenhuma faltante!"}\n\n` +
        `Gerencie o seu álbum também pelo site: ${siteUrl}`
      );
    }
    const lista = stickers
      .filter((s) => s.quantity > 1)
      .map((s) => `${s.number}: ${s.quantity - 1}`)
      .join(", ");
    return (
      `Minhas figurinhas repetidas:\n${lista || "Nenhuma repetida!"}\n\n` +
      `Gerencie o seu álbum também pelo site: ${siteUrl}`
    );
  }

  function abrirShareModal(tipo: "faltantes" | "repetidas") {
    setShareModal({ open: true, tipo, texto: gerarTexto(tipo) });
    setCopiado(false);
  }

  async function copiarTexto() {
    try {
      await navigator.clipboard.writeText(shareModal.texto);
    } catch {
      const el = document.createElement("textarea");
      el.value = shareModal.texto;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  async function compartilharNativo() {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareModal.texto });
      } catch {
        /* cancelado */
      }
    }
  }

  // Gera e baixa .xlsx — requer: npm install xlsx
  async function exportarExcel(tipo: "faltantes" | "repetidas") {
    setExcelLoading(true);
    try {
      const XLSX = await import("xlsx");

      if (tipo === "faltantes") {
        const numeros = stickers.filter((s) => !s.owned).map((s) => s.number);
        const COLS = 12;
        const linhas: string[][] = [];
        for (let i = 0; i < numeros.length; i += COLS)
          linhas.push(numeros.slice(i, i + COLS));

        const ws = XLSX.utils.aoa_to_sheet(linhas);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Faltantes");
        XLSX.writeFile(wb, "figurinhas-faltantes.xlsx");
      } else {
        const itens = stickers
          .filter((s) => s.quantity > 1)
          .map((s) => `${s.number}: ${s.quantity - 1}`);
        const COLS = 10;
        const linhas: string[][] = [];
        for (let i = 0; i < itens.length; i += COLS)
          linhas.push(itens.slice(i, i + COLS));

        const ws = XLSX.utils.aoa_to_sheet(linhas);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Repetidas");
        XLSX.writeFile(wb, "figurinhas-repetidas.xlsx");
      }
    } catch {
      alert(
        "Erro ao gerar Excel. Verifique se o pacote xlsx está instalado:\nnpm install xlsx",
      );
    } finally {
      setExcelLoading(false);
    }
  }

  // Totais reais por seção (sem filtro — para o contador do grupo)
  const totaisPorSecao = useMemo(
    () =>
      stickers.reduce<Record<string, { total: number; possuidas: number }>>(
        (acc, s) => {
          if (!acc[s.section]) acc[s.section] = { total: 0, possuidas: 0 };
          acc[s.section].total += 1;
          if (s.owned) acc[s.section].possuidas += 1;
          return acc;
        },
        {},
      ),
    [stickers],
  );

  // Figurinhas filtradas e agrupadas por seção (para exibição)
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

  // Classes compartilhadas para botão salvar
  const saveBtnBase = `flex items-center justify-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
    saveSuccess
      ? "bg-green-500 text-white"
      : "bg-slate-800 text-white hover:bg-slate-700 active:scale-95"
  } ${isSaving ? "opacity-60 cursor-not-allowed" : ""}`;

  const saveBtnContent = isSaving ? (
    <>
      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
      Salvando...
    </>
  ) : saveSuccess ? (
    <>✓ Salvo!</>
  ) : (
    <>💾 Salvar progresso</>
  );

  // Classes compartilhadas para botões de compartilhar
  const shareBtnClass =
    "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium " +
    "border border-slate-200 bg-white text-slate-600 " +
    "hover:border-slate-400 hover:text-slate-800 transition-all";

  return (
    <div>
      {/* ─── Barra de progresso ───────────────────────────────────────────
          Mobile:  linha 1 = contagem | %
                   linha 2 = barra
                   linha 3 = botão salvar (largura total)
          Desktop: linha 1 = contagem | %       botão salvar
                   linha 2 = barra
      ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700">
              {possuidas} de {total}
            </span>
            <span className="font-bold text-green-600">{progresso}%</span>
          </div>
          {/* Botão salvar — só desktop */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`hidden sm:flex ${saveBtnBase}`}
          >
            {saveBtnContent}
          </button>
        </div>

        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${progresso}%` }}
          />
        </div>

        {/* Botão salvar — só mobile, abaixo da barra */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`mt-3 w-full sm:hidden ${saveBtnBase}`}
        >
          {saveBtnContent}
        </button>
      </div>

      {/* ─── DESKTOP: Filtros + botões compartilhar na mesma linha ────────
          [Todas] [Possuídas] [Faltando] [Repetidas] ── [📤 Faltantes] [🔁 Repetidas]
      ─────────────────────────────────────────────────────────────────── */}
      <div className="hidden sm:flex items-center gap-2 mb-2 flex-wrap">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              filtro === f.value
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
            }`}
          >
            {f.label}
          </button>
        ))}

        {/* Separador flexível */}
        <div className="flex-1" />

        <button
          onClick={() => abrirShareModal("faltantes")}
          className={shareBtnClass}
        >
          📤 Compartilhar faltantes
        </button>
        <button
          onClick={() => abrirShareModal("repetidas")}
          className={shareBtnClass}
        >
          🔁 Compartilhar repetidas
        </button>
      </div>

      {/* DESKTOP: Barra de busca — linha abaixo, largura total */}
      <div className="hidden sm:block mb-6">
        <input
          type="text"
          placeholder="Pesquise por código (ex: BRA 10), país (ex: Brasil) ou grupo (ex: Grupo C)..."
          value={busca}
          onChange={(e) => handleBusca(e.target.value)}
          className="w-full px-4 py-2 rounded-full text-sm border border-slate-200
            focus:outline-none focus:border-slate-400 bg-white"
        />
      </div>

      {/* ─── MOBILE: Botões de compartilhar ───────────────────────────── */}
      <div className="flex gap-2 mb-3 sm:hidden">
        <button
          onClick={() => abrirShareModal("faltantes")}
          className={`flex-1 ${shareBtnClass}`}
        >
          📤 Compartilhar faltantes
        </button>
        <button
          onClick={() => abrirShareModal("repetidas")}
          className={`flex-1 ${shareBtnClass}`}
        >
          🔁 Compartilhar repetidas
        </button>
      </div>

      {/* ─── MOBILE: Filtros (4-col) + busca ──────────────────────────── */}
      <div className="sm:hidden mb-4">
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={`py-1.5 px-1 rounded-full text-xs font-medium border transition-all text-center ${
                filtro === f.value
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Buscar figurinha..."
          value={busca}
          onChange={(e) => handleBusca(e.target.value)}
          className="w-full px-4 py-1.5 rounded-full text-sm border border-slate-200
            focus:outline-none focus:border-slate-400"
        />
      </div>

      {/* ─── Grade por seção ──────────────────────────────────────────── */}
      {Object.entries(agrupadas).map(([secao, items]) => {
        const retraido = gruposRetraidos.has(secao);
        const secaoInfo = totaisPorSecao[secao] ?? { total: 0, possuidas: 0 };

        return (
          <div key={secao} className="mb-8">
            <button
              onClick={() => toggleGrupo(secao)}
              className="w-full flex items-center gap-3 mb-3 group"
            >
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-700 transition-colors">
                {secao}
              </h3>
              <div className="flex-1 h-px bg-slate-200" />
              {/* Sempre exibe possuídas/total real da seção */}
              <span className="text-xs text-slate-400">
                {secaoInfo.possuidas}/{secaoInfo.total}
              </span>
              <span
                className={`text-slate-400 group-hover:text-slate-600 text-xs inline-block
                  transition-transform duration-200 ${retraido ? "rotate-0" : "rotate-180"}`}
              >
                ▲
              </span>
            </button>

            {!retraido && (
              <div className="grid gap-2 grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
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

      {/* ─── Modal de compartilhamento ────────────────────────────────── */}
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
              Copie o texto ou baixe a planilha Excel
            </p>

            <textarea
              readOnly
              value={shareModal.texto}
              rows={7}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5
                bg-slate-50 text-slate-700 resize-none focus:outline-none font-mono leading-relaxed"
            />

            {/* Linha 1: copiar + compartilhar nativo */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={copiarTexto}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  copiado
                    ? "bg-green-500 text-white"
                    : "bg-slate-800 text-white hover:bg-slate-700"
                }`}
              >
                {copiado ? "✓ Copiado!" : "📋 Copiar texto"}
              </button>

              {typeof navigator !== "undefined" &&
                typeof navigator.share === "function" && (
                  <button
                    onClick={compartilharNativo}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium
                      border border-slate-200 text-slate-600
                      hover:border-slate-400 hover:text-slate-800 transition-all"
                  >
                    🔗 Compartilhar
                  </button>
                )}
            </div>

            {/* Linha 2: baixar Excel */}
            <button
              onClick={() => exportarExcel(shareModal.tipo!)}
              disabled={excelLoading}
              className="mt-2 w-full py-2.5 rounded-xl text-sm font-medium
                border border-slate-200 text-slate-600
                hover:border-green-400 hover:text-green-700 hover:bg-green-50
                transition-all disabled:opacity-50"
            >
              {excelLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  Gerando Excel...
                </span>
              ) : (
                "📊 Baixar Excel"
              )}
            </button>

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

      <SaveDialog open={showDialog} onClose={() => setShowDialog(false)} />
    </div>
  );
}
