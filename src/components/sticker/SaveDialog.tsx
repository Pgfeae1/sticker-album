"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SaveDialog({ open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Crie uma conta para salvar</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 pt-1">
              <p>
                Seu progresso está salvo neste navegador, mas para acessá-lo em
                outros dispositivos você precisa de uma conta.
              </p>
              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 space-y-1">
                <p>✓ Acesse seu álbum em qualquer dispositivo</p>
                <p>✓ Seu progresso nunca se perde</p>
                <p>✓ Gratuito para sempre</p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-2">
          <Button asChild className="w-full">
            <Link href="/registro" onClick={onClose}>
              Criar conta gratuita
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login" onClick={onClose}>
              Já tenho conta — fazer login
            </Link>
          </Button>
          <button
            onClick={onClose}
            className="text-sm text-slate-400 hover:text-slate-600 text-center mt-1"
          >
            Continuar sem conta
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
