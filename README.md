````md
# Promo Calculator (promo-calculator)

Aplicação web para **simular promoções** e calcular **metas de venda** com base em:
- **Histórico** (período em dias e lucro total)
- **Preço promocional**
- **Custo unitário**
- **Receita adicional / reembolso**
- **Período da promoção** (início/fim)

O sistema salva automaticamente cada simulação em um **histórico** no PostgreSQL, permite **consulta com filtros** e **importação em lote via Excel (.xlsx)**.

---

## ✅ Funcionalidades

- **Simulador de promoção**
  - Campos do cenário (A/B/C/D/E/F) + metadados (produto, marca, categoria, comprador, tipo).
  - Validações de datas e números.
  - Resultado com metas arredondadas para cima.

- **Histórico**
  - Lista com paginação.
  - Filtros: produto, marca, categoria, comprador, tipo de promoção.
  - Status da promoção: sem datas / não iniciou / em andamento / encerrada.
  - Status de análise: pendente / acima / abaixo / igual.
  - Ordenações: recente, antigo, produto A–Z, promo em andamento, análise pendente.
  - Exclusão individual e em lote.

- **Importação em lote (.xlsx)**
  - Gera modelo de planilha (`modelo_promocoes.xlsx`).
  - Processa linha a linha, calculando e salvando no histórico.

- **Autenticação simples**
  - Login por **AUTH_EMAIL / AUTH_PASSWORD**.
  - Cookie `simulador_auth=ok`.
  - Rotas protegidas: `/` e `/historico`.

---

## 🧰 Stack

- **Next.js 14 (App Router)**
- **React + TypeScript**
- **Tailwind CSS**
- **PostgreSQL + Knex (migrations)**
- **XLSX** (importação de planilhas)

---

## 📌 Regras do cálculo (exatamente como o backend calcula)

### Entradas
- **A** = Período histórico (dias) — inteiro > 0  
- **B** = Lucro total histórico (R$)
- **C** = Duração da promoção (dias) — inteiro > 0 (calculado no front pelo intervalo de datas)
- **D** = Preço promocional (R$)
- **E** = Custo unitário (R$)
- **F** = Receita adicional / reembolso (R$)

### Fórmulas
- **Lucro diário histórico**:  
  `lucro_diario_hist = B / A`

- **Lucro unitário sem adicional**:  
  `lucro_unit_sem_adicional = D - E`

- **Lucro unitário com adicional**:  
  `lucro_unit_com_adicional = (D - E) + F`  
  > Se `lucro_unit_com_adicional <= 0`, o cálculo é bloqueado.

- **Meta de unidades por dia**:  
  `meta_unid_dia = ceil(lucro_diario_hist / lucro_unit_com_adicional)`

- **Meta total no período**:  
  `meta_unid_total = ceil(meta_unid_dia * C)`

- **Markup com adicional** (quando `E > 0`):  
  `markup_com_adicional = lucro_unit_com_adicional / E`

> Observação importante: o backend orienta usar **vírgula como separador decimal** nos campos numéricos (ex.: `4,79`).

---

## 🚀 Como rodar localmente

### 1) Pré-requisitos
- Node.js (LTS recomendado)
- PostgreSQL (local ou remoto)

### 2) Instalar dependências
```bash
npm install
````

### 3) Configurar variáveis de ambiente

Crie `.env.local` na raiz:

```bash
# Login (obrigatório)
AUTH_EMAIL="seuemail@dominio.com"
AUTH_PASSWORD="sua_senha_forte"

# Banco
# DEV: usa DATABASE_URL_TEST (prioritário) ou DATABASE_URL
DATABASE_URL_TEST="postgres://USER:PASS@localhost:5432/promo_calculator_dev"

