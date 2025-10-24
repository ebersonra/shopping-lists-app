# 🚀 Guia Completo de Deploy - Shopping Lists App

## 📋 Visão Geral

Este projeto possui **dois ambientes de deploy** configurados com GitHub Actions:

1. **Staging (Desenvolvimento)** - Deploy automático da branch `main`
2. **Production (Produção)** - Deploy manual via releases/tags

---

## 🏗️ Arquitetura de Deploy

```
┌─────────────────────────────────────────────────────────────┐
│                        Git Flow                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Feature Branch                                              │
│       │                                                      │
│       │ Pull Request                                         │
│       ↓                                                      │
│    main branch ─────────────→ 🔨 CI Tests                   │
│       │                            │                         │
│       │                            ↓                         │
│       │                       ✅ Tests Pass                  │
│       │                                                      │
│       ├─→ Push to main ─────→ 🚀 Deploy to Staging         │
│       │                            │                         │
│       │                            ↓                         │
│       │                       📦 Netlify Staging             │
│       │                                                      │
│       │                                                      │
│       └─→ Create Release ────→ 🎯 Deploy to Production      │
│            (Tag: v1.0.0)           │                         │
│                                    ↓                         │
│                               🌍 Netlify Production          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Workflows Configurados

### 1. CI - Build and Test (`ci.yml`)

**Propósito:** Validar código em cada PR e push

**Executa em:**
- Pull requests para `main` e `develop`
- Pushes para `main` e `develop`

**Ações:**
- ✅ Build do projeto
- ✅ Verificação de formatação (Prettier)
- ✅ Testes automatizados
- ✅ Testa em Node.js 18.x e 20.x

---

### 2. Deploy to Staging (`deploy.yml`)

**Propósito:** Deploy automático para ambiente de staging/testes

**Executa em:**
- ✅ Push para branch `main`
- 🔘 Manual via "Run workflow"

**O que faz:**
1. Faz checkout do código
2. Instala Node.js 18.x
3. Instala dependências (`npm ci`)
4. Executa build com variáveis de ambiente
5. Deploy para Netlify (modo staging)
6. Adiciona comentários nos commits

**Configurações:**
- `production-deploy: false` (não sobrescreve produção)
- `timeout: 10 minutes` (aumentado do original 5min)
- Variáveis de ambiente injetadas no build
- Netlify Functions em `src/api`

**URL Gerado:**
- Preview URL: `https://deploy-preview-{pr-number}--{site-name}.netlify.app`
- Staging URL: `https://{branch}--{site-name}.netlify.app`

---

### 3. Deploy to Production (`deploy-production.yml`) ⭐ **NOVO**

**Propósito:** Deploy controlado para produção usando releases

**Executa em:**
- ✅ **Ao publicar uma release** no GitHub
- 🔘 **Manualmente** via "Run workflow" (pode especificar tag)

**O que faz:**
1. Faz checkout da tag de release
2. Instala Node.js 18.x
3. Instala dependências (`npm ci`)
4. Executa build com `NODE_ENV=production`
5. **Executa testes** (bloqueia se falhar)
6. Deploy para Netlify Production
7. Gera relatório detalhado de deploy

**Configurações:**
- `production-deploy: true` (sobrescreve produção)
- `timeout: 15 minutes` (mais tempo para produção)
- `continue-on-error: false` (testes devem passar)
- Variáveis de ambiente para build e Netlify Functions
- Deployment environment: `production`

**Segurança:**
- Testes **devem passar** antes do deploy
- Usa GitHub Environments para proteção
- Deploy message inclui tag e nome da release

---

## 🔐 Secrets Necessários

Configure os seguintes secrets no GitHub:

**Settings → Secrets and variables → Actions → New repository secret**

### Secrets do Netlify

#### `NETLIFY_AUTH_TOKEN`
- **Obter em:** https://app.netlify.com/user/applications
- **Caminho:** User settings → Applications → Personal access tokens → New access token
- **Exemplo:** `nfp_ABC123...XYZ789`

#### `NETLIFY_SITE_ID`
- **Obter em:** https://app.netlify.com
- **Caminho:** Seu site → Site settings → General → Site details → Site ID
- **Exemplo:** `abc12345-6789-def0-1234-56789abcdef0`

### Secrets do Supabase

#### `SUPABASE_URL`
- **Obter em:** https://app.supabase.com/project/SEU_PROJETO/settings/api
- **Localização:** Project URL
- **Exemplo:** `https://qtrbojicgwzbnolktwjp.supabase.co`
- **Usado em:** Build (frontend) e Netlify Functions

