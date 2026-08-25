/**
 * CLASSE BASE E SUBCLASSES (CAMELCASE)
 */
class BaseEntity {
  constructor(id, dataHoraAlteracao) {
    this.id = id;
    this.dataHoraAlteracao = this.formatDate(dataHoraAlteracao);
  }

  formatDate(dateVal) {
    if (!dateVal) return "";
    const date = dateVal instanceof Date ? dateVal : new Date(dateVal);
    if (isNaN(date.getTime())) return String(dateVal);

    const pad = (num) => String(num).padStart(2, '0');
    
    // Usa os métodos UTC para ignorar o fuso horário local e adiciona o sufixo Z
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}Z`;
  }
}

class Perfil extends BaseEntity {
  constructor(id, nomePerfil, dataHoraAlteracao) {
    super(id, dataHoraAlteracao);
    this.nomePerfil = nomePerfil;
  }
}

class Paciente extends BaseEntity {
  constructor(id, nomePaciente, apelido, dataInicio, dataFim, dataHoraAlteracao) {
    super(id, dataHoraAlteracao);
    this.nomePaciente = nomePaciente;
    this.apelido = apelido;
    this.dataInicio = this.formatDate(dataInicio);
    this.dataFim = this.formatDate(dataFim);
  }
}

class PacientePerfil extends BaseEntity {
  constructor(id, idPaciente, idPerfil, dataHoraAlteracao) {
    super(id, dataHoraAlteracao);
    this.idPaciente = idPaciente;
    this.idPerfil = idPerfil;
  }
}

class Categoria extends BaseEntity {
  constructor(id, nomeCategoria, ordemExibicao, dataHoraAlteracao) {
    super(id, dataHoraAlteracao);
    this.nomeCategoria = nomeCategoria;
    this.ordemExibicao = Number(ordemExibicao) || 0;
  }
}

class CategoriaPergunta extends BaseEntity {
  constructor(id, idCategoria, idPergunta, dataHoraAlteracao) {
    super(id, dataHoraAlteracao);
    this.idCategoria = idCategoria;
    this.idPergunta = idPergunta;
  }
}

class PerfilPergunta extends BaseEntity {
  constructor(id, idPerfil, idPergunta, dataHoraAlteracao) {
    super(id, dataHoraAlteracao);
    this.idPerfil = idPerfil;
    this.idPergunta = idPergunta;
  }
}

class Pergunta extends BaseEntity {
  constructor(id, principal, textoPergunta, tipoPergunta, obrigatorio, dataHoraAlteracao) {
    super(id, dataHoraAlteracao);
    this.principal = Number(principal) === 1 ? 1 : 0;
    this.textoPergunta = textoPergunta;
    this.tipoPergunta = Number(tipoPergunta);
    this.obrigatorio = Number(obrigatorio) === 1 ? 1 : 0;
  }
}

class TipoPergunta extends BaseEntity {
  constructor(id, tipo, dataHoraAlteracao) {
    super(id, dataHoraAlteracao);
    this.tipo = Number(tipo);
  }
}

class Resposta extends BaseEntity {
  constructor(id, idPergunta, textoResposta, anuladora, ordemExibicao, idProximaPergunta, dataHoraAlteracao) {
    super(id, dataHoraAlteracao);
    this.idPergunta = idPergunta;
    this.textoResposta = textoResposta;
    this.anuladora = Number(anuladora) === 1 ? 1 : 0;
    this.ordemExibicao = Number(ordemExibicao) || 0;
    this.idProximaPergunta = idProximaPergunta !== "" && idProximaPergunta !== undefined && idProximaPergunta !== null ? idProximaPergunta : null;
  }
}

class Formulario extends BaseEntity {
  constructor(id, idPaciente, nomeFormulario, dataInicio, dataFim, dataHoraAlteracao) {
    super(id, dataHoraAlteracao);
    this.idPaciente = idPaciente;
    this.nomeFormulario = nomeFormulario;
    this.dataInicio = this.formatDate(dataInicio);
    this.dataFim = this.formatDate(dataFim);
  }
}

class FormularioPergunta extends BaseEntity {
  constructor(id, idFormulario, idPergunta, dataHoraAlteracao) {
    super(id, dataHoraAlteracao);
    this.idFormulario = idFormulario;
    this.idPergunta = idPergunta;
  }
}

/**
 * MAPEAMENTO DE ENTIDADES E SUAS RESPECTIVAS ABAS/COLUNAS
 */
const ENTITY_CONFIG = {
  PERFIL: { sheetName: "PERFIL", classRef: Perfil, columns: ["id", "nomePerfil", "dataHoraAlteracao"] },
  PACIENTE: { sheetName: "PACIENTE", classRef: Paciente, columns: ["id", "nomePaciente", "apelido", "dataInicio", "dataFim", "dataHoraAlteracao"] },
  PACIENTE_PERFIL: { sheetName: "PACIENTE_PERFIL", classRef: PacientePerfil, columns: ["id", "idPaciente", "idPerfil", "dataHoraAlteracao"] },
  CATEGORIA: { sheetName: "CATEGORIA", classRef: Categoria, columns: ["id", "nomeCategoria", "ordemExibicao", "dataHoraAlteracao"] },
  CATEGORIA_PERGUNTA: { sheetName: "CATEGORIA_PERGUNTA", classRef: CategoriaPergunta, columns: ["id", "idCategoria", "idPergunta", "dataHoraAlteracao"] },
  PERFIL_PERGUNTA: { sheetName: "PERFIL_PERGUNTA", classRef: PerfilPergunta, columns: ["id", "idPerfil", "idPergunta", "dataHoraAlteracao"] },
  PERGUNTA: { sheetName: "PERGUNTA", classRef: Pergunta, columns: ["id", "principal", "textoPergunta", "tipoPergunta", "obrigatorio", "dataHoraAlteracao"] },
  TIPO_PERGUNTA: { sheetName: "TIPO_PERGUNTA", classRef: TipoPergunta, columns: ["id", "tipo", "dataHoraAlteracao"] },
  RESPOSTA: { sheetName: "RESPOSTA", classRef: Resposta, columns: ["id", "idPergunta", "textoResposta", "anuladora", "ordemExibicao", "idProximaPergunta", "dataHoraAlteracao"] },
  FORMULARIO: { sheetName: "FORMULARIO", classRef: Formulario, columns: ["id", "idPaciente", "nomeFormulario", "dataInicio", "dataFim", "dataHoraAlteracao"] },
  FORMULARIO_PERGUNTA: { sheetName: "FORMULARIO_PERGUNTA", classRef: FormularioPergunta, columns: ["id", "idFormulario", "idPergunta", "dataHoraAlteracao"] }
};

const BULK_CONFIG = {
  PACIENTE_PERFIL: { parentKey: "idPaciente", childKey: "idPerfil", childIsObject: false },
  CATEGORIA_PERGUNTA: { parentKey: "idCategoria", childKey: "idPergunta", childIsObject: false },
  PERFIL_PERGUNTA: { parentKey: "idPerfil", childKey: "idPergunta", childIsObject: false },
  FORMULARIO_PERGUNTA: { parentKey: "idFormulario", childKey: "idPergunta", childIsObject: false },
  RESPOSTA: { parentKey: "idPergunta", childKey: "id", childIsObject: true }
};

/**
 * UTILITÁRIOS E SEGURANÇA
 */
function checkAdminAuth(adminParam) {
  const scriptProperties = PropertiesService.getScriptProperties();
  const storedAdmin = scriptProperties.getProperty("ADMIN");
  return Boolean(storedAdmin && adminParam && String(storedAdmin) === String(adminParam));
}

function getSpreadsheet() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const idPlanilha = scriptProperties.getProperty("SOURCE_DATA_ID");
  if (!idPlanilha) {
    throw new Error('Propriedade SOURCE_DATA_ID não configurada.');
  }
  return SpreadsheetApp.openById(idPlanilha);
}

function responseJSON(payload, status = 200) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function formatDateISO(dateVal) {
  const date = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(date.getTime())) return String(dateVal || "");
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}Z`;
}

