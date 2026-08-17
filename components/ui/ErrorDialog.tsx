'use client';

import { FiX } from 'react-icons/fi';

interface ErrorDialogProps {
  error: string | null;
  onClose: () => void;
}

export function ErrorDialog({ error, onClose }: ErrorDialogProps) {
  if (!error) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="error-dialog-title"
        aria-describedby="error-dialog-description"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-red-100"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-xl font-bold text-red-600"
            aria-hidden="true"
          >
            !
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="error-dialog-title" className="text-xl font-bold text-slate-900">
              Não foi possível concluir
            </h2>
            <p id="error-dialog-description" className="mt-2 break-words text-sm leading-6 text-slate-600">
              {error}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar mensagem de erro"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}