#### `SUPABASE_ANON_KEY`
- **Obter em:** https://app.supabase.com/project/SEU_PROJETO/settings/api
- **Localização:** Project API keys → anon public
- **Exemplo:** `eyJhbGci...` (JWT token)
- **Usado em:** Build (frontend) - **seguro para expor**
- **Nota:** Esta chave é pública e protegida por RLS

#### `SUPABASE_SERVICE_API_KEY`
- **Obter em:** https://app.supabase.com/project/SEU_PROJETO/settings/api
- **Localização:** Project API keys → service_role (clicar em "Reveal")
- **Exemplo:** `eyJhbGci...` (JWT token)
- **Usado em:** Netlify Functions (backend)
- **⚠️ IMPORTANTE:** Esta chave bypassa RLS - **NUNCA exponha no frontend!**

---

## 🎯 Como Fazer Deploy

### Deploy para Staging (Automático)

**Opção 1: Push direto para main**
```bash
git checkout main
git merge develop
git push origin main
```
O GitHub Actions automaticamente:
- Executa o build
- Faz deploy para staging
- Comenta no commit com URL

**Opção 2: Deploy manual**
1. Acesse: GitHub → Actions → "Deploy to Staging"
2. Clique em "Run workflow"
3. Selecione branch `main`
4. Clique em "Run workflow"

---

### Deploy para Production (Releases) 🎯

#### Passo 1: Criar uma Release

**Opção A: Via Interface do GitHub**

1. Acesse: https://github.com/ebersonra/shopping-lists-app/releases
2. Clique em **"Draft a new release"**
3. Clique em **"Choose a tag"**
4. Digite o nome da tag: `v1.0.0` (seguir SemVer)
5. Ou selecione uma tag existente
6. **Target:** selecione `main` (ou branch desejada)
7. **Release title:** Ex: "Version 1.0.0 - Initial Release"
8. **Describe this release:** Adicione changelog:
   ```markdown
   ## 🚀 Features
   - Implementado sistema de listas de compras
   - Adicionado suporte a múltiplos usuários
   - Interface responsiva com tema escuro
   
   ## 🐛 Bug Fixes
   - Corrigido erro ao deletar items
   - Melhorada performance das queries
   
   ## 📚 Documentation
   - Adicionado guia de deploy
   - Atualizado README
   ```
9. Marque **"Set as the latest release"**
10. Clique em **"Publish release"**

**Opção B: Via Git CLI**

```bash
# 1. Certifique-se que está na branch main atualizada
git checkout main
git pull origin main

# 2. Crie a tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# 3. Envie a tag para o GitHub
git push origin v1.0.0

# 4. Crie a release via GitHub CLI (opcional)
gh release create v1.0.0 \
  --title "Version 1.0.0 - Initial Release" \
  --notes "Release notes aqui" \
  --latest
```

#### Passo 2: Deploy Automático

Ao publicar a release, o GitHub Actions **automaticamente**:
1. ✅ Faz checkout do código da tag
2. ✅ Instala dependências
3. ✅ Executa build
4. ✅ **Roda testes** (se falhar, deploy é cancelado)
5. ✅ Faz deploy para Netlify Production
6. ✅ Gera relatório de deploy

**Monitorar Deploy:**
1. Acesse: GitHub → Actions → "Deploy to Production"
2. Veja o workflow em execução
3. Ao final, veja o summary com:
   - Deploy URL
   - Netlify logs URL
   - Status das variáveis de ambiente

#### Passo 3: Deploy Manual (se necessário)

Se precisar fazer deploy de uma tag específica:

1. Acesse: GitHub → Actions → "Deploy to Production"
2. Clique em "Run workflow"
3. Opcionalmente, digite a tag (ex: `v1.0.0`)
4. Deixe vazio para usar última release
5. Clique em "Run workflow"

---

## 📊 Versionamento Semântico (SemVer)

Use o formato: `vMAJOR.MINOR.PATCH`

### Exemplos:

- **v1.0.0** - Primeira release de produção
- **v1.1.0** - Nova funcionalidade (não quebra compatibilidade)
- **v1.1.1** - Bug fix (não quebra compatibilidade)
- **v2.0.0** - Breaking changes (quebra compatibilidade)

### Quando incrementar:

- **MAJOR (v2.0.0)**: Mudanças que quebram compatibilidade
  - Alteração na estrutura do banco de dados
  - Mudança em APIs públicas
  - Remoção de funcionalidades

