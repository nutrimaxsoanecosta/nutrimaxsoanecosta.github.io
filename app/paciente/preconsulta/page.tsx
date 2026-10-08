'use client';

import { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaWhatsapp, FaPlay } from 'react-icons/fa';
import { OptionCard } from '@/components/ui/OptionCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LOGO_BASE64 } from '@/constants/logo';

import { Pergunta, Resposta, TipoPerguntaEnum, PayloadAppsScript, FormularioHierarquico, Paciente } from '@/types/form';
import { LoadingUi } from '@/components/ui/LoadingUi';

  // Utilitários de formatação via Regex
export function formatarData(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 8); // Mantém só números (máx 8)
  return digitos
    .replace(/^(\d{2})(\d)/, '$1/$2')
    .replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
}

export function formatarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11); // Mantém só números (máx 11)
  if (digitos.length <= 10) {
    return digitos
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digitos
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

function PreConsultaApp() {



  const responseJson: PayloadAppsScript = {
    "success": true,
    "paciente": {
      "id": "1",
      "dataHoraAlteracao": "2026-10-08T09:20:35Z",
      "nomePaciente": "Prezado(a) paciente",
      "apelido": "",
      "dataInicio": "2026-08-25T15:53:00Z",
      "dataFim": "2026-10-16T19:53:00Z"
    },

    "formularios": [{
      "id": "1",
      "dataHoraAlteracao": "2026-10-08T10:00:00Z",
      "idPaciente": "1",
      "nomeFormulario": "Formulário pré-consulta (Anamnese)",
      "dataInicio": "2026-10-08T10:00:00Z",
      "dataFim": "2027-10-08T10:00:00Z",
      "categorias": [
        {
          "id": 1,
          "dataHoraAlteracao": "2026-10-08T10:00:00Z",
          "nomeCategoria": "Dados Pessoais",
          "ordemExibicao": 1,
          "perguntas": [
            {
              "id": 101,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Nome completo",
              "tipoPergunta": 3,
              "obrigatorio": 1,
              "respostas": []
            },
            {
              "id": 102,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Data de nascimento",
              "tipoPergunta": 4, // 4 = Data (ou 3 com mascara)
              "obrigatorio": 1,
              "respostas": []
            },
            {
              "id": 103,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Telefone/WhatsApp",
              "tipoPergunta": 5, // 5 = Telefone
              "obrigatorio": 1,
              "respostas": []
            },
            {
              "id": 104,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Profissão/ocupação",
              "tipoPergunta": 3,
              "obrigatorio": 0,
              "respostas": []
            }
          ]
        },
        {
          "id": 2,
          "dataHoraAlteracao": "2026-10-08T10:00:00Z",
          "nomeCategoria": "Objetivo da Consulta",
          "ordemExibicao": 2,
          "perguntas": [
            {
              "id": 201,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Qual(is) motivo(s) abaixo está(ão) relacionados à sua necessidade de consulta?",
              "tipoPergunta": 2,
              "obrigatorio": 1,
              "respostas": [
                { "id": 20101, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 201, "textoResposta": "Emagrecimento", "ordemExibicao": 1 },
                { "id": 20102, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 201, "textoResposta": "Ganho de massa muscular", "ordemExibicao": 2 },
                { "id": 20103, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 201, "textoResposta": "Gestação", "ordemExibicao": 3 },
                { "id": 20104, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 201, "textoResposta": "Controle do diabetes", "ordemExibicao": 4 },
                { "id": 20105, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 201, "textoResposta": "Controle da pressão", "ordemExibicao": 5 },
                { "id": 20106, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 201, "textoResposta": "Colesterol/triglicerídeos", "ordemExibicao": 6 },
                { "id": 20107, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 201, "textoResposta": "Problemas intestinais", "ordemExibicao": 7 },
                { "id": 20108, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 201, "textoResposta": "Melhorar a alimentação", "ordemExibicao": 8 },
                {
                  "id": 20109,
                  "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                  "idPergunta": 201,
                  "textoResposta": "Outro",
                  "ordemExibicao": 9,
                  "pergunta": {
                    "id": 20110,
                    "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                    "principal": 0,
                    "textoPergunta": "Especifique o motivo",
                    "tipoPergunta": 3,
                    "obrigatorio": 1,
                    "respostas": []
                  }
                }
              ]
            },
            {
              "id": 202,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Qual é o seu principal objetivo com a consulta nutricional?",
              "tipoPergunta": 3,
              "obrigatorio": 1,
              "respostas": []
            }
          ]
        },
        {
          "id": 3,
          "dataHoraAlteracao": "2026-10-08T10:00:00Z",
          "nomeCategoria": "Saúde",
          "ordemExibicao": 3,
          "perguntas": [
            {
              "id": 301,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Possui algum diagnóstico ou problema de saúde?",
              "tipoPergunta": 2,
              "obrigatorio": 1,
              "respostas": [
                { "id": 30101, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 301, "textoResposta": "Não", "anuladora": 1, "ordemExibicao": 1 },
                { "id": 30102, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 301, "textoResposta": "Diabetes", "ordemExibicao": 2 },
                { "id": 30103, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 301, "textoResposta": "Pré-diabetes", "ordemExibicao": 3 },
                { "id": 30104, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 301, "textoResposta": "Hipertensão", "ordemExibicao": 4 },
                { "id": 30105, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 301, "textoResposta": "Colesterol/triglicerídeos elevados", "ordemExibicao": 5 },
                { "id": 30106, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 301, "textoResposta": "Problema na tireoide", "ordemExibicao": 6 },
                { "id": 30107, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 301, "textoResposta": "Doença renal", "ordemExibicao": 7 },
                { "id": 30108, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 301, "textoResposta": "Doença cardíaca", "ordemExibicao": 8 },
                { "id": 30109, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 301, "textoResposta": "Gastrite/refluxo", "ordemExibicao": 9 },
                {
                  "id": 30110,
                  "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                  "idPergunta": 301,
                  "textoResposta": "Outro",
                  "ordemExibicao": 10,
                  "pergunta": {
                    "id": 30111,
                    "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                    "principal": 0,
                    "textoPergunta": "Especifique o problema de saúde",
                    "tipoPergunta": 3,
                    "obrigatorio": 1,
                    "respostas": []
                  }
                }
              ]
            },
            {
              "id": 302,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Utiliza algum medicamento atualmente?",
              "tipoPergunta": 1,
              "obrigatorio": 1,
              "respostas": [
                { "id": 30201, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 302, "textoResposta": "Não", "ordemExibicao": 1 },
                {
                  "id": 30202,
                  "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                  "idPergunta": 302,
                  "textoResposta": "Sim",
                  "ordemExibicao": 2,
                  "pergunta": {
                    "id": 30203,
                    "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                    "principal": 0,
                    "textoPergunta": "Informe o nome, dose e horário dos medicamentos",
                    "tipoPergunta": 3,
                    "obrigatorio": 1,
                    "respostas": []
                  }
                }
              ]
            },
            {
              "id": 303,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Usa vitaminas, suplementos ou produtos naturais?",
              "tipoPergunta": 1,
              "obrigatorio": 1,
              "respostas": [
                { "id": 30301, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 303, "textoResposta": "Não", "ordemExibicao": 1 },
                {
                  "id": 30302,
                  "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                  "idPergunta": 303,
                  "textoResposta": "Sim",
                  "ordemExibicao": 2,
                  "pergunta": {
                    "id": 30303,
                    "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                    "principal": 0,
                    "textoPergunta": "Quais vitaminas, suplementos ou produtos naturais?",
                    "tipoPergunta": 3,
                    "obrigatorio": 1,
                    "respostas": []
                  }
                }
              ]
            },
            {
              "id": 304,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Possui alergia ou intolerância alimentar?",
              "tipoPergunta": 1,
              "obrigatorio": 1,
              "respostas": [
                { "id": 30401, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 304, "textoResposta": "Não", "ordemExibicao": 1 },
                {
                  "id": 30402,
                  "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                  "idPergunta": 304,
                  "textoResposta": "Sim",
                  "ordemExibicao": 2,
                  "pergunta": {
                    "id": 30403,
                    "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                    "principal": 0,
                    "textoPergunta": "Qual alergia ou intolerância alimentar?",
                    "tipoPergunta": 3,
                    "obrigatorio": 1,
                    "respostas": []
                  }
                }
              ]
            },
            {
              "id": 305,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Já realizou alguma cirurgia importante ou cirurgia bariátrica?",
              "tipoPergunta": 1,
              "obrigatorio": 1,
              "respostas": [
                { "id": 30501, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 305, "textoResposta": "Não", "ordemExibicao": 1 },
                {
                  "id": 30502,
                  "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                  "idPergunta": 305,
                  "textoResposta": "Sim",
                  "ordemExibicao": 2,
                  "pergunta": {
                    "id": 30503,
                    "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                    "principal": 0,
                    "textoPergunta": "Qual cirurgia e quando foi realizada?",
                    "tipoPergunta": 3,
                    "obrigatorio": 1,
                    "respostas": []
                  }
                }
              ]
            }
          ]
        },
        {
          "id": 4,
          "dataHoraAlteracao": "2026-10-08T10:00:00Z",
          "nomeCategoria": "Peso e Medidas",
          "ordemExibicao": 4,
          "perguntas": [
            {
              "id": 402,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Altura em cm (centímetro) - Se não souber, deixe em branco.",
              "tipoPergunta": 3,
              "obrigatorio": 0,
              "respostas": []
            },
            {
              "id": 404,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Teve perda ou ganho de peso recentemente?",
              "tipoPergunta": 1,
              "obrigatorio": 1,
              "respostas": [
                { "id": 40401, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 404, "textoResposta": "Não sei", "ordemExibicao": 1 },
                {
                  "id": 40402,
                  "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                  "idPergunta": 404,
                  "textoResposta": "Perdi peso",
                  "ordemExibicao": 2,
                  "pergunta": {
                    "id": 40404,
                    "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                    "principal": 0,
                    "textoPergunta": "Quanto aproximadamente perdeu (kg)?",
                    "tipoPergunta": 3,
                    "obrigatorio": 1,
                    "respostas": []
                  }
                },
                {
                  "id": 40403,
                  "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                  "idPergunta": 404,
                  "textoResposta": "Ganhei peso",
                  "ordemExibicao": 3,
                  "pergunta": {
                    "id": 40405,
                    "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                    "principal": 0,
                    "textoPergunta": "Quanto aproximadamente ganhou (kg)?",
                    "tipoPergunta": 3,
                    "obrigatorio": 1,
                    "respostas": []
                  }
                }
              ]
            }
          ]
        },
        {
          "id": 5,
          "dataHoraAlteracao": "2026-10-08T10:00:00Z",
          "nomeCategoria": "Alimentação",
          "ordemExibicao": 5,
          "perguntas": [
            {
              "id": 501,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Como é o seu café da manhã habitual?",
              "tipoPergunta": 3,
              "obrigatorio": 1,
              "respostas": []
            },
            {
              "id": 502,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Como é o seu almoço habitual?",
              "tipoPergunta": 3,
              "obrigatorio": 1,
              "respostas": []
            },
            {
              "id": 503,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Como é o seu lanche da tarde habitual?",
              "tipoPergunta": 3,
              "obrigatorio": 1,
              "respostas": []
            },
            {
              "id": 504,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Como é o seu jantar habitual?",
              "tipoPergunta": 3,
              "obrigatorio": 1,
              "respostas": []
            },
            {
              "id": 505,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Você faz outra refeição após o jantar? O que você costuma comer poucas horas antes de dormir?",
              "tipoPergunta": 3,
              "obrigatorio": 1,
              "respostas": []
            },
            {
              "id": 507,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Quais alimentos você mais gosta?",
              "tipoPergunta": 3,
              "obrigatorio": 1,
              "respostas": []
            },
            {
              "id": 508,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Quais alimentos você não gosta ou não costuma comer?",
              "tipoPergunta": 3,
              "obrigatorio": 1,
              "respostas": []
            },
            {
              "id": 509,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Costuma consumir doces, refrigerantes, bebidas alcoólicas ou fast-food?",
              "tipoPergunta": 1,
              "obrigatorio": 1,
              "respostas": [
                { "id": 50901, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 509, "textoResposta": "Não", "ordemExibicao": 1 },
                {
                  "id": 50902,
                  "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                  "idPergunta": 509,
                  "textoResposta": "Sim",
                  "ordemExibicao": 2,
                  "pergunta": {
                    "id": 50903,
                    "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                    "principal": 0,
                    "textoPergunta": "Quais alimentos consome e com que frequência?",
                    "tipoPergunta": 3,
                    "obrigatorio": 1,
                    "respostas": []
                  }
                }
              ]
            }
          ]
        },
        {
          "id": 6,
          "dataHoraAlteracao": "2026-10-08T10:00:00Z",
          "nomeCategoria": "Hidratação e Intestino",
          "ordemExibicao": 6,
          "perguntas": [
            {
              "id": 601,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Aproximadamente quanto de água você bebe por dia?",
              "tipoPergunta": 1,
              "obrigatorio": 1,
              "respostas": [
                { "id": 60101, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 601, "textoResposta": "Menos de 500 ml", "ordemExibicao": 1 },
                { "id": 60102, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 601, "textoResposta": "500 ml - 1 litro", "ordemExibicao": 2 },
                { "id": 60103, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 601, "textoResposta": "1 litros - 1,5 litros", "ordemExibicao": 3 },
                { "id": 60104, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 601, "textoResposta": "1,5 litros - 2 litros", "ordemExibicao": 4 },
                { "id": 60105, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 601, "textoResposta": "Mais de 2 litros", "ordemExibicao": 5 }
              ]
            },
            {
              "id": 602,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Como está o funcionamento do seu intestino nos últimos 15 dias?",
              "tipoPergunta": 1,
              "obrigatorio": 1,
              "respostas": [
                { "id": 60201, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 602, "textoResposta": "Normal", "ordemExibicao": 1 },
                { "id": 60202, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 602, "textoResposta": "Sempre ou frequentemente com Constipação", "ordemExibicao": 2 },
                { "id": 60203, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 602, "textoResposta": "Sempre ou frequentemente com Diarreia", "ordemExibicao": 3 },
                {
                  "id": 60204,
                  "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                  "idPergunta": 602,
                  "textoResposta": "Irregular",
                  "ordemExibicao": 5,
                  "pergunta": {
                    "id": 60205,
                    "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                    "principal": 0,
                    "textoPergunta": "Descreva o funcionamento do seu intestino",
                    "tipoPergunta": 3,
                    "obrigatorio": 1,
                    "respostas": []
                  }
                }
              ]
            },
            {
              "id": 603,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Possui algum sintoma digestivo?",
              "tipoPergunta": 2,
              "obrigatorio": 1,
              "respostas": [
                { "id": 60301, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 603, "textoResposta": "Não", "anuladora": 1, "ordemExibicao": 1 },
                { "id": 60302, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 603, "textoResposta": "Gases", "ordemExibicao": 2 },
                { "id": 60303, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 603, "textoResposta": "Estufamento", "ordemExibicao": 3 },
                { "id": 60304, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 603, "textoResposta": "Azia/refluxo", "ordemExibicao": 4 },
                { "id": 60305, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 603, "textoResposta": "Dor abdominal", "ordemExibicao": 5 },
                { "id": 60306, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 603, "textoResposta": "Náuseas", "ordemExibicao": 6 },
                {
                  "id": 60307,
                  "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                  "idPergunta": 603,
                  "textoResposta": "Outro",
                  "ordemExibicao": 7,
                  "pergunta": {
                    "id": 60308,
                    "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                    "principal": 0,
                    "textoPergunta": "Especifique o sintoma digestivo",
                    "tipoPergunta": 3,
                    "obrigatorio": 1,
                    "respostas": []
                  }
                }
              ]
            }
          ]
        },
        {
          "id": 7,
          "dataHoraAlteracao": "2026-10-08T10:00:00Z",
          "nomeCategoria": "Rotina e Atividade Física",
          "ordemExibicao": 7,
          "perguntas": [
            {
              "id": 701,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Pratica atividade física?",
              "tipoPergunta": 1,
              "obrigatorio": 1,
              "respostas": [
                { "id": 70101, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 701, "textoResposta": "Não", "ordemExibicao": 1 },
                {
                  "id": 70102,
                  "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                  "idPergunta": 701,
                  "textoResposta": "Sim",
                  "ordemExibicao": 2,
                  "pergunta": {
                    "id": 70103,
                    "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                    "principal": 0,
                    "textoPergunta": "Qual atividade e quantas vezes por semana?",
                    "tipoPergunta": 3,
                    "obrigatorio": 1,
                    "respostas": []
                  }
                }
              ]
            },
            {
              "id": 704,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Como é a sua rotina em relação às suas refeições principais na maior parte dos dias da semana?",
              "tipoPergunta": 1,
              "obrigatorio": 1,
              "respostas": [
                {
                  "id": 70401,
                  "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                  "idPergunta": 704,
                  "textoResposta": "Eu mesmo preparo e consumo minhas refeições e tenho total controle para montar o café da manhã, almoço e janta.",
                  "ordemExibicao": 1
                },
                {
                  "id": 70402,
                  "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                  "idPergunta": 704,
                  "textoResposta": "Algumas refeições como fora (trabalho/restaurante), mas consigo montar meu próprio prato de forma saudável.",
                  "ordemExibicao": 2,
                  "pergunta": {
                    "id": 704020,
                    "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                    "principal": 0,
                    "textoPergunta": "Quais refeições você costuma fazer fora de casa?",
                    "tipoPergunta": 2,
                    "obrigatorio": 1,
                    "respostas": [
                      { "id": 7040201, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 704020, "textoResposta": "Café da manhã", "ordemExibicao": 1 },
                      { "id": 7040202, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 704020, "textoResposta": "Almoço", "ordemExibicao": 2 },
                      { "id": 7040203, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 704020, "textoResposta": "Jantar", "ordemExibicao": 3 },
                      { "id": 7040204, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 704020, "textoResposta": "Lanches (manhã/tarde)", "ordemExibicao": 4 }
                    ]
                  }
                },
                {
                  "id": 70403,
                  "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                  "idPergunta": 704,
                  "textoResposta": "Como fora e não tenho nenhum controle sobre as opções disponíveis.",
                  "ordemExibicao": 3,
                  "pergunta": {
                    "id": 704030,
                    "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                    "principal": 0,
                    "textoPergunta": "Em quais refeições você não tem controle sobre as opções disponíveis?",
                    "tipoPergunta": 2,
                    "obrigatorio": 1,
                    "respostas": [
                      { "id": 7040301, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 704030, "textoResposta": "Café da manhã", "ordemExibicao": 1 },
                      { "id": 7040302, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 704030, "textoResposta": "Almoço", "ordemExibicao": 2 },
                      { "id": 7040303, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 704030, "textoResposta": "Jantar", "ordemExibicao": 3 },
                      { "id": 7040304, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 704030, "textoResposta": "Lanches (manhã/tarde)", "ordemExibicao": 4 }
                    ]
                  }
                }
              ]
            }
          ]
        },
        {
          "id": 8,
          "dataHoraAlteracao": "2026-10-08T10:00:00Z",
          "nomeCategoria": "Comportamento Alimentar",
          "ordemExibicao": 8,
          "perguntas": [
            {
              "id": 801,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Você costuma comer por ansiedade, estresse, tristeza ou tédio?",
              "tipoPergunta": 1,
              "obrigatorio": 1,
              "respostas": [
                { "id": 80101, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 801, "textoResposta": "Não", "ordemExibicao": 1 },
                { "id": 80102, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 801, "textoResposta": "Às vezes", "ordemExibicao": 2 },
                { "id": 80103, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 801, "textoResposta": "Frequentemente", "ordemExibicao": 3 }
              ]
            },
            {
              "id": 802,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Qual é sua maior dificuldade para manter uma alimentação saudável?",
              "tipoPergunta": 2,
              "obrigatorio": 1,
              "respostas": [
                { "id": 80201, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 802, "textoResposta": "Falta de tempo", "ordemExibicao": 1 },
                { "id": 80202, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 802, "textoResposta": "Falta de organização", "ordemExibicao": 2 },
                { "id": 80203, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 802, "textoResposta": "Ansiedade", "ordemExibicao": 3 },
                { "id": 80204, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 802, "textoResposta": "Fome excessiva", "ordemExibicao": 4 },
                { "id": 80205, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 802, "textoResposta": "Vontade de doces", "ordemExibicao": 5 },
                { "id": 80206, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 802, "textoResposta": "Custo dos alimentos", "ordemExibicao": 6 },
                { "id": 80207, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 802, "textoResposta": "Dificuldade para cozinhar", "ordemExibicao": 7 },
                { "id": 80208, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 802, "textoResposta": "Não consigo seguir dieta", "ordemExibicao": 8 },
                {
                  "id": 80209,
                  "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                  "idPergunta": 802,
                  "textoResposta": "Outra",
                  "ordemExibicao": 9,
                  "pergunta": {
                    "id": 80210,
                    "dataHoraAlteracao": "2026-10-08T10:00:00Z",
                    "principal": 0,
                    "textoPergunta": "Especifique a dificuldade",
                    "tipoPergunta": 3,
                    "obrigatorio": 1,
                    "respostas": []
                  }
                }
              ]
            }
          ]
        },
        {
          "id": 9,
          "dataHoraAlteracao": "2026-10-08T10:00:00Z",
          "nomeCategoria": "Informações Importantes",
          "ordemExibicao": 9,
          "perguntas": [
            {
              "id": 901,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Existe alguma informação sobre sua saúde, rotina ou alimentação que você considera importante contar à nutricionista antes da consulta?",
              "tipoPergunta": 3,
              "obrigatorio": 1,
              "respostas": []
            }
          ]
        },
        {
          "id": 10,
          "dataHoraAlteracao": "2026-10-08T10:00:00Z",
          "nomeCategoria": "Consentimento",
          "ordemExibicao": 10,
          "perguntas": [
            {
              "id": 1001,
              "dataHoraAlteracao": "2026-10-08T10:00:00Z",
              "principal": 1,
              "textoPergunta": "Declaro que as informações fornecidas são verdadeiras e autorizo seu uso para fins de avaliação e acompanhamento nutricional.",
              "tipoPergunta": 2,
              "obrigatorio": 1,
              "respostas": [
                { "id": 100101, "dataHoraAlteracao": "2026-10-08T10:00:00Z", "idPergunta": 1001, "textoResposta": "Li e concordo.", "ordemExibicao": 1 }
              ]
            }
          ]
        }
      ]
    }]
  };

  const searchParams = useSearchParams();
  const pacienteId = searchParams.get('pacienteId');

  const mainContainerRef = useRef<HTMLDivElement | null>(null);

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

      try {
        setLoading(true);

        const resultSimple: PayloadAppsScript = responseJson;

        if (!resultSimple.success) {
          throw new Error(resultSimple.error || 'Erro ao carregar os formulários do paciente.');
        }

        if (isMounted) {
          if (resultSimple.paciente) setPaciente(resultSimple.paciente);
          if (resultSimple.formularios) setFormulariosAtivos(resultSimple.formularios);
          setTimeout(() => {
            setLoading(false);
          }, 3000);
        }

        const resultQuestions: PayloadAppsScript = responseJson;
        if (isMounted && resultQuestions.success && resultQuestions.formularios) {
          setFormulariosCompletos(resultQuestions.formularios);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message || 'Falha ao carregar formulários.');
          setTimeout(() => {
            setLoading(false);
          }, 3000);
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
          const result: PayloadAppsScript = responseJson;
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
      if (mainContainerRef.current) {
        mainContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
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

          mensagemFormatada += `* *${perg.textoPergunta}*\n   ✍️ _${(textoResp || '').trim()}_\n\n`;
        }
      }
    });

    const mensagemUrlEncoded = encodeURIComponent(mensagemFormatada.trim());
    let urlWhatsapp = `https://api.whatsapp.com/send?phone=${atob(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER||'')}&text=${mensagemUrlEncoded}`;

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

        <main ref={mainContainerRef} className="flex-1 min-h-0 overflow-y-auto py-4">
          {/* TELA INICIAL: LISTA DE FORMULÁRIOS PENDENTES */}
          {!selectedFormId ? (
            <div className="bg-[#ffffff] border border-[#e2e5e2] rounded-2xl p-6 md:p-8 shadow-[0_12px_35px_rgba(27,83,43,0.06)]">
              <h1 className="text-xl md:text-2xl font-bold text-[#1b532b] mb-2">
                Olá prezado(a) paciente,
              </h1>
              <p className="text-[#6e7570] mb-6 text-sm md:text-base">
                Por gentileza responda o formulário abaixo:
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
             {/* TEXTO / DATA / TELEFONE */}
              {(Number(currentPergunta.tipoPergunta) === TipoPerguntaEnum.TEXTO ||
                Number(currentPergunta.tipoPergunta) === TipoPerguntaEnum.DATA ||
                Number(currentPergunta.tipoPergunta) === TipoPerguntaEnum.TELEFONE) && (
                <div className="my-6">
                  <textarea
                    rows={currentPergunta.tipoPergunta === TipoPerguntaEnum.TEXTO ? 4 :1}
                    value={currentTextAnswer}
                    onChange={(e) => {
                      let val = e.target.value;
                      const tipo = Number(currentPergunta.tipoPergunta);

                      // Formatação em tempo real
                      if (tipo === TipoPerguntaEnum.DATA) {
                        val = formatarData(val);
                      } else if (tipo === TipoPerguntaEnum.TELEFONE) {
                        val = formatarTelefone(val);
                      }

                      setUserAnswers((prev) => ({
                        ...prev,
                        [String(currentPergunta.id)]: val,
                      }));
                    }}
                    onBlur={() => {
                      // Garantia de formatação/ajuste ao perder o foco (quando o usuário para de digitar)
                      let val = currentTextAnswer;
                      const tipo = Number(currentPergunta.tipoPergunta);

                      if (tipo === TipoPerguntaEnum.DATA) {
                        val = formatarData(val);
                      } else if (tipo === TipoPerguntaEnum.TELEFONE) {
                        val = formatarTelefone(val);
                      }

                      setUserAnswers((prev) => ({
                        ...prev,
                        [String(currentPergunta.id)]: val,
                      }));
                    }}
                    placeholder={
                      Number(currentPergunta.tipoPergunta) === TipoPerguntaEnum.DATA
                        ? "DD/MM/AAAA"
                        : Number(currentPergunta.tipoPergunta) === TipoPerguntaEnum.TELEFONE
                        ? "(00) 00000-0000"
                        : isObrigatorio ? "Digite sua resposta..." : "Digite sua resposta (opcional)..."
                    }
                    className="w-full p-4 rounded-xl border-2 border-[#e2e5e2] focus:border-[#1b532b] focus:ring-0 text-[#2d312e] transition-colors outline-none"
                  />
                </div>
              )}

              {/* BOTÕES DE NAVEGAÇÃO: EMPILHADOS NO MOBILE (AVANÇAR EM CIMA), LADO A LADO NO DESKTOP */}
              <div className="flex flex-col md:flex-row gap-3 mt-6">
                {/* BOTÃO AVANÇAR / PULAR (PRIMEIRO NO MOBILE, DIREITA NO DESKTOP) */}
                <div className="order-1 md:order-2 flex gap-3 w-full md:w-1/2">
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isNextDisabled() || isAnimating}
                    className={`${'w-full'} ${
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
      <PreConsultaApp />
    </Suspense>
  );
}