# Modelo de PRD

O gerador e o editor de PRD seguem este modelo. Ele foi enriquecido a partir
de um PRD real de produto (Input & Output), extraído para virar estrutura
agnóstica: a qualidade do detalhe permanece, o domínio não vira regra da skill.

Exemplo preenchido: [`fixtures/prd-exemplo-input-output.md`](../fixtures/prd-exemplo-input-output.md).

## Cabeçalho

| Campo | Obrigatório | O que entra |
| --- | --- | --- |
| Produto | sim | Nome do produto |
| PM | não | Product Manager |
| PD | não | Product Designer |
| TM | não | Tech Manager |
| TL | não | Tech Lead |
| Iniciativa OKR | não | Código rastreável + título |
| Status | sim | rascunho / em revisão / aprovado |

## Seções

Cada seção tem um guia de qualidade. Se o insumo não existir, a skill não
inventa: marca pendente e abre pergunta.

| Seção | Qualidade mínima |
| --- | --- |
| Iniciativa OKR | Código + título |
| Pessoas envolvidas | Agrupadas por área, não lista única |
| Contextualização | Volume, processo atual, evidência, o que muda agora |
| Necessidade | Dor + número + prazo |
| Público afetado | Quem opera, decide e é impactado |
| Hipóteses | Hn com Dor, Hipótese (Se... então...) e Decisão |
| Métricas de impacto | Por solução: cobertura, volume, AS IS, TO BE, delta |
| Detalhamento das soluções | Por solução: recorte, jornada AS IS, jornada TO BE, mudanças |
| Permissionamento | Quem acessa, quem é bloqueado, permissão nova |
| Regras de campos | Obrigatórios, defaults, formatos, agrupadores |
| Tratamento de erros | Modal, exportação, sucesso parcial, persistência |
| Critérios de aceite | CAs numerados por solução, observáveis |
| Fora do escopo | Lista explícita com motivo |
| Dependências | Planilha, sistema, área, documento |
| Épicos | Um por entrega rastreável |
| Riscos | Risco + condição |
| Premissas | Fato assumido; se cair, o PRD muda |
| Experimentos | Como validar antes da construção completa |

## Formato das hipóteses

```
H1: [título curto]
Dor: [o que dói hoje, com evidência]
Hipótese: Se [ação], então [resultado mensurável]
Decisão: [o que o time já decidiu]
```

## Formato das métricas

```
Solução 1: [nome]
- Cobertura: ...
- Volume: ...
- AS IS: [tempo ou esforço atual]
- TO BE: [tempo ou esforço esperado]
- Redução / impacto: [delta]
```

Número sem baseline ou sem meta não entra como fato.

## Formato das soluções

```
Solução 1: [nome]
Aplicável a: [recorte]
Jornada AS IS:
- [passo]
Jornada TO BE:
- [passo]
Descrição: ...
Mudanças necessárias:
- ...
```

Várias soluções na mesma iniciativa viram blocos separados. Não misturar
cobertura ("todas as mecânicas") com recorte ("somente Desconto Direto").

## Formato dos critérios de aceite

```
Solução 1: [nome]
CA1: Dado [contexto], quando [ação], então [resultado observável]
```

Um CA descreve um comportamento. Agrupar por tema (acesso, upload, listagem,
planejamento, defaults) quando a solução for grande.

## Revisores e links

- Links (Miro, NotebookLM, Figma, matriz de campos) entram como referência,
  sem afirmar que o conteúdo foi lido.
- Revisores têm nome + status da análise (não iniciada, em andamento, aprovada).

## O que um PRD detalhado tem e um rascunho não tem

Comparando o modelo anterior com o PRD de referência:

| Antes | Agora |
| --- | --- |
| Solução única em um parágrafo | Várias soluções, cada uma com recorte |
| Métrica só no resultado esperado | AS IS / TO BE por solução |
| Hipótese = texto da dor | Dor + hipótese testável + decisão |
| Sem jornada | Jornada AS IS e TO BE |
| Sem CAs | CAs numerados e verificáveis |
| Fora de escopo genérico | Lista com motivo |
| Sem permissão, defaults, erros | Seções próprias |
| Responsáveis numa linha | Pessoas por área + papéis do cabeçalho |
