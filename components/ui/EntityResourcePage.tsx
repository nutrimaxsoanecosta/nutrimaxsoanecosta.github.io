'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiCheck, FiCopy, FiPlus, FiRefreshCw, FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import { ENTITY_FIELDS, FieldConfig } from '@/config/entityFields';
import { EntityName } from '@/types/form';
import { CrudForm } from '@/components/ui/CrudForm';
import { CrudTable } from '@/components/ui/CrudTable';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { ErrorDialog } from '@/components/ui/ErrorDialog';
import { Spinner } from '@/components/ui/Spinner';
import { ADMIN_TOKEN_STORAGE_KEY } from '@/components/ui/AdminAuthGuard';
import { BulkGroup, createRecord, deleteRecord, fetchBulkRecords, fetchRecords, syncBulkRecords, updateRecord } from '@/services/apiService';
import { Categoria, Paciente, Perfil, Resposta } from '@/types/form';

interface EntityResourcePageProps {
  entity: EntityName;
  title: string;
  description?: string;
}

// Browser-compatible UUID v4 generator
const generateUUID = (): string => {
  const arr = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(arr);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < 16; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
  }
  arr[6] = (arr[6] & 0x0f) | 0x40; // version 4
  arr[8] = (arr[8] & 0x3f) | 0x80; // variant 1
  const hex = Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

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
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [patients, setPatients] = useState<Paciente[]>([]);
  const [patientProfileGroups, setPatientProfileGroups] = useState<BulkGroup[]>([]);
  const [profileQuestionGroups, setProfileQuestionGroups] = useState<BulkGroup[]>([]);
  const [categoryQuestionGroups, setCategoryQuestionGroups] = useState<BulkGroup[]>([]);
  const [formCategoryGroups, setFormCategoryGroups] = useState<BulkGroup[]>([]);
  const [questionResponseGroups, setQuestionResponseGroups] = useState<BulkGroup<Resposta>[]>([]);
  const [isProfilesLoading, setIsProfilesLoading] = useState(false);
  const [isProfilesReady, setIsProfilesReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProfileIds, setSelectedProfileIds] = useState<Array<string | number>>([]);
  const [selectedQuestionProfileIds, setSelectedQuestionProfileIds] = useState<Array<string | number>>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Array<string | number>>([]);
  const [selectedFormCategoryIds, setSelectedFormCategoryIds] = useState<Array<string | number>>([]);
  const [questionProfileToAdd, setQuestionProfileToAdd] = useState('');
  const [categoryToAdd, setCategoryToAdd] = useState('');
  const [formCategoryToAdd, setFormCategoryToAdd] = useState('');
  const [responses, setResponses] = useState<Resposta[]>([]);
  const [isResponseFormOpen, setIsResponseFormOpen] = useState(false);
  const [deletionCandidate, setDeletionCandidate] = useState<string | number | null>(null);
  const [editingResponse, setEditingResponse] = useState<Resposta | null>(null);
  const [questionType, setQuestionType] = useState(1);
  const [profileToAdd, setProfileToAdd] = useState('');
  const [search, setSearch] = useState('');
  const [isPatientUrlCopied, setIsPatientUrlCopied] = useState(false);
  const managesPatientProfiles = entity === 'PACIENTE';
  const managesQuestionRelations = entity === 'PERGUNTA';
  const managesFormularios = entity === 'FORMULARIO';
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
    if (!managesPatientProfiles && !managesQuestionRelations && !managesFormularios) return;

    let isMounted = true;
    setIsProfilesLoading(true);
    setIsProfilesReady(false);
    const loadProfiles = async () => {
      try {
        const [profileData, categoryData, patientData, patientGroups, profileGroups, categoryGroups, formCategories, responseGroups] = await Promise.all([
          fetchRecords<Perfil>('PERFIL', adminToken),
          fetchRecords<Categoria>('CATEGORIA', adminToken),
          managesFormularios ? fetchRecords<Paciente>('PACIENTE', adminToken) : Promise.resolve([]),
          managesPatientProfiles ? fetchBulkRecords('PACIENTE_PERFIL', adminToken) : Promise.resolve([]),
          managesQuestionRelations ? fetchBulkRecords('PERFIL_PERGUNTA', adminToken) : Promise.resolve([]),
          managesQuestionRelations ? fetchBulkRecords('CATEGORIA_PERGUNTA', adminToken) : Promise.resolve([]),
          managesFormularios ? fetchBulkRecords('FORMULARIO_CATEGORIA', adminToken) : Promise.resolve([]),
          managesQuestionRelations ? fetchBulkRecords<Resposta>('RESPOSTA', adminToken) : Promise.resolve([]),
        ]);
        if (isMounted) {
          setProfiles(profileData);
          setCategories(categoryData);
          setPatients(patientData);
          setPatientProfileGroups(patientGroups);
          setProfileQuestionGroups(profileGroups);
          setCategoryQuestionGroups(categoryGroups);
          setFormCategoryGroups(formCategories);
          setQuestionResponseGroups(responseGroups);
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
  }, [adminToken, managesFormularios, managesPatientProfiles, managesQuestionRelations]);

  const handleOpenCreate = () => {
    setEditingRecord(null);
    setSelectedProfileIds([]);
    setProfileToAdd('');
    setSelectedQuestionProfileIds([]);
    setSelectedCategoryIds([]);
    setSelectedFormCategoryIds([]);
    setQuestionProfileToAdd('');
    setCategoryToAdd('');
    setFormCategoryToAdd('');
    setResponses([]);
    setQuestionType(1);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (record: Record<string, any>) => {
    setEditingRecord(record);
    setSelectedProfileIds(
      patientProfileGroups.find((group) => String(group.parentId) === String(record.id))?.items ?? [],
    );
    setSelectedQuestionProfileIds(
      profileQuestionGroups.find((group) => String(group.parentId) === String(record.id))?.items ?? [],
    );
    setSelectedCategoryIds(
      categoryQuestionGroups.find((group) => String(group.parentId) === String(record.id))?.items ?? [],
    );
    setSelectedFormCategoryIds(
      formCategoryGroups.find((group) => String(group.parentId) === String(record.id))?.items ?? [],
    );
    setProfileToAdd('');
    setQuestionProfileToAdd('');
    setCategoryToAdd('');
    setFormCategoryToAdd('');
    setResponses(
      questionResponseGroups.find((group) => String(group.parentId) === String(record.id))?.items ?? [],
    );
    setQuestionType(Number(record.tipoPergunta) || 1);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingRecord(null);
    setIsFormOpen(false);
    setIsPatientUrlCopied(false);
  };

  const patientQuestionnaireUrl = editingRecord && (managesPatientProfiles || managesFormularios)
    ? `${window.location.origin}/questionario?pacienteId=${encodeURIComponent(String(managesPatientProfiles ? editingRecord.id : editingRecord.idPaciente))}`
    : '';

  const handleCopyPatientQuestionnaireUrl = async () => {
    if (!patientQuestionnaireUrl) return;

    await navigator.clipboard.writeText(patientQuestionnaireUrl);
    setIsPatientUrlCopied(true);
    window.setTimeout(() => setIsPatientUrlCopied(false), 2000);
  };

  const handleSubmit = async (data: Record<string, any>) => {
    if (managesFormularios && selectedFormCategoryIds.length === 0) {
      throw new Error('Adicione pelo menos uma categoria ao formulário.');
    }

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

      if (managesQuestionRelations) {
        const syncRelations = async (relationEntity: 'PERFIL_PERGUNTA' | 'CATEGORIA_PERGUNTA', groups: BulkGroup[], selectedParentIds: Array<string | number>) => {
          const currentGroup = groups.find((group) => String(group.parentId) === String(savedPatient.id));
          const currentItems = currentGroup?.items ?? [];
          const selectedItems = new Set(selectedParentIds.map(String));
          const nextItems = [
            ...currentItems.filter((item) => selectedItems.has(String(item))),
            ...selectedParentIds.filter((item) => !currentItems.some((currentItem) => String(currentItem) === String(item))),
          ];

          await syncBulkRecords(relationEntity, savedPatient.id, nextItems, adminToken);
        };

        await Promise.all([
          syncRelations('PERFIL_PERGUNTA', profileQuestionGroups, selectedQuestionProfileIds),
          syncRelations('CATEGORIA_PERGUNTA', categoryQuestionGroups, selectedCategoryIds),
        ]);

        const questionId = savedPatient.id;
        await syncBulkRecords<Resposta>('RESPOSTA', questionId, questionType === 3 ? [] : responses, adminToken);
      }

      if (managesFormularios) {
        const formId = savedPatient.id;
        const syncedGroup = await syncBulkRecords('FORMULARIO_CATEGORIA', formId, selectedFormCategoryIds, adminToken);
        setFormCategoryGroups((current) => [
          ...current.filter((group) => String(group.parentId) !== String(formId)),
          syncedGroup,
        ]);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (recordId: string | number) => {
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
      setDeletionCandidate(null);
    }
  };

  const requestDelete = (recordId: string | number) => {
    setDeletionCandidate(recordId);
  };

  const formInitialData = useMemo(
    () => (editingRecord ? { ...createEmptyRecord(fields), ...editingRecord } : createEmptyRecord(fields)),
    [editingRecord, fields],
  );
  const formFields = useMemo(() => {
    if (!managesFormularios) {
      return fields;
    }

    return fields.map((field) => field.key === 'idPaciente' ? {
      ...field,
      type: 'select' as const,
      required: true,
      disabled: Boolean(editingRecord),
      options: patients.map((patient) => ({
        label: patient.nomePaciente,
        value: String(patient.id),
      })),
    } : field);
  }, [editingRecord, fields, managesFormularios, patients]);
  const isBusy = isLoading || isProfilesLoading || isSaving || deletingId !== null;
  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return records;
    }

    return records.filter((record) => {
      const matchesField = fields.some((field) => String(record[field.key] ?? '').toLowerCase().includes(term));
      const patientName = managesFormularios
        ? patients.find((patient) => String(patient.id) === String(record.idPaciente))?.nomePaciente ?? ''
        : '';

      return matchesField || patientName.toLowerCase().includes(term);
    });
  }, [fields, managesFormularios, patients, records, search]);
  const recordsForList = useMemo(() => {
    if (!managesFormularios) {
      return filteredRecords;
    }

    return filteredRecords.map((record) => ({
      ...record,
      nomePaciente: patients.find((patient) => String(patient.id) === String(record.idPaciente))?.nomePaciente ?? 'Paciente não encontrado',
    }));
  }, [filteredRecords, managesFormularios, patients]);
  const selectedProfiles = profiles.filter((profile) =>
    selectedProfileIds.some((selectedId) => String(selectedId) === String(profile.id)),
  );
  const availableQuestionProfiles = profiles.filter((profile) =>
    !selectedQuestionProfileIds.some((selectedId) => String(selectedId) === String(profile.id)),
  );
  const availableCategories = categories.filter((category) =>
    !selectedCategoryIds.some((selectedId) => String(selectedId) === String(category.id)),
  );
  const availableFormCategories = categories.filter((category) =>
    !selectedFormCategoryIds.some((selectedId) => String(selectedId) === String(category.id)),
  );
  const selectedQuestionProfiles = profiles.filter((profile) =>
    selectedQuestionProfileIds.some((selectedId) => String(selectedId) === String(profile.id)),
  );
  const selectedCategories = categories.filter((category) =>
    selectedCategoryIds.some((selectedId) => String(selectedId) === String(category.id)),
  );
  const selectedFormCategories = categories.filter((category) =>
    selectedFormCategoryIds.some((selectedId) => String(selectedId) === String(category.id)),
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

  const addQuestionProfile = (profileId: string) => {
    if (!profileId) return;
    setSelectedQuestionProfileIds((current) => [...current, profileId]);
    setQuestionProfileToAdd('');
  };

  const addCategory = (categoryId: string) => {
    if (!categoryId) return;
    setSelectedCategoryIds((current) => [...current, categoryId]);
    setCategoryToAdd('');
  };

  const removeQuestionProfile = (profileId: string | number) => {
    setSelectedQuestionProfileIds((current) => current.filter((id) => String(id) !== String(profileId)));
  };

  const removeCategory = (categoryId: string | number) => {
    setSelectedCategoryIds((current) => current.filter((id) => String(id) !== String(categoryId)));
  };

  const addFormCategory = (categoryId: string) => {
    if (!categoryId) return;
    setSelectedFormCategoryIds((current) => [...current, categoryId]);
    setFormCategoryToAdd('');
  };

  const removeFormCategory = (categoryId: string | number) => {
    setSelectedFormCategoryIds((current) => current.filter((id) => String(id) !== String(categoryId)));
  };

  type RelationItem = { id: string | number; label: string };
  type RelationView = {
    title: string;
    selected: RelationItem[];
    available: RelationItem[];
    value: string;
    setValue: (value: string) => void;
    add: (value: string) => void;
    remove: (id: string | number) => void;
  };

  const relationViews: RelationView[] = [
    {
      title: 'Exclusivo para Perfis',
      selected: selectedQuestionProfiles.map((item) => ({ id: item.id, label: item.nomePerfil })),
      available: availableQuestionProfiles.map((item) => ({ id: item.id, label: item.nomePerfil })),
      value: questionProfileToAdd,
      setValue: setQuestionProfileToAdd,
      add: addQuestionProfile,
      remove: removeQuestionProfile,
    },
    {
      title: 'Categorias',
      selected: selectedCategories.map((item) => ({ id: item.id, label: item.nomeCategoria })),
      available: availableCategories.map((item) => ({ id: item.id, label: item.nomeCategoria })),
      value: categoryToAdd,
      setValue: setCategoryToAdd,
      add: addCategory,
      remove: removeCategory,
    },
  ];

  const responseInitialData = useMemo(
    () => (editingResponse ? { ...createEmptyRecord(ENTITY_FIELDS.RESPOSTA), ...editingResponse } : createEmptyRecord(ENTITY_FIELDS.RESPOSTA)),
    [editingResponse],
  );
  const responseFields = useMemo(() => {
    if (!managesQuestionRelations) {
      return ENTITY_FIELDS.RESPOSTA.filter((field) => field.key !== 'idPergunta');
    }

    const nextQuestionOptions = [
      { label: 'Nenhuma pergunta', value: '' },
      ...records
        .filter((record) => Number(record.principal) !== 1 && String(record.id) !== String(editingRecord?.id))
        .map((record) => ({
          label: `${record.textoPergunta}`,
          value: String(record.id),
        })),
    ];

    return ENTITY_FIELDS.RESPOSTA
      .filter((field) => field.key !== 'idPergunta')
      .map((field) => field.key === 'idProximaPergunta' ? {
        ...field,
        type: 'select' as const,
        required: false,
        options: nextQuestionOptions,
      } : field);
  }, [editingRecord, managesQuestionRelations, records]);

  const handleOpenResponseCreate = () => {
    setEditingResponse(null);
    setIsResponseFormOpen(true);
  };

  const handleOpenResponseEdit = (response: Resposta) => {
    setEditingResponse(response);
    setIsResponseFormOpen(true);
  };

  const handleResponseSubmit = async (data: Record<string, any>) => {
    const responseData = {
      ...data,
      textoResposta: String(data.textoResposta ?? '').trim(),
      ordemExibicao: Number(data.ordemExibicao) || responses.length + 1,
      anuladora: Number(data.anuladora) || 0,
    } as Resposta;

    if (!responseData.textoResposta) {
      throw new Error('Informe o texto da resposta.');
    }

    if (editingResponse) {
      setResponses((current) => current.map((response) => (
        String(response.id) === String(editingResponse.id) ? { ...editingResponse, ...responseData } : response
      )));
    } else {
      setResponses((current) => [...current, { ...responseData, id: generateUUID() }]);
    }
    setIsResponseFormOpen(false);
  };

  const handleRemoveResponse = (responseId: string | number) => {
    setResponses((current) => current.filter((response) => String(response.id) !== String(responseId)));
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
                <span className="truncate text-lg font-semibold text-slate-900">{title}</span>
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
              <button type="button" onClick={() => setSearch('')} aria-label="Limpar busca" title="Limpar busca" className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                <FiX className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="flex items-center justify-between px-1 text-sm text-slate-600">
            <span>{filteredRecords.length} registros</span>
            <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50">
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
            records={recordsForList}
            onEdit={handleOpenEdit}
            showActiveBadge={entity === 'FORMULARIO' || entity === 'PACIENTE'}
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
        fields={formFields}
        initialData={formInitialData}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        onDelete={editingRecord ? () => requestDelete(editingRecord.id) : undefined}
        onSuccessToast={showToast}
        reloadOnSuccess
        onDataChange={(data) => setQuestionType(Number(data.tipoPergunta) || 1)}
      >
        {managesPatientProfiles ? (
          <>
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
                <option value="">Seleciona perfil </option>
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
                  <li key={String(profile.id)} className="rounded-xl border border-slate-200 pl-2 bg-white shadow-sm">
                    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                      <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-brand-greenDark bg-brand-greenDark text-white">
                        <FiCheck className="h-3 w-3" />
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

          </>
        ) : null}
        {editingRecord && (managesPatientProfiles || managesFormularios) ? (
          <section className="my-4 space-y-3 rounded-2xl border border-slate-200 bg-brand-cream/40 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">URL do questionário</h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={patientQuestionnaireUrl}
                readOnly
                aria-label="URL do questionário do paciente"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none"
              />
              <button
                type="button"
                onClick={() => void handleCopyPatientQuestionnaireUrl()}
                aria-label="Copiar URL do questionário"
                title="Copiar URL"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-greenDark text-white transition hover:bg-brand-greenDark/90"
              >
                <FiCopy className="h-5 w-5" />
              </button>
            </div>
            {isPatientUrlCopied ? <p className="text-xs font-medium text-emerald-600">URL copiada.</p> : null}
          </section>
        ) : null}
        {managesFormularios ? (
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-brand-cream/40 p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <h3 className="truncate text-sm font-semibold uppercase tracking-wide text-slate-700">
                Categorias do formulário<span className="ml-1 text-red-500" aria-hidden="true">*</span>
              </h3>
              <span className="shrink-0 text-xs text-slate-500">{selectedFormCategories.length} itens</span>
            </div>
            <div className="flex gap-2">
              <select
                value={formCategoryToAdd}
                onChange={(event) => setFormCategoryToAdd(event.target.value)}
                disabled={isProfilesLoading || !isProfilesReady || availableFormCategories.length === 0}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-greenDark focus:ring-4 focus:ring-brand-greenDark/10 disabled:bg-slate-100"
              >
                <option value="">Selecionar categoria</option>
                {availableFormCategories.map((category) => (
                  <option key={String(category.id)} value={String(category.id)}>
                    {category.nomeCategoria}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => addFormCategory(formCategoryToAdd)}
                disabled={!formCategoryToAdd || isProfilesLoading}
                aria-label="Adicionar categoria ao formulário"
                title="Adicionar categoria"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-greenDark text-white transition hover:bg-brand-greenDark/90 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                <FiPlus className="h-5 w-5" />
              </button>
            </div>
            <ul className="space-y-3">
              {isProfilesLoading || !isProfilesReady ? (
                <li className="py-6 text-center text-sm text-slate-500">Carregando categorias...</li>
              ) : selectedFormCategories.length === 0 ? (
                <li className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                  Nenhuma categoria adicionada.
                </li>
              ) : selectedFormCategories.map((category) => (
                <li key={String(category.id)} className="rounded-xl border border-slate-200 bg-white pl-2 shadow-sm">
                  <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                    <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-brand-greenDark bg-brand-greenDark text-white">
                      <FiCheck className="h-3 w-3" />
                    </span>
                    <span className="min-w-0 break-words text-sm font-medium text-slate-800">{category.nomeCategoria}</span>
                    <button
                      type="button"
                      onClick={() => removeFormCategory(category.id)}
                      aria-label={`Remover categoria ${category.nomeCategoria}`}
                      title="Remover categoria"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {managesQuestionRelations && questionType !== 3 ? (
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-brand-cream/40 p-4 mb-2">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <h3 className="truncate text-sm font-semibold uppercase tracking-wide text-slate-700">Respostas</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{responses.length} itens</span>
                <button
                  type="button"
                  onClick={handleOpenResponseCreate}
                  aria-label="Adicionar resposta"
                  title="Adicionar resposta"
                  className="grid h-9 w-9 place-items-center rounded-xl bg-brand-greenDark text-white transition hover:bg-brand-greenDark/90"
                >
                  <FiPlus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <ul className="space-y-3">
              {responses.length === 0 ? (
                <li className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">Nenhuma resposta adicionada.</li>
              ) : responses.map((response) => (
                <li
                  key={String(response.id)}
                  className={`rounded-xl border p-2 shadow-sm ${String(response.idProximaPergunta ?? '').trim() ? 'border-brand-gold/35 bg-brand-gold/10' : 'border-slate-200 bg-white'}`}
                >
                  <button type="button" onClick={() => handleOpenResponseEdit(response)} className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 text-left">
                    <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-brand-greenDark bg-brand-greenDark text-white"><FiCheck className="h-3 w-3" /></span>
                    <span className="min-w-0 break-words text-sm font-medium text-slate-800">{response.textoResposta}</span>
                    <FiArrowLeft className="h-4 w-4 rotate-180 text-slate-400" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {managesQuestionRelations ? (
          <div className="space-y-4">
            {relationViews.map((relation) => (
              <section key={relation.title} className="space-y-3 rounded-2xl border border-slate-200 bg-brand-cream/40 p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <h3 className="truncate text-sm font-semibold uppercase tracking-wide text-slate-700">{relation.title}</h3>
                  <span className="shrink-0 text-xs text-slate-500">{relation.selected.length} itens</span>
                </div>
                <div className="flex gap-2">
                  <select
                    value={relation.value}
                    onChange={(event) => relation.setValue(event.target.value)}
                    disabled={isProfilesLoading || !isProfilesReady || relation.available.length === 0}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-greenDark focus:ring-4 focus:ring-brand-greenDark/10 disabled:bg-slate-100"
                  >
                    <option value="">Selecionar {relation.title.toLowerCase()}</option>
                    {relation.available.map((item) => (
                      <option key={String(item.id)} value={String(item.id)}>{item.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => relation.add(relation.value)}
                    disabled={!relation.value || isProfilesLoading}
                    aria-label={`Adicionar ${relation.title.toLowerCase().slice(0, -1)}`}
                    title="Adicionar"
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-greenDark text-white transition hover:bg-brand-greenDark/90 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    <FiPlus className="h-5 w-5" />
                  </button>
                </div>
                <ul className="space-y-3">
                  {relation.selected.length === 0 ? (
                    <li className="rounded-xl border border-dashed border-slate-300 p-2 text-center text-sm text-slate-500">Nenhum item adicionado.</li>
                  ) : relation.selected.map((item) => (
                    <li key={String(item.id)} className="rounded-xl border border-slate-200 bg-white pl-2 shadow-sm">
                      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                        <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-brand-greenDark bg-brand-greenDark text-white"><FiCheck className="h-3 w-3" /></span>
                        <span className="min-w-0 break-words text-sm font-medium text-slate-800">{item.label}</span>
                        <button type="button" onClick={() => relation.remove(item.id)} aria-label={`Remover ${relation.title.toLowerCase().slice(0, -1)}`} title="Remover" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-red-50 hover:text-red-600"><FiTrash2 className="h-4 w-4" /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : null}
      </CrudForm>

      <CrudForm
        isOpen={isResponseFormOpen}
        presentation="modal"
        title={editingResponse ? 'Editar resposta' : 'Nova resposta'}
        fields={responseFields}
        initialData={responseInitialData}
        onClose={() => setIsResponseFormOpen(false)}
        onSubmit={handleResponseSubmit}
        onDelete={editingResponse ? () => {
          handleRemoveResponse(editingResponse.id);
          setIsResponseFormOpen(false);
        } : undefined}
      />

      <ErrorDialog error={error} onClose={() => setError(null)} />
      <ConfirmationDialog
        isOpen={deletionCandidate !== null}
        title="Excluir registro?"
        message="Deseja  o excluir o registro?"
        confirmLabel="Excluir"
        onCancel={() => setDeletionCandidate(null)}
        onConfirm={() => {
          if (deletionCandidate !== null) {
            void handleDelete(deletionCandidate);
          }
        }}
      />

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