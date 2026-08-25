import { EntityName } from '@/types/form';

const BASE_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || '';

export interface BulkGroup<T = string | number> {
  parentId: string | number;
  items: T[];
}

const validateConfiguration = (adminToken: string) => {
  if (!BASE_URL) {
    throw new Error('NEXT_PUBLIC_APPS_SCRIPT_URL não está configurada no .env.');
  }

  if (!adminToken) {
    throw new Error('NEXT_PUBLIC_ADMIN_TOKEN não está configurado no .env.');
  }
};

export async function validateAdminToken(adminToken: string): Promise<void> {
  validateConfiguration(adminToken);

  const url = `${BASE_URL}?acao=VALIDATE_ADMIN_TOKEN&admin=${encodeURIComponent(adminToken)}`;
  const response = await fetch(url, { method: 'GET', redirect: 'follow' });
  const data = await response.json();

  if (!response.ok || !data.success || data.valid !== true) {
    throw new Error(data.error || 'Credencial inválida.');
  }
}

export async function fetchRecords<T>(
  entity: EntityName,
  adminToken: string,
  signal?: AbortSignal
): Promise<T[]> {
  validateConfiguration(adminToken);
  const url = `${BASE_URL}?dado=${entity.toLowerCase()}&admin=${encodeURIComponent(adminToken)}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal,
    });

    if (!res.ok) {
      throw new Error(`Falha no servidor (Status: ${res.status}).`);
    }

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || `Erro ao carregar registros de ${entity}`);
    }

    return data.data as T[];
  } catch (err: any) {
    // Trata exceção de AbortController
    if (err?.name === 'AbortError') {
      throw new Error('Tempo limite excedido. Verifique sua conexão e tente novamente.');
    }

    // Captura erros de bloqueio de CORS / Conexão recusada
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error(
        'Erro de conexão/CORS: O navegador bloqueou a requisição para o Google Apps Script. Verifique as permissões do Script ou autorize o host no next.config.js.'
      );
    }

    throw err;
  }
}

export async function createRecord<T>(entity: EntityName, recordData: Partial<T>, adminToken: string): Promise<T> {
  validateConfiguration(adminToken);
  const url = `${BASE_URL}?admin=${encodeURIComponent(adminToken)}`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: { 
        'Content-Type': 'text/plain;charset=utf-8' 
      },
      body: JSON.stringify({
        action: 'CREATE',
        entity: entity,
        data: recordData,
      }),
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || `Erro ao criar registro em ${entity}`);
    }

    return data.data as T;
  } catch (err: any) {
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error('Erro de rede ou CORS ao tentar criar o registro.');
    }
    throw err;
  }
}

export async function updateRecord<T>(entity: EntityName, recordData: Partial<T> & { id: string | number }, adminToken: string): Promise<T> {
  validateConfiguration(adminToken);
  const url = `${BASE_URL}?admin=${encodeURIComponent(adminToken)}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: { 
        'Content-Type': 'text/plain;charset=utf-8' 
      },
      body: JSON.stringify({
        action: 'UPDATE',
        entity: entity,
        data: recordData,
      }),
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || `Erro ao atualizar registro em ${entity}`);
    }

    return data.data as T;
  } catch (err: any) {
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error('Erro de rede ou CORS ao tentar atualizar o registro.');
    }
    throw err;
  }
}

export async function deleteRecord(entity: EntityName, id: string | number, adminToken: string): Promise<void> {
  validateConfiguration(adminToken);
  const url = `${BASE_URL}?admin=${encodeURIComponent(adminToken)}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: { 
        'Content-Type': 'text/plain;charset=utf-8' 
      },
      body: JSON.stringify({
        action: 'DELETE',
        entity: entity,
        data: { id },
      }),
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || `Erro ao excluir registro de ${entity}`);
    }
  } catch (err: any) {
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error('Erro de rede ou CORS ao tentar excluir o registro.');
    }
    throw err;
  }
}

export async function fetchBulkRecords<T = string | number>(entity: EntityName, adminToken: string, signal?: AbortSignal): Promise<BulkGroup<T>[]> {
  validateConfiguration(adminToken);
  const url = `${BASE_URL}?dado=${entity.toLowerCase()}&bulk=true&admin=${encodeURIComponent(adminToken)}`;
  const res = await fetch(url, { method: 'GET', redirect: 'follow', signal });
  if (!res.ok) throw new Error(`Falha no servidor (Status: ${res.status}).`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || `Erro ao carregar dados agrupados de ${entity}`);
  return data.data as BulkGroup<T>[];
}

export async function syncBulkRecords<T = string | number>(
  entity: EntityName,
  parentId: string | number,
  childIds: Array<string | number | T>,
  adminToken: string,
): Promise<BulkGroup<T>> {
  validateConfiguration(adminToken);
  const url = `${BASE_URL}?admin=${encodeURIComponent(adminToken)}`;
  const res = await fetch(url, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'BULK_SYNC', entity, data: { parentId, childIds } }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || `Erro ao sincronizar dados de ${entity}`);
  return data.data as BulkGroup<T>;
}