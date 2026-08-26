'use client';

import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FiLock, FiShield, FiX } from 'react-icons/fi';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { validateAdminToken } from '@/services/apiService';

export const ADMIN_TOKEN_STORAGE_KEY = 'adminToken';

interface AdminAuthGuardProps {
  children: ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const pathname = usePathname();
  const [token, setToken] = useState('');
  const [credential, setCredential] = useState('');
  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
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
    setIsLogoutDialogOpen(true);
  };

  const handleConfirmLogout = () => {
    setIsLogoutDialogOpen(false);
    sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    setToken('');
  };

  if (isChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-cream p-6 text-slate-700">
        <div className="rounded-2xl border border-brand-greenDark/10 bg-white px-5 py-4 text-sm font-medium shadow-sm">
          Validando acesso...
        </div>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-cream p-4 sm:p-6">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-[28px] border border-brand-greenDark/10 bg-white p-5 shadow-brand sm:p-6"
        >
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-greenDark/10 text-brand-greenDark">
            <FiShield className="h-6 w-6" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Acesso administrativo</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Informe a credencial para continuar.</p>

          <label htmlFor="admin-credential" className="mt-6 block text-sm font-semibold text-slate-700">
            Credencial
          </label>
          <div className="relative mt-2">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <FiLock className="h-4 w-4" />
            </div>
            <input
              id="admin-credential"
              type="password"
              value={credential}
              onChange={(event) => setCredential(event.target.value)}
              autoComplete="current-password"
              className="w-full rounded-2xl border border-slate-200 bg-brand-cream/60 py-3 pl-10 pr-10 text-slate-900 outline-none transition focus:border-brand-greenDark focus:ring-4 focus:ring-brand-greenDark/10"
              required
            />
            {credential ? (
              <button
                type="button"
                aria-label="Limpar credencial"
                title="Limpar credencial"
                onClick={() => setCredential('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-900"
              >
                <FiX aria-hidden="true" size={16} />
              </button>
            ) : null}
          </div>

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded-2xl bg-brand-greenDark px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-greenDark/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Validando...' : 'Entrar'}
          </button>
        </form>
      </main>
    );
  }

  return (
    <>
      {pathname === '/admin' ? (
        <div className="border-b border-brand-greenDark/10 bg-brand-cream px-4 pb-3 pt-4 sm:px-6">
          <div className="mx-auto flex w-full max-w-6xl justify-end">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-greenDark/20 hover:text-brand-greenDark"
            >
              Sair
            </button>
          </div>
        </div>
      ) : null}
      {children}
      <ConfirmationDialog
        isOpen={isLogoutDialogOpen}
        title="Sair do painel?"
        message=""
        onCancel={() => setIsLogoutDialogOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
}