import { createClient } from "@/lib/supabase-server";
import { AlbumList } from "@/components/album/AlbumList";

const ALBUM_ID = "a1b2c3d4-0000-0000-0000-000000000001";

export default async function AlbunsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Busca as cópias pessoais do usuário logado
  let userAlbums: { id: string; custom_name: string; created_at: string }[] =
    [];
  if (user) {
    const { data } = await supabase
      .from("user_albums")
      .select("id, custom_name, created_at")
      .eq("user_id", user.id)
      .eq("album_id", ALBUM_ID)
      .order("created_at");

    userAlbums = data ?? [];
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Meus álbuns</h2>
        <p className="text-slate-500 mt-1">
          {user
            ? `${userAlbums.length}/5 álbuns criados`
            : "Crie um álbum para começar a marcar suas figurinhas"}
        </p>
      </div>

      <AlbumList
        userAlbums={userAlbums}
        isLoggedIn={!!user}
        albumId={ALBUM_ID}
      />
    </div>
  );
}