# PROD: usa DATABASE_URL
DATABASE_URL="postgres://USER:PASS@HOST:5432/promo_calculator"
```

### 4) Rodar

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

> O `dev` executa migrations automaticamente via `predev`.

---

## 🗄️ Banco de dados e migrations

### Scripts disponíveis

```bash
npm run db:migrate:dev
npm run db:rollback:dev
npm run db:migrate:prod
```

### Estrutura (tabela `historico`)

* `id` (bigint)
* `dataHora` (timestamp)
* `resultado` (jsonb)
* campos auxiliares para filtros:

  * `produto_nome_txt`
  * `marca_txt`
  * `categoria_txt`
  * `comprador_txt`
  * `data_inicio_promocao`
  * `data_fim_promocao`
  * `situacao_analise`
  * `tipo_promocao_txt`

Índices:

* por dataHora, marca, categoria, comprador, situação, período e tipo.
* extensão `pg_trgm` + índice gin trigram para busca por produto.

---

## 🔐 Autenticação

* Login: `POST /api/login`

  * Body: `{ "email": "...", "senha": "...", "lembrar": true|false }`
  * Cria cookie `simulador_auth=ok` (httpOnly)
  * `lembrar=true` → 7 dias; `false` → 1 hora

* Logout: `POST /api/logout`

  * Remove cookie

* Check: `GET /api/auth/check`

  * Retorna `{ ok: true }` se autenticado

Rotas protegidas:

* `/`
* `/historico`

---

## 📡 API (endpoints principais)

* `POST /api/calculo`

  * Calcula metas e salva no histórico.

* `GET /api/historico`

  * Query params (principais):

    * `produto` (contains/ilike)
    * `marca`, `categoria`, `comprador`
    * `tipoPromocao` = `INTERNA` | `SCANNTECH`
    * `statusPromo` = `SEM_DATAS` | `NAO_INICIOU` | `EM_ANDAMENTO` | `ENCERRADA`
    * `statusAnalise` = `PENDENTE` | `ACIMA` | `ABAIXO` | `IGUAL`
    * `sort` = `RECENTE` | `ANTIGO` | `PRODUTO_AZ` | `PROMO_EM_ANDAMENTO` | `ANALISE_PENDENTE`
    * `page` (default 1), `pageSize` (default 20, max 100)

* `DELETE /api/historico`

  * Body:

    * `{ "id": 123 }` (individual) ou
    * `{ "ids": [1,2,3] }` (lote)

* `GET /api/historico/options`

  * Retorna listas de opções (marcas/categorias/compradores) conforme filtros atuais.

* `GET /api/meta/compradores`

  * Retorna `{ compradores: [...] }` (distintos do histórico)

* `GET /api/meta/produto-sugestao?produto=...`

  * Sugere marca/categoria baseado no histórico, com `confidence` e `matchType`.

---

## 📥 Importação em lote (.xlsx)

### Gerar modelo

No app, use a função de gerar modelo para baixar `modelo_promocoes.xlsx`.

A primeira aba deve conter cabeçalhos exatamente assim:

* `Produto`
* `Categoria`
* `Comprador`
* `Marca`
* `TipoPromocao` (`INTERNA` ou `SCANNTECH`)
* `PeriodoHistorico`
* `LucroTotalHistorico`
* `DataInicioPromocao` (DD/MM/AAAA ou AAAA-MM-DD)
* `DataFimPromocao` (DD/MM/AAAA ou AAAA-MM-DD)
* `PrecoPromocional`
* `CustoUnitario`
* `ReceitaAdicional`

### Regras da importação

* Lê a **primeira aba** do arquivo.
* Valida datas e números.
* Calcula `C` automaticamente pelo intervalo (início–fim) e envia para `/api/calculo`.
* Exibe resultado por linha (ok/erro).

---

## 📦 Scripts (package.json)

```bash
npm run dev
npm run build
npm run start

npm run db:migrate:dev
npm run db:rollback:dev
npm run db:migrate:prod
```

---

## 🧯 Troubleshooting

### “Configuração de login não encontrada…”

Defina `AUTH_EMAIL` e `AUTH_PASSWORD` no `.env.local` (ou no ambiente do deploy).

### Erro de conexão com Postgres no app (dev)

* O app usa `DATABASE_URL_TEST` (ou `DATABASE_URL`) no dev.
* Ele inicializa a conexão com SSL habilitado.

  * Se seu Postgres local não aceitar SSL, ajuste a configuração em `lib/knex.ts` (desabilitar SSL) ou use um Postgres que aceite SSL.

### Migrations não rodaram

Rode manualmente:

```bash
npm run db:migrate:dev
```

---

## 🚢 Deploy (visão geral)

1. Defina variáveis no provedor:

   * `DATABASE_URL`
   * `AUTH_EMAIL`
   * `AUTH_PASSWORD`
2. Rode migrations:

   ```bash
   npm run db:migrate:prod
   ```
3. Build e start:

   ```bash
   npm run build
   npm run start
   ```

