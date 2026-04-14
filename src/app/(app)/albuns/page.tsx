import { createClient } from "@/lib/supabase-server";
import { AlbumList } from "@/components/album/AlbumList";

export default async function AlbunsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Meus álbuns</h2>
        <p className="text-slate-500 mt-1">
          {user
            ? "Seus álbuns salvos na nuvem"
            : "Crie um álbum para começar — sem precisar de conta"}
        </p>
      </div>
      <AlbumList isLoggedIn={!!user} />
    </div>
  );
}
