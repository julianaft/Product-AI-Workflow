# Guia de implementacao — PM Builder (do input da iniciativa ao PRD)

Documento passo a passo para reconstruir ou dar manutencao no projeto. Descreve a
ordem de trabalho, o que cada arquivo faz e como validar cada bloco. O escopo
termina na aprovacao do PRD; o fluxo tecnico posterior fica fora desta entrega.

Stack: React 19 + Vite, JavaScript puro (sem TypeScript), Tailwind CSS v4,
servidor de skills em Node com o modulo `http` nativo e testes com `node:test`.

---

## Sumario

1. [Visao geral da arquitetura](#1-visao-geral-da-arquitetura)
2. [Pre-requisitos](#2-pre-requisitos)
3. [Bloco 0 — Projeto e ferramentas](#3-bloco-0--projeto-e-ferramentas)
4. [Bloco 1 — Paleta e tema travados](#4-bloco-1--paleta-e-tema-travados)
5. [Bloco 2 — Dominio compartilhado](#5-bloco-2--dominio-compartilhado)
6. [Bloco 3 — Skills deterministicas](#6-bloco-3--skills-deterministicas)
7. [Bloco 4 — Contratos de saida](#7-bloco-4--contratos-de-saida)
8. [Bloco 5 — Estado da jornada](#8-bloco-5--estado-da-jornada)
9. [Bloco 6 — Servicos (IA, validacao, storage)](#9-bloco-6--servicos-ia-validacao-storage)
10. [Bloco 7 — Componentes de interface](#10-bloco-7--componentes-de-interface)
11. [Bloco 8 — As seis etapas](#11-bloco-8--as-seis-etapas)
12. [Bloco 9 — Montagem da pagina](#12-bloco-9--montagem-da-pagina)
13. [Bloco 10 — Servidor de skills](#13-bloco-10--servidor-de-skills)
14. [Bloco 11 — Testes](#14-bloco-11--testes)
15. [Bloco 12 — Build e auditoria de cores](#15-bloco-12--build-e-auditoria-de-cores)
16. [Roteiro de verificacao manual](#16-roteiro-de-verificacao-manual)
17. [Como plugar um provedor de IA real](#17-como-plugar-um-provedor-de-ia-real)
18. [Proximos passos](#18-proximos-passos)

---

## 1. Visao geral da arquitetura

Tres camadas, com uma regra de dependencia clara:

```
  React (src/)                Servidor (server/)
  ├── interface e estado      ├── rotas HTTP das skills
  ├── deriva tudo do estado   ├── prompts das skills
  └── chama aiClient          └── integracao com o provedor de IA
        │                            │
        └──────────┬─────────────────┘
                   ▼
           Dominio compartilhado (shared/)
           ├── frameworks de discovery
           ├── skills deterministicas
           ├── contratos de saida
           └── gerador de PRD
```

Principios que orientam todo o codigo:

- **A interface e funcao do estado.** Nada de `getElementById`, `innerHTML` ou
  `classList` manual. Uma maquina de estados (reducer) descreve a jornada; os
  componentes apenas a renderizam.
- **Contrato antes de modelo.** As skills tem um formato de saida fixo, validado
  antes de chegar na tela. Trocar a implementacao deterministica por um LLM nao
  muda a interface.
- **Nada inventado.** Onde falta insumo, o texto vira pergunta em aberto marcada
  com `[a preencher]`, nunca conteudo plausivel.
- **Cor imposta pela build.** A paleta padrao do Tailwind e zerada; so as dez
  cores aprovadas existem.

Ordem de construcao recomendada: de dentro para fora. Primeiro `shared/`, depois
`src/state`, depois `src/services`, depois componentes e etapas, e por fim o
servidor. Cada bloco abaixo segue essa ordem.

---

## 2. Pre-requisitos

- Node 20 ou superior (o projeto usa `node:test` e `fetch` nativo).
- npm 10 ou superior.
- Nenhuma chave de API e necessaria: o fluxo roda inteiro em modo
  deterministico.

---

## 3. Bloco 0 — Projeto e ferramentas

**Objetivo:** projeto Vite + React em JavaScript rodando em branco.

Passos:

1. Inicie o projeto e instale as dependencias.

   ```bash
   npm init -y
   npm install react react-dom
   npm install -D vite @vitejs/plugin-react tailwindcss @tailwindcss/vite
   ```

2. Ajuste o `package.json`: `"type": "module"` e os scripts.

   ```json
   {
     "scripts": {
       "dev": "vite",
       "build": "vite build",
       "preview": "vite preview",
       "server": "node server/index.js",
       "test": "node --test test/*.test.js"
     }
   }
   ```

3. Configure o Vite com os plugins de React e Tailwind e um proxy de `/api` para
   o servidor de skills (`vite.config.js`). O proxy permite que a interface em
   `http://localhost:5173` chame `/api/ai/...` sem lidar com CORS.

4. Crie `index.html` com a `div#root`, o `main.jsx` como modulo e o link da
   fonte Inter.

**Validacao:** `npm run dev` sobe sem erro e serve a pagina em
`http://localhost:5173`.

---

## 4. Bloco 1 — Paleta e tema travados

**Objetivo:** impedir por construcao qualquer cor fora da lista.

Arquivo: `src/index.css`.

A tecnica central e, dentro do bloco `@theme` do Tailwind v4, resetar toda a
paleta e declarar apenas as dez cores:

```css
@import 'tailwindcss';

@theme {
  --color-*: initial;      /* apaga slate, gray, red padrao etc. */

  --color-lime: #d4e137;
  --color-green: #8bc34a;
  --color-sky: #4fc3f7;
  --color-blue: #0277bd;
  --color-orange: #fb8c00;
  --color-ember: #f4511e;
  --color-black: #000000;
  --color-white: #ffffff;
  --color-line: #e2e8f0;
  --color-canvas: #f8fafc;
}
```

Depois disso, `bg-slate-300` deixa de gerar CSS. Quem tentar usar uma cor fora da
paleta simplesmente nao ve efeito, e a auditoria do Bloco 12 acusa.

Inclua tambem as regras de `@media print` para o PRD (esconder o que tiver a
classe `no-print` e remover bordas/altura do `print-area`).

**Validacao:** apos o primeiro componente existir, `npm run build` e a auditoria
de cores (Bloco 12) devem mostrar somente as dez cores.

---

## 5. Bloco 2 — Dominio compartilhado

**Objetivo:** definir os frameworks de discovery num unico lugar consumido por
interface e servidor.

Arquivo: `shared/frameworks.js`.

Modele cada framework com `id`, `label`, `summary` e uma lista de `fields`
(`key`, `label`, `hint`, `required`):

- `opportunity-tree`: outcome, opportunities, solutions, experiments.
- `csd`: certainties, assumptions, doubts.
- `double-diamond`: discover, define, develop, deliver.

Exporte helpers: `getFramework(id)` e `getRequiredFieldKeys(id)`. A interface usa
esses metadados para renderizar os formularios automaticamente, e a validacao os
usa para saber quais campos sao obrigatorios. Definir o campo em um so lugar
evita divergencia entre tela e regra.

**Validacao:** `node -e "import('./shared/frameworks.js').then(m => console.log(m.FRAMEWORK_IDS))"`
imprime os tres ids.

---

## 6. Bloco 3 — Skills deterministicas

**Objetivo:** implementar o comportamento das duas skills sem depender de modelo.

### 6.1 Skill de discovery (`shared/discoverySkill.js`)

Quatro funcoes, cada uma com entrada e saida no formato do contrato:

- `classifyInitiative({ product, initiative })` — conta sinais textuais de
  "expansao" versus "construcao inedita" e devolve `incremental` ou `new`, com
  confianca, motivo e `needsConfirmation: true`.
- `recommendDiscovery({ initiative, initiativeType, availableFrameworks })` —
  aplica regras: fluxo novo tende a double-diamond; muita hipotese e pouca
  evidencia tende a CSD; incremental com objetivo claro tende a
  opportunity-tree. Retorna framework recomendado, alternativas, um rascunho de
  campos (`suggestedFields`) e perguntas em aberto.
- `suggestDiscoveryField({ ... })` — devolve um rascunho para um unico campo.
- `reviewDiscovery({ frameworkId, fields })` — aponta campos vazios, marcadores
  `[a preencher]` remanescentes, textos curtos demais e contradicoes (ex.: uma
  "certeza" escrita com linguagem de hipotese).

Regra que atravessa todas: quando falta insumo, use a constante `PENDING`
(`[a preencher]`); nunca gere texto plausivel.

### 6.2 Skill de PRD (`shared/prdSkill.js`)

- Exporte `PRD_SECTIONS` (chave + rotulo) como fonte unica da ordem das secoes.
- `normalizeDiscovery(discovery)` traduz qualquer framework do catalogo para um
  formato comum (problema, solucao, experimentos, etc.), para o gerador nao
  precisar conhecer cada formato.
- `generatePrd(payload)` monta titulo, metadados, todas as secoes,
  `openQuestions` e rastreabilidade. Secao sem insumo recebe a constante
  `MISSING` e alimenta as perguntas em aberto.
- `regeneratePrdSection(payload, key)` regenera uma unica secao.
- `prdToMarkdown(prd)` serializa para exportacao.

**Validacao:** os testes do Bloco 11 cobrem estas funcoes; rode-os assim que
existirem.

---

## 7. Bloco 4 — Contratos de saida

**Objetivo:** garantir que nenhuma resposta de skill fora do formato chegue na
interface.

Arquivo: `shared/contracts.js`.

Escreva validadores que lancam `ContractError` com mensagem legivel:

- `assertClassification` — `type` deve ser `incremental` ou `new`, com `reason`.
- `assertDiscoveryRecommendation` — `recommendedFramework` deve existir na lista.
- `assertDiscoveryReview` — `gaps` e `questions` devem ser listas.
- `assertPrd` — `title` presente e todas as chaves de `PRD_SECTION_KEYS` do tipo
  string.

Esses validadores rodam tanto no modo mock quanto sobre a resposta do LLM. E a
peca que transforma "modelo devolveu algo estranho" em erro tratado na tela.

**Validacao:** um teste que passa um objeto incompleto e espera `ContractError`.

---

## 8. Bloco 5 — Estado da jornada

**Objetivo:** uma unica fonte de verdade, com as regras de coerencia embutidas.

### 8.1 Modelo (`src/state/journeyModel.js`)

`createJourney()` devolve o estado inicial: `activeStep`, `maxRevealedStep`,
`product`, `initiative`, `classification`, `discovery` e `prd`, alem de `links`.

Ponto importante: o discovery guarda `fieldsByFramework`, um objeto por
framework. Assim, trocar de metodo nao apaga o que foi escrito no anterior. O
helper `discoveryFields(journey)` devolve os campos do framework ativo.

### 8.2 Reducer (`src/state/journeyReducer.js`)

Implemente as acoes de navegacao (`nextStep`, `previousStep`, `goToStep`), de
edicao de cada secao, e as de skill (`setClassificationSuggestion`,
`setDiscoveryRecommendation`, `applySuggestedFields`, `setDiscoveryReview`,
`setPrd`, `updatePrdSection`).

Quatro regras de coerencia que precisam existir:

1. Editar um insumo (`updateProduct`, `updateInitiative`, `updateDiscoveryField`)
   marca o PRD como `stale` — nunca deixa um PRD apontando para um discovery que
   mudou.
2. Editar o discovery derruba `approved`, forcando nova revisao humana.
3. `applySuggestedFields` so preenche campos vazios; jamais sobrescreve texto do
   PM.
4. Navegacao respeita os limites (1 a 6).

**Validacao:** os testes de `test/journey.test.js` cobrem exatamente essas
regras.

---

## 9. Bloco 6 — Servicos (IA, validacao, storage)

**Objetivo:** isolar IA, regras de avanco e persistencia do resto do app.

### 9.1 Adaptador de IA (`src/services/aiClient.js`)

Um unico ponto que decide, por `VITE_AI_MODE`, entre chamar o servidor (`http`)
ou a skill deterministica local (`mock`). Nos dois casos, a resposta passa pelo
validador de contrato antes de retornar. Exporte uma funcao por operacao
(`classifyInitiative`, `recommendDiscovery`, `suggestDiscoveryField`,
`reviewDiscovery`, `generatePrd`) e `getAiMode()` para a interface exibir o modo.

### 9.2 Validacao (`src/services/validation.js`)

`validateStep(stepId, journey)` devolve `{ errors, blockers }`: `errors` por
campo (mostrados junto ao input) e `blockers` gerais (mostrados perto do botao
de avancar). `isStepComplete` deriva daí. Centralizar aqui evita espalhar `if`
de obrigatoriedade pelos componentes.

### 9.3 Storage (`src/services/storage.js`)

`loadJourney`, `saveJourney`, `clearJourney` sobre `localStorage`, com
try/catch. Isolar o acesso num servico permite trocar por API depois sem tocar
em componente.

### 9.4 Payload do PRD (`src/services/prdPayload.js`)

`buildPrdPayload(journey)` monta o objeto enviado a skill de PRD, convertendo
`owners` de texto para lista e incluindo o flag `approved` do discovery.

**Validacao:** o adaptador funciona no modo mock assim que as skills existirem;
teste chamando `generatePrd` com um journey de exemplo.

---

## 10. Bloco 7 — Componentes de interface

**Objetivo:** blocos reaproveitaveis, todos usando apenas classes da paleta.

Arquivos em `src/components/`:

- `ui.js` — constantes de classe (botoes, card, input, mapas de cor por acento).
  As classes ficam escritas por extenso de proposito: o Tailwind so gera o que
  enxerga no codigo, entao concatenar cor em runtime produziria classe
  inexistente.
- `Field.jsx` — `TextField` e `TextAreaField` com label, hint, erro e `onBlur`.
- `ProgressHeader.jsx` — barra de progresso fixa, botao voltar e reiniciar.
- `StepCard.jsx` — moldura de cada etapa, com o icone de status (pendente,
  ativo, concluido) e `scrollIntoView` na etapa ativa.
- `OptionCard.jsx` — cartao selecionavel com selo "Sugerido".
- `SkillPanel.jsx` — moldura das skills; deixa explicito que a saida e sugestao.
  Exporta tambem `HumanGate` para os avisos de intervencao humana.
- `StepActions.jsx` — area de botoes com lista de bloqueios.
- `LinkAttachments.jsx` — anexos de links externos (Miro, NotebookLM, Docs) por
  escopo, com validacao de URL.

Hooks em `src/hooks/`:

- `useSkill.js` — encapsula `loading`/`error`/`run` de uma chamada de skill.
- `useTouched.js` — mostra erro de campo obrigatorio so depois do primeiro blur.

**Validacao:** componentes renderizam isoladamente; a checagem real vem na
montagem das etapas.

---

## 11. Bloco 8 — As seis etapas

**Objetivo:** uma pasta por etapa em `src/features/`, cada uma consumindo estado,
validacao e (quando aplicavel) skill.

1. **`product-context/ProductContextStep.jsx`** — formulario de contexto do
   produto. Campos obrigatorios: produto, squad, contexto de negocio. Inclui
   anexos de link com escopo `product`.
2. **`initiative/InitiativeStep.jsx`** — nome, descricao, problema, publico,
   resultado esperado e restricoes.
3. **`initiative/ClassificationStep.jsx`** — dispara a skill de classificacao ao
   abrir (com `useRef` para nao repetir a chamada em remontagem), mostra a
   sugestao e exige confirmacao humana via `OptionCard` + botao confirmar.
4. **`discovery/DiscoverySelectionStep.jsx`** — dispara a skill de recomendacao,
   exibe motivo, alternativas e perguntas, e deixa o PM escolher qualquer um dos
   frameworks disponiveis.
5. **`discovery/DiscoveryFormStep.jsx`** — renderiza os campos do framework ativo
   a partir dos metadados, oferece sugestao por campo e "preencher vazios",
   roda a revisao e exige aprovacao humana.
6. **`prd/PrdStep.jsx`** — gera o PRD, mostra metadados e secoes editaveis,
   perguntas em aberto e referencias, com aprovar/reabrir, exportar Markdown e
   imprimir.

Padrao comum: cada etapa recebe `onNext`, le `validateStep`, exibe bloqueios em
`StepActions` e escreve no estado via `dispatch`.

**Validacao:** com o dev server rodando, percorra as seis etapas manualmente
(roteiro no Bloco 16).

---

## 12. Bloco 9 — Montagem da pagina

**Objetivo:** amarrar tudo em `App.jsx` e `main.jsx`.

- `main.jsx` monta `JourneyProvider` em volta de `App` dentro de `StrictMode`.
- `JourneyProvider` (`src/state/JourneyProvider.jsx`) cria o reducer, hidrata do
  storage e faz autosave com debounce de 400ms (digitar num textarea nao deve
  escrever a cada tecla).
- `App.jsx` renderiza o cabecalho, a linha do tempo (linha de fundo + linha
  preenchida por CSS, sem calculo manual de altura), e mapeia `STEPS` para
  `StepCard`, decidindo o status de cada etapa e o resumo exibido quando
  concluida.

**Validacao:** recarregar a pagina mantem a jornada; o indicador de modo mostra
"deterministico local".

---

## 13. Bloco 10 — Servidor de skills

**Objetivo:** um servidor onde ficam credenciais e prompts, sem dependencia
externa.

Arquivos em `server/`:

- `index.js` — servidor `http` nativo. Roteia `POST /api/ai/<skill>`, le o corpo
  com limite de tamanho, e para cada rota decide entre provedor real (se
  configurado) e fallback deterministico. Valida a saida pelo contrato antes de
  responder. Erro vira `502` com mensagem, detalhe fica no log.
- `provider.js` — unico ponto de contato com o provedor de IA. `runPrompt({
  system, payload })` faz a chamada com timeout via `AbortController`, pede
  `response_format: json_object` e extrai JSON mesmo se vier dentro de bloco de
  codigo. `isProviderConfigured()` checa as tres variaveis de ambiente.
- `prompts.js` — as instrucoes das duas skills. E a parte "treinada" no MVP:
  comportamento vem de instrucao especializada + contrato verificado, nao de
  fine-tuning. Contem as regras compartilhadas (nao inventar, separar fato de
  hipotese, links so como referencia, responder so JSON).

**Validacao:**

```bash
npm run server
curl -s -X POST http://localhost:8787/api/ai/recommend-discovery \
  -H 'Content-Type: application/json' \
  -d '{"initiativeType":"incremental","initiative":{"name":"Teste","description":"Expandir mecanica","expectedOutcome":"Ticket +15%"}}'
```

Deve responder um JSON com `recommendedFramework`.

---

## 14. Bloco 11 — Testes

**Objetivo:** cobrir as regras que mais quebram em refatoracao.

Arquivos em `test/`, com `node:test`:

- `skills.test.js` — classificacao incremental vs novo fluxo; recomendacao por
  tipo; revisao apontando lacuna; contradicao na CSD; PRD com todas as secoes;
  secao sem insumo virando pergunta; export Markdown; e conformidade com os
  contratos.
- `journey.test.js` — troca de framework preservando conteudo; edicao derrubando
  aprovacao; PRD marcado como `stale`; sugestao nao sobrescrevendo texto do PM;
  limites de navegacao; regras de avanco por etapa.

Rode com:

```bash
npm test
```

Meta: todos verdes antes de considerar um bloco concluido.

---

## 15. Bloco 12 — Build e auditoria de cores

**Objetivo:** confirmar que a producao compila e que so as dez cores existem.

```bash
npm run build
grep -oE '#[0-9a-fA-F]{3,8}' dist/assets/*.css | sort -u
```

O resultado deve conter apenas as dez cores aprovadas (em formato curto ou
longo). Qualquer outra cor indica uso de classe fora da paleta — corrija antes
de seguir.

---

## 16. Roteiro de verificacao manual

Com `npm run dev` no ar:

1. **Etapa 1:** tentar avancar vazio mostra erros; preencher produto, squad e
   contexto libera o avanco.
2. **Etapa 2:** preencher a iniciativa e avancar.
3. **Etapa 3:** a sugestao de classificacao aparece sozinha; confirmar libera o
   avanco.
4. **Etapa 4:** a recomendacao aparece; trocar de framework e voltar preserva o
   conteudo digitado.
5. **Etapa 5:** usar "sugerir conteudo" nao sobrescreve texto ja escrito; a
   revisao lista lacunas; aprovar libera o PRD.
6. **Etapa 6:** gerar, editar uma secao, aprovar, exportar Markdown e imprimir.
7. **Persistencia:** recarregar a pagina mantem tudo.
8. **Coerencia:** voltar e editar a iniciativa marca o PRD como desatualizado.

---

## 17. Como plugar um provedor de IA real

Sem mudar nenhuma linha de interface:

1. Configure as variaveis do servidor (arquivo `.env` ou ambiente):

   ```bash
   AI_API_URL=https://<endpoint>/chat/completions
   AI_API_KEY=<sua-chave>
   AI_MODEL=<modelo>
   ```

2. Suba o servidor: `npm run server`. Ele passa a usar o provedor e cai no
   fallback deterministico so se as variaveis faltarem.

3. Aponte a interface para o servidor:

   ```bash
   VITE_AI_MODE=http npm run dev
   ```

4. Compare a saida com a versao deterministica. Como o contrato e o mesmo, a
   tela nao muda; o que muda e a qualidade do texto.

Para "treinar" as skills no MVP, refine `server/prompts.js` e adicione exemplos
de bons PRDs. Fine-tuning so vale a pena depois de acumular PRDs reais aprovados
e identificar o que a instrucao nao resolve.

---

## 18. Proximos passos

Depois do MVP funcional:

1. Conectar um provedor real e comparar com a versao deterministica.
2. Reunir PRDs aprovados como exemplos nas instrucoes das skills.
3. Backend com banco, autenticacao e historico de versoes (trocar o
   `localStorage` pelos endpoints, mantendo o `storageService` como fronteira).
4. Comentarios de revisores dentro do documento.
5. Exportacao para DOCX alem de Markdown e impressao.

Fora deste MVP por dependerem de backend, credenciais e permissoes: integracao
nativa com Miro, Google Docs e BusinessMap, leitura automatica de repositorios e
todo o fluxo tecnico posterior ao PRD.
