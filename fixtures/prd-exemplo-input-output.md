# Automatizacao dos processos de input e output

Este arquivo e um **exemplo de qualidade**, nao uma regra da skill. Mostra o
nivel de detalhe esperado no modelo de PRD. Dominio e numeros pertencem a um
produto especifico e nao devem ser copiados para outras iniciativas.

| Campo | Valor |
| --- | --- |
| Dir. | Tech Experiencia |
| Produto | GCAM |
| Tribo | RGM |
| Squad | GCAM |
| PM / GPM | Juliana Fabeni Tostes, Caroline Morito Pereira |
| PD | Romulo Jose Ferreira De Morais, Liria Maria Ricci Ricci |
| Redatores | Juliana Fabeni Tostes |
| TM | Rafaela Talita Bernardo Schmitz |
| TL | Gustavo Rafael Novaes Silva |
| Iniciativa OKR | C17IN1120 - [GCAM] Automatizacao dos processos de input e output GCAM |
| Status | Em andamento |

## Iniciativa OKR

C17IN1120 - [GCAM] - Automatizacao dos processos de input e output GCAM

## Principais pessoas envolvidas

- Squad GCAM: Juliana Fabeni Tostes, Romulo Jose Ferreira De Morais, Dovilio Rodolfo Squisatti, Caroline Morito Pereira, Liria Maria Ricci Ricci, Gustavo Rafael Novaes Silva
- Inteligencia e Solucoes: Felipe Garcias Verbicaro, Giovana Dantas Matos, Igor Bernardes Oliveira, Maite Laranjeira Da Silva
- RGM LP: Fernanda Carlota Drzewinski, Melissa Santos De Resende, Erick De Oliveira Tourinho, Francisco Henrique Marqueti Monteverde
- Gestao de Campanhas: Rafael Lozano Da Luz
- RGM Curto Prazo: Renata Souza Ferreira, Bernardo De Souza Aristides

## Contextualizacao

Hoje o GCAM lida com mais de 10.800 acoes planejadas por ano, porem o processo ainda e descasado entre as areas: 74% das acoes precisam de ajuste depois de planejadas. Para a Rodada 05 de RGM, que se inicia no final de junho/26, o desafio e cadastrar a grade fullyear 2027 (~5.100 acoes) em 5 dias.

O diferencial agora e que os processos de RGM e Demanda passam a rodar juntos. Em vez de discussoes separadas que geram retrabalho sobre metas de volume, o fluxo integrado desde o inicio permite fechar a grade com mais assertividade, para que o que foi planejado chegue na ponta sem ajuste de ultima hora.

## Necessidade

Reduzir as horas gastas em cadastro manual (estimado em 31 semanas por ano) para o time cumprir o cronograma da Rodada 05.

## Publico afetado

Times de RGM, Gestao de Campanhas e operadores de cadastro de acoes no GCAM.

## Hipoteses

H1: IA para campos descritivos
Dor: Preenchimento de nome, descricao e texto legal e moroso e falho (responsavel por ~4,7% das AGCs em 2025).
Hipotese: Se utilizarmos IA para sugerir e pre-preencher estes campos com base em mecanica, subtipo, ciclo, vigencia e % max., reduziremos tempo e erros.
Decisao: Mover a etapa de Dados Gerais para o fim, como tela de revisao.

H2: Formulario simplificado para Desconto Direto
Dor: O fluxo de Desconto Direto tem 13 etapas com redundancias.
Hipotese: Se criarmos um fluxo especifico, enxuto e com pre-preenchimento, o esforco cai para ~25% das acoes da grade.
Decisao: Entregar recorte de Desconto Direto primeiro.

H3: Importacao massiva
Dor: Cadastro e planejamento ainda sao unitarios.
Hipotese: Se viabilizarmos rascunho e upload massivo, o lote substitui o clique a clique.
Decisao: Foco inicial em Desconto Direto; demais mecanicas no longo prazo.

## Metricas de impacto

Solucao 1: IA para Nome / Descricao / Texto Legal
- Volume: 3 campos em 5.300 acoes = preenchimento automatico de +15.000 campos
- Cobertura: 100% das acoes cadastradas (todas as mecanicas)
- Reducao de esforco: eliminacao de digitacao repetitiva em campos com padrao previsivel
- Consistencia: padronizacao da nomenclatura; em 2025 esses campos geraram ~5% das AGCs (~600)

