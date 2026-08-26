'use client';

import { FieldConfig } from '@/config/entityFields';
import { FiChevronRight } from 'react-icons/fi';

interface CrudTableProps {
  fields: FieldConfig[];
  records: Record<string, any>[];
  onEdit: (record: Record<string, any>) => void;
}

const formatDisplayDate = (value: any) => {
  if (!value) return '—';

  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

export function CrudTable({ fields, records, onEdit }: CrudTableProps) {
  const visibleFields = fields.filter((field) => !field.hiddenInList);
  const primaryField = visibleFields[0];

  const renderCellValue = (field: FieldConfig, value: any) => {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    if (field.type === 'date' || field.type === 'datetime-local') {
      return formatDisplayDate(value);
    }

    if (field.type === 'select') {
      return field.options?.find((option) => String(option.value) === String(value))?.label ?? String(value);
    }

    return String(value);
  };

  const getListValue = (field: FieldConfig, record: Record<string, any>) => (
    field.displayKey ? record[field.displayKey] : record[field.key]
  );

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-brand">
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full border-collapse text-left text-sm text-slate-700">
          <thead className="bg-brand-greenDark/5 text-slate-600">
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
                <td colSpan={visibleFields.length + 3} className="px-4 py-12 text-center text-slate-500">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              records.map((record) => {
                return (
                  <tr key={String(record.id)} className="border-t border-slate-200 transition hover:bg-slate-50">
                    <td className="hidden">{record.id}</td>
                    {visibleFields.map((field) => (
                      <td key={`${String(record.id)}-${field.key}`} className="px-4 py-3 align-top">
                        {renderCellValue(field, getListValue(field, record))}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-slate-500">
                      {formatDisplayDate(record.dataHoraAlteracao)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onEdit(record)}
                        aria-label={`Abrir ${String(record.id)}`}
                        className="ml-auto grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-brand-greenDark/10 hover:text-brand-greenDark"
                      >
                        <FiChevronRight className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {records.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Nenhum registro encontrado.
          </div>
        ) : (
          records.map((record) => {
            const secondaryFields = visibleFields.slice(1);

            return (
              <button
                key={String(record.id)}
                type="button"
                onClick={() => onEdit(record)}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-brand-greenDark/30 hover:bg-brand-greenDark/[0.03]"
              >
                <div className="min-w-0 space-y-1">
                  <p className="break-words text-sm font-semibold text-slate-900">
                    {primaryField ? renderCellValue(primaryField, getListValue(primaryField, record)) : String(record.id)}
                  </p>
                  <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 whitespace-normal text-xs text-slate-500">
                    {secondaryFields.map((field) => (
                      <span key={`${String(record.id)}-${field.key}`} className="break-words">
                        {field.label}: {renderCellValue(field, getListValue(field, record))}
                      </span>
                    ))}
                    <span>Alteração: {formatDisplayDate(record.dataHoraAlteracao)}</span>
                  </div>
                </div>

                <div className="flex items-center">
                  <FiChevronRight className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
