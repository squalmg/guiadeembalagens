# Guia de Embalagens — Dia 2

Projeto da home + solicitação de orçamento para o portal nacional B2B **Guia de Embalagens**.

A identidade visual aprovada foi aplicada com:

- verde escuro institucional;
- branco e cinza claro como base limpa;
- laranja para CTA comercial;
- símbolo geométrico abstrato em SVG;
- linguagem de portal B2B/SaaS;
- foco em captação de lead.

## O que está incluído

```txt
index.html                         Home completa + formulário comercial
admin-leads.html                   Painel simples para ver leads locais de teste
assets/css/styles.css              Estilos responsivos
assets/js/app.js                   Simulador, formulário, classificação e gravação
assets/img/logo-guia-embalagens.svg
assets/img/favicon.svg
api/leads.js                       API Vercel para salvar no Supabase
supabase/schema.sql                Banco inicial de leads
.env.example                       Exemplo de variáveis de ambiente
vercel.json                        Configuração simples para deploy
package.json                       Scripts básicos
docs/identidade-visual-aprovada.png
docs/brief-home-dia2.md
docs/lead-classification.md
docs/n8n-payload-example.json
```

## Como testar localmente

Abra `index.html` no navegador ou rode:

```bash
python -m http.server 8080
```

Depois acesse:

```txt
http://localhost:8080
```

Para ver leads locais de teste:

```txt
http://localhost:8080/admin-leads.html
```

## Como funciona a captação

O formulário coleta:

- nome;
- WhatsApp;
- cidade;
- estado;
- segmento;
- tipo de embalagem;
- quantidade estimada;
- necessidade de personalização;
- prazo desejado;
- observações.

Ao enviar, o lead é classificado como:

- **lead quente**: alta quantidade, urgência e/ou personalização;
- **lead médio**: intenção real, mas ainda precisa de nutrição;
- **lead fraco**: baixa quantidade ou curiosidade.

## Regra de roteamento

| Classificação | Rota recomendada |
|---|---|
| Lead quente | Natucopos ou parceiro premium |
| Lead médio | Nutrição via WhatsApp |
| Lead fraco | Conteúdo automático |

## Como ativar banco de dados com Supabase

1. Crie um projeto no Supabase.
2. Abra o SQL Editor.
3. Rode o arquivo:

```txt
supabase/schema.sql
```

4. No Vercel, configure as variáveis:

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

5. Publique o projeto na Vercel.

Quando o endpoint `/api/leads` estiver ativo, os leads serão salvos na tabela `packaging_leads`.

## Observação importante

Se o backend ainda não estiver configurado, a página não perde o teste: ela salva os leads no `localStorage` do navegador. Isso é apenas para desenvolvimento. Em produção, use o Supabase.

## Melhor próximo passo

Depois dessa etapa, o próximo ativo com maior impacto é criar o painel comercial de leads com filtros por:

- temperatura do lead;
- cidade/estado;
- segmento;
- tipo de embalagem;
- quantidade;
- prazo;
- status comercial;
- fornecedor/parceiro indicado.
