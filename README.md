# PM Builder — da iniciativa à entrega

Aplicação React para Product Managers, com login Google mockado, configuração
reutilizável do projeto/time e jornadas independentes por iniciativa. Cada
iniciativa percorre seis etapas até um PRD revisado e, opcionalmente, uma Story
criada no Businessmap. Escrita em JavaScript puro, sem TypeScript.

> Para reconstruir ou dar manutencao no projeto passo a passo, veja
> [`docs/GUIA_DE_IMPLEMENTACAO.md`](docs/GUIA_DE_IMPLEMENTACAO.md).
>
> O modelo de PRD (cabeçalho, seções, hipóteses, AS IS/TO BE e CAs) está em
> [`docs/MODELO_PRD.md`](docs/MODELO_PRD.md). Exemplo preenchido:
> [`fixtures/prd-exemplo-input-output.md`](fixtures/prd-exemplo-input-output.md).

## Como rodar

```bash
npm install
npm run dev          # interface + servidor de integração
```

As skills de IA rodam por padrão em modo determinístico dentro do navegador,
então não é preciso chave de API para percorrer a jornada inteira.

`npm run dev` sobe a interface em `http://localhost:5173` e o servidor em
`http://localhost:8787`. Para subir somente uma das partes:

```bash
npm run server       # http://localhost:8787
npm run dev:web      # http://localhost:5173
```

Outros comandos:

```bash
npm test             # testes das skills, do reducer e das validações
npm run build        # build de producao
```

## Login, setup e iniciativas

1. **Login mockado:** o e-mail simula a identidade Google e separa os dados
   locais de cada pessoa.
2. **Setup do projeto/time:** membros, documentação geral de negócio e
   repositórios são cadastrados uma vez. Link do board e chave de API do
   Businessmap são opcionais.
3. **Iniciativas:** o dashboard permite criar e retomar vários discoveries,
   todos herdando o setup.

| # | Etapa | O que acontece |
| --- | --- | --- |
| 1 | Iniciativa | Descrição, problema, público, resultado esperado e restrições |
| 2 | Classificação | A skill sugere incremental ou novo fluxo; o PM confirma |
| 3 | Ferramenta de discovery | A skill recomenda um dos onze frameworks e justifica |
| 4 | Preenchimento do discovery | Rascunho automático, documentos/transcrições da iniciativa, atualização com evidências, revisão e aprovação |
| 5 | PRD | Documento gerado, revisado por chat, aprovável e exportável em DOC |
| 6 | Story no Businessmap (WIP) | Criação opcional de card do tipo Story a partir do PRD aprovado |

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
  framework, rascunha os campos com base no problema/dor/entrega, incorpora
  documentos e transcrições sem apagar o texto do PM e revisa o preenchimento.
- **PRD** (`shared/prdSkill.js` e `shared/prdRevision.js`): monta o documento e
  gera novas versões a partir do chat (respostas e pedidos de mudança).

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
contexto técnico usa os repositórios GitHub selecionados no setup do projeto.
Miro e outros materiais continuam entrando apenas como links de referência.

### Businessmap

Toda a integração aparece com o selo **WIP**. A interface usa, sem alterações, o
logo oficial servido publicamente por Businessmap e versionado em
`src/assets/businessmap.svg`.

O setup aceita o link do board corporativo no formato
`https://grupoboticario.kanbanize.com/ctrl_board/379` e a chave de API. Depois
da aprovação do PRD, a etapa opcional:

1. consulta a estrutura do board;
2. encontra o workflow de cards, a primeira lane e a primeira coluna
   `Requested` disponível;
3. resolve o tipo `Story` habilitado no board;
4. cria o card com contexto, história do usuário, requisitos, links, critérios
   de aceite, dependências/restrições e cenários de teste.

A iniciativa guarda o ID retornado. Se o PRD mudar depois da criação, o card
externo é preservado e marcado como desatualizado na plataforma, evitando a
criação silenciosa de uma Story duplicada.

A chave passa pelo servidor Node; ela nunca é enviada diretamente do React para
o domínio do Businessmap. Neste MVP ela ainda fica no `localStorage` do
navegador porque o login é mockado. Isso não é adequado para produção: com SSO
real, a chave deve ficar em um cofre de segredos acessível apenas pelo backend.

### Evidências do discovery

Cada iniciativa aceita documentos TXT, MD, DOC, DOCX e HTML e transcrições TXT,
SRT e VTT. O botão **Atualizar template de discovery**:

- preserva todo texto já escrito pelo PM;
- preenche campos vazios com o rascunho da skill;
- incorpora trechos com identificação da fonte no campo mais orientado a
  evidências do framework;
- remove timestamps de SRT/VTT do trecho incorporado;
- derruba a aprovação anterior e marca PRD/Story como desatualizados quando
  aplicável.

## Tipografia

A plataforma usa **IBM Plex Sans** em toda a interface. A mesma família é
declarada na exportação DOC e no conteúdo formatado copiado para o Google Docs.
Os arquivos usados pela interface são locais, fornecidos por
`@fontsource/ibm-plex-sans`.

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

`localStorage`, com autosave em `src/services/storage.js`. Cada e-mail mockado
usa uma chave de workspace própria, com setup geral e uma lista de iniciativas.
Isso demonstra isolamento funcional no navegador, mas não substitui autorização
real: em produção, SSO, sessão e controle de acesso precisam ficar no backend.

## Proximos passos

Antes de ampliar escopo:

1. Conectar um provedor real e comparar a saída com a versão determinística.
2. Reunir PRDs aprovados como exemplos nas instrucoes das skills.
3. Backend com banco, autenticacao e historico de versoes.
4. Comentarios de revisores dentro do documento.
5. Exportacao para DOCX nativo, alem do DOC atual.

Fora deste MVP por dependerem de backend, credenciais e permissões: integração
nativa com NotebookLM e Miro, acesso a repositórios privados, armazenamento
seguro da chave do Businessmap e o restante do fluxo técnico posterior à Story.
