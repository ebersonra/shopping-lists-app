# Database Scripts

Esta pasta contém todos os scripts SQL necessários para configurar e manter o banco de dados da aplicação Shopping Lists.

## 📁 Arquivos

### `init.sql` ⭐

**Arquivo principal de inicialização do banco de dados**

Script completo e independente que cria toda a estrutura do banco de dados do zero. Este é o arquivo que você deve executar para configurar um novo ambiente.

**Conteúdo:**

- ✅ Extensões PostgreSQL necessárias
- ✅ Funções auxiliares (triggers, helpers)
- ✅ Tabela `markets` (mercados/lojas)
- ✅ Tabela `shopping_lists` (listas de compras)
- ✅ Tabela `shopping_list_items` (itens das listas)
- ✅ Triggers automáticos (updated_at, total_amount, share_code)
- ✅ Índices para performance
- ✅ Views úteis (active_shopping_lists, shopping_list_items_by_category)
- ✅ Stored procedures/functions para operações CRUD
- ✅ Dados de exemplo (opcional)

**Como executar:**

```bash
# Via psql
psql -U seu_usuario -d seu_banco -f database/init.sql

# Via Supabase SQL Editor
# Copie e cole o conteúdo do arquivo no SQL Editor e execute
```

### `shopping_lists_schema.sql`

Script original de schema das tabelas de listas de compras. Este arquivo foi usado como base para o `init.sql` e contém:

- Schema básico das tabelas
- Funções e triggers
- Dados de exemplo (seeds)

**Status:** Consolidado no `init.sql`

### `convert_shopping_lists_user_id_to_uuid.sql`

Script de migração para converter a coluna `user_id` de TEXT para UUID na tabela `shopping_lists`.

**Quando usar:**

- Se você tem um banco de dados existente com `user_id` como TEXT
- Para padronizar todos os IDs de usuário como UUID

**⚠️ Atenção:** Este script remove e recria views. Certifique-se de ter backup antes de executar.

### `simple_shopping_lists_uuid_migration.sql`

Versão simplificada da migração UUID, com tratamento de erros mais robusto.

**Diferenças da versão completa:**

- Verificações de tipo de dados mais inteligentes
- Melhor tratamento de casos onde a coluna já é UUID
- Menos propenso a falhas em migrações parciais

### `fix_get_shopping_list_by_code.sql`

Correção para a função `get_shopping_list_by_code` que tinha problemas com cláusula GROUP BY.

**Problema resolvido:**

- Erro de agregação ao buscar lista por código compartilhado
- Campos faltantes na cláusula GROUP BY

## 🗄️ Estrutura do Banco de Dados

### Diagrama de Relacionamentos

```
┌─────────────────┐
│     markets     │
│─────────────────│
│ id (UUID) PK    │
│ user_id (UUID)  │
│ name            │
│ address         │
│ cnpj            │
│ phone           │
│ email           │
│ website         │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────────────┐
│   shopping_lists        │
│─────────────────────────│
│ id (UUID) PK            │
│ user_id (UUID)          │
│ title                   │
│ description             │
│ shopping_date           │
│ market_id (UUID) FK     │
│ total_amount            │
│ share_code (UNIQUE)     │
│ is_completed            │
└────────┬────────────────┘
         │
         │ 1:N
         │
┌────────▼─────────────────┐
│ shopping_list_items      │
│──────────────────────────│
│ id (UUID) PK             │
│ list_id (UUID) FK        │
│ product_name             │
│ category                 │
│ quantity                 │
│ unit                     │
│ unit_price               │
│ total_price              │
│ is_checked               │
│ notes                    │
└──────────────────────────┘
```

### Tabelas Principais

#### `markets`

Armazena informações sobre mercados/lojas onde as compras são realizadas.

**Campos principais:**

- `id`: Identificador único (UUID)
- `user_id`: ID do usuário que cadastrou o mercado
- `name`: Nome do mercado (obrigatório)
- `cnpj`: CNPJ do estabelecimento (14 dígitos)
- `address`, `phone`, `email`, `website`: Informações de contato

#### `shopping_lists`

Lista principal de compras com código de compartilhamento único.

**Campos principais:**

