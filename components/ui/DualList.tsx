'use client';

import { useMemo, useState } from 'react';
import { FiArrowDown, FiArrowLeft, FiArrowRight, FiArrowUp, FiCheck, FiLoader, FiSearch } from 'react-icons/fi';

export interface DualListItem {
  id: string | number;
  label: string;
  disabled?: boolean;
}

interface DualListProps {
  items: DualListItem[];
  selectedIds: Array<string | number>;
  onChange: (selectedIds: Array<string | number>) => void;
  availableTitle?: string;
  selectedTitle?: string;
  availableDescription?: string;
  selectedDescription?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  isLoading?: boolean;
  isReady?: boolean;
}

export function DualList({
  items,
  selectedIds,
  onChange,
  availableTitle = 'Disponíveis',
  selectedTitle = 'Selecionados',
  availableDescription = 'Itens que podem ser adicionados',
  selectedDescription = 'Itens incluídos',
  searchPlaceholder = 'Buscar item',
  emptyMessage = 'Nenhum item encontrado.',
  disabled = false,
  isLoading = false,
  isReady = true,
}: DualListProps) {
  const [availableSearch, setAvailableSearch] = useState('');
  const [selectedSearch, setSelectedSearch] = useState('');
  const [availableChecked, setAvailableChecked] = useState<Array<string | number>>([]);
  const [selectedChecked, setSelectedChecked] = useState<Array<string | number>>([]);

  const selectedKeySet = useMemo(() => new Set(selectedIds.map(String)), [selectedIds]);
  const availableItems = items.filter((item) => !selectedKeySet.has(String(item.id)));
  const selectedItems = items.filter((item) => selectedKeySet.has(String(item.id)));
  const isLocked = disabled || isLoading || !isReady;

  const filterItems = (list: DualListItem[], search: string) => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    if (!normalizedSearch) return list;
    return list.filter((item) => item.label.toLocaleLowerCase().includes(normalizedSearch));
  };

  const visibleAvailable = filterItems(availableItems, availableSearch);
  const visibleSelected = filterItems(selectedItems, selectedSearch);

  const toggleChecked = (id: string | number, list: 'available' | 'selected') => {
    const setter = list === 'available' ? setAvailableChecked : setSelectedChecked;
    setter((current) => (current.some((currentId) => String(currentId) === String(id))
      ? current.filter((currentId) => String(currentId) !== String(id))
      : [...current, id]));
  };

  const moveItems = (ids: Array<string | number>, direction: 'add' | 'remove') => {
    if (isLocked || ids.length === 0) return;

    const idSet = new Set(ids.map(String));
    const nextSelected = direction === 'add'
      ? [...selectedIds, ...ids.filter((id) => !selectedKeySet.has(String(id)))]
      : selectedIds.filter((id) => !idSet.has(String(id)));

    onChange(nextSelected);
    if (direction === 'add') setAvailableChecked([]);
    else setSelectedChecked([]);
  };

  const moveAll = (direction: 'add' | 'remove') => {
    const sourceItems = direction === 'add' ? availableItems : selectedItems;
    moveItems(sourceItems.filter((item) => !item.disabled).map((item) => item.id), direction);
  };

  const renderList = (
    list: DualListItem[],
    checked: Array<string | number>,
    listType: 'available' | 'selected',
    title: string,
    description: string,
    search: string,
    setSearch: (value: string) => void,
  ) => {
    const visibleIds = list.map((item) => item.id);
    const checkedVisibleCount = checked.filter((id) => visibleIds.some((visibleId) => String(visibleId) === String(id))).length;
    const allVisibleChecked = visibleIds.length > 0 && checkedVisibleCount === visibleIds.length;

    return (
      <section className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm lg:h-[38rem]" aria-labelledby={`${listType}-list-title`}>
        <div className="border-b border-slate-100 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id={`${listType}-list-title`} className="text-base font-semibold text-slate-800">{title}</h2>
              <p className="mt-1 text-xs text-slate-500">{description}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{list.length}</span>
          </div>
          <label className="relative mt-4 block">
            <span className="sr-only">{searchPlaceholder} em {title}</span>
            <FiSearch aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              disabled={isLocked}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#498a28] focus:bg-white focus:ring-2 focus:ring-[#498a28]/15 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <label className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={allVisibleChecked}
              onChange={() => setSearchChecked(listType, visibleIds, allVisibleChecked)}
              disabled={isLocked || visibleIds.length === 0}
              className="h-4 w-4 rounded accent-[#1b532b]"
            />
            <span className="truncate">Selecionar visíveis</span>
          </label>
          <span className="shrink-0 text-xs text-slate-400">{checkedVisibleCount} marcados</span>
        </div>
        <ul className="min-h-40 flex-1 overflow-y-auto p-2" aria-label={title}>
          {isLoading || !isReady ? (
            <li className="flex min-h-36 items-center justify-center gap-2 px-4 text-center text-sm text-slate-500">
              <FiLoader aria-hidden="true" className="h-5 w-5 animate-spin text-[#1b532b]" />
              <span>Carregando opções...</span>
            </li>
          ) : list.length === 0 ? (
            <li className="flex min-h-36 items-center justify-center px-4 text-center text-sm text-slate-500">{emptyMessage}</li>
          ) : list.map((item) => {
            const isChecked = checked.some((id) => String(id) === String(item.id));
            return (
              <li key={String(item.id)}>
                <label className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${isChecked ? 'bg-[#1b532b]/8 text-[#1b532b]' : 'text-slate-700 hover:bg-slate-50'} ${item.disabled ? 'cursor-not-allowed opacity-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleChecked(item.id, listType)}
                    disabled={isLocked || item.disabled}
                    className="h-4 w-4 shrink-0 rounded accent-[#1b532b]"
                  />
                  <span className="min-w-0 break-words">{item.label}</span>
                  {isChecked ? <FiCheck aria-hidden="true" className="ml-auto h-4 w-4 shrink-0" /> : null}
                </label>
              </li>
            );
          })}
        </ul>
      </section>
    );
  };

  const setSearchChecked = (list: 'available' | 'selected', ids: Array<string | number>, allChecked: boolean) => {
    const setter = list === 'available' ? setAvailableChecked : setSelectedChecked;
    setter((current) => allChecked
      ? current.filter((id) => !ids.some((visibleId) => String(visibleId) === String(id)))
      : [...current, ...ids.filter((id) => !current.some((currentId) => String(currentId) === String(id))) ]);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center">
      {renderList(visibleAvailable, availableChecked, 'available', availableTitle, availableDescription, availableSearch, setAvailableSearch)}
      <div className="flex justify-center gap-2 lg:flex-col">
        <button type="button" onClick={() => moveItems(availableChecked, 'add')} disabled={isLocked || availableChecked.length === 0} aria-label="Adicionar selecionados" title="Adicionar selecionados" className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#1b532b] px-3 text-sm font-semibold text-white transition hover:bg-[#154323] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 lg:flex-none">
          <FiArrowRight className="hidden h-4 w-4 lg:block" /><FiArrowDown className="h-4 w-4 lg:hidden" /><span className="sm:inline lg:hidden">Adicionar</span>
        </button>
        <button type="button" onClick={() => moveItems(selectedChecked, 'remove')} disabled={isLocked || selectedChecked.length === 0} aria-label="Remover selecionados" title="Remover selecionados" className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 lg:flex-none">
          <FiArrowLeft className="hidden h-4 w-4 lg:block" /><FiArrowUp className="h-4 w-4 lg:hidden" /><span className="sm:inline lg:hidden">Remover</span>
        </button>
        <button type="button" onClick={() => moveAll('add')} disabled={isLocked || availableItems.every((item) => item.disabled)} aria-label="Adicionar todos" title="Adicionar todos" className="hidden h-9 items-center justify-center rounded-lg border border-slate-200 px-2 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 lg:inline-flex"><FiArrowRight className="h-4 w-4" /><span className="sr-only">Adicionar todos</span></button>
        <button type="button" onClick={() => moveAll('remove')} disabled={isLocked || selectedItems.every((item) => item.disabled)} aria-label="Remover todos" title="Remover todos" className="hidden h-9 items-center justify-center rounded-lg border border-slate-200 px-2 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 lg:inline-flex"><FiArrowLeft className="h-4 w-4" /><span className="sr-only">Remover todos</span></button>
      </div>
      {renderList(visibleSelected, selectedChecked, 'selected', selectedTitle, selectedDescription, selectedSearch, setSelectedSearch)}
    </div>
  );
}
