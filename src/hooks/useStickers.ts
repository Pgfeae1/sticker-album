// src/hooks/useStickers.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";

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

const LS_KEY = (userAlbumId: string) => `sticker-album:${userAlbumId}`;

function readLS(
  userAlbumId: string,
): Record<string, { owned: boolean; quantity: number }> {
  try {
    const raw = localStorage.getItem(LS_KEY(userAlbumId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLS(
  userAlbumId: string,
  data: Record<string, { owned: boolean; quantity: number }>,
) {
  localStorage.setItem(LS_KEY(userAlbumId), JSON.stringify(data));
}

export function useStickers(userAlbumId: string, albumId: string) {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      setLoading(true);

      // Lista de figurinhas do álbum (pública, igual para todos)
      const { data: allStickers } = await supabase
        .from("stickers")
        .select("*")
        .eq("album_id", albumId)
        .order("section")
        .order("sort_order");

      if (!allStickers) {
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      let statusMap: Record<string, { owned: boolean; quantity: number }> = {};

      if (user) {
        // Logado: carrega do Supabase usando o user_album_id
        const { data: userStatus } = await supabase
          .from("user_stickers")
          .select("*")
          .eq("user_album_id", userAlbumId);

        statusMap = Object.fromEntries(
          (userStatus ?? []).map((s) => [
            s.sticker_id,
            { owned: s.owned, quantity: s.quantity },
          ]),
        );

        // Mescla com localStorage se houver dados locais não salvos
        const local = readLS(userAlbumId);
        for (const [id, val] of Object.entries(local)) {
          if (!statusMap[id] || val.quantity > statusMap[id].quantity) {
            statusMap[id] = val;
          }
        }
      } else {
        // Não logado: só localStorage
        statusMap = readLS(userAlbumId);
      }

      setStickers(
        allStickers.map((s) => ({
          id: s.id,
          number: s.number,
          section: s.section,
          player_name: s.player_name,
          team: s.team,
          owned: statusMap[s.id]?.owned ?? false,
          quantity: statusMap[s.id]?.quantity ?? 0,
        })),
      );

      setLoading(false);
    }

    load();
  }, [userAlbumId, albumId]);

  const updateSticker = useCallback(
    async (stickerId: string, action: "toggle" | "add" | "remove") => {
      setStickers((prev) => {
        const current = prev.find((s) => s.id === stickerId);
        if (!current) return prev;

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

        const updated = prev.map((s) =>
          s.id === stickerId ? { ...s, owned: newOwned, quantity: newQty } : s,
        );

        // Salva snapshot no localStorage
        const snapshot: Record<string, { owned: boolean; quantity: number }> =
          {};
        updated.forEach((s) => {
          if (s.owned || s.quantity > 0)
            snapshot[s.id] = { owned: s.owned, quantity: s.quantity };
        });
        writeLS(userAlbumId, snapshot);

        return updated;
      });
    },
    [userAlbumId],
  );

  const saveToSupabase = useCallback(async (): Promise<
    "saved" | "not-logged"
  > => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return "not-logged";

    setIsSaving(true);

    const toSave = stickers
      .filter((s) => s.owned || s.quantity > 0)
      .map((s) => ({
        user_id: user.id,
        user_album_id: userAlbumId,
        sticker_id: s.id,
        owned: s.owned,
        quantity: s.quantity,
        updated_at: new Date().toISOString(),
      }));

    if (toSave.length > 0) {
      await supabase
        .from("user_stickers")
        .upsert(toSave, { onConflict: "user_album_id,sticker_id" });
    }

    localStorage.removeItem(LS_KEY(userAlbumId));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);

    return "saved";
  }, [stickers, userAlbumId, supabase]);

  return {
    stickers,
    loading,
    isSaving,
    saveSuccess,
    updateSticker,
    saveToSupabase,
  };
}