- **MINOR (v1.1.0)**: Novas funcionalidades (backward compatible)
  - Nova página/feature
  - Novo endpoint de API
  - Melhorias de UX

- **PATCH (v1.0.1)**: Bug fixes e pequenas melhorias
  - Correção de bugs
  - Ajustes de estilo
  - Correções de typos

---

## 🔍 Verificação Pós-Deploy

### Checklist Pós-Deploy

Após deploy para **Production**, verifique:

#### 1. Acesso e Carregamento
- [ ] Site carrega sem erros
- [ ] CSS e JavaScript carregam corretamente
- [ ] Imagens e assets carregam

#### 2. Funcionalidades Críticas
- [ ] Login/criação de usuário funciona
- [ ] Criar nova lista funciona
- [ ] Adicionar items funciona
- [ ] Marcar items como comprado funciona
- [ ] Deletar items funciona
- [ ] Compartilhar lista via código funciona

#### 3. Console do Navegador
```javascript
// Abrir DevTools (F12) e verificar:
- Sem erros 4xx ou 5xx
- window.ENV está definido
- SUPABASE_URL e SUPABASE_ANON_KEY estão corretos
```

#### 4. Netlify Functions
- [ ] Funções Lambda estão respondendo
- [ ] Logs não mostram erros de credenciais
- [ ] Conexão com Supabase funciona

**Verificar em:**
https://app.netlify.com/sites/SEU_SITE/functions

#### 5. Monitoramento
- [ ] Verificar Netlify Analytics
- [ ] Verificar Supabase Dashboard → Logs
- [ ] Configurar alertas se disponível

---

## 🐛 Troubleshooting

### Problema: Deploy timeout após 5/10 minutos

**Sintomas:**
```
Error: The action 'Deploy to Netlify' has timed out after 5 minutes.
```

**Causas possíveis:**
1. Muitos arquivos sendo enviados
2. Netlify está lento/com problemas
3. Build process muito demorado
4. Problemas de rede

**Soluções:**

1. **Aumentar timeout** (já implementado):
   - Staging: 10 minutos
   - Production: 15 minutos

2. **Otimizar build:**
   ```bash
   # Adicionar ao .gitignore arquivos desnecessários
   node_modules/
   .env
   *.log
   tests/
   docs/
   ```

3. **Usar Netlify CLI para debug local:**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod --debug
   ```

4. **Verificar status do Netlify:**
   - https://www.netlifystatus.com/

5. **Cache de dependências:**
   - O workflow já usa `cache: 'npm'`
   - Limpar cache: Settings → Actions → Caches → Delete

---

### Problema: Erro "Supabase credentials are required"

**Sintomas:**
```
GET /.netlify/functions/get-shopping-lists 500 (Internal Server Error)
Error: Supabase credentials are required
```

**Causa:** Secrets não configurados no GitHub

**Solução:**

1. **Verificar se secrets existem:**
   ```
   Settings → Secrets and variables → Actions → Repository secrets
   ```
   
   Devem existir:
   - ✅ NETLIFY_AUTH_TOKEN
   - ✅ NETLIFY_SITE_ID
   - ✅ SUPABASE_URL
   - ✅ SUPABASE_ANON_KEY
   - ✅ SUPABASE_SERVICE_API_KEY

2. **Testar localmente:**
   ```bash
   # Criar .env
   cp .env.example .env
   # Preencher com valores reais
   nano .env
   
   # Testar build
   npm run build
   
   # Testar Netlify Functions localmente
   netlify dev
   ```

3. **Verificar logs do deploy:**
   - GitHub Actions → Deploy workflow → View logs
   - Netlify → Site → Deploys → Deploy log

---

### Problema: Tests estão falhando no deploy de produção

**Sintomas:**
```
Error: Tests failed
npm test exited with code 1
```

**Causa:** Testes não passam, bloqueando deploy

**Solução:**

1. **Rodar testes localmente:**
   ```bash
   npm test
   ```

2. **Verificar logs de teste no GitHub Actions**

3. **Opções:**
   
   **Opção A:** Corrigir os testes (recomendado)
   
   **Opção B:** Temporariamente permitir falhas (não recomendado):
   ```yaml
   # Em deploy-production.yml
   - name: Run tests
     run: npm test
     continue-on-error: true  # ⚠️ Permitir falhas
   ```

---

### Problema: Deploy bem-sucedido mas site não funciona

**Verificar:**

1. **Console do navegador (F12):**
   - Procurar erros JavaScript
   - Verificar se assets carregam (Network tab)

2. **Netlify Functions logs:**
   ```
   Netlify Dashboard → Functions → Ver logs
   ```

3. **Supabase Dashboard:**
   ```
   https://app.supabase.com → Seu projeto → Logs
   ```

4. **Verificar variáveis de ambiente:**
   ```
   Netlify → Site settings → Environment variables
   ```
   
   Devem estar configuradas:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_API_KEY

---

## 📚 Referências

### Documentação Oficial

- **GitHub Actions:** https://docs.github.com/en/actions
- **GitHub Releases:** https://docs.github.com/en/repositories/releasing-projects-on-github
- **Netlify Deploy:** https://docs.netlify.com/site-deploys/overview/
- **Netlify Functions:** https://docs.netlify.com/functions/overview/
- **Supabase Auth:** https://supabase.com/docs/guides/auth
- **Semantic Versioning:** https://semver.org/

### Actions Utilizadas

- **actions/checkout@v4:** https://github.com/actions/checkout
- **actions/setup-node@v4:** https://github.com/actions/setup-node
- **nwtgck/actions-netlify@v3.0:** https://github.com/nwtgck/actions-netlify

### Documentação do Projeto

- [WORKFLOWS.md](.github/WORKFLOWS.md) - Visão geral dos workflows
- [ENVIRONMENT_CONFIG.md](../docs/ENVIRONMENT_CONFIG.md) - Configuração de ambiente
- [NETLIFY_FUNCTIONS_ENV_SETUP.md](../docs/NETLIFY_FUNCTIONS_ENV_SETUP.md) - Setup Netlify Functions
- [README.md](../README.md) - Documentação geral

---

## 🎓 Exemplos de Uso

### Exemplo 1: Deploy de uma nova feature

```bash
# 1. Desenvolver feature
git checkout -b feature/nova-funcionalidade
# ... fazer mudanças ...
git add .
git commit -m "feat: adicionar nova funcionalidade"
git push origin feature/nova-funcionalidade