function sheetToObjects(sheetName, ClassConstructor, mapRowCallback) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  
  return values.slice(1)
    .filter(row => row[0] !== "" && row[0] !== null && row[0] !== undefined)
    .map(row => mapRowCallback(row, ClassConstructor));
}

/**
 * MONTAGEM RECURSIVA DAS PERGUNTAS E RESPOSTAS
 */
function montarPerguntaComRespostas(perguntaObj, todasPerguntas, todasRespostas, visitados = new Set()) {
  if (!perguntaObj) return null;

  const idStr = String(perguntaObj.id);
  if (visitados.has(idStr)) {
    return { ...perguntaObj, respostas: [] };
  }
  const novosVisitados = new Set(visitados);
  novosVisitados.add(idStr);

  const respostasDaPergunta = todasRespostas
    .filter(r => String(r.idPergunta) === idStr)
    .sort((a, b) => a.ordemExibicao - b.ordemExibicao)
    .map(r => {
      const proxPerguntaObj = r.idProximaPergunta
        ? todasPerguntas.find(p => String(p.id) === String(r.idProximaPergunta))
        : null;

      const proximaPerguntaMontada = proxPerguntaObj
        ? montarPerguntaComRespostas(proxPerguntaObj, todasPerguntas, todasRespostas, novosVisitados)
        : null;

      const { idProximaPergunta, ...restResposta } = r;

      return {
        ...restResposta,
        pergunta: proximaPerguntaMontada
      };
    });

  return {
    ...perguntaObj,
    respostas: respostasDaPergunta
  };
}

