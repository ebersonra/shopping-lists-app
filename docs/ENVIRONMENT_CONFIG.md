# 🔐 Configuração de Ambiente - Guia Completo

## 📋 Visão Geral

Este projeto usa variáveis de ambiente para gerenciar configurações sensíveis como credenciais do Supabase. Isso garante:

✅ **Segurança** - Credenciais não ficam hardcoded no código
✅ **Flexibilidade** - Fácil trocar entre ambientes (dev/prod)
✅ **Manutenibilidade** - Mudanças de config sem alterar código
✅ **Boas práticas** - Seguindo padrão 12-factor app

---

## 🏗️ Arquitetura da Configuração

```
Environment Variables (Netlify/Vercel)
    ↓
npm run build (scripts/inject-env.js)
    ↓
src/utils/env.js (generated at build time)
    ↓
window.ENV (available in browser)
    ↓
config.js (reads window.ENV)
    ↓
window.APP_ENV (available to app)
    ↓
supabaseClient.js (uses window.APP_ENV)
    ↓
Outros módulos
```

---

## 📁 Arquivos de Configuração

### 1. `.env` (Git Ignored)
Contém as variáveis de ambiente reais. **NUNCA commitar este arquivo!**

```env
SUPABASE_URL=https://qtrbojicgwzbnolktwjp.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
```

### 2. `.env.example` (Commitado)
Template das variáveis necessárias. Commitar este arquivo.

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. `src/utils/env.js` (Gerado no Build)
Arquivo gerado automaticamente pelo build script. **NÃO commitar este arquivo!**

```javascript
window.ENV = {
    SUPABASE_URL: 'https://qtrbojicgwzbnolktwjp.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGci...',
    NODE_ENV: 'production'
};
```

### 4. `src/utils/config.js` (Commitado)
Carrega e valida as variáveis de ambiente.

```javascript
const ENV = {
    SUPABASE_URL: window.ENV?.SUPABASE_URL || 'default',
    SUPABASE_ANON_KEY: window.ENV?.SUPABASE_ANON_KEY || 'default'
};
```

---

## 🚀 Setup Inicial

### 1️⃣ Criar arquivo `.env` (para desenvolvimento local)

```bash
# Copiar o template
cp .env.example .env

# Editar com suas credenciais
nano .env  # ou use seu editor favorito
```

### 2️⃣ Preencher credenciais do Supabase

Acesse: https://app.supabase.com/project/qtrbojicgwzbnolktwjp/settings/api

```env
SUPABASE_URL=https://qtrbojicgwzbnolktwjp.supabase.co
SUPABASE_ANON_KEY=eyJhbGci... (copie da página de API Settings)
```

### 3️⃣ Executar o build

```bash
npm run build
```

Isso irá gerar o arquivo `src/utils/env.js` com suas credenciais.

### 4️⃣ Verificar `.gitignore`

Certifique-se que `.env` e `src/utils/env.js` estão ignorados:

```bash
# Verificar se estão no .gitignore
grep -E "\.env|env\.js" .gitignore

# Deve mostrar:
# .env
# src/utils/env.js
```

---

## 🔧 Como Funciona

### Desenvolvimento Local

**1. Definir variáveis de ambiente:**
```bash
# Opção 1: Criar .env e executar build
cp .env.example .env
# Editar .env com suas credenciais
npm run build

# Opção 2: Definir inline
SUPABASE_URL="https://qtrbojicgwzbnolktwjp.supabase.co" \
SUPABASE_ANON_KEY="your_key" \
npm run build
```

**2. HTML carrega env.js (gerado pelo build):**
```html
<script src="/src/utils/env.js"></script>
```

**3. env.js define window.ENV:**
**3. env.js define window.ENV:**
```javascript
window.ENV = {
    SUPABASE_URL: 'https://qtrbojicgwzbnolktwjp.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGci...',
    NODE_ENV: 'production'
};
```

**4. HTML carrega config.js:**
```html
<script src="/src/utils/config.js"></script>
```

**5. config.js define window.APP_ENV (lê de window.ENV):**
```javascript
window.APP_ENV = {
    SUPABASE_URL: window.ENV.SUPABASE_URL,
    SUPABASE_ANON_KEY: window.ENV.SUPABASE_ANON_KEY
};
```

**6. supabaseClient.js usa window.APP_ENV:**
```javascript
function getSupabaseConfig() {
    return {
        url: window.APP_ENV.SUPABASE_URL,
        anonKey: window.APP_ENV.SUPABASE_ANON_KEY
    };
}
```

---

## 🌍 Ambientes Diferentes

### Desenvolvimento (Local)

```env
NODE_ENV=development
SUPABASE_URL=https://qtrbojicgwzbnolktwjp.supabase.co
SUPABASE_ANON_KEY=your_dev_key
```

### Staging (Teste)

```env
NODE_ENV=staging
SUPABASE_URL=https://your-staging-project.supabase.co
SUPABASE_ANON_KEY=your_staging_key
```

### Produção

```env
NODE_ENV=production
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_ANON_KEY=your_prod_key
```

---

## 📦 Deploy em Produção

### Netlify

1. **Adicionar variáveis de ambiente:**
   ```
   Site settings → Environment variables → Add variable
   ```

2. **Configurar variáveis:**
   ```
   SUPABASE_URL = https://qtrbojicgwzbnolktwjp.supabase.co
   SUPABASE_ANON_KEY = eyJhbGci...
   ```

