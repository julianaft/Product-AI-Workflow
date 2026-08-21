# Frameworks de discovery

O catalogo possui 11 frameworks. A skill recomenda um com base no tipo de
incerteza da iniciativa; o PM sempre pode escolher outro. O framework e um meio
para reduzir uma incerteza, nao uma etapa obrigatoria por preferencia do time.

| Framework | Use quando | Evite quando |
| --- | --- | --- |
| Arvore de Oportunidades | O outcome esta claro e e preciso conectar dores, solucoes e experimentos | O problema ainda pode mudar completamente |
| Matriz CSD | O time mistura fatos, suposicoes e duvidas | Ja existem evidencias e uma decisao de problema clara |
| Double Diamond | O escopo e amplo e precisa divergir/convergir | O problema e o fluxo ja sao conhecidos |
| Jobs To Be Done | Falta entender motivacao, contexto e progresso buscado pelo usuario | A duvida principal e operacional ou tecnica |
| Mapa de Suposicoes | Ja existe uma solucao, mas as hipoteses mais arriscadas nao foram testadas | Ainda nao ha proposta nem hipoteses para priorizar |
| Impact Mapping | Existe uma meta/OKR e varios atores ou entregas concorrentes | A necessidade do usuario ainda e desconhecida |
| User Story Mapping | A jornada e conhecida e e preciso fatiar MVP e releases | O problema ou a proposta de valor ainda nao foram validados |
| Service Blueprint | O processo atravessa canais, operacao, handoffs e sistemas | A experiencia e simples e isolada numa unica interacao |
| Value Proposition Canvas | E preciso testar fit entre segmento, dores, ganhos e proposta | O encaixe ja esta comprovado e falta somente fatiar entrega |
| Design Sprint | Uma pergunta critica precisa de prototipo e teste rapido | Nao ha acesso a usuarios ou decisores para testar |
| Lean Canvas | Produto, mercado ou modelo de negocio ainda sao hipoteses | E uma melhoria incremental com outcome e publico conhecidos |

## Como a recomendacao funciona

A versao deterministica procura sinais na iniciativa:

- operacao, integracao, varios sistemas, handoff → Service Blueprint
- MVP, release, jornada ponta a ponta → User Story Mapping
- motivacao, comportamento, abandono → Jobs To Be Done
- risco, incerteza, hipotese critica → Mapa de Suposicoes
- OKR, atores, impacto → Impact Mapping
- proposta de valor, fit, segmento → Value Proposition Canvas
- prototipo, teste rapido, decisao urgente → Design Sprint
- modelo de negocio, receita, novo mercado → Lean Canvas
- fluxo novo sem sinal mais especifico → Double Diamond
- hipoteses acima das evidencias → Matriz CSD
- incremental com outcome claro → Arvore de Oportunidades

Um sinal isolado nao basta para substituir a recomendacao-base. A regra exige
mais de um indicio da necessidade especifica, reduzindo escolhas acidentais.

## Regras comuns

1. Todo framework tem campos obrigatorios validados antes do PRD.
2. Sugestoes da skill preenchem apenas campos vazios.
3. Trocar de framework preserva o conteudo escrito no anterior.
4. A revisao aponta lacunas, marcadores `[a preencher]` e ausencia de evidencia.
5. O PRD normaliza os 11 formatos para outcome, problema, hipoteses, solucao e
   experimentos sem perder o nome do framework usado.