- `id`: Identificador único (UUID)
- `user_id`: ID do usuário proprietário
- `title`: Título da lista (obrigatório)
- `share_code`: Código único de 4 dígitos para compartilhamento
- `total_amount`: Valor total calculado automaticamente
- `is_completed`: Status de conclusão

**Características especiais:**

- Geração automática de `share_code` único
- Cálculo automático de `total_amount`
- Soft delete via `deleted_at`

#### `shopping_list_items`

Itens individuais de cada lista de compras.

**Campos principais:**

- `id`: Identificador único (UUID)
- `list_id`: Referência à lista pai (CASCADE DELETE)
- `product_name`: Nome do produto
- `category`: Categoria do produto
- `quantity`: Quantidade
- `unit`: Unidade de medida (un, kg, l, etc.)
- `unit_price`: Preço unitário
- `total_price`: Preço total (calculado)
- `is_checked`: Item já comprado?

## 🔧 Funções e Procedures

### Funções de CRUD

#### `create_shopping_list()`

Cria uma nova lista de compras.

```sql
SELECT * FROM create_shopping_list(
    p_user_id := 'uuid-do-usuario',
    p_title := 'Minha Lista',
    p_description := 'Descrição opcional',
    p_shopping_date := CURRENT_DATE,
    p_market_id := 'uuid-do-mercado' -- opcional
);
```

#### `add_shopping_list_item()`

Adiciona um item a uma lista existente.

```sql
SELECT * FROM add_shopping_list_item(
    p_list_id := 'uuid-da-lista',
    p_product_name := 'Arroz',
    p_category := 'Cereais',
    p_quantity := 1,
    p_unit := 'kg',
    p_unit_price := 5.99
);
```

#### `update_shopping_list_item()`

Atualiza um item existente (atualização parcial suportada).

```sql
SELECT * FROM update_shopping_list_item(
    p_item_id := 'uuid-do-item',
    p_quantity := 2,
    p_is_checked := true
    -- outros parâmetros opcionais
);
```

#### `get_shopping_list_by_code()`

Busca uma lista completa (com itens) pelo código de compartilhamento.

```sql
SELECT * FROM get_shopping_list_by_code('1234');
```

Retorna:

- `list_data`: JSONB com dados da lista
- `items_data`: JSONB array com todos os itens

#### `get_user_shopping_lists()`

Lista todas as listas de um usuário com paginação.

```sql
SELECT * FROM get_user_shopping_lists(
    p_user_id := 'uuid-do-usuario',
    p_include_completed := true,
    p_limit := 50,
    p_offset := 0
);
```

#### `delete_shopping_list()`

Soft delete de uma lista (marca como deletada sem remover).

```sql
SELECT delete_shopping_list('uuid-da-lista');
```

#### `remove_shopping_list_item()`

Remove permanentemente um item da lista.

```sql
SELECT remove_shopping_list_item('uuid-do-item');
```

### Funções Auxiliares

#### `generate_share_code()`

Gera um código único de 4 dígitos para compartilhamento.

#### `set_share_code()`

Trigger function que auto-gera share_code ao inserir lista.

#### `set_updated_at()`

Trigger function que atualiza automaticamente o campo `updated_at`.

#### `update_shopping_list_total()`

Trigger function que recalcula o total da lista quando itens mudam.

## 📊 Views

### `active_shopping_lists`

Retorna todas as listas ativas (não deletadas) com informações agregadas.

**Colunas adicionais:**

- `market_name`: Nome do mercado
- `market_address`: Endereço do mercado
- `items_count`: Total de itens
- `checked_items_count`: Itens já comprados

**Uso:**

```sql
SELECT * FROM active_shopping_lists
WHERE user_id = 'uuid-do-usuario'
ORDER BY created_at DESC;
```

### `shopping_list_items_by_category`

Retorna itens organizados por categoria com informações da lista pai.

**Uso:**

```sql
SELECT * FROM shopping_list_items_by_category
WHERE list_id = 'uuid-da-lista'
ORDER BY category, product_name;
```

## 🚀 Triggers Automáticos

### Atualização de Timestamps

- `trg_set_updated_at_markets`: Atualiza `markets.updated_at`
- `trg_set_updated_at_shopping_lists`: Atualiza `shopping_lists.updated_at`
- `trg_set_updated_at_shopping_list_items`: Atualiza `shopping_list_items.updated_at`

