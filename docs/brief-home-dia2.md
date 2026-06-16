# Dia 2 — Home e solicitação de orçamento

## Objetivo da home
Vender a promessa em 5 segundos:

**Encontre a embalagem ideal para o seu negócio.**

A home não deve ser apenas bonita. Ela precisa transformar visita em lead.

## Promessa principal
Compare tipos de embalagens, simule custos e solicite orçamento com fornecedores confiáveis.

## CTAs principais
- Solicitar orçamento
- Usar simulador
- Encontrar fornecedor

## Seções implementadas
1. Hero com promessa direta.
2. Embalagens por segmento.
3. Embalagens por tipo.
4. Simulador rápido.
5. Fornecedores por região.
6. Conteúdo técnico.
7. Solicitação de orçamento.

## Campos mínimos do formulário
- nome
- WhatsApp
- cidade
- estado
- segmento
- tipo de embalagem
- quantidade estimada
- precisa personalizada?
- prazo desejado
- observações

## Dados salvos
O front-end tenta enviar para `/api/leads`.
Se o endpoint ainda não estiver configurado, salva no `localStorage` para teste.
Em produção, use Supabase com o SQL em `/supabase/schema.sql`.
