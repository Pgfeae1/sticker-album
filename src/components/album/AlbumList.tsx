"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type UserAlbum = {
  id: string;
  custom_name: string;
  created_at: string;
};

type Props = {
  userAlbums: UserAlbum[];
  isLoggedIn: boolean;
  albumId: string;
};

export function AlbumList({ userAlbums: initial, isLoggedIn, albumId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [userAlbums, setUserAlbums] = useState<UserAlbum[]>(initial);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [newName, setNewName] = useState("");

  const atLimit = userAlbums.length >= 5;

  // Cria novo álbum pessoal
  async function handleCreate() {
    if (!isLoggedIn) {
      router.push("/registro");
      return;
    }
    if (atLimit) return;
    setShowNameModal(true);
    setNewName("Meu álbum");
  }

  async function confirmCreate() {
    setCreating(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("user_albums")
      .insert({
        user_id: user.id,
        album_id: albumId,
        custom_name: newName.trim() || "Meu álbum",
      })
      .select()
      .single();

    if (!error && data) {
      setUserAlbums((prev) => [...prev, data]);
      setShowNameModal(false);
      router.push(`/albuns/${data.id}`);
    }
    setCreating(false);
  }

  // Renomeia álbum
  async function handleRename(id: string) {
    await supabase
      .from("user_albums")
      .update({ custom_name: editName.trim() || "Meu álbum" })
      .eq("id", id);

    setUserAlbums((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, custom_name: editName.trim() || "Meu álbum" } : a,
      ),
    );
    setEditingId(null);
  }

  // Deleta álbum pessoal
  async function handleDelete(id: string) {
    if (!confirm("Tem certeza? Isso vai apagar todo o progresso desse álbum."))
      return;
    setDeleting(id);
    await supabase.from("user_albums").delete().eq("id", id);
    setUserAlbums((prev) => prev.filter((a) => a.id !== id));
    setDeleting(null);
  }

  return (
    <div>
      {/* Grid de álbuns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {userAlbums.map((ua) => (
          <div
            key={ua.id}
            className="relative bg-white border-2 border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all"
          >
            {/* Clica no card para abrir */}
            <div
              className="cursor-pointer"
              onClick={() =>
                editingId !== ua.id && router.push(`/albuns/${ua.id}`)
              }
            >
              <div className="text-4xl mb-3">📖</div>

              {/* Nome editável */}
              {editingId === ua.id ? (
                <div
                  className="flex gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(ua.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 text-sm border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:border-slate-500"
                    maxLength={40}
                  />
                  <button
                    onClick={() => handleRename(ua.id)}
                    className="text-xs bg-slate-800 text-white px-3 py-1 rounded-lg"
                  >
                    Salvar
                  </button>
                </div>
              ) : (
                <h4 className="font-bold text-slate-800 leading-tight">
                  {ua.custom_name}
                </h4>
              )}

              <p className="text-xs text-slate-400 mt-1">
                Copa do Mundo FIFA 2026
              </p>
            </div>

            {/* Ações */}
            {editingId !== ua.id && (
              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(ua.id);
                    setEditName(ua.custom_name);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
                >
                  ✏️ Renomear
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(ua.id);
                  }}
                  disabled={deleting === ua.id}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors ml-auto"
                >
                  {deleting === ua.id ? "Apagando..." : "🗑️ Apagar"}
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Card de criar novo álbum */}
        {!atLimit && (
          <button
            onClick={handleCreate}
            disabled={creating}
            className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-slate-400
              hover:border-slate-400 hover:text-slate-600 hover:bg-slate-50
              transition-all flex flex-col items-center justify-center gap-2 min-h-[160px]"
          >
            <span className="text-3xl">+</span>
            <span className="text-sm font-medium">
              {isLoggedIn ? "Novo álbum" : "Criar álbum"}
            </span>
            {!isLoggedIn && (
              <span className="text-xs text-center leading-tight">
                (cria conta gratuitamente)
              </span>
            )}
          </button>
        )}

        {/* Aviso de limite */}
        {atLimit && (
          <div
            className="border-2 border-dashed border-amber-200 rounded-xl p-5 bg-amber-50
            flex flex-col items-center justify-center gap-2 min-h-[160px]"
          >
            <span className="text-3xl">🔒</span>
            <span className="text-sm font-medium text-amber-700">
              Limite atingido
            </span>
            <span className="text-xs text-amber-600 text-center">
              Você já tem 5 álbuns. Apague um para criar outro.
            </span>
          </div>
        )}
      </div>

      {/* Modal de nome do novo álbum */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-slate-800 text-lg mb-1">
              Nome do álbum
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Dê um nome para identificar esse álbum. Ex: Meu álbum, Álbum do
              João, etc.
            </p>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmCreate();
              }}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm
                focus:outline-none focus:border-slate-500 mb-4"
              maxLength={40}
              placeholder="Meu álbum"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowNameModal(false)}
                className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2.5 text-sm hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmCreate}
                disabled={creating}
                className="flex-1 bg-slate-800 text-white rounded-xl py-2.5 text-sm hover:bg-slate-700 disabled:opacity-60"
              >
                {creating ? "Criando..." : "Criar álbum"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
