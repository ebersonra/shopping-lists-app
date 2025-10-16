# Tabela de Usuários - Documentação Completa

## 📋 Visão Geral

A tabela `users` foi adicionada ao schema do banco de dados para gerenciar informações dos usuários da aplicação Shopping Lists. Esta tabela é central no sistema e se relaciona com outras tabelas através de foreign keys.

## 🗄️ Estrutura da Tabela

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    preferred_market_id UUID,
    skipped_onboarding BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);
```

## 📊 Campos Detalhados

| Campo                 | Tipo      | Restrições                 | Descrição                                |
| --------------------- | --------- | -------------------------- | ---------------------------------------- |
| `id`                  | UUID      | PRIMARY KEY, NOT NULL      | Identificador único do usuário           |
| `name`                | TEXT      | NOT NULL, length > 0       | Nome completo do usuário                 |
| `phone`               | TEXT      | NULL, min 10 dígitos       | Telefone/WhatsApp (formato: 11987654321) |
| `email`               | TEXT      | NULL, formato email válido | Email do usuário                         |
| `preferred_market_id` | UUID      | NULL, FK → markets(id)     | Mercado preferido do usuário             |
| `skipped_onboarding`  | BOOLEAN   | DEFAULT FALSE              | Se pulou o formulário de boas-vindas     |
| `is_active`           | BOOLEAN   | DEFAULT TRUE               | Status da conta (ativo/inativo)          |
| `created_at`          | TIMESTAMP | DEFAULT now()              | Data de criação do registro              |
| `updated_at`          | TIMESTAMP | DEFAULT now()              | Última atualização (auto)                |
| `deleted_at`          | TIMESTAMP | NULL                       | Soft delete (NULL = ativo)               |

## 🔗 Relacionamentos

### Relações da Tabela Users

```
users (1) ──────── (N) markets
  │                     │
  │                     └─ user_id (quem criou o mercado)
  │
  └─ preferred_market_id ──► markets.id (mercado preferido)

users (1) ──────── (N) shopping_lists
                         │
                         └─ user_id (proprietário da lista)
```

### Foreign Keys

1. **users.preferred_market_id → markets.id**
   - Tipo: Optional (NULL permitido)
   - ON DELETE: SET NULL
   - Uso: Define o mercado preferido do usuário

2. **shopping_lists.user_id → users.id**
   - Tipo: Required (NOT NULL)
   - ON DELETE: CASCADE
   - Uso: Todas as listas pertencem a um usuário

3. **markets.user_id → users.id**
   - Tipo: Required (NOT NULL)
   - ON DELETE: CASCADE
   - Uso: Quem criou/cadastrou o mercado

## ✅ Constraints e Validações

### Check Constraints

```sql
-- Nome não pode ser vazio
CONSTRAINT users_name_not_empty
CHECK (length(trim(name)) > 0)

-- Telefone deve ter pelo menos 10 dígitos (se fornecido)
CONSTRAINT users_phone_format
CHECK (phone IS NULL OR length(regexp_replace(phone, '\D', '', 'g')) >= 10)

