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
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
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
    this.nomePaciente = apelido || nomePaciente;
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
    this.anuladora = Number(anuladora) === 1 ? 1 : 0; // 0 ou 1
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
 * AUXILIARES DE LEITURA
 */
function sheetToObjects(sheetName, ClassConstructor, mapRowCallback) {

  const scriptProperties = PropertiesService.getScriptProperties();
  let ID_DA_PLANILHA = "";
  try { 
    ID_DA_PLANILHA = scriptProperties.getProperty("SOURCE_DATA_ID");
  } catch (err) {
    throw new Error('Falha a consultar propriedas do sistema');
  }

  const ss = SpreadsheetApp.openById(ID_DA_PLANILHA);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  
  return values.slice(1)
    .filter(row => row[0] !== "" && row[0] !== null && row[0] !== undefined)
    .map(row => mapRowCallback(row, ClassConstructor));
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function responseJSON(payload, status = 200) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
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
 * ENDPOINT DA ROTA PARAMETRIZADA
 * - ?dado=formulario&pacienteId=UUID (Apenas formulários ativos)
 * - ?dado=formulario&dado=pergunta&pacienteId=UUID (Formulários + Categorias + Perguntas)
 */
function doGet(e) {
  try {
    const dados = e?.parameters?.dado || [];
    const pacienteId = e?.parameter?.pacienteId;

    const incluiFormulario = dados.includes("formulario");
    const incluiPergunta = dados.includes("pergunta");

    if (!incluiFormulario || !pacienteId) {
      return responseJSON({ 
        success: false, 
        error: "Parâmetros obrigatórios ausentes: 'dado=formulario' e 'pacienteId'." 
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

    // Caso não tenha solicitado as perguntas, retorna apenas a lista de formulários e o paciente
    if (!incluiPergunta) {
      return responseJSON({
        success: true,
        paciente: paciente,
        formularios: formulariosAtivos.map(f => ({ ...f, categorias: [] }))
      });
    }

    // Se solicitou as perguntas (?dado=formulario&dado=pergunta)
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