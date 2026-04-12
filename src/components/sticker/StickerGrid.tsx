"use client";

import { useState, useMemo } from "react";
import { useStickers, type FilterType } from "@/hooks/useStickers";
import { StickerCard } from "./StickerCard";

const FILTROS: { value: FilterType; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "possuidas", label: "Possuídas" },
  { value: "faltando", label: "Faltando" },
  { value: "repetidas", label: "Repetidas" },
];

export function StickerGrid({ albumId }: { albumId: string }) {
  const { stickers, loading, updateSticker } = useStickers(albumId);
  const [filtro, setFiltro] = useState<FilterType>("todas");
  const [busca, setBusca] = useState("");

  // Filtra e agrupa as figurinhas
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

    // Agrupa por seção
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
      {/* Barra de progresso */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-slate-700">
            {possuidas} de {total} figurinhas
          </span>
          <span className="font-bold text-green-600">{progresso}%</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${progresso}%` }}
          />
        </div>
      </div>

      {/* Filtros */}
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

        {/* Barra de busca */}
        <input
          type="text"
          placeholder="Buscar figurinha..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex-1 min-w-[180px] px-4 py-1.5 rounded-full text-sm border border-slate-200 focus:outline-none focus:border-slate-400"
        />
      </div>

      {/* Grade por seção */}
      {Object.entries(agrupadas).map(([secao, items]) => (
        <div key={secao} className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              {secao}
            </h3>
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">
              {items.filter((s) => s.owned).length}/{items.length}
            </span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {items.map((s) => (
              <StickerCard key={s.id} sticker={s} onUpdate={updateSticker} />
            ))}
          </div>
        </div>
      ))}

      {Object.keys(agrupadas).length === 0 && (
        <p className="text-center text-slate-400 py-16">
          Nenhuma figurinha encontrada para esse filtro.
        </p>
      )}
    </div>
  );
}