3. **Build command:**
   ```bash
   npm run build
   ```
   
   Isso irá executar `scripts/inject-env.js` que gera o arquivo `env.js` com as variáveis de ambiente do Netlify.

4. **Publish directory:**
   ```
   .
   ```

### Vercel

1. **Adicionar variáveis:**
   ```
   Project Settings → Environment Variables
   ```

2. **Configurar para diferentes ambientes:**
   - Production
   - Preview
   - Development

### GitHub Pages

Para GitHub Pages (que não suporta variáveis de ambiente backend), use `config.js` com valores default:

```javascript
const ENV = {
    SUPABASE_URL: 'https://qtrbojicgwzbnolktwjp.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGci...' // OK para anon key (é pública)
};
```

⚠️ **Nota:** A anon key do Supabase é segura para expor publicamente. Ela tem Row Level Security (RLS) que protege os dados.

---

## 🔒 Segurança

### ✅ O que é seguro expor:

- `SUPABASE_URL` - URL pública do projeto
- `SUPABASE_ANON_KEY` - Chave anônima com RLS
- `NODE_ENV` - Ambiente atual

### ❌ NUNCA expor:

- `SUPABASE_SERVICE_KEY` - Chave com acesso total
- Senhas ou tokens privados
- Chaves de API pagas

### Boas Práticas:

1. **Usar Row Level Security (RLS)** no Supabase
2. **Nunca commitar `.env`** no git
3. **Usar `.env.example`** para documentação
4. **Rotacionar chaves** periodicamente
5. **Monitorar acessos** no Supabase Dashboard

---

## 🧪 Testar Configuração

### 1. Verificar se config.js está carregando:

```javascript
// No console do navegador (F12)
console.log(window.APP_ENV);

// Deve mostrar:
// {
//   SUPABASE_URL: "https://qtrbojicgwzbnolktwjp.supabase.co",
//   SUPABASE_ANON_KEY: "eyJhbGci...",
//   NODE_ENV: "development"
// }
```

### 2. Verificar se Supabase está conectando:

```javascript
// No console do navegador
SupabaseUtils.initSupabase();

// Deve mostrar:
// ✅ Supabase client initialized
// URL: https://qtrbojicgwzbnolktwjp.supabase.co
// Key: ✓ Loaded from config
```

### 3. Testar criação de usuário:

```javascript
// No console do navegador
const user = await SupabaseUtils.createUser({
    name: 'Teste Config',
    phone: '11999999999'
});
console.log(user);
```

---

## 🐛 Troubleshooting

### Erro: "Supabase configuration not found"

**Causa:** `config.js` não foi carregado ou carregou depois de `supabaseClient.js`

**Solução:**
```html
<!-- Ordem correta no HTML -->
<script src="../utils/config.js"></script>  <!-- PRIMEIRO -->
<script src="../utils/supabaseClient.js"></script>  <!-- DEPOIS -->
```

### Erro: "window.APP_ENV is undefined"

**Causa:** `config.js` não executou corretamente

**Solução:**
1. Verifique se o arquivo está no caminho correto
2. Abra o console e procure por erros
3. Verifique se não há erros de sintaxe em `config.js`

### Erro: "Invalid API key"

**Causa:** Chave do Supabase incorreta ou expirada

**Solução:**
1. Acesse: https://app.supabase.com/project/qtrbojicgwzbnolktwjp/settings/api
2. Copie a chave novamente
3. Atualize no `.env`
4. Reinicie o servidor

---

## 📚 Referências

- [12-Factor App - Config](https://12factor.net/config)
- [Supabase - Environment Variables](https://supabase.com/docs/guides/api#api-url-and-keys)
- [Netlify - Environment Variables](https://docs.netlify.com/configure-builds/environment-variables/)
- [Vercel - Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## 🔄 Mudando para Novo Projeto Supabase

Se você criar um novo projeto Supabase:

1. **Criar novo projeto** no Supabase Dashboard
2. **Executar init.sql** no novo projeto
3. **Copiar novas credenciais:**
   ```
   Project Settings → API
   ```
4. **Atualizar `.env`:**
   ```env
   SUPABASE_URL=https://novo-projeto.supabase.co
   SUPABASE_ANON_KEY=nova_chave_aqui
   ```
5. **Testar** a nova conexão

---

## 📝 Checklist de Segurança

Antes de fazer commit:

- [ ] `.env` está no `.gitignore`
- [ ] `.env.example` está atualizado
- [ ] Não há credenciais hardcoded no código
- [ ] Chaves sensíveis não estão em nenhum commit
- [ ] RLS está habilitado no Supabase
- [ ] Variáveis de produção estão configuradas no host

---

## 🎯 Resumo

**Arquivos:**
- ✅ `.env` - Credenciais reais (NÃO commitar)
- ✅ `.env.example` - Template (commitar)
- ✅ `config.js` - Carregador (commitar)
- ✅ `supabaseClient.js` - Consumidor (commitar)

**Ordem de carregamento:**
1. `config.js` (define `window.APP_ENV`)
2. `supabaseClient.js` (usa `window.APP_ENV`)

**Em produção:**
- Netlify/Vercel: Usar Environment Variables
- GitHub Pages: Usar valores default em `config.js`

---

**Criado em:** 12 de outubro de 2025  
**Última atualização:** 12 de outubro de 2025  
**Versão:** 1.0.0