/**
 * METODOS CRUD GENÉRICOS PARA AS ABAS
 */
function getAllRecords(entityKey) {
  const config = ENTITY_CONFIG[entityKey.toUpperCase()];
  if (!config) throw new Error(`Entidade '${entityKey}' não é válida.`);

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(config.sheetName);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  return values.slice(1)
    .filter(row => row[0] !== "" && row[0] !== null && row[0] !== undefined)
    .map(row => {
      const instance = new config.classRef(...row);
      return instance;
    });
}

function getBulkRecords(entityKey) {
  const bulkConfig = BULK_CONFIG[entityKey];
  if (!bulkConfig) throw new Error(`Entidade '${entityKey}' não possui rota bulk.`);

  const groups = {};
  getAllRecords(entityKey).forEach(record => {
    const parentId = String(record[bulkConfig.parentKey]);
    if (!groups[parentId]) groups[parentId] = [];
    groups[parentId].push(bulkConfig.childIsObject ? record : record[bulkConfig.childKey]);
  });

  return Object.keys(groups).map(parentId => ({ parentId: parentId, items: groups[parentId] }));
}

function syncBulkRecords(entityKey, data) {
  const bulkConfig = BULK_CONFIG[entityKey];
  if (!bulkConfig) throw new Error(`Entidade '${entityKey}' não possui sincronização bulk.`);
  if (data.parentId === undefined || data.parentId === null || data.parentId === "") {
    throw new Error("Parâmetro 'parentId' é obrigatório para sincronização bulk.");
  }

  const items = Array.isArray(data.items) ? data.items : (Array.isArray(data.childIds) ? data.childIds : []);
  getAllRecords(entityKey)
    .filter(record => String(record[bulkConfig.parentKey]) === String(data.parentId))
    .forEach(record => deleteRecord(entityKey, record.id));

  items.forEach(item => {
    const recordData = bulkConfig.childIsObject
      ? Object.assign({}, item, { [bulkConfig.parentKey]: data.parentId })
      : { [bulkConfig.parentKey]: data.parentId, [bulkConfig.childKey]: item };
    createRecord(entityKey, recordData);
  });

  return { parentId: data.parentId, items: items };
}

function createRecord(entityKey, data) {
  const config = ENTITY_CONFIG[entityKey.toUpperCase()];
  if (!config) throw new Error(`Entidade '${entityKey}' não é válida.`);

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(config.sheetName);
  if (!sheet) throw new Error(`Aba '${config.sheetName}' não encontrada.`);

  const id = data.id || Utilities.getUuid();
  const nowISO = formatDateISO(new Date());

  data.id = id;
  data.dataHoraAlteracao = nowISO;

  const rowToInsert = config.columns.map(col => {
    let val = data[col];
    if (col === "dataInicio" || col === "dataFim") {
      val = val ? formatDateISO(val) : "";
    }
    return val !== undefined && val !== null ? val : "";
  });

  sheet.appendRow(rowToInsert);

  const instance = new config.classRef(...rowToInsert);
  return instance;
}

function updateRecord(entityKey, data) {
  if (!data.id) throw new Error("Parâmetro 'id' é obrigatório para atualização.");

  const config = ENTITY_CONFIG[entityKey.toUpperCase()];
  if (!config) throw new Error(`Entidade '${entityKey}' não é válida.`);

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(config.sheetName);
  if (!sheet) throw new Error(`Aba '${config.sheetName}' não encontrada.`);

  const values = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(data.id)) {
      rowIndex = i + 1; // 1-based index
      break;
    }
  }

  if (rowIndex === -1) throw new Error(`Registro com ID '${data.id}' não foi encontrado.`);

  const nowISO = formatDateISO(new Date());
  data.dataHoraAlteracao = nowISO;

  const rowToUpdate = config.columns.map((col, idx) => {
    let val = data[col];
    if (val === undefined) {
      val = values[rowIndex - 1][idx]; // mantém o valor atual caso não enviado
    } else if (col === "dataInicio" || col === "dataFim") {
      val = val ? formatDateISO(val) : "";
    }
    return val;
  });

  sheet.getRange(rowIndex, 1, 1, rowToUpdate.length).setValues([rowToUpdate]);

  return new config.classRef(...rowToUpdate);
}

