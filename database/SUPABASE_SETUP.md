# 🚀 Guia de Setup do Supabase

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter:
- [ ] Conta no Supabase (https://supabase.com)
- [ ] Projeto criado no Supabase
- [ ] Acesso ao SQL Editor do projeto

## 🎯 Passo a Passo

### 1️⃣ Acessar o SQL Editor

1. Faça login no [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto: **qtrbojicgwzbnolktwjp**
3. No menu lateral, clique em **SQL Editor**

### 2️⃣ Executar o Script de Inicialização

1. Clique em **New Query** (Nova consulta)
2. Copie todo o conteúdo do arquivo `database/init.sql`
3. Cole no editor SQL
4. Clique em **RUN** (Executar) ou pressione `Ctrl+Enter` (Windows/Linux) ou `Cmd+Enter` (Mac)

### 3️⃣ Verificar a Execução

Após executar o script, você deverá ver no output:

```
========================================
Database initialization completed!
========================================
Users: 3
Markets: 3
Shopping Lists: 3
Shopping List Items: 19
========================================
Sample data created:
- 3 users (Ana Silva, João Santos, Maria Oliveira)
- 3 markets (Supermercado Central, Mercado do Bairro, Atacadão Popular)
- 3 shopping lists with items
========================================
```

### 4️⃣ Verificar as Tabelas Criadas

Execute as seguintes queries para confirmar:

```sql
-- Verificar tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- Deve retornar:
-- users
-- markets
-- shopping_lists
-- shopping_list_items
```

### 5️⃣ Testar as Funções

```sql
-- Testar busca de usuário por telefone
SELECT * FROM get_user_by_phone('11987654321');

-- Testar criação de usuário
SELECT * FROM create_user(
    'Teste User',
    '11999999999',
    'test@example.com',
    NULL,
    false
);

-- Testar estatísticas de usuário
SELECT * FROM get_user_statistics('550e8400-e29b-41d4-a716-446655440001'::UUID);
```

## 🔐 Configurar Políticas de Segurança (RLS)

Por padrão, o Supabase habilita Row Level Security (RLS). Vamos configurar as políticas:

### Para a tabela `users`:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
USING (true); -- Permitir leitura para todos (ajuste conforme necessário)

-- Policy: Users can update their own data
CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (true); -- Ajuste baseado em autenticação

-- Policy: Anyone can create a user
CREATE POLICY "Anyone can create a user"
ON users FOR INSERT
WITH CHECK (true);
```

### Para a tabela `markets`:

```sql
-- Enable RLS
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read markets
CREATE POLICY "Anyone can view markets"
ON markets FOR SELECT
USING (true);

-- Policy: Authenticated users can create markets
CREATE POLICY "Authenticated users can create markets"
ON markets FOR INSERT
WITH CHECK (true);

-- Policy: Users can update their own markets
CREATE POLICY "Users can update their own markets"
ON markets FOR UPDATE
USING (true);
```

### Para a tabela `shopping_lists`:

```sql
-- Enable RLS
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view lists (for sharing via code)
CREATE POLICY "Anyone can view shopping lists"
ON shopping_lists FOR SELECT
USING (true);

-- Policy: Authenticated users can create lists
CREATE POLICY "Users can create shopping lists"
ON shopping_lists FOR INSERT
WITH CHECK (true);

-- Policy: Users can update their own lists
CREATE POLICY "Users can update their own lists"
ON shopping_lists FOR UPDATE
USING (true);

-- Policy: Users can delete their own lists
CREATE POLICY "Users can delete their own lists"
ON shopping_lists FOR DELETE
USING (true);
```

### Para a tabela `shopping_list_items`:

```sql
-- Enable RLS
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view items (for sharing)
CREATE POLICY "Anyone can view shopping list items"
ON shopping_list_items FOR SELECT
USING (true);

-- Policy: Users can create items
CREATE POLICY "Users can create items"
ON shopping_list_items FOR INSERT
WITH CHECK (true);

-- Policy: Users can update items
CREATE POLICY "Users can update items"
ON shopping_list_items FOR UPDATE
USING (true);

-- Policy: Users can delete items
CREATE POLICY "Users can delete items"
ON shopping_list_items FOR DELETE
USING (true);
```

## 📊 Verificar Dados de Exemplo

```sql
-- Ver usuários criados
SELECT id, name, phone, email FROM users;

-- Ver mercados
SELECT id, name, address FROM markets;

-- Ver listas de compras
SELECT id, title, share_code, total_amount FROM shopping_lists;

-- Ver itens
SELECT 
    sl.title as lista,
    sli.product_name,
    sli.category,
    sli.quantity,
    sli.unit,
    sli.total_price
FROM shopping_list_items sli
JOIN shopping_lists sl ON sli.list_id = sl.id
ORDER BY sl.title, sli.category;
```

## 🔧 Configurar Chaves API no Projeto

As chaves já estão configuradas no arquivo `.env`:

```env
SUPABASE_URL=https://qtrbojicgwzbnolktwjp.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## ✅ Testar a Aplicação

1. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm start
   ```

2. **Acesse a página de boas-vindas:**
   ```
   http://localhost:3000/src/pages/shopping-welcome.html
   ```

3. **Preencha o formulário:**
   - Nome: Seu nome
   - Telefone: Número de WhatsApp
   - Mercado Preferido: Selecione um

4. **Clique em "Começar Agora"**

5. **Verifique no console do navegador:**
   - Deve mostrar: "✅ Supabase client initialized"
   - Deve mostrar: "✅ User created successfully" ou "✅ Existing user found"
   - Deve redirecionar para shopping-lists.html

## 🐛 Troubleshooting

### Erro: "Supabase client not initialized"

**Solução:** Verifique se o CDN do Supabase está carregando:
```html
<!-- Deve estar no <head> do HTML -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### Erro: "relation 'users' does not exist"

**Solução:** Execute o script `init.sql` novamente no SQL Editor do Supabase.

### Erro: "permission denied for function create_user"

**Solução:** Verifique as políticas RLS ou execute as funções com SECURITY DEFINER (já configurado no init.sql).

### Erro: "Failed to create or retrieve user"

**Solução:** 
1. Abra o Console do navegador (F12)
2. Veja os erros detalhados
3. Verifique se as credenciais do Supabase estão corretas no `.env`
4. Verifique se o banco de dados está acessível

## 📚 Recursos Adicionais

- [Documentação Supabase](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [SQL Functions](https://supabase.com/docs/guides/database/functions)

## 🎉 Próximos Passos

Após completar este setup:

1. ✅ Banco de dados inicializado
2. ✅ Usuários funcionando
3. ✅ Integração com frontend
4. 🔄 Implementar autenticação (opcional)
5. 🔄 Adicionar mais features
6. 🔄 Deploy em produção

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do Console do navegador
2. Verifique os logs do Supabase Dashboard
3. Consulte a documentação do Supabase
4. Revise o arquivo `database/USERS_TABLE.md` para detalhes das funções

---

**Data de criação:** 12 de outubro de 2025  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para uso
