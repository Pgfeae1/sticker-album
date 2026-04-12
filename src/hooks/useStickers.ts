"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";

// Tipos que representam os dados
export type Sticker = {
  id: string;
  number: string;
  section: string;
  player_name: string | null;
  team: string | null;
  owned: boolean;
  quantity: number;
};

export type FilterType = "todas" | "possuidas" | "faltando" | "repetidas";

export function useStickers(albumId: string) {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Busca todas as figurinhas do álbum
      const { data: allStickers } = await supabase
        .from("stickers")
        .select("*")
        .eq("album_id", albumId)
        .order("section")
        .order("sort_order");

      // Busca o status do usuário para esse álbum
      const { data: userStatus } = await supabase
        .from("user_stickers")
        .select("*")
        .eq("user_id", user.id);

      // Junta os dois: para cada figurinha, anexa o status do usuário
      const statusMap = new Map(
        userStatus?.map((s) => [s.sticker_id, s]) ?? [],
      );

      const merged: Sticker[] = (allStickers ?? []).map((s) => ({
        id: s.id,
        number: s.number,
        section: s.section,
        player_name: s.player_name,
        team: s.team,
        owned: statusMap.get(s.id)?.owned ?? false,
        quantity: statusMap.get(s.id)?.quantity ?? 0,
      }));

      setStickers(merged);
      setLoading(false);
    }

    load();
  }, [albumId]);

  // Função para marcar/desmarcar ou adicionar repetidas
  const updateSticker = useCallback(
    async (stickerId: string, action: "toggle" | "add" | "remove") => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const current = stickers.find((s) => s.id === stickerId);
      if (!current) return;

      let newOwned = current.owned;
      let newQty = current.quantity;

      if (action === "toggle") {
        newOwned = !current.owned;
        newQty = newOwned ? 1 : 0;
      } else if (action === "add") {
        newOwned = true;
        newQty = current.quantity + 1;
      } else if (action === "remove") {
        newQty = Math.max(0, current.quantity - 1);
        newOwned = newQty > 0;
      }

      // Upsert = insere se não existe, atualiza se já existe
      await supabase.from("user_stickers").upsert(
        {
          user_id: user.id,
          sticker_id: stickerId,
          owned: newOwned,
          quantity: newQty,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,sticker_id" },
      );

      // Atualiza o estado local imediatamente (sem precisar recarregar a página)
      setStickers((prev) =>
        prev.map((s) =>
          s.id === stickerId ? { ...s, owned: newOwned, quantity: newQty } : s,
        ),
      );
    },
    [stickers, supabase],
  );

  return { stickers, loading, updateSticker };
}
