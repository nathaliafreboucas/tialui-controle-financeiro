RFC 001: Projeto Tialui (PWA de Gestão Financeira)
1. Resumo Executivo
O Tialui é um PWA (Progressive Web App) focado em organização financeira pessoal. O diferencial do app é o foco no "saldo real restante", onde o usuário define seu orçamento mensal e vê o abatimento progressivo conforme registra gastos, com controle rígido de limites por categorias.

2. Contexto e Objetivos
Problema: Dificuldade em visualizar o quanto ainda se pode gastar no mês após as contas fixas e investimentos (cofrinho).

Objetivo: Interface minimalista para input rápido de gastos e monitoramento de metas.

Idioma: Interface em Português (PT-BR). Código, variáveis e documentação técnica em Inglês.

3. Arquitetura Técnica
Frontend: Next.js (App Router).

Estilização: Tailwind CSS (Suporte a Dark/Light mode).

Ícones: react-icons.

Backend/Banco: Firebase (Authentication & Firestore).

Qualidade/Testes: Jest e React Testing Library (Foco em TDD).

4. Especificações de Dados (Firestore Schema)
As coleções no banco de dados devem seguir nomes em inglês:

users (Coleção)
uid, email, displayName, photoURL.

settings (Coleção)
userId (FK), monthlyIncome (salário), billingCycleDay (dia de fechamento), savingsGoal (valor para o cofrinho).

categories (Coleção)
id, userId (ou "system" para padrões), name (ex: "Lazer", "Farmácia"), limit (valor opcional), icon.

transactions (Coleção)
id, userId (FK), description, amount, date, type ("fixed" ou "variable"), categoryId (FK).

5. Requisitos Funcionais
Gestão de Categorias: O usuário pode usar categorias padrão ou criar novas, definindo um limite de valor para cada uma.

Cálculo de Saldo Disponível: * Available = (Income + Extras) - (Savings + Fixed Expenses + Variable Expenses).

Sistema de Alertas: * Exibir progresso visual (barra de progresso) por categoria.

Alerta de proximidade (ex: 80% do limite atingido).

Alerta de limite ultrapassado (valor negativo ou cor de destaque).

Entradas Variáveis: Possibilidade de adicionar rendas extras que somam ao montante do mês atual.

6. Critérios de Aceite para Testes (Jest)
Para aprender e garantir a qualidade, os testes devem cobrir:

Lógica de Limite por Categoria:

Teste: Se a categoria "Farmácia" tem limite de 200 e os gastos são 180, o sistema deve retornar que o limite está próximo.

Teste: Se os gastos passarem de 200, deve retornar estado de "Ultrapassado".

Cálculo do Saldo Global:

Teste: Verificar se o valor do "Cofrinho" (savings) está sendo subtraído corretamente do saldo disponível antes de calcular os gastos variáveis.

Formatação e UI:

Teste: A função de utilidade deve converter 1250.5 em "R$ 1.250,50".

Teste: O componente de Alerta deve ser renderizado apenas quando o limite for atingido.

Módulo de Cobrança entre Terceiros (Billing Module)
Lógica de Negócio:

Transação de Terceiro: Uma despesa no cartão do usuário "A" que pertence ao usuário "B".

Agregação: Capacidade de selecionar múltiplas transações para gerar uma "Cobrança Única" (Invoice).

Integração: O usuário receptor ("B") pode importar essa cobrança como um gasto automático no seu próprio controle.

Novo Schema (Firestore):

invoices (Coleção):

id, senderId, receiverId, status (pending/paid), totalAmount, transactionIds (array de IDs), shareLink.

Gestão de Cartão de Crédito:

Projeção: Gastos feitos no cartão de crédito neste mês não são descontados do saldo do mês atual. Eles geram uma "fatura" (Invoice) que será paga no mês seguinte (baseado no billingCycleDay configurado).

Parcelamento (Installments): Ao cadastrar um gasto de cartão, o usuário informa o número de parcelas (ex: 3x).

Lógica de Projeção: O sistema deve calcular automaticamente o valor de cada parcela e projetá-lo como um gasto fixo nos meses subsequentes correspondentes, descontando da monthlyIncome desses meses futuros.