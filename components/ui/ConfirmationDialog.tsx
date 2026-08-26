'use client';

import { FiAlertTriangle, FiX } from 'react-icons/fi';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
}

export function ConfirmationDialog({
  isOpen,
  title,
  message,
  onCancel,
  onConfirm,
  confirmLabel = 'Sim',
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
        aria-describedby="confirmation-dialog-description"
        className="w-full max-w-md rounded-3xl border border-brand-greenDark/10 bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <FiAlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="confirmation-dialog-title" className="text-xl font-bold tracking-tight text-slate-900">
              {title}
            </h2>
            <p id="confirmation-dialog-description" className="mt-2 text-sm leading-6 text-slate-600">
              {message}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Continuar na página"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-full bg-brand-greenDark px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-greenDark/90 focus:outline-none focus:ring-2 focus:ring-brand-greenDark/40 focus:ring-offset-2"
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-greenDark/30 focus:ring-offset-2"
          >
            Não
          </button>
        </div>
      </div>
    </div>
  );
}
