"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";

export type Sticker = {
  id: number; // Integer ID
  number: string;
  section: string;
  player_name: string | null;
  team: string | null;
  owned: boolean;
  quantity: number;
};

export type FilterType = "todas" | "possuidas" | "faltando" | "repetidas";

const LS_ALBUMS_KEY = "sticker-albums:list";

function readLocalAlbumData(userAlbumId: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(LS_ALBUMS_KEY);
    if (!raw) return {};
    const albums = JSON.parse(raw);
    const album = albums.find((a: { id: string }) => a.id === userAlbumId);
    return album?.stickers_data ?? {};
  } catch {
    return {};
  }
}

function writeLocalAlbumData(
  userAlbumId: string,
  data: Record<string, number>,
) {
  try {
    const raw = localStorage.getItem(LS_ALBUMS_KEY);
    const albums = raw ? JSON.parse(raw) : [];
    const updated = albums.map((a: { id: string }) =>
      a.id === userAlbumId ? { ...a, stickers_data: data } : a,
    );
    localStorage.setItem(LS_ALBUMS_KEY, JSON.stringify(updated));
  } catch {}
}

export function useStickers(
  userAlbumId: string,
  albumId: string,
  isLocal: boolean,
) {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Instância do cliente Supabase
  const supabase = createClient();

  const stickersDataRef = useRef<Record<string, number>>({});

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: allStickers } = await supabase
        .from("stickers")
        .select("*")
        .eq("album_id", albumId)
        .order("section")
        .order("id");

      if (!allStickers) {
        setLoading(false);
        return;
      }

      let stickersData: Record<string, number> = {};

      if (isLocal) {
        stickersData = readLocalAlbumData(userAlbumId);
      } else {
        const { data: userAlbum } = await supabase
          .from("user_albums")
          .select("stickers_data")
          .eq("id", userAlbumId)
          .single();

        stickersData = userAlbum?.stickers_data ?? {};

        const localData = readLocalAlbumData(userAlbumId);
        for (const [id, qty] of Object.entries(localData)) {
          if (!stickersData[id] || qty > stickersData[id]) {
            stickersData[id] = qty;
          }
        }
      }

      stickersDataRef.current = stickersData;

      setStickers(
        allStickers.map((s) => ({
          id: s.id, // Recebe como number do banco
          number: s.number,
          section: s.section,
          player_name: s.player_name,
          team: s.team,
          owned: (stickersData[s.id] ?? 0) > 0,
          quantity: stickersData[s.id] ?? 0,
        })),
      );

      setLoading(false);
    }

    load();
    // A adição do 'supabase' aqui causou o erro no Hot Reload.
    // O refresh (F5) resolve o problema de tamanho do array.
  }, [userAlbumId, albumId, isLocal, supabase]);

  const updateSticker = useCallback(
    (stickerId: number, action: "toggle" | "add" | "remove") => {
      setStickers((prev) => {
        const current = prev.find((s) => s.id === stickerId);
        if (!current) return prev;

        let newQty = current.quantity;
        if (action === "toggle") newQty = current.owned ? 0 : 1;
        else if (action === "add") newQty = current.quantity + 1;
        else if (action === "remove")
          newQty = Math.max(0, current.quantity - 1);

        const updated = prev.map((s) =>
          s.id === stickerId
            ? { ...s, owned: newQty > 0, quantity: newQty }
            : s,
        );

        const newData = { ...stickersDataRef.current };
        if (newQty > 0) {
          newData[stickerId] = newQty; // Number vira string no JSON automaticamente
        } else {
          delete newData[stickerId];
        }

        stickersDataRef.current = newData;
        writeLocalAlbumData(userAlbumId, newData);

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

    await supabase
      .from("user_albums")
      .update({ stickers_data: stickersDataRef.current })
      .eq("id", userAlbumId);

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);

    return "saved";
  }, [userAlbumId, supabase]);

  return {
    stickers,
    loading,
    isSaving,
    saveSuccess,
    updateSticker,
    saveToSupabase,
  };
}
