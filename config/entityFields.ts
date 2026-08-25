import { EntityName } from '@/types/form';

export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'datetime-local' | 'date' | 'select'; // <- Adicionado 'date' aqui
  required?: boolean;
  hiddenInList?: boolean;
  options?: { label: string; value: string | number }[];
}

export const ENTITY_FIELDS: Record<EntityName, FieldConfig[]> = {
  PERFIL: [
    { key: 'nomePerfil', label: 'Nome do Perfil', type: 'text', required: true }
  ],
  PACIENTE: [
    { key: 'nomePaciente', label: 'Nome do Paciente', type: 'text', required: true },
    { key: 'apelido', label: 'Apelido', type: 'text', required: true, hiddenInList: true },
    { key: 'dataInicio', label: 'Data Início', type: 'datetime-local', required: true },
    { key: 'dataFim', label: 'Data Fim', type: 'datetime-local' }
  ],
  PACIENTE_PERFIL: [
    { key: 'idPaciente', label: 'ID Paciente', type: 'text' },
    { key: 'idPerfil', label: 'ID Perfil', type: 'text' }
  ],
  CATEGORIA: [
    { key: 'nomeCategoria', label: 'Nome da Categoria', type: 'text', required: true },
    { key: 'ordemExibicao', label: 'Ordem de Exibição', type: 'number' }
  ],
  CATEGORIA_PERGUNTA: [
    { key: 'idCategoria', label: 'ID Categoria', type: 'text', required: true },
    { key: 'idPergunta', label: 'ID Pergunta', type: 'text' }
  ],
  PERFIL_PERGUNTA: [
    { key: 'idPerfil', label: 'ID Perfil', type: 'text', required: true },
    { key: 'idPergunta', label: 'ID Pergunta', type: 'text' }
  ],
  PERGUNTA: [
    { key: 'textoPergunta', label: 'Texto da Pergunta', type: 'text', required: true },
    { 
      key: 'tipoPergunta', label: 'Tipo de Pergunta', type: 'select', 
      options: [
        { label: 'Objetiva', value: 1 },
        { label: 'Múltipla Escolha', value: 2 },
        { label: 'Texto', value: 3 }
      ] 
    },
    { 
      key: 'principal', label: 'Principal', type: 'select', 
      options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] 
    },
    { 
      key: 'obrigatorio', label: 'Obrigatório', type: 'select', 
      options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] 
    }
  ],
  TIPO_PERGUNTA: [
    { 
      key: 'tipo', label: 'Tipo', type: 'select', 
      options: [
        { label: 'Objetiva (1)', value: 1 },
        { label: 'Múltipla Escolha (2)', value: 2 },
        { label: 'Texto (3)', value: 3 }
      ] 
    }
  ],
  RESPOSTA: [
    { key: 'idPergunta', label: 'ID Pergunta', type: 'text' },
    { key: 'textoResposta', label: 'Texto da Resposta', type: 'text', required: true },
    { key: 'ordemExibicao', label: 'Ordem de Exibição', type: 'number', required: true },
    { key: 'idProximaPergunta', label: 'ID Próxima Pergunta (Opcional)', type: 'text', required: false },
    { 
      key: 'anuladora', label: 'Anuladora', type: 'select', 
      options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] 
    }
  ],
  FORMULARIO: [
    { key: 'idPaciente', label: 'ID Paciente', type: 'text' },
    { key: 'nomeFormulario', label: 'Nome do Formulário', type: 'text', required: true },
    { key: 'dataInicio', label: 'Data Início', type: 'datetime-local', required: false },
    { key: 'dataFim', label: 'Data Fim', type: 'datetime-local', required: false },
  ],
  FORMULARIO_PERGUNTA: [
    { key: 'idFormulario', label: 'ID Formulário', type: 'text' },
    { key: 'idPergunta', label: 'ID Pergunta', type: 'text' }
  ]
};