-- Email deve ter formato válido (se fornecido)
CONSTRAINT users_email_format
CHECK (email IS NULL OR email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$')
```

## 📇 Índices

```sql
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_preferred_market_id ON users(preferred_market_id);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_is_active ON users(is_active) WHERE is_active = TRUE;
```

### Propósito dos Índices

- **idx_users_phone**: Busca rápida por telefone (login/autenticação)
- **idx_users_email**: Busca por email
- **idx_users_preferred_market_id**: JOIN com markets
- **idx_users_created_at**: Ordenação temporal, usuários recentes
- **idx_users_deleted_at**: Filtro de usuários ativos (partial index)
- **idx_users_is_active**: Filtro de contas ativas (partial index)

## 🔧 Funções CRUD

### 1. create_user()

Cria um novo usuário.

**Sintaxe:**

```sql
SELECT * FROM create_user(
    p_name TEXT,
    p_phone TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_preferred_market_id UUID DEFAULT NULL,
    p_skipped_onboarding BOOLEAN DEFAULT FALSE
);
```

**Exemplo:**

```sql
-- Usuário completo
SELECT * FROM create_user(
    'Maria Silva',
    '11987654321',
    'maria@email.com',
    '650e8400-e29b-41d4-a716-446655440001'::UUID,
    false
);

-- Usuário mínimo (apenas nome)
SELECT * FROM create_user('João Santos');
```

**Retorna:** Registro completo do usuário criado

### 2. update_user()

Atualiza informações de um usuário existente (atualização parcial).

**Sintaxe:**

```sql
SELECT * FROM update_user(
    p_user_id UUID,
    p_name TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_preferred_market_id UUID DEFAULT NULL
);
```

**Exemplo:**

```sql
-- Atualizar apenas telefone
SELECT * FROM update_user(
    '550e8400-e29b-41d4-a716-446655440001'::UUID,
    p_phone := '11999887766'
);

-- Atualizar múltiplos campos
SELECT * FROM update_user(
    '550e8400-e29b-41d4-a716-446655440001'::UUID,
    p_name := 'Maria Silva Santos',
    p_email := 'maria.silva@newemail.com',
    p_preferred_market_id := '650e8400-e29b-41d4-a716-446655440002'::UUID
);
```

**Retorna:** Registro atualizado do usuário

**Erros:**

- Levanta exceção se usuário não encontrado

### 3. get_user_by_id()

Busca usuário pelo ID com informações do mercado preferido.

**Sintaxe:**

```sql
SELECT * FROM get_user_by_id(p_user_id UUID);
```

**Exemplo:**

```sql
SELECT * FROM get_user_by_id('550e8400-e29b-41d4-a716-446655440001'::UUID);
```

**Retorna:**

```
┌────────────────────────┬──────────────┬──────────────┬─────────────────┬─────────────────────┬──────────────────────┐
│ id                     │ name         │ phone        │ email           │ preferred_market_id │ preferred_market_name│
├────────────────────────┼──────────────┼──────────────┼─────────────────┼─────────────────────┼──────────────────────┤
│ 550e8400-e29b-41d4-... │ Ana Silva    │ 11987654321  │ ana@email.com   │ 650e8400-e29b-...   │ Supermercado Central │
└────────────────────────┴──────────────┴──────────────┴─────────────────┴─────────────────────┴──────────────────────┘
```

### 4. get_user_by_phone()

Busca usuário pelo número de telefone.

**Sintaxe:**

```sql
SELECT * FROM get_user_by_phone(p_phone TEXT);
```

**Exemplo:**

```sql
SELECT * FROM get_user_by_phone('11987654321');
```

**Uso típico:** Login/autenticação por WhatsApp

**Retorna:** Mesmo formato que `get_user_by_id()`

**Observações:**

- Só retorna usuários ativos (`is_active = TRUE`)
- Não retorna usuários deletados (`deleted_at IS NULL`)

### 5. delete_user()

Soft delete de um usuário (não remove do banco).

**Sintaxe:**

```sql
SELECT delete_user(p_user_id UUID);
```

**Exemplo:**

```sql
SELECT delete_user('550e8400-e29b-41d4-a716-446655440003'::UUID);
-- Retorna: true (sucesso) ou false (não encontrado)
```

**Efeitos:**

- Define `deleted_at` para timestamp atual
- Define `is_active` como `FALSE`
- Usuário não aparece mais em buscas normais
- Dados permanecem no banco para auditoria

### 6. get_user_statistics()

Retorna estatísticas completas de um usuário.

**Sintaxe:**

```sql
SELECT * FROM get_user_statistics(p_user_id UUID);
```

**Exemplo:**

```sql
SELECT * FROM get_user_statistics('550e8400-e29b-41d4-a716-446655440001'::UUID);
```

**Retorna:**

```
┌─────────────┬─────────────────┬─────────────┬────────────┬─────────────┬─────────────────┬──────────────────┐
│ total_lists │ completed_lists │ active_lists│ total_items│ total_spent │ favorite_market │ favorite_category│
├─────────────┼─────────────────┼─────────────┼────────────┼─────────────┼─────────────────┼──────────────────┤
│ 15          │ 10              │ 5           │ 142        │ 1250.50     │ Carrefour       │ Cereais e Grãos  │
└─────────────┴─────────────────┴─────────────┴────────────┴─────────────┴─────────────────┴──────────────────┘
```

**Métricas:**

- `total_lists`: Total de listas criadas
- `completed_lists`: Listas marcadas como concluídas
- `active_lists`: Listas não concluídas e não deletadas
- `total_items`: Total de itens em todas as listas
- `total_spent`: Soma de todos os valores gastos
- `favorite_market`: Mercado mais usado
- `favorite_category`: Categoria mais comprada

## 🔄 Triggers

### 1. trg_set_updated_at_users

**Tipo:** BEFORE UPDATE
**Função:** Atualiza automaticamente `updated_at` para `now()`

**Comportamento:**

```sql
-- Qualquer UPDATE na tabela users
UPDATE users SET name = 'Novo Nome' WHERE id = '...';
-- Automaticamente: updated_at = now()
```

## 💾 Dados de Exemplo

### Usuários Pré-cadastrados

```sql
-- Usuário 1: Ana Silva (usuária ativa completa)
id: 550e8400-e29b-41d4-a716-446655440001
name: Ana Silva
phone: 11987654321
email: ana.silva@email.com
skipped_onboarding: false
preferred_market_id: 650e8400-e29b-41d4-a716-446655440001 (Supermercado Central)

-- Usuário 2: João Santos (usuário ativo completo)
id: 550e8400-e29b-41d4-a716-446655440002
name: João Santos
phone: 11912345678
email: joao.santos@email.com
skipped_onboarding: false
preferred_market_id: 650e8400-e29b-41d4-a716-446655440003 (Atacadão Popular)

-- Usuário 3: Maria Oliveira (pulou onboarding)
id: 550e8400-e29b-41d4-a716-446655440003
name: Maria Oliveira
phone: 11998765432
email: maria.oliveira@email.com
skipped_onboarding: true
preferred_market_id: NULL
```

## 📱 Integração com Frontend

### Fluxo de Onboarding (shopping-welcome.html)

**1. Usuário preenche formulário:**

```javascript
const userData = {
  name: 'João Silva',
  phone: '11987654321',
  market: 'carrefour', // valor do select
  skipped: false,
};
```

**2. Backend deve:**

```javascript
// 1. Criar ou buscar usuário por telefone
const existingUser = await db.query('SELECT * FROM get_user_by_phone($1)', [userData.phone]);

if (!existingUser) {
  // 2. Buscar/criar market_id baseado no nome
  const market = await findOrCreateMarket(userData.market);

  // 3. Criar novo usuário
  const newUser = await db.query(
    `
        SELECT * FROM create_user($1, $2, NULL, $3, $4)
    `,
    [userData.name, userData.phone, market.id, userData.skipped]
  );
}

// 4. Salvar user_id no localStorage
localStorage.setItem('user_id', user.id);
```

### Queries Comuns no Frontend

**Verificar se usuário existe:**

```sql
SELECT * FROM get_user_by_phone('11987654321');
```

**Obter perfil completo:**

```sql
SELECT * FROM get_user_by_id('550e8400-e29b-41d4-a716-446655440001'::UUID);
```

**Dashboard de usuário:**

```sql
SELECT * FROM get_user_statistics('550e8400-e29b-41d4-a716-446655440001'::UUID);
```

**Listas do usuário:**

```sql
SELECT * FROM get_user_shopping_lists(
    '550e8400-e29b-41d4-a716-446655440001'::UUID,
    true,  -- incluir concluídas
    20,    -- limite
    0      -- offset
);
```

## 🔒 Segurança e Privacidade

### Soft Delete

- Usuários deletados **não são removidos** do banco
- `deleted_at` é setado com timestamp
- `is_active` é marcado como `FALSE`
- Dados preservados para:
  - Auditoria
  - Histórico de compras
  - Relatórios
  - Possível recuperação de conta

### Campos Opcionais

- `phone`, `email`, `preferred_market_id` são NULL por padrão
- Permite criação rápida de usuários
- Dados podem ser completados depois

### SECURITY DEFINER

Todas as funções usam `SECURITY DEFINER`:

- Executam com privilégios do owner da função
- Frontend não precisa de permissões diretas nas tabelas
- Camada adicional de segurança

## 📊 Queries Úteis

### Buscar usuários mais ativos

```sql
SELECT
    u.id,
    u.name,
    COUNT(DISTINCT sl.id) as total_lists,
    COUNT(DISTINCT sli.id) as total_items,
    SUM(sl.total_amount) as total_spent
FROM users u
LEFT JOIN shopping_lists sl ON u.id = sl.user_id AND sl.deleted_at IS NULL
LEFT JOIN shopping_list_items sli ON sl.id = sli.list_id
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.name
ORDER BY total_lists DESC
LIMIT 10;
```

### Usuários sem mercado preferido

```sql
SELECT id, name, phone, email
FROM users
WHERE preferred_market_id IS NULL
AND deleted_at IS NULL
AND is_active = TRUE;
```

### Usuários inativos (há mais de 30 dias)

```sql
SELECT id, name, phone, created_at, updated_at
FROM users
WHERE deleted_at IS NULL
AND is_active = TRUE
AND updated_at < NOW() - INTERVAL '30 days'
ORDER BY updated_at ASC;
```

### Novos usuários (últimos 7 dias)

```sql
SELECT id, name, phone, email, created_at
FROM users
WHERE deleted_at IS NULL
AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

## 🧪 Testes

### Criar usuário de teste

```sql
SELECT * FROM create_user(
    'Teste User',
    '11999999999',
    'test@example.com',
    NULL,
    false
);
```

### Atualizar usuário de teste

```sql
SELECT * FROM update_user(
    (SELECT id FROM users WHERE phone = '11999999999'),
    p_name := 'Teste User Updated'
);
```

### Deletar usuário de teste

```sql
SELECT delete_user(
    (SELECT id FROM users WHERE phone = '11999999999')
);
```

### Verificar integridade referencial

```sql
-- Verificar se todos os user_id em shopping_lists existem
SELECT sl.id, sl.user_id
FROM shopping_lists sl
LEFT JOIN users u ON sl.user_id = u.id
WHERE u.id IS NULL;
-- Deve retornar 0 rows

-- Verificar se todos os user_id em markets existem
SELECT m.id, m.user_id
FROM markets m
LEFT JOIN users u ON m.user_id = u.id
WHERE u.id IS NULL;
-- Deve retornar 0 rows
```

## 📝 Notas de Implementação

1. **UUID vs SERIAL**: Escolhido UUID para:
   - Melhor distribuição em sistemas distribuídos
   - Não expõe quantidade de usuários
   - Dificulta enumeração de IDs

2. **Telefone sem máscara**: Armazenado sem formatação
   - Validação: mínimo 10 dígitos numéricos
   - Frontend: aplicar máscara na exibição
   - Backend: remover formatação antes de salvar

3. **Email opcional**:
   - WhatsApp/telefone como método principal
   - Email como secundário/opcional

4. **Mercado preferido**:
   - Melhora UX (pré-seleciona mercado)
   - Não impede usar outros mercados
   - Pode ser mudado a qualquer momento

## 🔄 Migrações Futuras

Possíveis adições:

```sql
-- Avatar/foto do usuário
ALTER TABLE users ADD COLUMN avatar_url TEXT;

-- Preferências do usuário
ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}'::JSONB;

-- Notificações
ALTER TABLE users ADD COLUMN notifications_enabled BOOLEAN DEFAULT TRUE;

-- Autenticação
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
```

## 📚 Referências

- [PostgreSQL UUID Type](https://www.postgresql.org/docs/current/datatype-uuid.html)
- [PostgreSQL Check Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [Soft Delete Pattern](https://en.wikipedia.org/wiki/Soft_delete)
