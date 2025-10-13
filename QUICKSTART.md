# 🚀 Quick Start - Supabase + Usuários

## ⚡ Setup Rápido (5 minutos)

### 1️⃣ Executar SQL no Supabase

1. Acesse: https://app.supabase.com/project/qtrbojicgwzbnolktwjp
2. Clique em **SQL Editor** (menu lateral)
3. Clique em **New Query**
4. Copie todo o conteúdo de `database/init.sql`
5. Cole no editor
6. Clique em **RUN** ou pressione `Ctrl+Enter`
7. ✅ Deve ver: "Database initialization completed!"

### 2️⃣ Configurar RLS (Segurança)

No mesmo SQL Editor, execute:

```sql
-- Enable RLS for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Allow public read (for sharing feature)
CREATE POLICY "Public read access" ON users FOR SELECT USING (true);
CREATE POLICY "Public read access" ON markets FOR SELECT USING (true);
CREATE POLICY "Public read access" ON shopping_lists FOR SELECT USING (true);
CREATE POLICY "Public read access" ON shopping_list_items FOR SELECT USING (true);

-- Allow public write (adjust based on auth needs)
CREATE POLICY "Public write access" ON users FOR ALL USING (true);
CREATE POLICY "Public write access" ON markets FOR ALL USING (true);
CREATE POLICY "Public write access" ON shopping_lists FOR ALL USING (true);
CREATE POLICY "Public write access" ON shopping_list_items FOR ALL USING (true);
```

### 3️⃣ Iniciar a Aplicação

```bash
npm start
```

### 4️⃣ Testar

1. Abra: http://localhost:3000/src/pages/shopping-welcome.html
2. Preencha o formulário
3. Clique em "Começar Agora"
4. ✅ Deve criar usuário e redirecionar

---

## 🔍 Verificar se Funcionou

### No Console do Navegador (F12):

Você deve ver:
```
🚀 Initializing Supabase...
✅ Supabase client initialized
📝 Processing user data...
✅ User created successfully: {id: "...", name: "..."}
🏪 Processing preferred market: carrefour
✅ Market created successfully: ...
✅ User updated with preferred market
💾 User data saved to localStorage
```

### No Supabase Dashboard:

1. Vá em **Table Editor**
2. Abra tabela `users`
3. ✅ Deve ter seu usuário criado

---

## 📝 Uso em Outras Páginas

### Adicionar no HTML:

```html
<!DOCTYPE html>
<html>
<head>
    <!-- Supabase CDN -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
    <!-- Seu conteúdo -->
    
    <!-- Utilitários -->
    <script src="../utils/supabaseClient.js"></script>
    <script>
        // Inicializar
        SupabaseUtils.initSupabase();
        
        // Usar funções
        async function loadUser() {
            const user = await SupabaseUtils.getUserByPhone('11987654321');
            console.log(user);
        }
    </script>
</body>
</html>
```

### Funções Disponíveis:

```javascript
// Buscar usuário por telefone
const user = await SupabaseUtils.getUserByPhone('11987654321');

// Buscar por ID
const user = await SupabaseUtils.getUserById(userId);

// Criar usuário
const user = await SupabaseUtils.createUser({
    name: 'João Silva',
    phone: '11987654321'
});

// Buscar ou criar
const user = await SupabaseUtils.getOrCreateUser({
    name: 'João Silva',
    phone: '11987654321'
});

// Atualizar
const updated = await SupabaseUtils.updateUser(userId, {
    name: 'Novo Nome'
});

// Estatísticas
const stats = await SupabaseUtils.getUserStatistics(userId);
```

---

## 🎯 Checklist de Verificação

- [ ] `init.sql` executado no Supabase
- [ ] RLS policies configuradas
- [ ] Tabelas criadas (users, markets, shopping_lists, shopping_list_items)
- [ ] Aplicação iniciada (`npm start`)
- [ ] Onboarding testado (criar usuário)
- [ ] Console sem erros
- [ ] Usuário aparece no Supabase Table Editor

---

## 🆘 Problemas Comuns

### ❌ "Supabase is not defined"
**Solução:** Adicione o CDN no HTML:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### ❌ "relation 'users' does not exist"
**Solução:** Execute `database/init.sql` no Supabase

### ❌ "permission denied"
**Solução:** Configure as policies RLS (passo 2)

### ❌ "Failed to create user"
**Solução:** Verifique o console do navegador para o erro específico

---

## 📚 Documentação Completa

- `database/SUPABASE_SETUP.md` - Setup detalhado
- `database/USERS_TABLE.md` - Documentação da tabela users
- `database/CHANGES.md` - Resumo de todas as alterações
- `src/utils/userExamples.js` - Exemplos de código

---

## 🎉 Pronto!

Sua aplicação agora está integrada com Supabase e gerenciando usuários de forma profissional!

**Próximos passos sugeridos:**
1. Atualizar `shopping-lists.html` para usar user_id
2. Adicionar página de perfil do usuário
3. Implementar autenticação real (opcional)
4. Deploy em produção

---

**Data:** 12 de outubro de 2025  
**Status:** ✅ Pronto para usar
