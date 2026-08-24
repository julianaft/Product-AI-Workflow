# PM Builder — do input da iniciativa ao PRD

Aplicação React que conduz um Product Manager por seis etapas, do contexto do
produto ate um PRD revisado e aprovado. Escrita em JavaScript puro, sem
TypeScript.

O escopo termina no PRD. O fluxo técnico (design doc, tarefas, pull requests)
fica fora desta entrega.

> Para reconstruir ou dar manutencao no projeto passo a passo, veja
> [`docs/GUIA_DE_IMPLEMENTACAO.md`](docs/GUIA_DE_IMPLEMENTACAO.md).
>
> O modelo de PRD (cabeçalho, seções, hipóteses, AS IS/TO BE e CAs) está em
> [`docs/MODELO_PRD.md`](docs/MODELO_PRD.md). Exemplo preenchido:
> [`fixtures/prd-exemplo-input-output.md`](fixtures/prd-exemplo-input-output.md).

## Como rodar

```bash
npm install
npm run dev          # interface em http://localhost:5173
```

As skills de IA rodam por padrão em modo determinístico dentro do navegador,
então não é preciso chave de API para percorrer a jornada inteira.

Para usar o servidor de skills:

```bash
npm run server       # http://localhost:8787
VITE_AI_MODE=http npm run dev
```

Outros comandos:

```bash
npm test             # testes das skills, do reducer e das validações
npm run build        # build de producao
```

## As seis etapas

| # | Etapa | O que acontece |
| --- | --- | --- |
| 1 | Contexto do produto | Dados estaveis da squad, reaproveitados por todas as iniciativas |
| 2 | Iniciativa | Descrição, problema, público, resultado esperado e restrições |
| 3 | Classificação | A skill sugere incremental ou novo fluxo; o PM confirma |
| 4 | Ferramenta de discovery | A skill recomenda um dos onze frameworks e justifica |
| 5 | Preenchimento do discovery | Sugestao por campo, revisao automatica e aprovacao humana |
| 6 | PRD | Documento gerado, editavel, aprovavel e exportavel |

Frameworks disponiveis:

- Árvore de Oportunidades — outcome, dores, soluções e experimentos
- Matriz CSD — fatos, suposições e dúvidas
- Double Diamond — problema amplo e convergencia
- Jobs To Be Done — motivação e progresso do usuário
- Mapa de Suposições — hipóteses mais arriscadas
- Impact Mapping — meta, atores, impactos e entregas
- User Story Mapping — jornada e cortes de MVP
- Service Blueprint — operação, canais, handoffs e sistemas
- Value Proposition Canvas — segmento e proposta de valor
- Design Sprint — prototipo e teste rapido
- Lean Canvas — novo produto, mercado ou modelo de negócio

Trocar de framework não apaga conteúdo — cada um guarda os próprios campos.
Veja a orientacao de uso em
[`docs/FRAMEWORKS_DISCOVERY.md`](docs/FRAMEWORKS_DISCOVERY.md).

## Skills de IA

Duas skills, ambas atras do mesmo adaptador (`src/services/aiClient.js`):

- **Discovery** (`shared/discoverySkill.js`): classifica a iniciativa, recomenda
  framework, rascunha campos e revisa o preenchimento.
- **PRD** (`shared/prdSkill.js`): monta o documento a partir do discovery
  aprovado.

Três decisões sustentam esse desenho:

1. **Contrato antes de modelo.** Cada resposta e validada em
   `shared/contracts.js`. Resposta fora do formato vira erro exibido na tela, não
   uma renderizacao quebrada.
2. **Implementação determinística primeiro.** As mesmas funções servem de modo
   mock da interface e de fallback do servidor. O fluxo inteiro e desenvolvivel
   sem custo, sem credencial e sem resposta imprevisivel.
3. **Nada inventado.** O que falta insumo vira pergunta em aberto marcada como
   `[a preencher]`, nunca texto plausivel. As instrucoes que impoem isso a um
   modelo real estao em `server/prompts.js`.

Trocar a versão determinística por um provedor real não exige mudança na
interface: basta configurar `AI_API_URL`, `AI_API_KEY` e `AI_MODEL` e apontar a
interface para o servidor.

## Ferramentas externas

O contexto de negócio aceita link do NotebookLM ou arquivo TXT/DOC baseado em texto.
O conteúdo do NotebookLM não é lido nativamente; o link identifica a fonte. O
contexto técnico usa somente os repositórios GitHub selecionados para a iniciativa.
Miro e outros materiais continuam entrando apenas como links de referência.

## Paleta

Somente dez cores sao permitidas:

`#D4E137` `#8BC34A` `#4FC3F7` `#0277BD` `#FB8C00` `#F4511E` `#000000` `#FFFFFF`
`#E2E8F0` `#F8FAFC`

A regra é imposta pela build, não pela disciplina de quem escreve o código: o
`@theme` em `src/index.css` zera a paleta padrão do Tailwind com
`--color-*: initial`. Classes como `bg-slate-300` deixam de existir. Para
conferir o resultado:

```bash
npm run build
grep -oE '#[0-9a-fA-F]{3,8}' dist/assets/*.css | sort -u
```

## Estrutura

```
shared/            skills, frameworks e contratos (usados pelo app e pelo servidor)
server/            servidor das skills, prompts e integração com o provedor
src/components/    blocos de interface reaproveitados
src/features/      uma pasta por etapa da jornada
src/services/      adaptador de IA, validação e persistência
src/state/         modelo, reducer e provider da jornada
test/              testes com node:test
```

O estado vive num reducer único e a interface deriva dele. Não há manipulação
direta de DOM nem alteracao manual de classe, que era a caracteristica do
prototipo HTML original.

Duas regras do reducer merecem atencao:

- Editar um insumo marca o PRD como `stale`, entao o documento nunca fica
  apontando para um discovery que mudou depois.
- Editar o discovery derruba a aprovacao anterior, forcando nova revisao humana.

## Persistencia

`localStorage`, com autosave em `src/services/storage.js`. O acesso esta isolado
num serviço para que a troca por uma API não exija tocar em componente nenhum.

## Proximos passos

Antes de ampliar escopo:

1. Conectar um provedor real e comparar a saída com a versão determinística.
2. Reunir PRDs aprovados como exemplos nas instrucoes das skills.
3. Backend com banco, autenticacao e historico de versoes.
4. Comentarios de revisores dentro do documento.
5. Exportacao para DOCX alem de Markdown e impressao.

Fora deste MVP por dependerem de backend, credenciais e permissões: integração
nativa com NotebookLM, Miro e BusinessMap, acesso a repositórios privados e
todo o fluxo técnico posterior ao PRD.
