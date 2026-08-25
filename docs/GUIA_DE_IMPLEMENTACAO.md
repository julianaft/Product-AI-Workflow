# Guia de implementação — PM Builder (da iniciativa à entrega)

Documento passo a passo para reconstruir ou dar manutenção no projeto. Descreve
a ordem de trabalho, o que cada arquivo faz e como validar cada bloco. Depois do
PRD, o MVP oferece a criação opcional de uma Story no Businessmap.

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
9. [Bloco 6 — Serviços (IA, validação, storage)](#9-bloco-6--servicos-ia-validacao-storage)
10. [Bloco 7 — Componentes de interface](#10-bloco-7--componentes-de-interface)
11. [Bloco 8 — Login, setup e etapas da iniciativa](#11-bloco-8--login-setup-e-etapas-da-iniciativa)
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
  └── chama serviços          ├── integração com o provedor de IA
                              └── proxy seguro para o Businessmap
        │                            │
        └──────────┬─────────────────┘
                   ▼
           Dominio compartilhado (shared/)
           ├── frameworks de discovery
           ├── skills deterministicas
           ├── contratos de saida
           ├── gerador de PRD
           └── template da Story
```

Princípios que orientam todo o código:

- **A interface é função do estado.** Nada de `getElementById`, `innerHTML` ou
  `classList` manual. Uma maquina de estados (reducer) descreve a jornada; os
  componentes apenas a renderizam.
- **Contrato antes de modelo.** As skills tem um formato de saida fixo, validado
  antes de chegar na tela. Trocar a implementação determinística por um LLM não
  muda a interface.
- **Nada inventado.** Onde falta insumo, o texto vira pergunta em aberto marcada
  com `[a preencher]`, nunca conteúdo plausível.
- **Cor imposta pela build.** A paleta padrão do Tailwind é zerada; só as dez
  cores aprovadas existem.

Ordem de construção recomendada: de dentro para fora. Primeiro `shared/`, depois
`src/state`, depois `src/services`, depois componentes e etapas, e por fim o
servidor. Cada bloco abaixo segue essa ordem.

---

## 2. Pre-requisitos

- Node 20 ou superior (o projeto usa `node:test` e `fetch` nativo).
- npm 10 ou superior.
- Nenhuma chave de API é necessária para discovery e PRD. A criação opcional da
  Story exige uma chave do Businessmap configurada pelo usuário.

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
      "dev": "node server/dev.js",
      "dev:web": "vite",
       "build": "vite build",
       "preview": "vite preview",
       "server": "node server/index.js",
       "test": "node --test test/*.test.js"
     }
   }
   ```

3. Configure o Vite com os plugins de React e Tailwind e um proxy de `/api` para
   o servidor (`vite.config.js`). O proxy permite que a interface em
   `http://localhost:5173` chame `/api/ai/...` e `/api/businessmap/...` sem
   lidar com CORS ou enviar a chave diretamente ao serviço externo.

4. Crie `index.html` com a `div#root` e o `main.jsx` como módulo. Importe os
   pesos da IBM Plex Sans pelo pacote `@fontsource/ibm-plex-sans`; a interface
   não depende de uma fonte remota para renderizar.

**Validação:** `npm run dev` sobe sem erro, serve a página em
`http://localhost:5173` e o backend em `http://localhost:8787`.

---

## 4. Bloco 1 — Paleta e tema travados

**Objetivo:** impedir por construção qualquer cor fora da lista.

Arquivo: `src/index.css`.

A técnica central é, dentro do bloco `@theme` do Tailwind v4, resetar toda a
paleta e declarar apenas as dez cores:

```css
@import 'tailwindcss';

@theme {
  --color-*: initial;      /* apaga slate, gray, red padrão etc. */

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
paleta simplesmente não vê efeito, e a auditoria do Bloco 12 acusa.

Inclua tambem as regras de `@media print` para o PRD (esconder o que tiver a
classe `no-print` e remover bordas/altura do `print-area`).

**Validação:** após o primeiro componente existir, `npm run build` e a auditoria
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
esses metadados para renderizar os formulários automaticamente, e a validação os
usa para saber quais campos sao obrigatorios. Definir o campo em um so lugar
evita divergencia entre tela e regra.

**Validação:** `node -e "import('./shared/frameworks.js').then(m => console.log(m.FRAMEWORK_IDS))"`
imprime os tres ids.

---

## 6. Bloco 3 — Skills deterministicas

**Objetivo:** implementar o comportamento das duas skills sem depender de modelo.

### 6.1 Skill de discovery (`shared/discoverySkill.js`)

Quatro funções, cada uma com entrada e saída no formato do contrato:

- `classifyInitiative({ product, initiative })` — conta sinais textuais de
  "expansão" versus "construção inédita" e devolve `incremental` ou `new`, com
  confianca, motivo e `needsConfirmation: true`.
- `recommendDiscovery({ initiative, initiativeType, availableFrameworks })` —
  aplica regras: fluxo novo tende a double-diamond; muita hipótese e pouca
  evidência tende a CSD; incremental com objetivo claro tende a
  opportunity-tree. Retorna framework recomendado, alternativas, um rascunho de
  campos (`suggestedFields`) e perguntas em aberto.
- `suggestDiscoveryField({ ... })` — devolve um rascunho para um unico campo.
- `reviewDiscovery({ frameworkId, fields })` — aponta campos vazios, marcadores
  `[a preencher]` remanescentes, textos curtos demais e contradicoes (ex.: uma
  "certeza" escrita com linguagem de hipótese).

Regra que atravessa todas: quando falta insumo, use a constante `PENDING`
(`[a preencher]`); nunca gere texto plausivel.

### 6.2 Skill de PRD (`shared/prdSkill.js`)

- Exporte `PRD_SECTIONS` (chave + rótulo) como fonte única da ordem das seções.
- `normalizeDiscovery(discovery)` traduz qualquer framework do catalogo para um
  formato comum (problema, solução, experimentos, etc.), para o gerador não
  precisar conhecer cada formato.
- `generatePrd(payload)` monta título, metadados, todas as seções,
  `openQuestions` e rastreabilidade. Seção sem insumo recebe a constante
  `MISSING` e alimenta as perguntas em aberto.
- `regeneratePrdSection(payload, key)` regenera uma única seção.
- `prdToMarkdown(prd)` serializa para exportacao.
- `revisePrd` em `shared/prdRevision.js` aplica a mensagem do chat sobre o
  documento atual (respostas e pedidos de mudança) e devolve `{ prd, reply }`.

**Validação:** os testes do Bloco 11 cobrem estas funções; rode-os assim que
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

**Validação:** um teste que passa um objeto incompleto e espera `ContractError`.

---

## 8. Bloco 5 — Estado da jornada

**Objetivo:** uma unica fonte de verdade, com as regras de coerencia embutidas.

### 8.1 Modelo (`src/state/journeyModel.js`)

`createJourney()` devolve o estado inicial: `activeStep`, `maxRevealedStep`,
`product`, `initiative`, `classification`, `discovery` e `prd`, alem de `links`.

Ponto importante: o discovery guarda `fieldsByFramework`, um objeto por
framework. Assim, trocar de método não apaga o que foi escrito no anterior. O
helper `discoveryFields(journey)` devolve os campos do framework ativo.

### 8.2 Reducer (`src/state/journeyReducer.js`)

Implemente as ações de navegação (`nextStep`, `previousStep`, `goToStep`), de
edição de cada seção, e as de skill (`setClassificationSuggestion`,
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

**Validação:** os testes de `test/journey.test.js` cobrem exatamente essas
regras.

---

## 9. Bloco 6 — Serviços (IA, validação, storage)

**Objetivo:** isolar IA, regras de avanco e persistencia do resto do app.

### 9.1 Adaptador de IA (`src/services/aiClient.js`)

Um unico ponto que decide, por `VITE_AI_MODE`, entre chamar o servidor (`http`)
ou a skill deterministica local (`mock`). Nos dois casos, a resposta passa pelo
validador de contrato antes de retornar. Exporte uma função por operação
(`classifyInitiative`, `recommendDiscovery`, `suggestDiscoveryField`,
`reviewDiscovery`, `generatePrd`) e `getAiMode()` para a interface exibir o modo.

### 9.2 Validação (`src/services/validation.js`)

`validateStep(stepId, journey)` devolve `{ errors, blockers }`: `errors` por
campo (mostrados junto ao input) e `blockers` gerais (mostrados perto do botao
de avancar). `isStepComplete` deriva daí. Centralizar aqui evita espalhar `if`
de obrigatoriedade pelos componentes.

### 9.3 Storage (`src/services/storage.js`)

O storage guarda uma sessão mockada e um workspace por e-mail
(`pm-builder:workspace:<email>`). Cada workspace contém o setup geral, as
iniciativas e o ID da iniciativa ativa. A chave antiga `pm-builder:journey` é
migrada uma única vez para a primeira conta que entrar. Esse isolamento é só
funcional no navegador; produção exige backend e autorização por usuário.

### 9.4 Payload do PRD (`src/services/prdPayload.js`)

`buildPrdPayload(journey)` monta o objeto enviado a skill de PRD, convertendo
`owners` de texto para lista e incluindo o flag `approved` do discovery.

**Validação:** o adaptador funciona no modo mock assim que as skills existirem;
teste chamando `generatePrd` com um journey de exemplo.

---

## 10. Bloco 7 — Componentes de interface

**Objetivo:** blocos reaproveitaveis, todos usando apenas classes da paleta.

Arquivos em `src/components/`:

- `ui.js` — constantes de classe (botoes, card, input, mapas de cor por acento).
  As classes ficam escritas por extenso de proposito: o Tailwind so gera o que
  enxerga no código, então concatenar cor em runtime produziria classe
  inexistente.
- `Field.jsx` — `TextField` e `TextAreaField` com label, hint, erro e `onBlur`.
- `ProgressHeader.jsx` — barra de progresso fixa, botao voltar e reiniciar.
- `StepCard.jsx` — moldura de cada etapa, com o icone de status (pendente,
  ativo, concluido) e `scrollIntoView` na etapa ativa.
- `OptionCard.jsx` — cartao selecionavel com selo "Sugerido".
- `SkillPanel.jsx` — moldura das skills; deixa explicito que a saida e sugestao.
  Exporta tambem `HumanGate` para os avisos de intervencao humana.
- `StepActions.jsx` — área de botões com lista de bloqueios.
- `LinkAttachments.jsx` — anexos de links externos (Miro, NotebookLM, Docs) por
  escopo, com validação de URL.

Hooks em `src/hooks/`:

- `useSkill.js` — encapsula `loading`/`error`/`run` de uma chamada de skill.
- `useTouched.js` — mostra erro de campo obrigatório só depois do primeiro blur.

**Validação:** componentes renderizam isoladamente; a checagem real vem na
montagem das etapas.

---

## 11. Bloco 8 — Login, setup e etapas da iniciativa

**Objetivo:** separar identidade, configuração estável e trabalho por iniciativa.

1. **`auth/MockLoginPage.jsx`** — identifica o acesso por e-mail Google. Cada conta
   carrega uma chave própria de workspace no storage.
2. **`workspace/ProjectSetupPage.jsx`** — envolve o formulário de contexto com
   Produto, PM,
   PD, TM e TL; fonte de contexto de negócio por NotebookLM ou TXT/DOC; e seleção
   dos repositórios do projeto. Link e chave do Businessmap são opcionais. Esse
   setup é reaproveitado.
3. **`workspace/WorkspaceDashboard.jsx`** — lista somente as iniciativas da
   conta ativa e permite criar ou retomar cada fluxo.
4. **`initiative/InitiativeStep.jsx`** — nome, descrição, problema, público,
   resultado esperado e restrições.
5. **`initiative/ClassificationStep.jsx`** — dispara a skill de classificação ao
   abrir (com `useRef` para não repetir a chamada em remontagem), mostra a
   sugestão e exige confirmação humana via `OptionCard` + botão confirmar.
6. **`discovery/DiscoverySelectionStep.jsx`** — dispara a skill de recomendação,
   exibe motivo, alternativas e perguntas, e deixa o PM escolher qualquer um dos
   frameworks disponíveis.
7. **`discovery/DiscoveryFormStep.jsx`** — renderiza os campos do framework ativo
   a partir dos metadados, já traz rascunho baseado no problema, na dor e na
   entrega da iniciativa (sem sobrescrever texto do PM), oferece sugestão por
   campo e "preencher vazios", aceita documentos/transcrições por iniciativa,
   atualiza o template com fontes identificadas, roda a revisão e exige
   aprovação humana. `DiscoveryEvidenceSources.jsx` extrai DOCX com `mammoth` e
   lê TXT, MD, DOC/HTML, SRT e VTT diretamente no navegador.
8. **`prd/PrdStep.jsx`** — gera o PRD, mostra metadados e seções editáveis,
   perguntas em aberto e referências; abaixo do documento fica o chat de
   revisão (cada mensagem gera uma nova versão), seguido de aprovar/reabrir,
   exportar DOC compatível com Google Docs e copiar o conteúdo formatado.
9. **`businessmap/BusinessmapStep.jsx`** — etapa opcional marcada como WIP, com
   logo oficial, que mostra a prévia do template e chama o backend para criar um
   card sempre do tipo `Story`.

Padrão comum: cada etapa recebe `onNext`, lê `validateStep`, exibe bloqueios em
`StepActions` e escreve no estado via `dispatch`.

**Validação:** entre com dois e-mails diferentes, confirme o isolamento, configure
um projeto e crie duas iniciativas sem repetir o setup.

---

## 12. Bloco 9 — Montagem da pagina

**Objetivo:** amarrar tudo em `App.jsx` e `main.jsx`.

- `main.jsx` monta `JourneyProvider` em volta de `App` dentro de `StrictMode`.
- `JourneyProvider` (`src/state/JourneyProvider.jsx`) cria o reducer, hidrata do
  storage e faz autosave com debounce de 400ms (digitar num textarea não deve
  escrever a cada tecla).
- `App.jsx` renderiza o cabecalho, a linha do tempo (linha de fundo + linha
  preenchida por CSS, sem calculo manual de altura), e mapeia `STEPS` para
  `StepCard`, decidindo o status de cada etapa e o resumo exibido quando
  concluida.

**Validação:** recarregar a página mantém a jornada; o indicador de modo mostra
"deterministico local".

---

## 13. Bloco 10 — Servidor de skills e integrações

**Objetivo:** um servidor onde ficam credenciais e prompts, sem dependencia
externa.

Arquivos em `server/`:

- `index.js` — servidor `http` nativo. Roteia `POST /api/ai/<skill>` (`classify-initiative`,
  `recommend-discovery`, `suggest-discovery-field`, `review-discovery`, `generate-prd`,
  `revise-prd`), le o corpo com limite de tamanho, e para cada rota decide entre
  provedor real (se configurado) e fallback deterministico. Valida a saida pelo
  contrato antes de responder. Também expõe `POST /api/businessmap/stories`.
  Erro vira `502` com mensagem, detalhe fica no log.
- `businessmap.js` — valida o domínio corporativo para evitar SSRF, consulta a
  estrutura do board e os tipos disponíveis, encontra o workflow de cards, a
  primeira lane e uma folha da seção `Requested`, resolve o tipo `Story` e cria
  o card. A chave fica somente no header `apikey` enviado pelo backend.
- `dev.js` — sobe servidor e Vite juntos, inclusive no Windows.
- `provider.js` — unico ponto de contato com o provedor de IA. `runPrompt({
  system, payload })` faz a chamada com timeout via `AbortController`, pede
  `response_format: json_object` e extrai JSON mesmo se vier dentro de bloco de
  código. `isProviderConfigured()` checa as três variáveis de ambiente.
- `prompts.js` — as instrucoes das duas skills. E a parte "treinada" no MVP:
  comportamento vem de instrução especializada + contrato verificado, não de
  fine-tuning. Contém as regras compartilhadas (não inventar, separar fato de
  hipótese, links só como referência, responder só JSON).

**Validação:**

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

- `skills.test.js` — classificação incremental vs novo fluxo; recomendação por
  tipo; revisão apontando lacuna; contradição na CSD; PRD com todas as seções;
  seção sem insumo virando pergunta; export Markdown; e conformidade com os
  contratos.
- `journey.test.js` — troca de framework preservando conteúdo; edição derrubando
  aprovação; PRD marcado como `stale`; sugestão não sobrescrevendo texto do PM;
  limites de navegacao; regras de avanco por etapa.
- `businessmap.test.js` — valida URL/configuração, template da Story, resolução
  de workflow/lane/coluna/tipo e contrato HTTP com respostas simuladas.

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
3. **Etapa 3:** a sugestão de classificação aparece sozinha; confirmar libera o
   avanco.
4. **Etapa 4:** a recomendacao aparece; trocar de framework e voltar preserva o
   conteúdo digitado.
5. **Etapa 5:** usar "sugerir conteúdo" não sobrescreve texto já escrito; a
   revisao lista lacunas; aprovar libera o PRD.
6. **Etapa 6:** gerar, editar uma seção, conversar no chat de revisão até sair uma
   nova versão, aprovar, exportar DOC e copiar para Google Docs.
7. **Etapa 7:** conferir a prévia da Story, criar no Businessmap ou pular por
   agora. Sem configuração, a etapa deve oferecer acesso ao setup do projeto.
8. **Persistência:** recarregar a página mantém tudo, inclusive o ID da Story.
9. **Coerência:** voltar e editar a iniciativa marca o PRD como desatualizado.

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

4. Compare a saída com a versão determinística. Como o contrato é o mesmo, a
   tela não muda; o que muda é a qualidade do texto.

Para "treinar" as skills no MVP, refine `server/prompts.js` e adicione exemplos
de bons PRDs. Fine-tuning so vale a pena depois de acumular PRDs reais aprovados
e identificar o que a instrução não resolve.

---

## 18. Proximos passos

Depois do MVP funcional:

1. Conectar um provedor real e comparar com a versão determinística.
2. Reunir PRDs aprovados como exemplos nas instrucoes das skills.
3. Backend com banco, autenticacao e historico de versoes (trocar o
   `localStorage` pelos endpoints, mantendo o `storageService` como fronteira).
4. Comentarios de revisores dentro do documento.
5. Exportacao para DOCX nativo, alem do DOC atual.

Fora deste MVP por dependerem de backend, credenciais e permissões: integração
nativa com NotebookLM e Miro, leitura automática dos repositórios selecionados,
cofre de segredos para a chave do Businessmap e o restante do fluxo técnico.
