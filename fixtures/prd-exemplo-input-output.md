# Automatizacao dos processos de input e output

Este arquivo é um **exemplo de qualidade**, não uma regra da skill. Mostra o
nivel de detalhe esperado no modelo de PRD. Dominio e numeros pertencem a um
produto específico e não devem ser copiados para outras iniciativas.

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
- Inteligência e Soluções: Felipe Garcias Verbicaro, Giovana Dantas Matos, Igor Bernardes Oliveira, Maite Laranjeira Da Silva
- RGM LP: Fernanda Carlota Drzewinski, Melissa Santos De Resende, Erick De Oliveira Tourinho, Francisco Henrique Marqueti Monteverde
- Gestao de Campanhas: Rafael Lozano Da Luz
- RGM Curto Prazo: Renata Souza Ferreira, Bernardo De Souza Aristides

## Contextualização

Hoje o GCAM lida com mais de 10.800 ações planejadas por ano, porém o processo ainda é descasado entre as áreas: 74% das ações precisam de ajuste depois de planejadas. Para a Rodada 05 de RGM, que se inicia no final de junho/26, o desafio é cadastrar a grade fullyear 2027 (~5.100 ações) em 5 dias.

O diferencial agora e que os processos de RGM e Demanda passam a rodar juntos. Em vez de discussoes separadas que geram retrabalho sobre metas de volume, o fluxo integrado desde o inicio permite fechar a grade com mais assertividade, para que o que foi planejado chegue na ponta sem ajuste de ultima hora.

## Necessidade

Reduzir as horas gastas em cadastro manual (estimado em 31 semanas por ano) para o time cumprir o cronograma da Rodada 05.

## Público afetado

Times de RGM, Gestão de Campanhas e operadores de cadastro de ações no GCAM.

## Hipóteses

H1: IA para campos descritivos
Dor: Preenchimento de nome, descrição e texto legal é moroso e falho (responsável por ~4,7% das AGCs em 2025).
Hipótese: Se utilizarmos IA para sugerir e pré-preencher estes campos com base em mecânica, subtipo, ciclo, vigência e % máx., reduziremos tempo e erros.
Decisão: Mover a etapa de Dados Gerais para o fim, como tela de revisão.

H2: Formulario simplificado para Desconto Direto
Dor: O fluxo de Desconto Direto tem 13 etapas com redundancias.
Hipótese: Se criarmos um fluxo específico, enxuto e com pré-preenchimento, o esforço cai para ~25% das ações da grade.
Decisão: Entregar recorte de Desconto Direto primeiro.

H3: Importacao massiva
Dor: Cadastro e planejamento ainda sao unitarios.
Hipótese: Se viabilizarmos rascunho e upload massivo, o lote substitui o clique a clique.
Decisão: Foco inicial em Desconto Direto; demais mecânicas no longo prazo.

## Métricas de impacto

Solução 1: IA para Nome / Descrição / Texto Legal
- Volume: 3 campos em 5.300 ações = preenchimento automático de +15.000 campos
- Cobertura: 100% das ações cadastradas (todas as mecânicas)
- Redução de esforço: eliminação de digitação repetitiva em campos com padrão previsível
- Consistencia: padronizacao da nomenclatura; em 2025 esses campos geraram ~5% das AGCs (~600)

Solução 2: Subida e planejamento massivo de Desconto Direto
Subida massiva
- Cobertura: 45% da grade 2025 — 4.888 ações de desconto direto em 10.830
- AS IS: 5 min x 2.500 ações = 208 horas
- TO BE: 1 min x 2.500 ações = 40 horas
- Reducao: 80% no tempo de cadastro
Planejamento massivo
- AS IS: 1 min por ação x 2.500 = 40 horas
- TO BE: 5 min para o lote

## Detalhamento das soluções

Solução 1: IA para Nome / Descrição / Texto Legal
Aplicavel a: todas as mecanicas
Jornada AS IS:
- Cadastro comeca obrigatoriamente por Dados Gerais
- Usuário consulta PPT/documentos de nomenclatura
- Digita nome (marca + % + ciclo), descrição (SKUs e mecânica) e texto legal (vigência e regras)
- Volta na primeira tela no fim para ajustar o nome
Jornada TO BE:
- Usuário preenche dados técnicos primeiro (SKUs, mecânica, vigência, categoria)
- Na penultima etapa aciona "Gerar Sugestao"
- Sistema sugere textos com historico 2025 + book de regras de cadastro 2027
- Usuário revisa, edita se precisar e finaliza
Descrição: V0 algoritmo / V1 GenAI para sugerir nome, descrição e texto legal. Sugestão aceitável e editável.
Mudancas necessarias:
- Dados Gerais deixa de ser a primeira etapa e vira a ultima antes da revisao
- Campos permanecem editaveis apos a sugestao

Solução 2: Subida e planejamento massivo de Desconto Direto
Aplicável a: somente ações de Desconto Direto
Jornada AS IS:
- Usuário manipula 6 a 7 planilhas para consolidar a grade
- Copia SKU e percentual ação a ação
- Percorre 16 etapas por ação (~5.300)
- Usa 0% em Desconto Direcional so para destravar o fluxo
- Clica em Planejar individualmente
Jornada TO BE:
- Upload da planilha modelo RGM na pagina Subida Massiva
- Sistema pre-cria rascunhos validando regras de front
- Usuário filtra, seleciona em lote e clica em Planejar Ações
Descrição: Upload de planilha com múltiplas ações, rascunho validado e planejamento em lote.

## Permissionamento

Nova permissão "Subida massiva": criação massiva de ações via upload de planilha.
Página visível apenas para quem tem a permissão. Demais perfis são bloqueados.

## Regras de campos, defaults e validações

