// src/app/(app)/albuns/[albumId]/page.tsx
import { createClient } from "@/lib/supabase-server";
import { StickerGrid } from "@/components/sticker/StickerGrid";
import { notFound } from "next/navigation";
import Link from "next/link";

type Props = {
  params: Promise<{ albumId: string }>;
};

export default async function AlbumPage({ params }: Props) {
  const { albumId: userAlbumId } = await params;
  const supabase = await createClient();

  // Busca o álbum pessoal e junto o álbum base
  const { data: userAlbum } = await supabase
    .from("user_albums")
    .select("*, albums(name, year)")
    .eq("id", userAlbumId)
    .single();

  if (!userAlbum) notFound();

  const albumBase = userAlbum.albums as { name: string; year: number };

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/albuns" className="hover:text-slate-800 transition-colors">
          Meus álbuns
        </Link>
        <span>›</span>
        <span className="text-slate-800 font-medium">
          {userAlbum.custom_name}
        </span>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          {userAlbum.custom_name}
        </h2>
        <p className="text-slate-500 mt-1">
          {albumBase.name} · {albumBase.year}
        </p>
      </div>

      <StickerGrid
        userAlbumId={userAlbumId}
        albumId="a1b2c3d4-0000-0000-0000-000000000001"
      />
    </div>
  );
}
