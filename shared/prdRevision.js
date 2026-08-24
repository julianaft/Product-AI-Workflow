/**
 * Revisão de PRD a partir do chat do PM.
 *
 * Sem modelo de linguagem, interpreta a mensagem com regras explícitas:
 * responde perguntas em aberto, altera seções citadas e, se não houver alvo,
 * registra a orientação na contextualização. A saída segue o mesmo contrato
 * do PRD gerado, mais um texto de resposta para o chat.
 */

import { PRD_SECTIONS, PRD_SECTION_KEYS, PRD_MISSING, generatePrd } from './prdSkill.js';

function text(value) {
  return String(value ?? '').trim();
}

function normalize(value) {
  return text(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function isPlaceholder(value) {
  const current = text(value);
  return current.length === 0 || current === PRD_MISSING || /\[a preencher\]/i.test(current);
}

function appendBlock(current, addition) {
  const next = text(addition);
  if (!next) return current;
  if (isPlaceholder(current)) return next;
  return `${text(current)}\n\n${next}`;
}

function resolveSection(fragment) {
  const hay = normalize(fragment);
  if (!hay) return null;

  for (const section of PRD_SECTIONS) {
    if (hay.includes(normalize(section.label))) return section;
  }

  const aliases = [
    ['okrInitiative', ['okr', 'codigo da iniciativa', 'código da iniciativa']],
    ['stakeholders', ['pessoas', 'stakeholders', 'envolvidos', 'time']],
    ['context', ['contexto', 'contextualizacao']],
    ['problem', ['necessidade', 'problema', 'dor']],
    ['audience', ['publico', 'audiencia']],
    ['hypotheses', ['hipotese', 'hipoteses']],
    ['impactMetrics', ['metrica', 'metricas', 'as is', 'to be']],
    ['solutions', ['solucao', 'solucoes', 'jornada']],
    ['permissions', ['permissao', 'permissionamento', 'acesso']],
    ['fieldRules', ['regras de campo', 'defaults', 'validacoes']],
    ['errorHandling', ['erro', 'erros', 'tratamento de erro']],
    ['acceptanceCriteria', ['criterio de aceite', 'criterios de aceite', 'ca1']],
    ['outOfScope', ['fora do escopo', 'fora desta entrega', 'nao entra']],
    ['dependencies', ['dependencia', 'dependencias']],
    ['epics', ['epico', 'epicos']],
    ['risks', ['risco', 'riscos']],
    ['assumptions', ['premissa', 'premissas']],
    ['experiments', ['experimento', 'experimentos']],
  ];

  for (const [key, words] of aliases) {
    if (words.some((word) => hay.includes(normalize(word)))) {
      return PRD_SECTIONS.find((section) => section.key === key) ?? null;
    }
  }

  return null;
}

function sectionFromQuestion(question) {
  const hay = normalize(question);

  if (hay.includes('codigo da iniciativa') || hay.includes('okr')) return 'okrInitiative';
  if (hay.includes('metrica') || hay.includes('baseline') || hay.includes('as is')) {
    return 'impactMetrics';
  }
  if (hay.includes('problema') || hay.includes('evidencia')) return 'problem';
  if (hay.includes('jornada')) return 'solutions';
  if (hay.includes('soluc')) return 'solutions';
  if (hay.includes('criterio de aceite') || hay.includes('verificavel')) {
    return 'acceptanceCriteria';
  }
  if (hay.includes('fora desta entrega') || hay.includes('fora do escopo')) {
    return 'outOfScope';
  }
  if (hay.includes('pessoas envolvidas') || hay.includes('agrupadas por area')) {
    return 'stakeholders';
  }

  const named = question.match(/Se[cç][aã]o "([^"]+)"/i);
  if (named) {
    const section = resolveSection(named[1]);
    if (section) return section.key;
  }

  return 'context';
}

function extractStructuredQa(instruction) {
  const match = instruction.match(
    /(?:PERGUNTA|Pergunta)\s*:\s*([\s\S]+?)\n\s*(?:RESPOSTA|Resposta)\s*:\s*([\s\S]+)/i,
  );
  if (!match) return null;

  return {
    question: text(match[1]),
    answer: text(match[2]),
  };
}

function matchOpenQuestion(instruction, openQuestions = []) {
  const hay = normalize(instruction);
  let best = null;
  let bestScore = 0;

  for (const question of openQuestions) {
    const tokens = normalize(question)
      .split(/\s+/)
      .filter((token) => token.length > 4);
    if (tokens.length === 0) continue;
    const hits = tokens.filter((token) => hay.includes(token)).length;
    const score = hits / tokens.length;
    if (score > bestScore && (score >= 0.45 || hay.includes(normalize(question).slice(0, 28)))) {
      best = question;
      bestScore = score;
    }
  }

  return best;
}

function extractSectionPatches(instruction) {
  const patches = [];
  const replaceMatch = instruction.match(
    /(?:substitua|troque|altere|mude|reescreva)\s+(?:a |o |as |os )?(?:se[cç][aã]o\s+)?(.+?)\s+(?:por|para|com)\s*[:\-]?\s*([\s\S]+)/i,
  );
  if (replaceMatch) {
    const section = resolveSection(replaceMatch[1]);
    if (section) {
      patches.push({ key: section.key, action: 'replace', text: text(replaceMatch[2]) });
    }
  }

  const addNamed = instruction.match(
    /(?:adicione|inclua|acrescente|coloque)\s+(?:em|na|no)\s+(?:a |o )?(?:se[cç][aã]o\s+)?([^:\n]+)[:\-\s]+([\s\S]+)/i,
  );
  if (addNamed) {
    const section = resolveSection(addNamed[1]);
    if (section) {
      patches.push({ key: section.key, action: 'append', text: text(addNamed[2]) });
    }
  }

  const addTail = instruction.match(
    /(?:adicione|inclua|acrescente|coloque)\s+([\s\S]+?)\s+(?:em|na|no)\s+(?:a |o )?(?:se[cç][aã]o\s+)?([^\n.]+)/i,
  );
  if (addTail && patches.length === 0) {
    const section = resolveSection(addTail[2]);
    if (section) {
      patches.push({ key: section.key, action: 'append', text: text(addTail[1]) });
    }
  }

  return patches.filter((patch) => patch.text);
}

function extractDirectFills(instruction) {
  const fills = [];
  const patterns = [
    [/c[oó]digo(?: da iniciativa)?(?: okr)?(?: é|:)\s*(.+)/i, 'okrInitiative'],
    [/fora do escopo[:\s]+([\s\S]+)/i, 'outOfScope'],
    [/crit[eé]rios? de aceite[:\s]+([\s\S]+)/i, 'acceptanceCriteria'],
    [/p[úu]blico(?: afetado)?[:\s]+([\s\S]+)/i, 'audience'],
    [/depend[eê]ncias?[:\s]+([\s\S]+)/i, 'dependencies'],
    [/riscos?[:\s]+([\s\S]+)/i, 'risks'],
    [/premissas?[:\s]+([\s\S]+)/i, 'assumptions'],
  ];

  for (const [pattern, key] of patterns) {
    const match = instruction.match(pattern);
    if (match) fills.push({ key, action: 'append', text: text(match[1]) });
  }

  return fills;
}

function applyOkrAnswer(metadata, answer) {
  const codeMatch = answer.match(/\b([A-Z0-9][A-Z0-9._-]{1,})\b/);
  if (!codeMatch) return metadata;
  return { ...metadata, okrCode: codeMatch[1] };
}

function questionAnswered(question, answers, instruction) {
  if (answers.some((item) => item.question === question)) return true;
  const hay = normalize(instruction);
  return hay.includes(normalize(question).slice(0, 24));
}

function summarizeChange(change, sections) {
  const label = PRD_SECTIONS.find((section) => section.key === change.key)?.label ?? change.key;
  if (change.action === 'replace') return `Reescrevi a seção ${label}.`;
  if (change.action === 'answer') return `Incorporei a resposta em ${label}.`;
  return `Atualizei ${label}.`;
}

export function parsePrdInstruction(instruction, currentPrd = {}) {
  const raw = text(instruction);
  const answers = [];
  const patches = [];

  const structured = extractStructuredQa(raw);
  if (structured) {
    answers.push({
      question: structured.question,
      answer: structured.answer,
      sectionKey: sectionFromQuestion(structured.question),
    });
  }

  const matchedQuestion = structured
    ? null
    : matchOpenQuestion(raw, currentPrd.openQuestions ?? []);
  if (matchedQuestion) {
    const withoutQuestion = raw.replace(matchedQuestion, '').replace(/^[—\-:\s]+/, '');
    answers.push({
      question: matchedQuestion,
      answer: text(withoutQuestion) || raw,
      sectionKey: sectionFromQuestion(matchedQuestion),
    });
  }

  patches.push(...extractSectionPatches(raw), ...extractDirectFills(raw));

  return { answers, patches, raw };
}

/**
 * Aplica a mensagem do PM sobre o PRD atual e devolve uma nova versão.
 */
export function revisePrd({
  payload = {},
  currentPrd,
  instruction,
  conversation = [],
} = {}) {
  const source = currentPrd && currentPrd.sections ? currentPrd : generatePrd(payload);
  const parsed = parsePrdInstruction(instruction, source);
  const sections = { ...source.sections };
  const appliedChanges = [];
  const previousAnswers = Array.isArray(payload.prdAnswers) ? payload.prdAnswers : [];
  const newAnswers = [...previousAnswers];

  for (const answer of parsed.answers) {
    const key = answer.sectionKey;
    if (!PRD_SECTION_KEYS.includes(key)) continue;
    sections[key] = appendBlock(sections[key], answer.answer);
    newAnswers.push(answer);
    appliedChanges.push({ key, action: 'answer', text: answer.answer, question: answer.question });
    if (key === 'okrInitiative') {
      source.metadata = applyOkrAnswer(source.metadata ?? {}, answer.answer);
    }
  }

  for (const patch of parsed.patches) {
    if (!PRD_SECTION_KEYS.includes(patch.key)) continue;
    if (appliedChanges.some((change) => change.key === patch.key && change.text === patch.text)) {
      continue;
    }
    sections[patch.key] =
      patch.action === 'replace' ? patch.text : appendBlock(sections[patch.key], patch.text);
    appliedChanges.push(patch);
    if (patch.key === 'okrInitiative') {
      source.metadata = applyOkrAnswer(source.metadata ?? {}, patch.text);
    }
  }

  if (appliedChanges.length === 0) {
    sections.context = appendBlock(
      sections.context,
      `Orientação do PM para esta versão:\n${parsed.raw}`,
    );
    appliedChanges.push({ key: 'context', action: 'append', text: parsed.raw });
  }

  const remainingQuestions = (source.openQuestions ?? []).filter(
    (question) => !questionAnswered(question, parsed.answers, parsed.raw),
  );

  for (const [key, value] of Object.entries(sections)) {
    if (!isPlaceholder(value)) {
      const related = remainingQuestions.filter((question) => sectionFromQuestion(question) === key);
      for (const question of related) {
        if (appliedChanges.some((change) => change.key === key)) {
          const index = remainingQuestions.indexOf(question);
          if (index >= 0) remainingQuestions.splice(index, 1);
        }
      }
    }
  }

  const revision = Number(source.revision ?? 1) + (currentPrd?.sections ? 1 : 0);
  const nextRevision = Math.max(revision, 1);
  const prd = {
    ...source,
    sections,
    metadata: { ...(source.metadata ?? {}), status: 'draft' },
    openQuestions: remainingQuestions,
    revision: nextRevision,
    generatedAt: new Date().toISOString(),
    traceability: {
      ...(source.traceability ?? {}),
      generatedFrom: [
        ...new Set([...(source.traceability?.generatedFrom ?? []), 'prdRevisionChat']),
      ],
      lastInstruction: parsed.raw,
    },
  };

  const remaining = prd.openQuestions.length;
  const replyLines = [
    `Gerei a versão ${prd.revision} do PRD.`,
    ...appliedChanges.map((change) => `- ${summarizeChange(change, sections)}`),
  ];

  if (remaining === 0) {
    replyLines.push('Não restam perguntas em aberto nesta versão.');
  } else {
    replyLines.push(
      `Ainda há ${remaining} pergunta${remaining === 1 ? '' : 's'} em aberto. Pode responder aqui.`,
    );
  }

  return {
    prd,
    reply: replyLines.join('\n'),
    appliedChanges,
    answers: newAnswers,
    conversation,
  };
}
