# Modelo de PRD

O gerador e o editor de PRD seguem este modelo. Ele foi enriquecido a partir
de um PRD real de produto (Input & Output), extraido para virar estrutura
agnostica: a qualidade do detalhe permanece, o dominio nao vira regra da skill.

Exemplo preenchido: [`fixtures/prd-exemplo-input-output.md`](../fixtures/prd-exemplo-input-output.md).

## Cabecalho

| Campo | Obrigatorio | O que entra |
| --- | --- | --- |
| Dir. | nao | Diretoria |
| Produto | sim | Nome do produto |
| Tribo | nao | Tribo |
| Squad | sim | Squad dona |
| PM / GPM | nao | Product Manager |
| PD | nao | Product Designer |
| Redatores | nao | Quem escreveu o PRD |
| TM | nao | Tech Manager |
| TL | nao | Tech Lead |
| Iniciativa OKR | nao | Codigo rastreavel + titulo |
| Status | sim | rascunho / em revisao / aprovado |

## Secoes

Cada secao tem um guia de qualidade. Se o insumo nao existir, a skill nao
inventa: marca pendente e abre pergunta.

| Secao | Qualidade minima |
| --- | --- |
| Iniciativa OKR | Codigo + titulo |
| Pessoas envolvidas | Agrupadas por area, nao lista unica |
| Contextualizacao | Volume, processo atual, evidencia, o que muda agora |
| Necessidade | Dor + numero + prazo |
| Publico afetado | Quem opera, decide e e impactado |
| Hipoteses | Hn com Dor, Hipotese (Se... entao...) e Decisao |
| Metricas de impacto | Por solucao: cobertura, volume, AS IS, TO BE, delta |
| Detalhamento das solucoes | Por solucao: recorte, jornada AS IS, jornada TO BE, mudancas |
| Permissionamento | Quem acessa, quem e bloqueado, permissao nova |
| Regras de campos | Obrigatorios, defaults, formatos, agrupadores |
| Tratamento de erros | Modal, exportacao, sucesso parcial, persistencia |
| Criterios de aceite | CAs numerados por solucao, observaveis |
| Fora do escopo | Lista explicita com motivo |
| Dependencias | Planilha, sistema, area, documento |
| Epicos | Um por entrega rastreavel |
| Riscos | Risco + condicao |
| Premissas | Fato assumido; se cair, o PRD muda |
| Experimentos | Como validar antes da construcao completa |

## Formato das hipoteses

```
H1: [titulo curto]
Dor: [o que dói hoje, com evidencia]
Hipotese: Se [acao], entao [resultado mensuravel]
Decisao: [o que o time ja decidiu]
```

## Formato das metricas

```
Solucao 1: [nome]
- Cobertura: ...
- Volume: ...
- AS IS: [tempo ou esforco atual]
- TO BE: [tempo ou esforco esperado]
- Reducao / impacto: [delta]
```

Numero sem baseline ou sem meta nao entra como fato.

## Formato das solucoes

```
Solucao 1: [nome]
Aplicavel a: [recorte]
Jornada AS IS:
- [passo]
Jornada TO BE:
- [passo]
Descricao: ...
Mudancas necessarias:
- ...
```

Varias solucoes na mesma iniciativa viram blocos separados. Nao misturar
cobertura ("todas as mecanicas") com recorte ("somente Desconto Direto").

## Formato dos criterios de aceite

```
Solucao 1: [nome]
CA1: Dado [contexto], quando [acao], entao [resultado observavel]
```

Um CA descreve um comportamento. Agrupar por tema (acesso, upload, listagem,
planejamento, defaults) quando a solucao for grande.

## Revisores e links

- Links (Miro, NotebookLM, Figma, matriz de campos) entram como referencia,
  sem afirmar que o conteudo foi lido.
- Revisores tem nome + status da analise (nao iniciada, em andamento, aprovada).

## O que um PRD detalhado tem e um rascunho nao tem

Comparando o modelo anterior com o PRD de referencia:

| Antes | Agora |
| --- | --- |
| Solucao unica em um paragrafo | Varias solucoes, cada uma com recorte |
| Metrica so no resultado esperado | AS IS / TO BE por solucao |
| Hipotese = texto da dor | Dor + hipotese testavel + decisao |
| Sem jornada | Jornada AS IS e TO BE |
| Sem CAs | CAs numerados e verificaveis |
| Fora de escopo generico | Lista com motivo |
| Sem permissao, defaults, erros | Secoes proprias |
| Responsaveis numa linha | Pessoas por area + papeis do cabecalho |
