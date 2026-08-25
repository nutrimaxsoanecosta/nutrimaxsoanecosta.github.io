'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiCheck, FiPlus, FiRefreshCw, FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import { ENTITY_FIELDS, FieldConfig } from '@/config/entityFields';
import { EntityName } from '@/types/form';
import { CrudForm } from '@/components/ui/CrudForm';
import { CrudTable } from '@/components/ui/CrudTable';
import { ErrorDialog } from '@/components/ui/ErrorDialog';
import { Spinner } from '@/components/ui/Spinner';
import { ADMIN_TOKEN_STORAGE_KEY } from '@/components/ui/AdminAuthGuard';
import { BulkGroup, createRecord, deleteRecord, fetchBulkRecords, fetchRecords, syncBulkRecords, updateRecord } from '@/services/apiService';
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
  const [profileToAdd, setProfileToAdd] = useState('');
  const [search, setSearch] = useState('');
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
    setProfileToAdd('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (record: Record<string, any>) => {
    setEditingRecord(record);
    setSelectedProfileIds(
      patientProfileGroups.find((group) => String(group.parentId) === String(record.id))?.items ?? [],
    );
    setProfileToAdd('');
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
      if (String(editingRecord?.id) === String(recordId)) {
        handleCloseForm();
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Erro ao excluir registro.');
    } finally {
      setDeletingId(null);
    }
  };

  const formInitialData = useMemo(
    () => (editingRecord ? { ...createEmptyRecord(fields), ...editingRecord } : createEmptyRecord(fields)),
    [editingRecord, fields],
  );
  const isBusy = isLoading || isProfilesLoading || isSaving || deletingId !== null;
  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return records;
    }

    return records.filter((record) =>
      fields.some((field) => String(record[field.key] ?? '').toLowerCase().includes(term)),
    );
  }, [fields, records, search]);
  const selectedProfiles = profiles.filter((profile) =>
    selectedProfileIds.some((selectedId) => String(selectedId) === String(profile.id)),
  );
  const availableProfiles = profiles.filter((profile) =>
    !selectedProfileIds.some((selectedId) => String(selectedId) === String(profile.id)),
  );

  const handleAddProfile = () => {
    if (!profileToAdd || selectedProfileIds.some((id) => String(id) === profileToAdd)) return;
    setSelectedProfileIds((current) => [...current, profileToAdd]);
    setProfileToAdd('');
  };

  const handleRemoveProfile = (profileId: string | number) => {
    setSelectedProfileIds((current) => current.filter((id) => String(id) !== String(profileId)));
  };

  return (
    <div className={isFormOpen ? 'min-h-screen bg-brand-cream' : 'min-h-screen bg-brand-cream px-4 pb-28 pt-4 sm:px-6'}>
      {!isFormOpen ? (
      <div className="mx-auto max-w-6xl">
        <header className="mb-4 rounded-[28px] bg-white p-4 shadow-brand sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex min-w-0 items-center gap-2">
                <Link
                  href="/admin"
                  className="inline-flex shrink-0 items-center text-sm font-medium text-brand-greenDark transition hover:text-brand-greenDark/80"
                  aria-label="Voltar para o painel"
                >
                  <FiArrowLeft className="h-6 w-6" />
                </Link>
                <span className="truncate text-lg font-semibold text-slate-900">
                  {title}
                </span>
              </div>
              {description ? <p className="text-sm leading-6 text-slate-600">{description}</p> : null}
            </div>

          </div>
        </header>

        <div className="mb-4 space-y-3">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Buscar em ${title.toLowerCase()}`}
              aria-label={`Buscar em ${title.toLowerCase()}`}
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-9 pr-12 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-greenDark focus:ring-4 focus:ring-brand-greenDark/10"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Limpar busca"
                title="Limpar busca"
                className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <FiX className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="flex items-center justify-between px-1 text-sm text-slate-600">
            <span>{filteredRecords.length} registros</span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <FiRefreshCw className="h-3.5 w-3.5" />
              Recarregar
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-[28px] border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
            <div className="flex items-center gap-3">
              <Spinner size="sm" className="border-brand-greenDark border-t-transparent" />
              <p className="font-medium">Carregando registros...</p>
            </div>
          </div>
        ) : (
          <CrudTable
            fields={fields}
            records={filteredRecords}
            onEdit={handleOpenEdit}
          />
        )}
      </div>
      ) : null}

      {!isFormOpen ? (
        <button
          type="button"
          onClick={handleOpenCreate}
          aria-label="Novo registro"
          title="Novo registro"
          className="fixed bottom-6 right-5 z-20 grid h-14 w-14 place-items-center rounded-full bg-brand-greenDark text-white shadow-lg transition hover:bg-brand-greenDark/90 active:scale-95 sm:bottom-8 sm:right-8"
        >
          <FiPlus className="h-6 w-6" aria-hidden="true" />
        </button>
      ) : null}

      <CrudForm
        isOpen={isFormOpen}
        title={editingRecord ? `Editar ${title}` : `Novo ${title}`}
        fields={fields}
        initialData={formInitialData}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        onDelete={editingRecord ? () => void handleDelete(editingRecord.id) : undefined}
        onSuccessToast={showToast}
      >
        {managesPatientProfiles ? (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-brand-cream/40 p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <h3 className="truncate text-sm font-semibold uppercase tracking-wide text-slate-700">Perfis</h3>
              <span className="shrink-0 text-xs text-slate-500">{selectedProfiles.length} itens</span>
            </div>

            <div className="flex gap-2">
              <select
                value={profileToAdd}
                onChange={(event) => setProfileToAdd(event.target.value)}
                disabled={isProfilesLoading || !isProfilesReady || availableProfiles.length === 0}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-greenDark focus:ring-4 focus:ring-brand-greenDark/10 disabled:bg-slate-100"
              >
                <option value="">Selecionar perfil</option>
                {availableProfiles.map((profile) => (
                  <option key={String(profile.id)} value={String(profile.id)}>
                    {profile.nomePerfil}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddProfile}
                disabled={!profileToAdd || isProfilesLoading}
                aria-label="Adicionar perfil"
                title="Adicionar perfil"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-greenDark text-white transition hover:bg-brand-greenDark/90 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                <FiPlus className="h-5 w-5" />
              </button>
            </div>

            <ul className="space-y-3">
              {isProfilesLoading || !isProfilesReady ? (
                <li className="py-6 text-center text-sm text-slate-500">Carregando perfis...</li>
              ) : selectedProfiles.length === 0 ? (
                <li className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  Nenhum perfil adicionado.
                </li>
              ) : (
                selectedProfiles.map((profile) => (
                  <li key={String(profile.id)} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-brand-greenDark bg-brand-greenDark text-white">
                        <FiCheck className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 break-words text-sm font-medium text-slate-800">{profile.nomePerfil}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveProfile(profile.id)}
                        aria-label={`Remover perfil ${profile.nomePerfil}`}
                        title="Remover perfil"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : null}
      </CrudForm>

      <ErrorDialog error={error} onClose={() => setError(null)} />

      {toastMessage ? (
        <div className="fixed right-4 top-5 z-[80] rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {toastMessage}
        </div>
      ) : null}

      {isBusy ? (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-slate-900/55 p-6 backdrop-blur-[2px]" role="status" aria-live="polite">
          <Spinner size="lg" className="border-white border-t-transparent" />
          <p className="text-sm font-semibold text-white">
            {isSaving || deletingId !== null ? 'Processando...' : 'Carregando dados...'}
          </p>
        </div>
      ) : null}
    </div>
  );
}