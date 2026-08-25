'use client';

import { FieldConfig } from '@/config/entityFields';
import { FiEdit2, FiTrash2, FiLoader } from 'react-icons/fi';

interface CrudTableProps {
  fields: FieldConfig[];
  records: Record<string, any>[];
  deletingId?: string | number | null;
  onEdit: (record: Record<string, any>) => void;
  onDelete: (recordId: string | number) => void;
}

// Formata strings ISO ("2026-08-24T02:34:00Z") mantendo o fuso UTC original da API
const formatDisplayDate = (value: any) => {
  if (!value) return '—';

  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);

  // Utiliza os métodos UTC para não aplicar a conversão de fuso local
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();

  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

export function CrudTable({ fields, records, deletingId, onEdit, onDelete }: CrudTableProps) {
  const visibleFields = fields.filter((field) => !field.hiddenInList);

  const renderCellValue = (field: FieldConfig, value: any) => {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    if (field.type === 'date' || field.type === 'datetime-local') {
      return formatDisplayDate(value);
    }

    return String(value);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full border-collapse text-left text-sm text-slate-700">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="hidden">ID</th>
            {visibleFields.map((field) => (
              <th key={field.key} className="px-4 py-3 font-semibold">
                {field.label}
              </th>
            ))}
            <th className="px-4 py-3 font-semibold">Alteração</th>
            <th className="px-4 py-3 text-right font-semibold">Ações</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan={visibleFields.length + 3} className="px-4 py-10 text-center text-slate-500">
                Nenhum registro encontrado.
              </td>
            </tr>
          ) : (
            records.map((record) => {
              const isDeleting = String(deletingId) === String(record.id);

              return (
                <tr key={String(record.id)} className="border-t border-slate-200 hover:bg-slate-50">
                  <td className="hidden">{record.id}</td>
                  {visibleFields.map((field) => (
                    <td key={`${String(record.id)}-${field.key}`} className="px-4 py-3">
                      {renderCellValue(field, record[field.key])}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-slate-500">
                    {formatDisplayDate(record.dataHoraAlteracao)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(record)}
                        disabled={isDeleting}
                        aria-label="Editar"
                        className="rounded-md bg-blue-50 p-2.5 text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
                      >
                        <FiEdit2 className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(record.id)}
                        disabled={isDeleting}
                        aria-label="Excluir"
                        className="inline-flex items-center justify-center rounded-md bg-red-50 p-2.5 text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <FiLoader className="h-5 w-5 animate-spin text-red-600" />
                        ) : (
                          <FiTrash2 className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}