"use client";

import { useState } from "react";
import type { Sticker } from "@/hooks/useStickers";

type Props = {
  sticker: Sticker;
  onUpdate: (
    id: number,
    action: "toggle" | "add" | "remove",
  ) => void | Promise<void>;
};

export function StickerCard({ sticker, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);

  async function handle(
    action: "toggle" | "add" | "remove",
    e?: React.MouseEvent,
  ) {
    e?.stopPropagation();
    setLoading(true);
    await onUpdate(sticker.id, action);
    setLoading(false);
  }

  return (
    <div
      onClick={() => handle("toggle")}
      className={`
        relative rounded-xl border-2 p-2 cursor-pointer select-none
        transition-colors duration-150
        flex flex-col
        ${
          sticker.owned
            ? "bg-green-50 border-green-400"
            : "bg-white border-slate-200 opacity-50 hover:opacity-75"
        }
        ${loading ? "pointer-events-none" : ""}
      `}
    >
      {/* Número */}
      <p className="text-[10px] font-mono font-bold text-slate-400 leading-none">
        {sticker.number}
      </p>

      {/* Nome — clamp 2 linhas, altura mínima fixa para consistência */}
      <p className="text-xs font-medium text-slate-700 mt-1 leading-tight line-clamp-2 min-h-[2rem] flex-1">
        {sticker.player_name ?? sticker.section}
      </p>

      {/* Badge de repetidas */}
      {sticker.quantity > 1 && (
        <span className="absolute top-1 right-1 bg-blue-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {sticker.quantity}
        </span>
      )}

      {/* Controles — SEMPRE renderizados para manter altura constante.
          Quando não possuída: invisible (ocupa espaço mas não aparece).
          Quando possuída: visível com borda verde. */}
      <div
        className={`flex items-center justify-between mt-2 pt-1 border-t ${
          sticker.owned ? "border-green-200" : "border-transparent invisible"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => handle("remove", e)}
          className="w-5 h-5 rounded text-slate-500 hover:bg-slate-100 text-xs font-bold flex items-center justify-center"
        >
          −
        </button>
        <span className="text-[11px] text-slate-500">{sticker.quantity}×</span>
        <button
          onClick={(e) => handle("add", e)}
          className="w-5 h-5 rounded text-slate-500 hover:bg-slate-100 text-xs font-bold flex items-center justify-center"
        >
          +
        </button>
      </div>
    </div>
  );
}
