'use client';

import { ReactNode, useEffect, useState } from 'react';
import { FieldConfig } from '@/config/entityFields';
import { FiArrowLeft, FiLoader, FiTrash2 } from 'react-icons/fi';
import { ErrorDialog } from '@/components/ui/ErrorDialog';

interface CrudFormProps {
  isOpen: boolean;
  title: string;
  fields: FieldConfig[];
  initialData: Record<string, any>;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  onDelete?: () => void;
  onSuccessToast?: (message: string) => void;
  onDataChange?: (data: Record<string, any>) => void;
  reloadOnSuccess?: boolean;
  presentation?: 'page' | 'modal';
  children?: ReactNode;
}

const formatValueForInput = (type: string, value: any) => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (type === 'date') {
    const dateStr = String(value);
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0];
    }
    return dateStr;
  }

  if (type === 'datetime-local') {
    const dateStr = String(value);
    if (dateStr.includes('T')) {
      const [datePart, timePart] = dateStr.split('T');
      return `${datePart}T${timePart.slice(0, 5)}`;
    }
    return dateStr;
  }

  return value;
};

export function CrudForm({
  isOpen,
  title,
  fields,
  initialData,
  onClose,
  onSubmit,
  onDelete,
  onSuccessToast,
  onDataChange,
  reloadOnSuccess = false,
  presentation = 'page',
  children,
}: CrudFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(initialData);
    setFormError(null);
    setIsSubmitting(false);
  }, [initialData, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleFieldChange = (key: string, value: string | number) => {
    setFormData((current) => {
      const nextData = { ...current, [key]: value };
      onDataChange?.(nextData);
      return nextData;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      await onSubmit(formData);
      if (onSuccessToast) {
        onSuccessToast('Registro salvo com sucesso!');
      }
      onClose();
      if (reloadOnSuccess) {
        window.location.reload();
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar registro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className={presentation === 'modal' ? 'fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/55 p-3 sm:p-6' : 'min-h-screen bg-brand-cream'}>
        <div className={presentation === 'modal' ? 'max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-brand' : 'min-h-screen w-full bg-white shadow-sm'}>
          <header className="sticky top-0 z-10 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="grid h-10 w-10 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              aria-label="Voltar"
            >
              <FiArrowLeft className="h-6 w-6" />
            </button>
            <h2 className="min-w-0 truncate text-center text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{title}</h2>
            <div className="flex shrink-0 items-center">
              {onDelete ? (
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={isSubmitting}
                  className="grid h-10 w-10 place-items-center rounded-full text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  aria-label="Excluir registro"
                >
                  <FiTrash2 className="h-6 w-6" />
                </button>
              ) : null}
            </div>
          </header>

          <form onSubmit={handleSubmit} className={`space-y-4 px-4 pb-40 pt-4 sm:px-8 sm:pb-6 sm:pt-6 ${presentation === 'modal' ? 'sm:pb-6' : ''}`}>
            {fields.map((field) => {
              const rawValue = formData[field.key] ?? '';
              const value = formatValueForInput(field.type, rawValue);
              const isRequired = field.required !== false;

              if (field.type === 'select') {
                return (
                  <div key={field.key} className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      {field.label}
                      {isRequired ? <span className="ml-1 text-red-500">*</span> : null}
                    </label>
                    <select
                      value={value}
                      required={isRequired}
                      disabled={isSubmitting}
                      onChange={(event) => handleFieldChange(field.key, event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-brand-cream/40 px-3 py-3 text-slate-800 outline-none transition focus:border-brand-greenDark focus:ring-4 focus:ring-brand-greenDark/10 disabled:bg-slate-100"
                    >
                      {field.options?.map((option) => (
                        <option key={String(option.value)} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              if (field.type === 'textarea') {
                return (
                  <div key={field.key} className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      {field.label}
                      {isRequired ? <span className="ml-1 text-red-500">*</span> : null}
                    </label>
                    <textarea
                      value={value}
                      required={isRequired}
                      disabled={isSubmitting}
                      onChange={(event) => handleFieldChange(field.key, event.target.value)}
                      className="min-h-28 w-full resize-y rounded-2xl border border-slate-200 bg-brand-cream/40 px-3 py-3 text-slate-800 outline-none transition focus:border-brand-greenDark focus:ring-4 focus:ring-brand-greenDark/10 disabled:bg-slate-100 md:min-h-24"
                    />
                  </div>
                );
              }

              return (
                <div key={field.key} className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    {field.label}
                    {isRequired ? <span className="ml-1 text-red-500">*</span> : null}
                  </label>
                  <input
                    type={field.type}
                    value={value}
                    required={isRequired}
                    disabled={isSubmitting}
                    onChange={(event) => {
                      const nextValue = field.type === 'number' ? Number(event.target.value) : event.target.value;
                      handleFieldChange(field.key, nextValue);
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-brand-cream/40 px-3 py-3 text-slate-800 outline-none transition focus:border-brand-greenDark focus:ring-4 focus:ring-brand-greenDark/10 disabled:bg-slate-100"
                  />
                </div>
              );
            })}

            {children}

            <div className={presentation === 'modal' ? 'sticky bottom-0 z-20 -mx-4 border-t border-slate-200 bg-white px-4 pb-4 pt-3 sm:-mx-8 sm:px-8' : 'fixed inset-x-0 bottom-0 z-[60] border-t border-slate-200 bg-white px-4 pb-4 pt-3 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] sm:static sm:z-auto sm:-mx-8 sm:px-8 sm:pb-0 sm:pt-4 sm:shadow-none'}>
              <div className="mx-auto flex w-full max-w-2xl justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-greenDark px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-greenDark/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <FiLoader className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <ErrorDialog error={formError} onClose={() => setFormError(null)} />
    </>
  );
}