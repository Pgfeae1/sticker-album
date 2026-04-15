import { createClient } from "@/lib/supabase-server";
import { StickerGrid } from "@/components/sticker/StickerGrid";
import Link from "next/link";

type Props = {
  params: Promise<{ albumId: string }>;
};

export default async function AlbumPage({ params }: Props) {
  const { albumId: userAlbumId } = await params;

  // Se for um álbum local (ID começa com "local-"), renderiza direto
  const isLocal = userAlbumId.startsWith("local-");

  let customName = "Meu álbum";

  if (!isLocal) {
    const supabase = await createClient();
    const { data: userAlbum } = await supabase
      .from("user_albums")
      .select("custom_name")
      .eq("id", userAlbumId)
      .single();

    if (!userAlbum) {
      // Álbum não encontrado no banco — pode ser local, continua normalmente
    } else {
      customName = userAlbum.custom_name;
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/albuns"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 
                    bg-white border border-slate-200 hover:border-slate-400 
                    px-3 py-1.5 rounded-full transition-all"
        >
          ← Meus álbuns
        </Link>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          {isLocal ? "Álbum local" : customName}
        </h2>
        <p className="text-slate-500 mt-1">Copa do Mundo FIFA 2026</p>
      </div>

      <StickerGrid
        userAlbumId={userAlbumId}
        albumId="a1b2c3d4-0000-0000-0000-000000000001"
        isLocal={isLocal}
      />
    </div>
  );
}
