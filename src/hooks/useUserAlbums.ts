"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

export type UserAlbum = {
  id: string;
  custom_name: string;
  album_id: string;
  created_at: string;
  stickers_data: Record<string, number>; // { stickerId: quantity }
  isLocal: boolean; // true = só no localStorage
};

const LS_ALBUMS_KEY = "sticker-albums:list";

function readLocalAlbums(): UserAlbum[] {
  try {
    const raw = localStorage.getItem(LS_ALBUMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalAlbums(albums: UserAlbum[]) {
  localStorage.setItem(LS_ALBUMS_KEY, JSON.stringify(albums));
}

function generateLocalId() {
  return "local-" + Math.random().toString(36).slice(2, 10);
}

export function useUserAlbums(albumId: string) {
  const [userAlbums, setUserAlbums] = useState<UserAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const localAlbums = readLocalAlbums();

      if (user) {
        // Busca álbuns do banco
        const { data: remoteAlbums } = await supabase
          .from("user_albums")
          .select("*")
          .eq("user_id", user.id)
          .eq("album_id", albumId)
          .order("created_at");

        const remote: UserAlbum[] = (remoteAlbums ?? []).map((a) => ({
          id: a.id,
          custom_name: a.custom_name,
          album_id: a.album_id,
          created_at: a.created_at,
          stickers_data: a.stickers_data ?? {},
          isLocal: false,
        }));

        // Mantém álbuns locais que ainda não foram sincronizados
        const unsyncedLocal = localAlbums.filter((a) => a.isLocal);

        setUserAlbums([...remote, ...unsyncedLocal]);
      } else {
        // Não logado: só localStorage
        setUserAlbums(localAlbums);
      }

      setLoading(false);
    }

    load();
  }, [albumId]);

  // Cria novo álbum (sempre local primeiro)
  async function createAlbum(customName: string): Promise<UserAlbum> {
    const newAlbum: UserAlbum = {
      id: generateLocalId(),
      custom_name: customName,
      album_id: albumId,
      created_at: new Date().toISOString(),
      stickers_data: {},
      isLocal: true,
    };

    setUserAlbums((prev) => {
      const updated = [...prev, newAlbum];
      writeLocalAlbums(updated);
      return updated;
    });

    return newAlbum;
  }

  // Renomeia álbum
  async function renameAlbum(id: string, newName: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const album = userAlbums.find((a) => a.id === id);
    if (!album) return;

    if (!album.isLocal && user) {
      await supabase
        .from("user_albums")
        .update({ custom_name: newName })
        .eq("id", id);
    }

    setUserAlbums((prev) => {
      const updated = prev.map((a) =>
        a.id === id ? { ...a, custom_name: newName } : a,
      );
      const localOnly = updated.filter((a) => a.isLocal);
      if (localOnly.length > 0) writeLocalAlbums(updated);
      return updated;
    });
  }

  // Deleta álbum
  async function deleteAlbum(id: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const album = userAlbums.find((a) => a.id === id);
    if (!album) return;

    if (!album.isLocal && user) {
      await supabase.from("user_albums").delete().eq("id", id);
    }

    setUserAlbums((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      writeLocalAlbums(updated);
      return updated;
    });
  }

  // Sincroniza álbuns locais para o Supabase
  async function syncToSupabase(): Promise<"synced" | "not-logged"> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return "not-logged";

    setIsSyncing(true);

    const localAlbums = userAlbums.filter((a) => a.isLocal);

    const synced: UserAlbum[] = [];
    for (const album of localAlbums) {
      const { data } = await supabase
        .from("user_albums")
        .insert({
          user_id: user.id,
          album_id: album.album_id,
          custom_name: album.custom_name,
          stickers_data: album.stickers_data,
        })
        .select()
        .single();

      if (data) {
        synced.push({
          id: data.id,
          custom_name: data.custom_name,
          album_id: data.album_id,
          created_at: data.created_at,
          stickers_data: data.stickers_data ?? {},
          isLocal: false,
        });
      }
    }

    // Substitui os locais pelos remotos sincronizados
    setUserAlbums((prev) => {
      const remoteOnes = prev.filter((a) => !a.isLocal);
      const updated = [...remoteOnes, ...synced];
      // Limpa localStorage após sincronizar
      writeLocalAlbums([]);
      return updated;
    });

    setIsSyncing(false);
    return "synced";
  }

  return {
    userAlbums,
    loading,
    isSyncing,
    createAlbum,
    renameAlbum,
    deleteAlbum,
    syncToSupabase,
  };
}
