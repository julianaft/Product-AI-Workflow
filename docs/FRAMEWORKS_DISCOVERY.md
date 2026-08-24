# Frameworks de discovery

O catálogo possui 11 frameworks. A skill recomenda um com base no tipo de
incerteza da iniciativa; o PM sempre pode escolher outro. O framework é um meio
para reduzir uma incerteza, não uma etapa obrigatória por preferência do time.

| Framework | Use quando | Evite quando |
| --- | --- | --- |
| Árvore de Oportunidades | O outcome está claro e é preciso conectar dores, soluções e experimentos | O problema ainda pode mudar completamente |
| Matriz CSD | O time mistura fatos, suposições e dúvidas | Já existem evidências e uma decisão de problema clara |
| Double Diamond | O escopo é amplo e precisa divergir/convergir | O problema e o fluxo já são conhecidos |
| Jobs To Be Done | Falta entender motivação, contexto e progresso buscado pelo usuário | A dúvida principal é operacional ou técnica |
| Mapa de Suposições | Já existe uma solução, mas as hipóteses mais arriscadas não foram testadas | Ainda não há proposta nem hipóteses para priorizar |
| Impact Mapping | Existe uma meta/OKR e vários atores ou entregas concorrentes | A necessidade do usuário ainda é desconhecida |
| User Story Mapping | A jornada é conhecida e é preciso fatiar MVP e releases | O problema ou a proposta de valor ainda não foram validados |
| Service Blueprint | O processo atravessa canais, operação, handoffs e sistemas | A experiência é simples e isolada numa única interação |
| Value Proposition Canvas | É preciso testar fit entre segmento, dores, ganhos e proposta | O encaixe já está comprovado e falta somente fatiar entrega |
| Design Sprint | Uma pergunta crítica precisa de protótipo e teste rápido | Não há acesso a usuários ou decisores para testar |
| Lean Canvas | Produto, mercado ou modelo de negócio ainda são hipóteses | É uma melhoria incremental com outcome e público conhecidos |

## Como a recomendacao funciona

A versão determinística procura sinais na iniciativa:

- operação, integração, vários sistemas, handoff → Service Blueprint
- MVP, release, jornada ponta a ponta → User Story Mapping
- motivação, comportamento, abandono → Jobs To Be Done
- risco, incerteza, hipótese crítica → Mapa de Suposições
- OKR, atores, impacto → Impact Mapping
- proposta de valor, fit, segmento → Value Proposition Canvas
- protótipo, teste rápido, decisão urgente → Design Sprint
- modelo de negócio, receita, novo mercado → Lean Canvas
- fluxo novo sem sinal mais especifico → Double Diamond
- hipóteses acima das evidências → Matriz CSD
- incremental com outcome claro → Arvore de Oportunidades

Um sinal isolado não basta para substituir a recomendação-base. A regra exige
mais de um indício da necessidade específica, reduzindo escolhas acidentais.

## Regras comuns

1. Todo framework tem campos obrigatorios validados antes do PRD.
2. Sugestoes da skill preenchem apenas campos vazios.
3. Trocar de framework preserva o conteúdo escrito no anterior.
4. A revisão aponta lacunas, marcadores `[a preencher]` e ausência de evidência.
5. O PRD normaliza os 11 formatos para outcome, problema, hipóteses, solução e
   experimentos sem perder o nome do framework usado.
