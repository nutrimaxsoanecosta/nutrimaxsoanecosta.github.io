'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ENTITY_FIELDS, FieldConfig } from '@/config/entityFields';
import { EntityName } from '@/types/form';
import { CrudForm } from '@/components/ui/CrudForm';
import { CrudTable } from '@/components/ui/CrudTable';
import { ErrorDialog } from '@/components/ui/ErrorDialog';
import { createRecord, deleteRecord, fetchRecords, updateRecord } from '@/services/apiService';

interface EntityResourcePageProps {
  entity: EntityName;
  title: string;
  description?: string;
}

const standardizeValue = (field: FieldConfig, value: any) => {
  const isRequired = field.required !== false;

  if (value === '' || value === null || value === undefined) {
    if (!isRequired) {
      return null;
    }
  }

  if (field.type === 'number') {
    return value === '' || value === null || value === undefined ? 0 : Number(value);
  }

  if (field.type === 'select') {
    return value === '' || value === null || value === undefined ? (field.options?.[0]?.value ?? '') : value;
  }

  // Adiciona o sufixo UTC ('Z') aos campos de data
  if (field.type === 'datetime-local' && value) {
    const strVal = String(value).trim();
    if (strVal.length === 16) {
      return `${strVal}:00Z`;
    }
    if (strVal.length === 19 && !strVal.endsWith('Z')) {
      return `${strVal}Z`;
    }
  }

  if (field.type === 'date' && value) {
    const strVal = String(value).trim();
    if (!strVal.includes('T')) {
      return `${strVal}T00:00:00Z`;
    }
  }

  return value ?? '';
};

const createEmptyRecord = (fields: FieldConfig[]) => {
  return fields.reduce<Record<string, any>>((accumulator, field) => {
    accumulator[field.key] = standardizeValue(field, '');
    return accumulator;
  }, {});
};

export function EntityResourcePage({ entity, title, description }: EntityResourcePageProps) {
  const fields = useMemo(() => ENTITY_FIELDS[entity] ?? [], [entity]);
  const [records, setRecords] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record<string, any> | null>(null);
  const adminToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN || '';

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadRecords = async () => {
      setIsLoading(true);
      setError(null);

      const timeoutId = setTimeout(() => controller.abort(), 12000);

      try {
        const data = await fetchRecords<Record<string, any>>(entity, adminToken, controller.signal);
        clearTimeout(timeoutId);

        if (isMounted) {
          setRecords(Array.isArray(data) ? data : []);
        }
      } catch (loadError: any) {
        clearTimeout(timeoutId);
        if (isMounted) {
          if (loadError?.name === 'AbortError') {
            setError('A conexão demorou muito para responder. Verifique sua rede móvel e recarregue a página.');
          } else {
            setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar registros.');
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadRecords();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [entity, adminToken]);

  const handleOpenCreate = () => {
    setEditingRecord(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (record: Record<string, any>) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingRecord(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (data: Record<string, any>) => {
    const normalizedData = fields.reduce<Record<string, any>>((accumulator, field) => {
      accumulator[field.key] = standardizeValue(field, data[field.key]);
      return accumulator;
    }, {});

    if (editingRecord) {
      const updatedRecord = await updateRecord(entity, { ...normalizedData, id: editingRecord.id }, adminToken);
      setRecords((current) =>
        current.map((record) => (String(record.id) === String(editingRecord.id) ? updatedRecord : record)),
      );
    } else {
      const createdRecord = await createRecord(entity, normalizedData, adminToken);
      setRecords((current) => [...current, createdRecord]);
    }
  };

  const handleDelete = async (recordId: string | number) => {
    const shouldDelete = window.confirm('Deseja realmente excluir este registro?');
    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingId(recordId);
      setError(null);
      await deleteRecord(entity, recordId, adminToken);
      setRecords((current) => current.filter((record) => String(record.id) !== String(recordId)));
      showToast('Registro excluído com sucesso!');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Erro ao excluir registro.');
    } finally {
      setDeletingId(null);
    }
  };

  const formInitialData = editingRecord
    ? { ...createEmptyRecord(fields), ...editingRecord }
    : createEmptyRecord(fields);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/admin" className="mb-2 inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-800">
              ← Voltar para o painel
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
            {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Novo registro
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
            <p>Carregando registros...</p>
          </div>
        ) : (
          <CrudTable
            fields={fields}
            records={records}
            deletingId={deletingId}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      <CrudForm
        isOpen={isFormOpen}
        title={editingRecord ? `Editar ${title}` : `Novo ${title}`}
        fields={fields}
        initialData={formInitialData}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        onSuccessToast={showToast}
      />

      <ErrorDialog error={error} onClose={() => setError(null)} />

      {toastMessage ? (
        <div className="fixed bottom-5 right-5 z-[80] rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}