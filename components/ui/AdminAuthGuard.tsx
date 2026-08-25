'use client';

import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { validateAdminToken } from '@/services/apiService';

export const ADMIN_TOKEN_STORAGE_KEY = 'adminToken';

interface AdminAuthGuardProps {
  children: ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [token, setToken] = useState('');
  const [credential, setCredential] = useState('');
  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)?.trim() || '';

    if (!storedToken) {
      setIsChecking(false);
      return;
    }

    void validateAdminToken(storedToken)
      .then(() => setToken(storedToken))
      .catch(() => {
        sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
      })
      .finally(() => setIsChecking(false));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedCredential = credential.trim();

    if (!trimmedCredential) {
      setError('Informe a credencial.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await validateAdminToken(trimmedCredential);
      sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, trimmedCredential);
      setToken(trimmedCredential);
      setCredential('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Credencial inválida.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    setToken('');
  };

  if (isChecking) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-600">Validando acesso...</main>;
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-2xl font-bold text-slate-900">Acesso administrativo</h1>
          <p className="mt-2 text-sm text-slate-600">Informe a credencial para continuar.</p>
          <label htmlFor="admin-credential" className="mt-6 block text-sm font-semibold text-slate-700">
            Credencial
          </label>
          <div className="relative mt-2">
            <input
              id="admin-credential"
              type="password"
              value={credential}
              onChange={(event) => setCredential(event.target.value)}
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-slate-900 caret-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              required
            />
            {credential ? (
              <button
                type="button"
                aria-label="Limpar credencial"
                title="Limpar credencial"
                onClick={() => setCredential('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <FiX aria-hidden="true" size={18} />
              </button>
            ) : null}
          </div>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Validando...' : 'Entrar'}
          </button>
        </form>
      </main>
    );
  }

  return (
    <>
      <div className="bg-slate-100 px-6 pb-2 pt-5">
        <div className="mx-auto flex w-full max-w-7xl justify-end">
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Sair
          </button>
        </div>
      </div>
      {children}
    </>
  );
}