Solucao 2: Subida e planejamento massivo de Desconto Direto
Subida massiva
- Cobertura: 45% da grade 2025 — 4.888 acoes de desconto direto em 10.830
- AS IS: 5 min x 2.500 acoes = 208 horas
- TO BE: 1 min x 2.500 acoes = 40 horas
- Reducao: 80% no tempo de cadastro
Planejamento massivo
- AS IS: 1 min por acao x 2.500 = 40 horas
- TO BE: 5 min para o lote

## Detalhamento das solucoes

Solucao 1: IA para Nome / Descricao / Texto Legal
Aplicavel a: todas as mecanicas
Jornada AS IS:
- Cadastro comeca obrigatoriamente por Dados Gerais
- Usuario consulta PPT/documentos de nomenclatura
- Digita nome (marca + % + ciclo), descricao (SKUs e mecanica) e texto legal (vigencia e regras)
- Volta na primeira tela no fim para ajustar o nome
Jornada TO BE:
- Usuario preenche dados tecnicos primeiro (SKUs, mecanica, vigencia, categoria)
- Na penultima etapa aciona "Gerar Sugestao"
- Sistema sugere textos com historico 2025 + book de regras de cadastro 2027
- Usuario revisa, edita se precisar e finaliza
Descricao: V0 algoritmo / V1 GenAI para sugerir nome, descricao e texto legal. Sugestao aceitavel e editavel.
Mudancas necessarias:
- Dados Gerais deixa de ser a primeira etapa e vira a ultima antes da revisao
- Campos permanecem editaveis apos a sugestao

Solucao 2: Subida e planejamento massivo de Desconto Direto
Aplicavel a: somente acoes de Desconto Direto
Jornada AS IS:
- Usuario manipula 6 a 7 planilhas para consolidar a grade
- Copia SKU e percentual acao a acao
- Percorre 16 etapas por acao (~5.300)
- Usa 0% em Desconto Direcional so para destravar o fluxo
- Clica em Planejar individualmente
Jornada TO BE:
- Upload da planilha modelo RGM na pagina Subida Massiva
- Sistema pre-cria rascunhos validando regras de front
- Usuario filtra, seleciona em lote e clica em Planejar Acoes
Descricao: Upload de planilha com multiplas acoes, rascunho validado e planejamento em lote.

## Permissionamento

Nova permissao "Subida massiva": criacao massiva de acoes via upload de planilha.
Pagina visivel apenas para quem tem a permissao. Demais perfis sao bloqueados.

## Regras de campos, defaults e validacoes

Planilha modelo RGM: limite 25.000 linhas, arquivo maximo 10 MB.
Obrigatorios (sem eles a linha nao cria acao): Nome (J), Descricao (K), Texto legal (S), Agregador (G, alfanumerico 100), UN (A: BOT, EUD, QBD, OUI), Canal (B: loja, vd, ecommerce), Ciclo (F: AAAACC, ciclo aberto), Tipo/Subtipo/Mecanica (L, M, N; V1 so Desconto Direto), SKU (H), % Desconto (R, ate 5 casas).
Regras de canal: Eudora e QDB nao podem selecionar os tres canais juntos; OUI nao seleciona loja nem multiplos canais.
Agregador agrupa SKUs da mesma acao; divergencia de cabecalho prevalece a primeira linha.
Defaults se vazios: Projeto/Tag/Cluster em branco; Optin, Dual Pricing, Aero, Personalizada, Limitar aplicacoes = Nao; Regra acumulativa; Cliente Sellin + Sellout; Reembolsar BSO = Sim; Trazer todas as versoes de SKU = Sim.

## Tratamento de erros

Upload com erro: modal Linha + Erro, exportacao CSV. Fechar no X exige reimportar.
Planejamento em lote: planeja as validas, mantem invalidas em rascunho, modal Codigo da acao + erro, exportacao CSV.
Persistencia: planilha permanece conectada ate Desconectar planilha, mesmo fechando a aba.
Historico: "Criado por USUARIO via subida massiva" e "Planejado massivamente por USUARIO".

## Criterios de aceite

