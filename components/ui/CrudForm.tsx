'use client';

import { useEffect, useState } from 'react';
import { FieldConfig } from '@/config/entityFields';
import { FiX, FiLoader } from 'react-icons/fi';
import { ErrorDialog } from '@/components/ui/ErrorDialog';

interface CrudFormProps {
  isOpen: boolean;
  title: string;
  fields: FieldConfig[];
  initialData: Record<string, any>;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  onSuccessToast?: (message: string) => void;
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
  onSuccessToast,
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
    setFormData((current) => ({ ...current, [key]: value }));
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
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar registro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
              aria-label="Fechar formulário"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
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
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                  />
                </div>
              );
            })}

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-lg border border-slate-300 px-8 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {isSubmitting ? (
                  <>
                    <FiLoader className="h-5 w-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ErrorDialog error={formError} onClose={() => setFormError(null)} />
    </>
  );
}