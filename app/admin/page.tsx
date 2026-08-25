 'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  FiBriefcase,
  FiChevronRight,
  FiClipboard,
  FiGrid,
  FiLayers,
  FiList,
  FiSearch,
  FiX,
  FiTag,
  FiUsers,
} from 'react-icons/fi';

const resources = [
  { label: 'Perfil', path: '/admin/perfil', description: 'Gerencie os perfis dos pacientes.', icon: FiTag },
  { label: 'Paciente', path: '/admin/paciente', description: 'Cadastre e acompanhe os pacientes.', icon: FiUsers },
  { label: 'Categoria', path: '/admin/categoria', description: 'Organize as categorias das perguntas.', icon: FiLayers },
  { label: 'Pergunta', path: '/admin/pergunta', description: 'Crie e edite perguntas.', icon: FiClipboard },
  { label: 'Tipo de pergunta', path: '/admin/tipo-pergunta', description: 'Controle os tipos de pergunta.', icon: FiList },
  { label: 'Formulário', path: '/admin/formulario', description: 'Gerencie os formulários.', icon: FiBriefcase },
  { label: 'Formulário/Pergunta', path: '/admin/formulario-pergunta', description: 'Associe perguntas aos formulários.', icon: FiClipboard },
];

export default function AdminDashboardPage() {
  const [search, setSearch] = useState('');
  const filteredResources = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return resources;
    }

    return resources.filter((resource) =>
      `${resource.label} ${resource.description}`.toLowerCase().includes(term),
    );
  }, [search]);

  return (
    <main className="min-h-screen bg-brand-cream pb-28">
      <header className="sticky top-0 z-10 space-y-3 border-b border-brand-greenDark/10 bg-brand-cream/95 px-4 pb-4 pt-5 backdrop-blur sm:px-6">
        <div className="mx-auto grid w-full max-w-2xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight text-slate-900">Painel do sistema</h1>
            <p className="truncate text-sm text-slate-600">{resources.length} opções administrativas</p>
          </div>
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-greenDark/10 text-brand-greenDark">
            <FiGrid className="h-5 w-5" />
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-2xl">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar opção administrativa"
            aria-label="Buscar opção administrativa"
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-9 pr-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-greenDark focus:ring-4 focus:ring-brand-greenDark/10"
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
      </header>

      <div className="mx-auto w-full max-w-2xl px-4 py-4 sm:px-6">
        {filteredResources.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
            <p className="text-sm text-slate-500">Nenhuma opção encontrada.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredResources.map((resource) => {
            const Icon = resource.icon;

            return (
              <li key={resource.path}>
                <Link
                  href={resource.path}
                  className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-brand-greenDark/30 hover:bg-brand-greenDark/[0.03]"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-greenDark/10 text-brand-greenDark">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{resource.label}</p>
                    <p className="line-clamp-2 text-xs leading-5 text-slate-500">{resource.description}</p>
                  </div>
                  <FiChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-greenDark" />
                </Link>
              </li>
            );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