Solucao 1: IA para Nome / Descricao / Texto Legal
CA1: O cadastro reordena Dados Gerais para a ultima etapa antes da revisao, em todas as mecanicas.
CA2: Na etapa Dados Gerais existe o botao Gerar Sugestao, que preenche Nome, Descricao e Texto Legal.
CA3: A geracao consome historico de acoes de 2025 e o documento Novo formato de Cadastro 2027.
CA4: Apos a geracao, os tres campos permanecem editaveis.
CA5: Se o usuario alterar dado tecnico e voltar, Gerar Sugestao pode ser acionado de novo e sobrescreve o texto.
CA6: Nao avanca para Planejamento com campos vazios; respeita limite de caracteres.

Solucao 2: Subida e planejamento massivo
CA1: Botao Subida Massiva no modulo de acoes so para quem tem a permissao.
CA2: Acesso a pagina bloqueado para demais perfis.
CA3: Aceita so o modelo RGM, 25.000 linhas, 10 MB.
CA4: Colunas obrigatorias vazias impedem a criacao da linha e reportam erro.
CA5: Regras de canal por UN aplicadas na importacao.
CA6: Ciclo congelado nao cria rascunho, salvo excecao valida.
CA7: Agregador agrupa SKUs; divergencia usa a primeira linha.
CA8: Modal de erros com Linha + Erro e exportacao CSV.
CA9: Acoes surgem na aba Subida Massiva como Rascunho.
CA10: Lista permanece vinculada ao usuario ate Desconectar planilha; paginacao padrao de 10.
CA11: Busca por agregador ou codigo; filtros UN, Canal, Ciclo, Situacao.
CA12: Checkbox do cabecalho seleciona todas as paginas.
CA13: Exportar gera CSV/XLSX com COD. ACAO, AGREGADOR, NOME, CICLO, UN, CANAL, SITUACAO.
CA14: Planejar acoes fica inativo sem selecao.
CA15: Planejar executa as validacoes de Dataquality do fluxo unitario.
CA16: Sucesso parcial: planeja as corretas, mantem as demais em rascunho, modal com exportacao.
CA17: Historico registra planejamento massivo com usuario e timestamp.
CA18: Acoes aparecem na listagem geral e em Meus rascunhos.
CA19: Campos opcionais vazios assumem os defaults documentados.

## Fora do escopo

- Acoes com voucher
- Selecao de lojas especificas (padrao Nao)
- IA de nome/descricao/texto legal no fluxo massivo (usuario ja traz os campos na planilha)
- Preco otimo "aplicar a todos os SKUs" de forma massiva (padrao Nao; usar 5 casas no desconto)
- Desconto direcional (sempre zero; desconto ajustado por SKU)
- Validacao de duplicidade de acoes
- Descarte massivo de rascunhos

## Principais dependencias

- Planilha modelo padrao de RGM
- Matriz de campos e regras da planilha
- Regras de Dataquality do planejamento unitario

## Epicos

- [GCAM] Criacao e planejamento massivo acoes Desconto Direto
- [GCAM] Inteligencia campos descritivos da acao promocional

## Riscos

- Rodada 05 com janela de 5 dias para ~5.100 acoes; atraso na entrega impede o cronograma
- Regras de canal e ciclo congelado, se nao replicadas no lote, geram rascunhos invalidos

## Premissas

- Recorte V1 da subida massiva e somente Desconto Direto
- Regras de ouro de duplicidade do modulo de acoes foram retiradas
- Historico 2025 e o book de cadastro 2027 existem e podem ser consumidos pela sugestao

## Experimentos

Nao informado neste PRD de referencia.

## Links importantes

- Notebook LM sobre o Discovery
- Miro
- Apresentacao final do discovery
- Matriz completa de definicao de campos
- Figma da tela de Dados Gerais
- Figma do fluxo de subida massiva

## Revisores

| Participante | Status da analise |
| --- | --- |
| Ariane Maria Messias De Souza | Em andamento |
| Giovana Dantas Matos | Aprovada |
| Fernanda Carlota Drzewinski | Aprovada |
| Francisco Henrique Marqueti Monteverde | Aprovada |
| Melissa Santos De Resende | Em andamento |
| Felipe Garcias Verbicaro | Em andamento |
| Rafael Lozano Da Luz | Aprovada |