function deleteRecord(entityKey, id) {
  if (!id) throw new Error("Parâmetro 'id' é obrigatório para exclusão.");

  const config = ENTITY_CONFIG[entityKey.toUpperCase()];
  if (!config) throw new Error(`Entidade '${entityKey}' não é válida.`);

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(config.sheetName);
  if (!sheet) throw new Error(`Aba '${config.sheetName}' não encontrada.`);

  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true, message: `Registro ID ${id} excluído com sucesso.` };
    }
  }

  throw new Error(`Registro com ID '${id}' não encontrado.`);
}

/**
 * ENDPOINT GET
 * - Permite consulta pública de formulários para paciente: GET ?dado=formulario&pacienteId=UUID
 * - Permite CRUD READ para admins: GET ?dado=NOME_ENTIDADE&admin=UUID (Retorna os dados da aba solicitada)
 */
function doGet(e) {
  try {
    const adminParam = e?.parameter?.admin;
    const isAdmin = checkAdminAuth(adminParam);

    const dados = e?.parameters?.dado || [];
    const pacienteId = e?.parameter?.pacienteId;

    // Se admin for informado porém for inválido
    if (adminParam && !isAdmin) {
      return responseJSON({ success: false, error: "Acesso negado. Token ADMIN inválido." }, 403);
    }

    // --- ROTA DE LEITURA CRUD ADMIN ---
    if (isAdmin && dados.length > 0 && e?.parameter?.bulk === "true" && BULK_CONFIG[dados[0].toUpperCase()]) {
      const entityKey = dados[0].toUpperCase();
      return responseJSON({ success: true, entity: entityKey, bulk: true, data: getBulkRecords(entityKey) });
    }

    if (isAdmin && dados.length > 0 && ENTITY_CONFIG[dados[0].toUpperCase()]) {
      const entityKey = dados[0].toUpperCase();
      const records = getAllRecords(entityKey);
      return responseJSON({
        success: true,
        entity: entityKey,
        data: records
      });
    }

    // --- ROTA ORIGINAL DE CONSULTA DO PACIENTE ---
    const incluiFormulario = dados.includes("formulario");
    const incluiPergunta = dados.includes("pergunta");

    if (!incluiFormulario || !pacienteId) {
      return responseJSON({ 
        success: false, 
        error: "Parâmetros inválidos ou ausentes." 
      }, 400);
    }

    const pacientes = sheetToObjects("PACIENTE", Paciente, (r, C) => new C(r[0], r[1], r[2], r[3], r[4], r[5]));
    const paciente = pacientes.find(p => String(p.id) === String(pacienteId));

    if (!paciente) {
      return responseJSON({ success: false, error: `Paciente não encontrado.` }, 404);
    }

    const agora = new Date();
    const pacienteDataFim = parseDate(paciente.dataFim);

    if (!pacienteDataFim || pacienteDataFim < agora) {
      return responseJSON({ 
        success: false, 
        error: "Paciente com cadastro expirado ou inválido." 
      }, 403);
    }

    const todosFormularios = sheetToObjects("FORMULARIO", Formulario, (r, C) => new C(r[0], r[1], r[2], r[3], r[4], r[5]));
    
    const formulariosAtivos = todosFormularios.filter(f => {
      if (String(f.idPaciente) !== String(pacienteId)) return false;
      const fInicio = parseDate(f.dataInicio);
      const fFim = parseDate(f.dataFim);
      return fInicio && fFim && agora >= fInicio && agora <= fFim;
    });

    const primeiroNome = paciente.nomePaciente ? paciente.nomePaciente.trim().split(' ')[0] : 'paciente';

    if (formulariosAtivos.length === 0) {
      return responseJSON({ 
        success: false, 
        error: `Olá ${primeiroNome}, no momento não existe formulário para você.`
      }, 404);
    }

    if (!incluiPergunta) {
      return responseJSON({
        success: true,
        paciente: paciente,
        formularios: formulariosAtivos.map(f => ({ ...f, categorias: [] }))
      });
    }

    const formularioPerguntas = sheetToObjects("FORMULARIO_PERGUNTA", FormularioPergunta, (r, C) => new C(r[0], r[1], r[2], r[3]));
    const categoriaPerguntas = sheetToObjects("CATEGORIA_PERGUNTA", CategoriaPergunta, (r, C) => new C(r[0], r[1], r[2], r[3]));
    const categorias = sheetToObjects("CATEGORIA", Categoria, (r, C) => new C(r[0], r[1], r[2], r[3]));
    const todasPerguntas = sheetToObjects("PERGUNTA", Pergunta, (r, C) => new C(r[0], r[1], r[2], r[3], r[4], r[5]));
    const todasRespostas = sheetToObjects("RESPOSTA", Resposta, (r, C) => new C(r[0], r[1], r[2], r[3], r[4], r[5], r[6]));

    const formulariosHierarquicos = formulariosAtivos.map(form => {
      const idsPerguntasDoForm = formularioPerguntas
        .filter(fp => String(fp.idFormulario) === String(form.id))
        .map(fp => String(fp.idPergunta));

      const categoriasDoForm = [];

      categorias.sort((a, b) => a.ordemExibicao - b.ordemExibicao).forEach(cat => {
        const idsPerguntasDaCat = categoriaPerguntas
          .filter(cp => String(cp.idCategoria) === String(cat.id) && idsPerguntasDoForm.includes(String(cp.idPergunta)))
          .map(cp => String(cp.idPergunta));

        if (idsPerguntasDaCat.length > 0) {
          const perguntasMapeadas = todasPerguntas
            .filter(p => idsPerguntasDaCat.includes(String(p.id)))
            .map(p => montarPerguntaComRespostas(p, todasPerguntas, todasRespostas));

          categoriasDoForm.push({
            ...cat,
            perguntas: perguntasMapeadas
          });
        }
      });

      return {
        ...form,
        categorias: categoriasDoForm
      };
    });

    return responseJSON({
      success: true,
      paciente: paciente,
      formularios: formulariosHierarquicos
    });

  } catch (err) {
    return responseJSON({
      success: false,
      error: "Erro interno no servidor do Apps Script: " + err.toString()
    }, 500);
  }
}

