// src/components/album/AlbumList.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserAlbums } from "@/hooks/useUserAlbums";
import { SaveDialog } from "@/components/sticker/SaveDialog";

const ALBUM_ID = "a1b2c3d4-0000-0000-0000-000000000001";

export function AlbumList({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const {
    userAlbums,
    loading,
    isSyncing,
    createAlbum,
    renameAlbum,
    deleteAlbum,
    syncToSupabase,
  } = useUserAlbums(ALBUM_ID);

  const [showNameModal, setShowNameModal] = useState(false);
  const [newName, setNewName] = useState("Meu álbum");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const atLimit = userAlbums.length >= 5;
  const hasLocalAlbums = userAlbums.some((a) => a.isLocal);

  async function handleCreate() {
    setShowNameModal(true);
    setNewName("Meu álbum");
  }

  async function confirmCreate() {
    setCreating(true);
    const album = await createAlbum(newName.trim() || "Meu álbum");
    setShowNameModal(false);
    setCreating(false);
    router.push(`/albuns/${album.id}`);
  }

  async function handleRename(id: string) {
    await renameAlbum(id, editName.trim() || "Meu álbum");
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza? Isso vai apagar todo o progresso desse álbum."))
      return;
    setDeleting(id);
    await deleteAlbum(id);
    setDeleting(null);
  }

  async function handleSync() {
    const result = await syncToSupabase();
    if (result === "not-logged") setShowSaveDialog(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400 animate-pulse">Carregando álbuns...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Banner de sincronização — aparece se tiver álbuns locais e estiver logado */}
      {hasLocalAlbums && isLoggedIn && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-700">
            Você tem álbuns salvos apenas neste dispositivo.
          </p>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="text-sm font-medium bg-amber-500 text-white px-4 py-1.5 rounded-full hover:bg-amber-600 disabled:opacity-60 whitespace-nowrap"
          >
            {isSyncing ? "Sincronizando..." : "☁️ Salvar na nuvem"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {userAlbums.map((ua) => (
          <div
            key={ua.id}
            className="relative bg-white border-2 border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <div
              className="cursor-pointer"
              onClick={() =>
                editingId !== ua.id && router.push(`/albuns/${ua.id}`)
              }
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-4xl">📖</span>
                {ua.isLocal && (
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                    local
                  </span>
                )}
              </div>

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
                    Ok
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

              {/* Mini progresso */}
              <p className="text-xs text-slate-500 mt-2">
                {Object.keys(ua.stickers_data).length} figurinhas possuídas
              </p>
            </div>

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

        {/* Card criar novo */}
        {!atLimit && (
          <button
            onClick={handleCreate}
            className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-slate-400
              hover:border-slate-400 hover:text-slate-600 hover:bg-slate-50
              transition-all flex flex-col items-center justify-center gap-2 min-h-[160px]"
          >
            <span className="text-3xl">+</span>
            <span className="text-sm font-medium">Novo álbum</span>
          </button>
        )}

        {atLimit && (
          <div
            className="border-2 border-dashed border-amber-200 rounded-xl p-5 bg-amber-50
            flex flex-col items-center justify-center gap-2 min-h-[160px]"
          >
            <span className="text-3xl">🔒</span>
            <span className="text-sm font-medium text-amber-700">
              Limite de 5 atingido
            </span>
            <span className="text-xs text-amber-600 text-center">
              Apague um álbum para criar outro.
            </span>
          </div>
        )}
      </div>

      {/* Modal nome */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-slate-800 text-lg mb-1">
              Nome do álbum
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Ex: Meu álbum, Álbum do João
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
                {creating ? "Criando..." : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <SaveDialog
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
      />
    </div>
  );
}
