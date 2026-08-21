'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaWhatsapp, FaPlay } from 'react-icons/fa';
import { OptionCard } from '@/components/ui/OptionCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LOGO_BASE64 } from '@/constants/logo';

import { Pergunta, Resposta, TipoPerguntaEnum, PayloadAppsScript, FormularioHierarquico, Paciente } from '@/types/form';
import { LoadingUi } from '../../components/ui/LoadingUi';

function QuizApp() {
  const searchParams = useSearchParams();
  const pacienteId = searchParams.get('pacienteId');

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dados do paciente e lista de formulários ativos
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [formulariosAtivos, setFormulariosAtivos] = useState<FormularioHierarquico[]>([]);

  // Dados dos formulários completos com perguntas
  const [formulariosCompletos, setFormulariosCompletos] = useState<FormularioHierarquico[] | null>(null);
  const [loadingPerguntas, setLoadingPerguntas] = useState(false);

  // Estado do formulário selecionado no momento
  const [selectedFormId, setSelectedFormId] = useState<string | number | null>(null);
  const [nomeFormulario, setNomeFormulario] = useState<string | null>(null);
  const [rawPerguntas, setRawPerguntas] = useState<Pergunta[]>([]);

  // Estados de navegação entre as perguntas
  const [currentPerguntaId, setCurrentPerguntaId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [returnStack, setReturnStack] = useState<string[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string | string[]>>({});
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState<string>('');

  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!pacienteId) {
        setErrorMessage('O parâmetro pacienteId é obrigatório na URL.');
        setLoading(false);
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;

      if (!baseUrl) {
        setErrorMessage('A variável de ambiente não foi configurada.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 1. Chamada completa com dado=formulario&dado=pergunta
        const fullQuestionsUrl = `${baseUrl}?dado=formulario&dado=pergunta&pacienteId=${encodeURIComponent(pacienteId)}`;
        const promiseQuestions = fetch(fullQuestionsUrl).then(res => res.json());

        // 2. Chamada simples com dado=formulario
        const simpleUrl = `${baseUrl}?dado=formulario&pacienteId=${encodeURIComponent(pacienteId)}`;
        const promiseSimple = fetch(simpleUrl).then(res => res.json());

        const resultSimple: PayloadAppsScript = await promiseSimple;

        if (!resultSimple.success) {
          throw new Error(resultSimple.error || 'Erro ao carregar os formulários do paciente.');
        }

        if (isMounted) {
          if (resultSimple.paciente) setPaciente(resultSimple.paciente);
          if (resultSimple.formularios) setFormulariosAtivos(resultSimple.formularios);
          setLoading(false);
        }

        const resultQuestions: PayloadAppsScript = await promiseQuestions;
        if (isMounted && resultQuestions.success && resultQuestions.formularios) {
          setFormulariosCompletos(resultQuestions.formularios);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message || 'Falha ao carregar formulários.');
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [pacienteId]);

  // Função para iniciar as perguntas de um formulário selecionado
  const handleSelecionarFormulario = async (form: FormularioHierarquico) => {
    setSelectedFormId(form.id);
    setLoadingPerguntas(true);

    let compList = formulariosCompletos;

    if (!compList) {
      const baseUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;
      if (baseUrl && pacienteId) {
        try {
          const fullQuestionsUrl = `${baseUrl}?dado=formulario&dado=pergunta&pacienteId=${encodeURIComponent(pacienteId)}`;
          const response = await fetch(fullQuestionsUrl);
          const result: PayloadAppsScript = await response.json();
          if (result.success && result.formularios) {
            compList = result.formularios;
            setFormulariosCompletos(result.formularios);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    const targetForm = compList?.find((f) => String(f.id) === String(form.id)) || form;

    setNomeFormulario(targetForm.nomeFormulario);

    const lista: Pergunta[] = [];
    if (targetForm.categorias) {
      targetForm.categorias.forEach((cat) => {
        cat.perguntas?.forEach((perg) => {
          lista.push({
            ...perg,
            nomeCategoria: cat.nomeCategoria,
          });
        });
      });
    }

    setRawPerguntas(lista);
    
    if (lista.length > 0) {
      const initial = lista.find((p) => Number(p.principal) === 1) || lista[0];
      setCurrentPerguntaId(String(initial.id));
    }

    setLoadingPerguntas(false);
  };

  // Função para voltar à lista inicial de formulários
  const handleVoltarParaLista = () => {
    setSelectedFormId(null);
    setNomeFormulario(null);
    setRawPerguntas([]);
    setCurrentPerguntaId(null);
    setHistory([]);
    setReturnStack([]);
    setUserAnswers({});
    setIsSubmitted(false);
  };

  // Formatação para DD/MM/YYYY ÀS HH:MM:SS
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      return `${day}/${month}/${year} às ${hours}:${minutes}:${seconds}`;
    } catch {
      return dateStr;
    }
  };

  const allPerguntasMap = useMemo(() => {
    const map = new Map<string, Pergunta>();

    const registrar = (p: Pergunta, parentCategoria?: string) => {
      const idStr = String(p.id);
      const categoriaDefinitiva = p.nomeCategoria || parentCategoria || '';

      const perguntaComCategoria: Pergunta = {
        ...p,
        nomeCategoria: categoriaDefinitiva,
      };

      if (!map.has(idStr)) {
        map.set(idStr, perguntaComCategoria);
      }

      p.respostas?.forEach((r) => {
        if (r.pergunta) {
          registrar(r.pergunta, categoriaDefinitiva);
        }
      });
    };

    rawPerguntas.forEach((p) => registrar(p, p.nomeCategoria));
    return map;
  }, [rawPerguntas]);

  const subPerguntaIds = useMemo(() => {
    const subIds = new Set<string>();
    allPerguntasMap.forEach((p) => {
      p.respostas?.forEach((r) => {
        if (r.pergunta) {
          subIds.add(String(r.pergunta.id));
        }
      });
    });
    return subIds;
  }, [allPerguntasMap]);

  const mainPerguntas = useMemo(() => {
    return rawPerguntas.filter((p) => !subPerguntaIds.has(String(p.id)));
  }, [rawPerguntas, subPerguntaIds]);

  const executeTransition = (action: () => void) => {
    setIsAnimating(true);
    setTimeout(() => {
      action();
      setIsAnimating(false);
    }, 350);
  };

  const currentPergunta = currentPerguntaId ? allPerguntasMap.get(String(currentPerguntaId)) : null;
  const currentRespostas = currentPergunta?.respostas || [];
  const isObrigatorio = currentPergunta ? Number(currentPergunta.obrigatorio) === 1 : false;

  // Determina dinamicamente o ID da próxima pergunta com base nas respostas e na hierarquia
  const calculateNextPerguntaId = (
    pergId: string | null,
    answers: Record<string, string | string[]>,
    stack: string[]
  ): string | null => {
    if (!pergId) return null;

    const perg = allPerguntasMap.get(String(pergId));
    if (!perg) return null;

    const idKey = String(pergId);
    const currentAnswer = answers[idKey];
    let nextId: string | null = null;

    // 1. Caso a pergunta seja Objetiva e leve para uma subpergunta
    if (Number(perg.tipoPergunta) === TipoPerguntaEnum.OBJETIVA && typeof currentAnswer === 'string') {
      const selectedOption = (perg.respostas || []).find((r) => r.textoResposta === currentAnswer);
      if (selectedOption?.pergunta?.id !== undefined && selectedOption?.pergunta?.id !== null) {
        nextId = String(selectedOption.pergunta.id);
      }
    }

    // 2. Se não houver subpergunta, retoma o fluxo principal
    if (!nextId) {
      let referenceId = idKey;
      if (subPerguntaIds.has(idKey) && stack.length > 0) {
        referenceId = stack[stack.length - 1];
      }

      const mainIdx = mainPerguntas.findIndex((p) => String(p.id) === String(referenceId));
      if (mainIdx !== -1 && mainIdx < mainPerguntas.length - 1) {
        nextId = String(mainPerguntas[mainIdx + 1].id);
      }
    }

    return nextId;
  };

  const isLastQuestion = useMemo(() => {
    if (!currentPerguntaId || !currentPergunta) return false;
    const nextId = calculateNextPerguntaId(currentPerguntaId, userAnswers, returnStack);
    return nextId === null;
  }, [currentPerguntaId, currentPergunta, userAnswers, returnStack, mainPerguntas, subPerguntaIds, allPerguntasMap]);

  const handleSingleSelect = (resposta: Resposta) => {
    if (!currentPerguntaId) return;
    setUserAnswers((prev) => ({ ...prev, [String(currentPerguntaId)]: resposta.textoResposta }));
  };

  const handleToggleMultiSelect = (respostaClicada: Resposta) => {
    if (!currentPerguntaId) return;

    const idKey = String(currentPerguntaId);
    const textoResposta = respostaClicada.textoResposta;
    const currentSelected = (userAnswers[idKey] as string[]) || [];

    if (Number(respostaClicada.anuladora) === 1) {
      if (currentSelected.includes(textoResposta)) {
        setUserAnswers((prev) => ({ ...prev, [idKey]: [] }));
      } else {
        setUserAnswers((prev) => ({ ...prev, [idKey]: [textoResposta] }));
      }
      return;
    }

    if (currentSelected.includes(textoResposta)) {
      const updated = currentSelected.filter((item) => item !== textoResposta);
      setUserAnswers((prev) => ({ ...prev, [idKey]: updated }));
    } else {
      const textosAnuladores = currentRespostas
        .filter((r) => Number(r.anuladora) === 1)
        .map((r) => r.textoResposta);

      const filterSemAnuladores = currentSelected.filter((item) => !textosAnuladores.includes(item));
      const updated = [...filterSemAnuladores, textoResposta];

      setUserAnswers((prev) => ({ ...prev, [idKey]: updated }));
    }
  };

  const executingEnvioFormulario = () => {
    const tituloFormulario = nomeFormulario && nomeFormulario.trim() !== ''
      ? `📋 ${nomeFormulario.trim().toUpperCase()}`
      : '📋 FORMULÁRIO';

    let mensagemFormatada = `*${tituloFormulario}*\n\n`;

    const orderedPerguntaIds = [...history];
    if (currentPerguntaId && !orderedPerguntaIds.includes(String(currentPerguntaId))) {
      orderedPerguntaIds.push(String(currentPerguntaId));
    }

    let categoriaAtual = '';

    orderedPerguntaIds.forEach((keyId) => {
      const perg = allPerguntasMap.get(keyId);
      const respVal = userAnswers[keyId];

      if (perg && respVal !== undefined) {
        let textoResp = '';
        if (Array.isArray(respVal)) {
          textoResp = respVal.join('; ');
        } else {
          textoResp = String(respVal);
        }

        if (textoResp.trim() !== '') {
          const catNome = perg.nomeCategoria || 'Geral';

          if (catNome !== categoriaAtual) {
            categoriaAtual = catNome;
            mensagemFormatada += `*${categoriaAtual}*\n\n`;
          }

          mensagemFormatada += `* *${perg.textoPergunta}*\n   ✍️ _${textoResp}_\n\n`;
        }
      }
    });

    const mensagemUrlEncoded = encodeURIComponent(mensagemFormatada.trim());
    let urlWhatsapp = `https://api.whatsapp.com/send?text=${mensagemUrlEncoded}`;

    const numeroWhatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';
    if (numeroWhatsapp && numeroWhatsapp.trim() !== "") {
      urlWhatsapp += `&phone=${numeroWhatsapp.replace(/\D/g, '')}`;
    }

    setWhatsappUrl(urlWhatsapp);
    setIsSubmitted(true);

    setTimeout(() => {
      window.open(urlWhatsapp, '_blank');
    }, 1000);
  };

  const handleNext = () => {
    if (!currentPerguntaId || !currentPergunta) return;

    const idKey = String(currentPerguntaId);
    const currentAnswer = userAnswers[idKey];

    if (isObrigatorio) {
      if (!currentAnswer) return;
      if (Array.isArray(currentAnswer) && currentAnswer.length === 0) return;
      if (typeof currentAnswer === 'string' && !currentAnswer.trim()) return;
    }

    if (isLastQuestion) {
      executingEnvioFormulario();
      return;
    }

    let nextId: string | null = null;
    let nextReturnStack = [...returnStack];

    if (Number(currentPergunta.tipoPergunta) === TipoPerguntaEnum.OBJETIVA && typeof currentAnswer === 'string') {
      const selectedOption = currentRespostas.find((r) => r.textoResposta === currentAnswer);
      if (selectedOption?.pergunta?.id !== undefined && selectedOption?.pergunta?.id !== null) {
        nextId = String(selectedOption.pergunta.id);
        nextReturnStack.push(idKey);
      }
    }

    if (!nextId) {
      let referenceId = idKey;
      if (subPerguntaIds.has(idKey) && nextReturnStack.length > 0) {
        referenceId = nextReturnStack[nextReturnStack.length - 1];
      }

      const mainIdx = mainPerguntas.findIndex((p) => String(p.id) === String(referenceId));
      if (mainIdx !== -1 && mainIdx < mainPerguntas.length - 1) {
        nextId = String(mainPerguntas[mainIdx + 1].id);
      }
    }

    executeTransition(() => {
      setReturnStack(nextReturnStack);
      setHistory((prev) => [...prev, idKey]);
      setCurrentPerguntaId(nextId);
    });
  };

  const handleBack = () => {
    if (history.length === 0) {
      handleVoltarParaLista();
      return;
    }

    const prevId = history[history.length - 1];

    executeTransition(() => {
      setReturnStack((prev) => {
        if (prev.length > 0 && prev[prev.length - 1] === prevId) {
          return prev.slice(0, -1);
        }
        if (subPerguntaIds.has(prevId)) {
          const parentPergunta = Array.from(allPerguntasMap.values()).find((p) =>
            p.respostas?.some((r) => String(r.pergunta?.id) === prevId)
          );
          if (parentPergunta) {
            return [...prev, String(parentPergunta.id)];
          }
        }
        return prev;
      });
      setHistory((prev) => prev.slice(0, -1));
      setCurrentPerguntaId(prevId);
    });
  };

  if (loading || loadingPerguntas) {
    return <LoadingUi />;
  }

  if (errorMessage) {
    return (
      <div className="h-screen bg-[#f9f7f2] flex items-center justify-center p-4">
        <div className="bg-white border border-red-200 text-red-700 p-6 rounded-2xl max-w-md shadow-md text-center">
          <p className="font-bold text-lg mb-2">⚠️ Atenção</p>
          <p className="text-sm">{errorMessage}</p>
        </div>
      </div>
    );
  }

  const respondidasNoHistorico = new Set(
    history.filter((id) => !subPerguntaIds.has(String(id)))
  ).size;

  const progressPercent = isSubmitted || (!currentPergunta && mainPerguntas.length > 0)
    ? 100
    : mainPerguntas.length > 0
    ? Math.min(100, Math.round((respondidasNoHistorico / mainPerguntas.length) * 100))
    : 0;

  const currentSingleAnswer = currentPerguntaId ? (userAnswers[String(currentPerguntaId)] as string) || '' : '';
  const currentMultiAnswers = currentPerguntaId ? ((userAnswers[String(currentPerguntaId)] as string[]) || []) : [];
  const currentTextAnswer = currentPerguntaId ? (userAnswers[String(currentPerguntaId)] as string) || '' : '';

  const isNextDisabled = () => {
    if (!isObrigatorio) return false;
    if (!currentPergunta) return true;

    const tipo = Number(currentPergunta.tipoPergunta);

    if (tipo === TipoPerguntaEnum.OBJETIVA) {
      return !currentSingleAnswer;
    }
    if (tipo === TipoPerguntaEnum.MULTIPLA) {
      return currentMultiAnswers.length === 0;
    }
    if (tipo === TipoPerguntaEnum.TEXTO) {
      return !currentTextAnswer.trim();
    }
    return false;
  };

  const nomePacienteFormatado = paciente?.nomePaciente
    ? paciente.nomePaciente.trim().split(' ')[0]
    : 'Paciente';

  return (
    <div className="h-screen max-h-screen w-full bg-[#f9f7f2] text-[#2d312e] flex flex-col items-center justify-between p-4 font-sans overflow-hidden">
      <style>{`
        @keyframes backgroundPan {
          0% { background-position: 0% center; }
          100% { background-position: -200% center; }
        }
        .brand-shine {
          animation: backgroundPan 3.5s linear infinite;
          background: linear-gradient(
            to right,
            #1b532b,
            #498a28,
            #c39a2b,
            #1b532b
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      <div className="w-full max-w-2xl h-full flex flex-col">
        {/* HEADER */}
        <header className="flex-shrink-0 py-3 flex items-center justify-start gap-3">
          {LOGO_BASE64 && (
            <img
              src={LOGO_BASE64}
              alt="Logo"
              className="h-16 w-auto object-contain"
            />
          )}

          <div className="brand-shine flex flex-col">
            <span className="font-mono text-xs font-bold tracking-widest">
              Nutricionista
            </span>
            <span className="font-mono text-xl font-bold whitespace-nowrap">
              Maxsoane Costa
            </span>
          </div>
        </header>

        {/* BARRA DE PROGRESSO */}
        {selectedFormId && (
          <section className="flex-shrink-0 py-2 flex items-center justify-center">
            <div className="w-full">
              <ProgressBar progress={progressPercent} isAnimating={isAnimating} />
            </div>
          </section>
        )}

        <main className="flex-1 min-h-0 overflow-y-auto py-4">
          {/* TELA INICIAL: LISTA DE FORMULÁRIOS PENDENTES */}
          {!selectedFormId ? (
            <div className="bg-[#ffffff] border border-[#e2e5e2] rounded-2xl p-6 md:p-8 shadow-[0_12px_35px_rgba(27,83,43,0.06)]">
              <h1 className="text-xl md:text-2xl font-bold text-[#1b532b] mb-2">
                Olá {nomePacienteFormatado},
              </h1>
              <p className="text-[#6e7570] mb-6 text-sm md:text-base">
                Há formulário(s) pendente(s):
              </p>

              {/* LISTA DE CARTÕES RESPONSIVOS */}
              <div className="space-y-4">
                {formulariosAtivos.map((form) => (
                  <div
                    key={form.id}
                    className="p-5 rounded-2xl border border-[#e2e5e2] bg-[#ffffff] hover:border-[#1b532b]/30 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <h3 className="font-bold text-base md:text-lg text-[#1b532b] mb-1">
                        {form.nomeFormulario}
                      </h3>
                      <p className="text-xs md:text-sm text-[#6e7570] font-medium">
                        Disponível até {formatDateTime(form.dataFim)}
                      </p>
                    </div>

                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleSelecionarFormulario(form)}
                        className="w-full sm:w-auto bg-[#1b532b] hover:bg-[#498a28] text-white font-semibold py-2.5 px-5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
                      >
                        <span>Responder</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : isSubmitted ? (
            /* MODAL / TELA DE MENSAGEM ENVIADA */
            <div className="bg-[#ffffff] border border-[#e2e5e2] rounded-2xl p-8 shadow-[0_12px_35px_rgba(27,83,43,0.06)] text-center my-auto">
              <h2 className="text-2xl font-bold text-[#1b532b] mb-2">
                Respondido!
              </h2>
              <p className="text-[#2d312e] mt-2">
                Você está sendo redirecionado para o WhatsApp para enviar suas respostas.
              </p>
              <p className="text-[#6e7570] text-xs mt-2">
                Se a janela não abrir automaticamente, clique no botão abaixo.
              </p>
              
              <div className="mt-6 flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.open(whatsappUrl, '_blank')}
                  className="w-full sm:w-auto bg-[#25D366] hover:bg-[#1ebd59] text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <FaWhatsapp className="w-5 h-5" />
                  <span>Enviar no WhatsApp</span>
                </button>

                {/* BOTÃO SECUNDÁRIO PARA VOLTAR À LISTA */}
                <button
                  type="button"
                  onClick={handleVoltarParaLista}
                  className="text-xs font-medium text-[#6e7570] hover:text-[#1b532b] underline transition-colors pt-2"
                >
                  Voltar para a lista de formulários
                </button>
              </div>
            </div>
          ) : currentPergunta ? (
            /* EXIBIÇÃO DA PERGUNTA */
            <div
              className={`bg-[#ffffff] border border-[#e2e5e2] rounded-2xl p-6 md:p-8 shadow-[0_12px_35px_rgba(27,83,43,0.06)] transition-opacity duration-200 delay-150 ease-out ${
                isAnimating ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              <span className="block text-xs uppercase font-bold tracking-widest text-[#c39a2b] mb-3">
                {subPerguntaIds.has(String(currentPergunta.id))
                  ? 'Subpergunta Condicional'
                  : currentPergunta.nomeCategoria || ''}
              </span>

              <h2 className="text-xl md:text-2xl font-semibold text-[#1b532b] mb-2 leading-snug">
                {currentPergunta.textoPergunta}
                {isObrigatorio ? (
                  <span className="text-red-500 ml-1">*</span>
                ) : (
                  <span className="text-xs font-normal text-[#6e7570] ml-2">(Opcional)</span>
                )}
              </h2>

              {/* SELEÇÃO ÚNICA */}
              {Number(currentPergunta.tipoPergunta) === TipoPerguntaEnum.OBJETIVA && (
                <div className="space-y-3 my-6">
                  {currentRespostas.map((resposta) => (
                    <OptionCard
                      key={resposta.id}
                      id={`resp_${resposta.id}`}
                      value={resposta.textoResposta}
                      type="radio"
                      selected={userAnswers[String(currentPergunta.id)] === resposta.textoResposta}
                      onSelect={() => handleSingleSelect(resposta)}
                    />
                  ))}
                </div>
              )}

              {/* SELEÇÃO MÚLTIPLA */}
              {Number(currentPergunta.tipoPergunta) === TipoPerguntaEnum.MULTIPLA && (
                <div className="space-y-3 my-6">
                  {currentRespostas.map((resposta) => (
                    <OptionCard
                      key={resposta.id}
                      id={`resp_${resposta.id}`}
                      value={resposta.textoResposta}
                      type="checkbox"
                      selected={currentMultiAnswers.includes(resposta.textoResposta)}
                      onSelect={() => handleToggleMultiSelect(resposta)}
                    />
                  ))}
                </div>
              )}

              {/* TEXTO */}
              {Number(currentPergunta.tipoPergunta) === TipoPerguntaEnum.TEXTO && (
                <div className="my-6">
                  <textarea
                    rows={4}
                    value={currentTextAnswer}
                    onChange={(e) =>
                      setUserAnswers((prev) => ({
                        ...prev,
                        [String(currentPergunta.id)]: e.target.value,
                      }))
                    }
                    placeholder={isObrigatorio ? "Digite sua resposta..." : "Digite sua resposta (opcional)..."}
                    className="w-full p-4 rounded-xl border-2 border-[#e2e5e2] focus:border-[#1b532b] focus:ring-0 text-[#2d312e] transition-colors outline-none"
                  />
                </div>
              )}

              {/* BOTÕES DE NAVEGAÇÃO: EMPILHADOS NO MOBILE (AVANÇAR EM CIMA), LADO A LADO NO DESKTOP */}
              <div className="flex flex-col md:flex-row gap-3 mt-6">
                {/* BOTÃO AVANÇAR / PULAR (PRIMEIRO NO MOBILE, DIREITA NO DESKTOP) */}
                <div className="order-1 md:order-2 flex gap-3 w-full md:w-1/2">
                  {!isObrigatorio && Number(currentPergunta.tipoPergunta) === TipoPerguntaEnum.TEXTO && (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="w-1/3 bg-[#e2e5e2] hover:bg-[#d5d9d5] text-[#6e7570] font-semibold py-3.5 rounded-xl transition-colors"
                    >
                      Pular
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isNextDisabled() || isAnimating}
                    className={`${
                      !isObrigatorio && Number(currentPergunta.tipoPergunta) === TipoPerguntaEnum.TEXTO
                        ? 'w-2/3'
                        : 'w-full'
                    } ${
                      isLastQuestion
                        ? 'bg-[#25D366] hover:bg-[#1ebd59]'
                        : 'bg-[#1b532b] hover:bg-[#498a28]'
                    } disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2`}
                  >
                    {isLastQuestion ? (
                      <>
                        <FaWhatsapp className="w-5 h-5" />
                        <span>Enviar no WhatsApp</span>
                      </>
                    ) : (
                      'Avançar'
                    )}
                  </button>
                </div>

                {/* BOTÃO VOLTAR (SEGUNDO NO MOBILE, ESQUERDA NO DESKTOP) */}
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isAnimating}
                  className="order-2 md:order-1 w-full md:w-1/2 bg-[#e2e5e2] hover:bg-[#d5d9d5] text-[#2d312e] font-semibold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                >
                 Voltar
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#ffffff] border border-[#e2e5e2] rounded-2xl p-8 shadow-[0_12px_35px_rgba(27,83,43,0.06)] text-center my-auto">
              <h2 className="text-2xl font-bold text-[#1b532b] mb-2">
                Formulário Concluído!
              </h2>
              <p className="text-[#6e7570]">
                Suas respostas foram registradas com sucesso.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={<LoadingUi />}>
      <QuizApp />
    </Suspense>
  );
}