'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ENTITY_FIELDS, FieldConfig } from '@/config/entityFields';
import { EntityName } from '@/types/form';
import { CrudForm } from '@/components/ui/CrudForm';
import { CrudTable } from '@/components/ui/CrudTable';
import { ErrorDialog } from '@/components/ui/ErrorDialog';
import { Spinner } from '@/components/ui/Spinner';
import { ADMIN_TOKEN_STORAGE_KEY } from '@/components/ui/AdminAuthGuard';
import { BulkGroup, createRecord, deleteRecord, fetchBulkRecords, fetchRecords, syncBulkRecords, updateRecord } from '@/services/apiService';
import { DualList } from '@/components/ui/DualList';
import { Perfil } from '@/types/form';

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
  const [profiles, setProfiles] = useState<Perfil[]>([]);
  const [patientProfileGroups, setPatientProfileGroups] = useState<BulkGroup[]>([]);
  const [isProfilesLoading, setIsProfilesLoading] = useState(false);
  const [isProfilesReady, setIsProfilesReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProfileIds, setSelectedProfileIds] = useState<Array<string | number>>([]);
  const managesPatientProfiles = entity === 'PACIENTE';
  const [adminToken, setAdminToken] = useState('');

  useEffect(() => {
    setAdminToken(sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)?.trim() || '');
  }, []);

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
      if (!adminToken) {
        return;
      }

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

  useEffect(() => {
    if (!managesPatientProfiles) return;

    let isMounted = true;
    setIsProfilesLoading(true);
    setIsProfilesReady(false);
    const loadProfiles = async () => {
      try {
        const [profileData, relationGroups] = await Promise.all([
          fetchRecords<Perfil>('PERFIL', adminToken),
          fetchBulkRecords('PACIENTE_PERFIL', adminToken),
        ]);
        if (isMounted) {
          setProfiles(profileData);
          setPatientProfileGroups(relationGroups);
          setIsProfilesReady(true);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar os perfis.');
        }
      } finally {
        if (isMounted) setIsProfilesLoading(false);
      }
    };

    void loadProfiles();
    return () => {
      isMounted = false;
    };
  }, [adminToken, managesPatientProfiles]);

  const handleOpenCreate = () => {
    setEditingRecord(null);
    setSelectedProfileIds([]);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (record: Record<string, any>) => {
    setEditingRecord(record);
    setSelectedProfileIds(
      patientProfileGroups.find((group) => String(group.parentId) === String(record.id))?.items ?? [],
    );
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingRecord(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (data: Record<string, any>) => {
    setIsSaving(true);

    try {
      const normalizedData = fields.reduce<Record<string, any>>((accumulator, field) => {
        accumulator[field.key] = standardizeValue(field, data[field.key]);
        return accumulator;
      }, {});

      let savedPatient: Record<string, any>;
      if (editingRecord) {
        const updatedRecord = await updateRecord(entity, { ...normalizedData, id: editingRecord.id }, adminToken);
        savedPatient = updatedRecord;
        setRecords((current) =>
          current.map((record) => (String(record.id) === String(editingRecord.id) ? updatedRecord : record)),
        );
      } else {
        const createdRecord = await createRecord(entity, normalizedData, adminToken);
        savedPatient = createdRecord;
        setRecords((current) => [...current, createdRecord]);
      }

      if (managesPatientProfiles) {
        const patientId = savedPatient.id;
        const syncedGroup = await syncBulkRecords('PACIENTE_PERFIL', patientId, selectedProfileIds, adminToken);
        setPatientProfileGroups((current) => [
          ...current.filter((group) => String(group.parentId) !== String(patientId)),
          syncedGroup,
        ]);
      }
    } finally {
      setIsSaving(false);
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
  const isBusy = isLoading || isProfilesLoading || isSaving || deletingId !== null;

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/admin" className="mb-2 inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-800">
              ← Voltar para o painel
            </Link>
              <br />
              <div className="mb-3 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-base font-semibold uppercase tracking-[0.12em] text-blue-700">
               {title}
              </div>
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
      >
        {managesPatientProfiles ? (
          <div className="space-y-2 pt-2">
            <div>
              <h3 className="text-sm font-medium text-slate-700">Perfis do paciente</h3>
              <p className="mt-1 text-xs text-slate-500">Selecione os perfis relacionados a este paciente.</p>
            </div>
            <DualList
              items={profiles.map((profile) => ({ id: profile.id, label: profile.nomePerfil }))}
              selectedIds={selectedProfileIds}
              onChange={setSelectedProfileIds}
              isLoading={isProfilesLoading}
              isReady={isProfilesReady}
            />
          </div>
        ) : null}
      </CrudForm>

      <ErrorDialog error={error} onClose={() => setError(null)} />

      {toastMessage ? (
        <div className="fixed right-5 top-5 z-[80] rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      ) : null}

      {isBusy ? (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-slate-900/50 p-6 backdrop-blur-[2px]" role="status" aria-live="polite">
          <Spinner size="lg" className="border-white border-t-transparent" />
          <p className="text-sm font-semibold text-white">
            {isSaving || deletingId !== null ? 'Processando...' : 'Carregando dados...'}
          </p>
        </div>
      ) : null}
    </div>
  );
}