Planilha modelo RGM: limite 25.000 linhas, arquivo maximo 10 MB.
Obrigatórios (sem eles a linha não cria ação): Nome (J), Descrição (K), Texto legal (S), Agregador (G, alfanumérico 100), UN (A: BOT, EUD, QBD, OUI), Canal (B: loja, vd, ecommerce), Ciclo (F: AAAACC, ciclo aberto), Tipo/Subtipo/Mecânica (L, M, N; V1 só Desconto Direto), SKU (H), % Desconto (R, até 5 casas).
Regras de canal: Eudora e QDB não podem selecionar os três canais juntos; OUI não seleciona loja nem múltiplos canais.
Agregador agrupa SKUs da mesma ação; divergência de cabeçalho prevalece a primeira linha.
Defaults se vazios: Projeto/Tag/Cluster em branco; Optin, Dual Pricing, Aero, Personalizada, Limitar aplicações = Não; Regra acumulativa; Cliente Sellin + Sellout; Reembolsar BSO = Sim; Trazer todas as versões de SKU = Sim.

## Tratamento de erros

Upload com erro: modal Linha + Erro, exportacao CSV. Fechar no X exige reimportar.
Planejamento em lote: planeja as válidas, mantém inválidas em rascunho, modal Código da ação + erro, exportação CSV.
Persistencia: planilha permanece conectada ate Desconectar planilha, mesmo fechando a aba.
Histórico: "Criado por USUÁRIO via subida massiva" e "Planejado massivamente por USUÁRIO".

## Criterios de aceite

Solução 1: IA para Nome / Descrição / Texto Legal
CA1: O cadastro reordena Dados Gerais para a ultima etapa antes da revisao, em todas as mecanicas.
CA2: Na etapa Dados Gerais existe o botão Gerar Sugestão, que preenche Nome, Descrição e Texto Legal.
CA3: A geração consome histórico de ações de 2025 e o documento Novo formato de Cadastro 2027.
CA4: Após a geração, os três campos permanecem editáveis.
CA5: Se o usuário alterar dado técnico e voltar, Gerar Sugestão pode ser acionado de novo e sobrescreve o texto.
CA6: Não avança para Planejamento com campos vazios; respeita limite de caracteres.

Solução 2: Subida e planejamento massivo
CA1: Botão Subida Massiva no módulo de ações só para quem tem a permissão.
CA2: Acesso a pagina bloqueado para demais perfis.
CA3: Aceita so o modelo RGM, 25.000 linhas, 10 MB.
CA4: Colunas obrigatorias vazias impedem a criacao da linha e reportam erro.
CA5: Regras de canal por UN aplicadas na importacao.
CA6: Ciclo congelado não cria rascunho, salvo exceção válida.
CA7: Agregador agrupa SKUs; divergencia usa a primeira linha.
CA8: Modal de erros com Linha + Erro e exportacao CSV.
CA9: Ações surgem na aba Subida Massiva como Rascunho.
CA10: Lista permanece vinculada ao usuário até Desconectar planilha; paginação padrão de 10.
CA11: Busca por agregador ou código; filtros UN, Canal, Ciclo, Situação.
CA12: Checkbox do cabecalho seleciona todas as paginas.
CA13: Exportar gera CSV/XLSX com COD. AÇÃO, AGREGADOR, NOME, CICLO, UN, CANAL, SITUAÇÃO.
CA14: Planejar ações fica inativo sem seleção.
CA15: Planejar executa as validações de Dataquality do fluxo unitário.
CA16: Sucesso parcial: planeja as corretas, mantem as demais em rascunho, modal com exportacao.
CA17: Histórico registra planejamento massivo com usuário e timestamp.
CA18: Ações aparecem na listagem geral e em Meus rascunhos.
CA19: Campos opcionais vazios assumem os defaults documentados.

## Fora do escopo

- Ações com voucher
- Seleção de lojas específicas (padrão Não)
- IA de nome/descrição/texto legal no fluxo massivo (usuário já traz os campos na planilha)
- Preço ótimo "aplicar a todos os SKUs" de forma massiva (padrão Não; usar 5 casas no desconto)
- Desconto direcional (sempre zero; desconto ajustado por SKU)
- Validação de duplicidade de ações
- Descarte massivo de rascunhos

## Principais dependencias

- Planilha modelo padrão de RGM
- Matriz de campos e regras da planilha
- Regras de Dataquality do planejamento unitario

## Epicos

- [GCAM] Criação e planejamento massivo ações Desconto Direto
- [GCAM] Inteligência campos descritivos da ação promocional

## Riscos

- Rodada 05 com janela de 5 dias para ~5.100 ações; atraso na entrega impede o cronograma
- Regras de canal e ciclo congelado, se não replicadas no lote, geram rascunhos inválidos

## Premissas

- Recorte V1 da subida massiva e somente Desconto Direto
- Regras de ouro de duplicidade do módulo de ações foram retiradas
- Historico 2025 e o book de cadastro 2027 existem e podem ser consumidos pela sugestao

## Experimentos

Não informado neste PRD de referência.

## Links importantes

- Notebook LM sobre o Discovery
- Miro
- Apresentacao final do discovery
- Matriz completa de definicao de campos
- Figma da tela de Dados Gerais
- Figma do fluxo de subida massiva

## Revisores

| Participante | Status da análise |
| --- | --- |
| Ariane Maria Messias De Souza | Em andamento |
| Giovana Dantas Matos | Aprovada |
| Fernanda Carlota Drzewinski | Aprovada |
| Francisco Henrique Marqueti Monteverde | Aprovada |
| Melissa Santos De Resende | Em andamento |
| Felipe Garcias Verbicaro | Em andamento |
| Rafael Lozano Da Luz | Aprovada |
