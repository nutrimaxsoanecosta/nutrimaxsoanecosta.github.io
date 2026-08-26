export interface BaseEntity {
  id: string | number;
  dataHoraAlteracao: string;
}

export enum TipoPerguntaEnum {
  OBJETIVA = 1,
  MULTIPLA = 2,
  TEXTO = 3,
}

export interface Perfil extends BaseEntity {
  nomePerfil: string;
}

export interface Paciente extends BaseEntity {
  nomePaciente: string;
  apelido?: string;
  dataInicio: string;
  dataFim: string;
}


export interface PacientePerfil extends BaseEntity {
  idPaciente: string | number;
  idPerfil: string | number;
}

export interface Categoria extends BaseEntity {
  nomeCategoria: string;
  ordemExibicao: number;
}

export interface CategoriaPergunta extends BaseEntity {
  idCategoria: string | number;
  idPergunta: string | number;
}

export interface PerfilPergunta extends BaseEntity {
  idPerfil: string | number;
  idPergunta: string | number;
}

export interface TipoPergunta extends BaseEntity {
  tipo: TipoPerguntaEnum;
}

export interface Resposta extends BaseEntity {
  idPergunta: string | number;
  textoResposta: string;
  idProximaPergunta?: string | number | null;
  anuladora?: number; // 0 ou 1
  ordemExibicao: number;
  pergunta?: Pergunta | null;
}

export interface Pergunta extends BaseEntity {
  principal: 0 | 1;
  textoPergunta: string;
  tipoPergunta: TipoPerguntaEnum;
  obrigatorio: 0 | 1; // Nova propriedade adicionada
  respostas: Resposta[];
  nomeCategoria?: string;
}

export interface CategoriaHierarquica extends Categoria {
  perguntas: Pergunta[];
}

export interface FormularioHierarquico extends BaseEntity {
  idPaciente: string | number;
  nomeFormulario: string;
  dataInicio: string;
  dataFim: string;
  categorias: CategoriaHierarquica[];
}

export interface PayloadAppsScript {
  success: boolean;
  error?: string;
  paciente?: Paciente;
  formularios?: FormularioHierarquico[];
}

export interface FormularioCategoria extends BaseEntity {
  idFormulario: string | number;
  idCategoria: string | number;
}

export type EntityName =
  | 'PERFIL'
  | 'PACIENTE'
  | 'PACIENTE_PERFIL'
  | 'CATEGORIA'
  | 'CATEGORIA_PERGUNTA'
  | 'PERFIL_PERGUNTA'
  | 'PERGUNTA'
  | 'TIPO_PERGUNTA'
  | 'RESPOSTA'
  | 'FORMULARIO'
  | 'FORMULARIO_CATEGORIA';