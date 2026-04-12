// src/app/(app)/albuns/page.tsx
import { StickerGrid } from "@/components/sticker/StickerGrid";

// ID fixo do álbum que inserimos no banco
const ALBUM_ID = "a1b2c3d4-0000-0000-0000-000000000001";

export default function AlbunsPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          Copa do Mundo FIFA 2026
        </h2>
        <p className="text-slate-500 mt-1">
          Clique em uma figurinha para marcar como possuída
        </p>
      </div>
      <StickerGrid albumId={ALBUM_ID} />
    </div>
  );
}