### Geração de Share Code

- `trg_set_share_code`: Gera automaticamente código único ao criar lista

### Cálculo de Totais

- `trg_update_list_total_insert`: Recalcula total ao inserir item
- `trg_update_list_total_update`: Recalcula total ao atualizar item
- `trg_update_list_total_delete`: Recalcula total ao remover item

## 🔍 Índices

Índices criados para otimizar queries comuns:

**Shopping Lists:**

- `user_id`: Buscar listas por usuário
- `share_code`: Buscar por código de compartilhamento (UNIQUE)
- `created_at`: Ordenação temporal
- `shopping_date`: Filtrar por data de compra
- `market_id`: Filtrar por mercado
- `deleted_at`: Filtrar apenas ativos
- `is_completed`: Filtrar por status

**Shopping List Items:**

- `list_id`: Buscar itens de uma lista
- `category`: Agrupar por categoria
- `is_checked`: Filtrar por status de compra

**Markets:**

- `user_id`: Buscar mercados do usuário
- `name`: Busca por nome
- `cnpj`: Busca por CNPJ

## 🛡️ Constraints e Validações

### Shopping Lists

- ✅ Título não pode ser vazio
- ✅ Share code deve ter exatamente 4 dígitos
- ✅ Total amount deve ser >= 0

### Shopping List Items

- ✅ Nome do produto não pode ser vazio
- ✅ Categoria não pode ser vazia
- ✅ Quantidade deve ser > 0
- ✅ Preços devem ser >= 0

### Markets

- ✅ Nome não pode ser vazio
- ✅ CNPJ deve ter 14 dígitos (se fornecido)
- ✅ Email deve ter formato válido (se fornecido)

## 📝 Ordem de Execução

Para configurar um novo banco de dados:

1. **Primeira instalação:**

   ```bash
   psql -U usuario -d banco -f database/init.sql
   ```

2. **Banco existente com user_id como TEXT:**

   ```bash
   # Primeiro, faça backup!
   pg_dump banco > backup.sql

   # Execute a migração
   psql -U usuario -d banco -f database/simple_shopping_lists_uuid_migration.sql
   ```

3. **Aplicar correções específicas:**
   ```bash
   psql -U usuario -d banco -f database/fix_get_shopping_list_by_code.sql
   ```

## 🔄 Migrações

### De TEXT para UUID (user_id)

Se você tem um banco existente onde `user_id` é TEXT e precisa converter para UUID:

1. **Backup obrigatório:**

   ```bash
   pg_dump -U usuario banco > backup_$(date +%Y%m%d).sql
   ```

2. **Execute a migração:**

   ```bash
   psql -U usuario -d banco -f database/simple_shopping_lists_uuid_migration.sql
   ```

3. **Verificação:**
   ```sql
   SELECT data_type
   FROM information_schema.columns
   WHERE table_name = 'shopping_lists'
   AND column_name = 'user_id';
   -- Deve retornar: uuid
   ```

## 🧪 Testando o Banco

Após executar o `init.sql`, você pode verificar se tudo está funcionando:

```sql
-- Verificar tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Verificar funções criadas
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION';

-- Verificar views criadas
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public';

-- Verificar dados de exemplo
SELECT COUNT(*) FROM markets;
SELECT COUNT(*) FROM shopping_lists;
SELECT COUNT(*) FROM shopping_list_items;

-- Testar busca por código
SELECT * FROM get_shopping_list_by_code('1234');
```

## 📚 Recursos Adicionais

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Database Guide](https://supabase.com/docs/guides/database)
- [UUID Best Practices](https://www.postgresql.org/docs/current/datatype-uuid.html)

## 🤝 Contribuindo

Ao adicionar novos scripts SQL:

1. Documente o propósito do script no cabeçalho
2. Inclua comentários explicativos
3. Adicione verificações de segurança (EXISTS, IF NOT EXISTS)
4. Atualize este README
5. Teste em ambiente de desenvolvimento primeiro

## ⚠️ Notas Importantes

- **Sempre faça backup antes de executar migrações**
- Scripts são idempotentes (podem ser executados múltiplas vezes)
- Use `init.sql` para novas instalações
- Use scripts de migração apenas quando necessário
- Dados de exemplo são opcionais (podem ser comentados)

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.