/**
 * ENDPOINT POST (ADMIN CRUD)
 * Requer o query param ?admin=UUID válido.
 * 
 * Estrutura do JSON no corpo da requisição (postData.contents):
 * {
 *   "action": "CREATE" | "UPDATE" | "DELETE",
 *   "entity": "PACIENTE" | "PERGUNTA" | ... (Qualquer nome de classe/aba),
 *   "data": { ... } // Dados para inclusão/edição ou { "id": "..." } para deleção
 * }
 */
function doPost(e) {
  try {
    const adminParam = e?.parameter?.admin;

    if (!checkAdminAuth(adminParam)) {
      return responseJSON({ 
        success: false, 
        error: "Acesso não autorizado. Token ADMIN é obrigatório ou inválido." 
      }, 401);
    }

    let payload = {};
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }

    const { action, entity, data } = payload;
    const entityKey = (entity || e?.parameter?.dado || "").toUpperCase();

    if (!action) {
      return responseJSON({ success: false, error: "Ação ('action') não informada no corpo da requisição." }, 400);
    }

    if (!entityKey || !ENTITY_CONFIG[entityKey]) {
      return responseJSON({ success: false, error: `Entidade '${entityKey}' é inválida ou não suportada.` }, 400);
    }

    let result;
    switch (action.toUpperCase()) {
      case "BULK_SYNC":
        result = syncBulkRecords(entityKey, data || {});
        return responseJSON({ success: true, action: "BULK_SYNC", data: result }, 200);

      case "CREATE":
        result = createRecord(entityKey, data || {});
        return responseJSON({ success: true, action: "CREATE", data: result }, 201);

      case "UPDATE":
        result = updateRecord(entityKey, data || {});
        return responseJSON({ success: true, action: "UPDATE", data: result }, 200);

      case "DELETE":
        const idToDelete = data?.id || payload.id;
        result = deleteRecord(entityKey, idToDelete);
        return responseJSON({ success: true, action: "DELETE", result: result }, 200);

      default:
        return responseJSON({ success: false, error: `Ação '${action}' não reconhecida. Use CREATE, UPDATE ou DELETE.` }, 400);
    }

  } catch (err) {
    return responseJSON({
      success: false,
      error: "Erro no processamento da requisição POST: " + err.toString()
    }, 500);
  }
}