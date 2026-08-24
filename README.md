# PM Builder — do input da iniciativa ao PRD

Aplicacao React que conduz um Product Manager por seis etapas, do contexto do
produto ate um PRD revisado e aprovado. Escrita em JavaScript puro, sem
TypeScript.

O escopo termina no PRD. O fluxo tecnico (design doc, tarefas, pull requests)
fica fora desta entrega.

> Para reconstruir ou dar manutencao no projeto passo a passo, veja
> [`docs/GUIA_DE_IMPLEMENTACAO.md`](docs/GUIA_DE_IMPLEMENTACAO.md).
>
> O modelo de PRD (cabecalho, secoes, hipoteses, AS IS/TO BE e CAs) esta em
> [`docs/MODELO_PRD.md`](docs/MODELO_PRD.md). Exemplo preenchido:
> [`fixtures/prd-exemplo-input-output.md`](fixtures/prd-exemplo-input-output.md).

## Como rodar

```bash
npm install
npm run dev          # interface em http://localhost:5173
```

As skills de IA rodam por padrao em modo deterministico dentro do navegador,
entao nao e preciso chave de API para percorrer a jornada inteira.

Para usar o servidor de skills:

```bash
npm run server       # http://localhost:8787
VITE_AI_MODE=http npm run dev
```

Outros comandos:

```bash
npm test             # testes das skills, do reducer e das validacoes
npm run build        # build de producao
```

## As seis etapas

| # | Etapa | O que acontece |
| --- | --- | --- |
| 1 | Contexto do produto | Dados estaveis da squad, reaproveitados por todas as iniciativas |
| 2 | Iniciativa | Descricao, problema, publico, resultado esperado e restricoes |
| 3 | Classificacao | A skill sugere incremental ou novo fluxo; o PM confirma |
| 4 | Ferramenta de discovery | A skill recomenda um dos onze frameworks e justifica |
| 5 | Preenchimento do discovery | Sugestao por campo, revisao automatica e aprovacao humana |
| 6 | PRD | Documento gerado, editavel, aprovavel e exportavel |

Frameworks disponiveis:

- Arvore de Oportunidades — outcome, dores, solucoes e experimentos
- Matriz CSD — fatos, suposicoes e duvidas
- Double Diamond — problema amplo e convergencia
- Jobs To Be Done — motivacao e progresso do usuario
- Mapa de Suposicoes — hipoteses mais arriscadas
- Impact Mapping — meta, atores, impactos e entregas
- User Story Mapping — jornada e cortes de MVP
- Service Blueprint — operacao, canais, handoffs e sistemas
- Value Proposition Canvas — segmento e proposta de valor
- Design Sprint — prototipo e teste rapido
- Lean Canvas — novo produto, mercado ou modelo de negocio

Trocar de framework nao apaga conteudo — cada um guarda os proprios campos.
Veja a orientacao de uso em
[`docs/FRAMEWORKS_DISCOVERY.md`](docs/FRAMEWORKS_DISCOVERY.md).

## Skills de IA

Duas skills, ambas atras do mesmo adaptador (`src/services/aiClient.js`):

- **Discovery** (`shared/discoverySkill.js`): classifica a iniciativa, recomenda
  framework, rascunha campos e revisa o preenchimento.
- **PRD** (`shared/prdSkill.js`): monta o documento a partir do discovery
  aprovado.

Tres decisoes sustentam esse desenho:

1. **Contrato antes de modelo.** Cada resposta e validada em
   `shared/contracts.js`. Resposta fora do formato vira erro exibido na tela, nao
   uma renderizacao quebrada.
2. **Implementacao deterministica primeiro.** As mesmas funcoes servem de modo
   mock da interface e de fallback do servidor. O fluxo inteiro e desenvolvivel
   sem custo, sem credencial e sem resposta imprevisivel.
3. **Nada inventado.** O que falta insumo vira pergunta em aberto marcada como
   `[a preencher]`, nunca texto plausivel. As instrucoes que impoem isso a um
   modelo real estao em `server/prompts.js`.

Trocar a versao deterministica por um provedor real nao exige mudanca na
interface: basta configurar `AI_API_URL`, `AI_API_KEY` e `AI_MODEL` e apontar a
interface para o servidor.

## Ferramentas externas

Miro, NotebookLM e Google Docs entram apenas como link, sem integracao nativa.
A skill recebe tipo, titulo e URL, e as instrucoes proibem afirmar que o
conteudo do link foi lido.

## Paleta

Somente dez cores sao permitidas:

`#D4E137` `#8BC34A` `#4FC3F7` `#0277BD` `#FB8C00` `#F4511E` `#000000` `#FFFFFF`
`#E2E8F0` `#F8FAFC`

A regra e imposta pela build, nao pela disciplina de quem escreve o codigo: o
`@theme` em `src/index.css` zera a paleta padrao do Tailwind com
`--color-*: initial`. Classes como `bg-slate-300` deixam de existir. Para
conferir o resultado:

```bash
npm run build
grep -oE '#[0-9a-fA-F]{3,8}' dist/assets/*.css | sort -u
```

## Estrutura

```
shared/            skills, frameworks e contratos (usados pelo app e pelo servidor)
server/            servidor das skills, prompts e integracao com o provedor
src/components/    blocos de interface reaproveitados
src/features/      uma pasta por etapa da jornada
src/services/      adaptador de IA, validacao e persistencia
src/state/         modelo, reducer e provider da jornada
test/              testes com node:test
```

O estado vive num reducer unico e a interface deriva dele. Nao ha manipulacao
direta de DOM nem alteracao manual de classe, que era a caracteristica do
prototipo HTML original.

Duas regras do reducer merecem atencao:

- Editar um insumo marca o PRD como `stale`, entao o documento nunca fica
  apontando para um discovery que mudou depois.
- Editar o discovery derruba a aprovacao anterior, forcando nova revisao humana.

## Persistencia

`localStorage`, com autosave em `src/services/storage.js`. O acesso esta isolado
num servico para que a troca por uma API nao exija tocar em componente nenhum.

## Proximos passos

Antes de ampliar escopo:

1. Conectar um provedor real e comparar a saida com a versao deterministica.
2. Reunir PRDs aprovados como exemplos nas instrucoes das skills.
3. Backend com banco, autenticacao e historico de versoes.
4. Comentarios de revisores dentro do documento.
5. Exportacao para DOCX alem de Markdown e impressao.

Fora deste MVP por dependerem de backend, credenciais e permissoes: integracao
nativa com Miro, Google Docs e BusinessMap, leitura automatica de repositorios e
todo o fluxo tecnico posterior ao PRD.
