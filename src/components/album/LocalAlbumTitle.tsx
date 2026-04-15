"use client";

import { useState } from "react";

const LS_ALBUMS_KEY = "sticker-albums:list";

function getLocalAlbumName(albumId: string): string {
  try {
    const raw = localStorage.getItem(LS_ALBUMS_KEY);
    if (raw) {
      const albums = JSON.parse(raw);
      const album = albums.find((a: { id: string }) => a.id === albumId);
      if (album?.custom_name) return album.custom_name;
    }
  } catch {
    // silencia erros de parse
  }
  return "Meu álbum";
}

export function LocalAlbumTitle({ albumId }: { albumId: string }) {
  const [name] = useState(() => getLocalAlbumName(albumId));

  return <h2 className="text-2xl font-bold text-slate-800">{name}</h2>;
}