# 2. Criar PR
gh pr create --title "Nova funcionalidade" --body "Descrição"

# 3. CI roda automaticamente e valida

# 4. Após aprovação, fazer merge
gh pr merge --merge

# 5. Deploy automático para staging acontece

# 6. Testar em staging

# 7. Criar release para produção
git tag -a v1.1.0 -m "Release v1.1.0 - Nova funcionalidade"
git push origin v1.1.0
gh release create v1.1.0 --title "v1.1.0" --notes "Nova funcionalidade adicionada"

# 8. Deploy automático para produção acontece
```

### Exemplo 2: Hotfix em produção

```bash
# 1. Criar branch de hotfix
git checkout main
git pull
git checkout -b hotfix/bug-critico

# 2. Corrigir bug
# ... fazer correções ...
git add .
git commit -m "fix: corrigir bug crítico"
git push origin hotfix/bug-critico

# 3. PR direto para main
gh pr create --base main --title "Hotfix: Bug crítico"

# 4. Após merge, criar release de patch
git tag -a v1.0.1 -m "Hotfix v1.0.1"
git push origin v1.0.1
gh release create v1.0.1 --title "v1.0.1 - Hotfix" --notes "Correção de bug crítico"

# 5. Deploy automático para produção
```

---

## ✅ Checklist de Configuração Inicial

Antes do primeiro deploy:

### GitHub
- [ ] Repositório configurado
- [ ] Branch `main` protegida (Settings → Branches)
- [ ] Secrets configurados (5 secrets necessários)
- [ ] GitHub Environments criados (staging e production)

### Netlify
- [ ] Site criado no Netlify
- [ ] Site conectado ao repositório GitHub
- [ ] Variáveis de ambiente configuradas
- [ ] Custom domain configurado (opcional)

### Supabase
- [ ] Projeto criado
- [ ] Tabelas criadas (rodar `database/init.sql`)
- [ ] RLS habilitado e configurado
- [ ] Ambas as keys copiadas (anon e service_role)

### Testes
- [ ] Testes rodando localmente: `npm test`
- [ ] Build funciona: `npm run build`
- [ ] Netlify Dev funciona: `netlify dev`

### Deploy
- [ ] Workflow CI passou
- [ ] Deploy staging funcionou
- [ ] Site staging testado e validado
- [ ] Primeira release criada
- [ ] Deploy production bem-sucedido
- [ ] Site production testado e validado

---

**Criado em:** 24 de outubro de 2025  
**Versão:** 1.0.0  
**Mantido por:** Shopping Lists Team
