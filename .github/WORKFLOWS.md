# GitHub Actions - CI/CD Configuration

Este documento descreve os workflows do GitHub Actions configurados para o Shopping Lists App.

## 📋 Workflows Disponíveis

### 1. CI - Build and Test (`ci.yml`)

**Objetivo:** Validar o código através de build e testes em cada pull request e push.

**Quando executa:**

- Em pull requests para as branches `main` e `develop`
- Em pushes para as branches `main` e `develop`

**O que faz:**

- ✅ Executa build do projeto
- ✅ Verifica formatação do código com Prettier
- ✅ Executa testes automatizados
- ✅ Testa em múltiplas versões do Node.js (18.x e 20.x)

**Etapas:**

1. Faz checkout do código
2. Configura Node.js (versões 18.x e 20.x)
3. Instala dependências com `npm ci`
4. Executa o build (`npm run build`)
5. Verifica formatação (`npm run format:check`) - não bloqueia em caso de erro
6. Executa testes (`npm test`) - não bloqueia em caso de erro

### 2. Deploy to Staging (`deploy.yml`)

**Objetivo:** Fazer deploy automático da aplicação para o ambiente de staging/testes no Netlify.

**Quando executa:**

- Automaticamente em pushes para a branch `main`
- Manualmente através do botão "Run workflow" no GitHub Actions

**O que faz:**

- 🚀 Faz build do projeto com variáveis de ambiente
- 🌐 Deploy para **staging** no Netlify (não produção)
- 💬 Adiciona comentários no commit e PRs com URL do deploy
- ⚡ Deploy das Netlify Functions (src/api)

**Configurações:**

- `production-deploy: false` - Não sobrescreve produção
- `timeout-minutes: 10` - Aumentado para evitar timeouts
- Variáveis de ambiente injetadas no build e Functions

**Etapas:**

1. Faz checkout do código
2. Configura Node.js 18.x
3. Instala dependências com `npm ci`
4. Executa o build com variáveis de ambiente (`npm run build`)
5. Faz deploy para staging no Netlify usando a action `nwtgck/actions-netlify`

### 3. Deploy to Production (`deploy-production.yml`) ⭐ **NOVO**

**Objetivo:** Fazer deploy controlado para produção usando releases/tags.

**Quando executa:**

- ✅ **Automaticamente** quando uma release é publicada no GitHub
- 🔘 **Manualmente** através do botão "Run workflow" (pode especificar tag)

**O que faz:**

- 🏷️ Faz checkout da tag de release específica
- 🚀 Faz build do projeto para produção
- ✅ **Executa testes** (bloqueia deploy se falhar)
- 🌍 Deploy para **produção** no Netlify
- 📊 Gera relatório detalhado de deploy

**Configurações:**

- `production-deploy: true` - Deploy de produção real
- `timeout-minutes: 15` - Mais tempo para garantir sucesso
- `continue-on-error: false` - Testes devem passar
- Deployment environment: `production`

**Etapas:**

1. Faz checkout do código da tag/release
2. Obtém informações da release (tag, nome)
3. Configura Node.js 18.x
4. Instala dependências com `npm ci`
5. Executa o build com `NODE_ENV=production`
6. **Executa testes** (bloqueia se falhar)
7. Faz deploy para produção no Netlify
8. Gera relatório de sucesso ou falha

## 🔐 Secrets Necessários

Para que os workflows funcionem corretamente, você precisa configurar os seguintes secrets no GitHub:

### Como adicionar secrets:

1. Acesse o repositório no GitHub
2. Vá em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Adicione os seguintes secrets:

#### `NETLIFY_AUTH_TOKEN`

- **O que é:** Token de autenticação do Netlify
- **Como obter:**
  1. Acesse https://app.netlify.com
  2. Vá em **User settings** → **Applications**
  3. Em **Personal access tokens**, clique em **New access token**
  4. Dê um nome (ex: "GitHub Actions") e copie o token gerado

#### `NETLIFY_SITE_ID`

- **O que é:** ID único do seu site no Netlify
- **Como obter:**
  1. Acesse https://app.netlify.com
  2. Selecione seu site
  3. Vá em **Site settings** → **General**
  4. Copie o valor de **Site ID** (também chamado de **API ID**)

#### `SUPABASE_URL`

- **O que é:** URL do projeto Supabase
- **Como obter:**
  1. Acesse https://app.supabase.com
  2. Selecione seu projeto
  3. Vá em **Settings** → **API**
  4. Copie o valor de **Project URL**
- **Exemplo:** `https://qtrbojicgwzbnolktwjp.supabase.co`
- **Usado em:** Build (frontend) e Netlify Functions (backend)

#### `SUPABASE_ANON_KEY`

- **O que é:** Chave pública anônima do Supabase
- **Como obter:**
  1. Acesse https://app.supabase.com
  2. Selecione seu projeto
  3. Vá em **Settings** → **API**
  4. Copie o valor de **Project API keys** → **anon public**
- **Exemplo:** `eyJhbGci...` (JWT token longo)
- **Usado em:** Build (frontend) - **É seguro expor esta chave**
- **Nota:** Esta chave é pública e protegida por Row Level Security (RLS)

#### `SUPABASE_SERVICE_API_KEY`

- **O que é:** Chave de serviço (service role) do Supabase
- **Como obter:**
  1. Acesse https://app.supabase.com
  2. Selecione seu projeto
  3. Vá em **Settings** → **API**
  4. Em **Project API keys** → **service_role**, clique em **"Reveal"**
  5. Copie o valor (JWT token)
- **Exemplo:** `eyJhbGci...` (JWT token longo, diferente do anon)
- **Usado em:** Netlify Functions (backend/serverless)
- **⚠️ IMPORTANTE:** Esta chave bypassa Row Level Security (RLS) e tem acesso total ao banco
- **⚠️ NUNCA** exponha esta chave no código frontend ou commits

### Resumo dos Secrets

| Secret                     | Onde obter            | Usado em            | Segurança            |
| -------------------------- | --------------------- | ------------------- | -------------------- |
| `NETLIFY_AUTH_TOKEN`       | Netlify User Settings | Deploy              | 🔒 Privado           |
| `NETLIFY_SITE_ID`          | Netlify Site Settings | Deploy              | 🔒 Privado           |
| `SUPABASE_URL`             | Supabase API Settings | Build + Functions   | ✅ Público           |
| `SUPABASE_ANON_KEY`        | Supabase API Settings | Build (frontend)    | ✅ Público (com RLS) |
| `SUPABASE_SERVICE_API_KEY` | Supabase API Settings | Functions (backend) | 🔒 Muito Privado     |

## 🎯 Como Usar

### Para Desenvolvedores

1. **Ao criar um Pull Request:**
   - O workflow CI será executado automaticamente
   - Verifique os resultados na aba "Checks" do PR
   - Corrija eventuais erros antes de fazer merge

2. **Ao fazer merge para main:**
   - O workflow de deploy **staging** será executado automaticamente
   - A aplicação será atualizada no Netlify (ambiente de staging)
   - Um comentário com o URL do deploy será adicionado ao commit
   - **NÃO afeta produção**

3. **Para fazer deploy manual para staging:**
   - Vá em **Actions** no GitHub
   - Selecione "Deploy to Staging"
   - Clique em **Run workflow**
   - Escolha a branch e clique em **Run workflow**

4. **Para fazer deploy para produção:**

   **Opção A: Criar Release via GitHub (Recomendado)**
   1. Vá em **Releases** no GitHub
   2. Clique em **"Draft a new release"**
   3. Clique em **"Choose a tag"** e crie uma nova tag (ex: `v1.0.0`)
   4. Preencha título e descrição
   5. Clique em **"Publish release"**
   6. O deploy para produção inicia automaticamente

   **Opção B: Criar Tag via Git CLI**

   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   # Depois criar release no GitHub ou via gh CLI
   gh release create v1.0.0 --title "v1.0.0" --notes "Release notes"
   ```

   **Opção C: Deploy Manual de Produção**
   1. Vá em **Actions** → "Deploy to Production"
   2. Clique em **Run workflow**
   3. Opcionalmente especifique uma tag (ex: `v1.0.0`)
   4. Clique em **Run workflow**

### Para Administradores

1. **Configurar secrets:** Siga as instruções na seção "Secrets Necessários"
2. **Criar GitHub Environments (Opcional mas recomendado):**
   - Settings → Environments → New environment
   - Criar: `staging` e `production`
   - Adicionar proteções para `production` (ex: required reviewers)
3. **Monitorar workflows:** Acesse a aba **Actions** para ver o histórico de execuções
4. **Ajustar configurações:** Edite os arquivos `.github/workflows/*.yml` conforme necessário

## 🛠️ Estrutura dos Arquivos

```
.github/
├── workflows/
│   ├── ci.yml                    # CI: Build e testes
│   ├── deploy.yml                # Deploy para Staging (main branch)
│   └── deploy-production.yml     # Deploy para Production (releases/tags)
├── WORKFLOWS.md                  # Este arquivo (visão geral)
└── DEPLOYMENT_GUIDE.md           # Guia completo de deploy (NOVO)
```

## 📊 Status dos Workflows

Você pode adicionar badges no README.md para mostrar o status dos workflows:

```markdown
![CI](https://github.com/ebersonra/shopping-lists-app/workflows/CI%20-%20Build%20and%20Test/badge.svg)
![Staging](https://github.com/ebersonra/shopping-lists-app/workflows/Deploy%20to%20Staging/badge.svg)
![Production](https://github.com/ebersonra/shopping-lists-app/workflows/Deploy%20to%20Production/badge.svg)
```

## 🔧 Customização

### Alterar versões do Node.js testadas

Edite o arquivo `.github/workflows/ci.yml`:

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x, 21.x] # Adicione ou remova versões
```

### Adicionar mais branches para deploy

Edite o arquivo `.github/workflows/deploy.yml`:

```yaml
on:
  push:
    branches: [main, staging] # Adicione mais branches
```

### Configurar deploy para diferentes ambientes

Você pode criar workflows separados para staging e produção, ou adicionar lógica condicional baseada na branch.

## 📚 Recursos Adicionais

- [Documentação do GitHub Actions](https://docs.github.com/en/actions)
- [Documentação do Netlify](https://docs.netlify.com/)
- [Action nwtgck/actions-netlify](https://github.com/nwtgck/actions-netlify)

## ⚠️ Notas Importantes

1. **Testes não bloqueantes no CI:** Os testes e formatação no workflow CI estão configurados com `continue-on-error: true` para não bloquear o workflow enquanto os testes estão sendo corrigidos. Remova essa opção quando os testes estiverem estáveis.

2. **Testes bloqueantes em produção:** No workflow de produção (`deploy-production.yml`), os testes **devem passar** antes do deploy. Isso garante qualidade em produção.

3. **Cache do npm:** Os workflows usam cache do npm para acelerar a instalação de dependências.

4. **Timeouts aumentados:**
   - CI: padrão (sem timeout específico)
   - Staging: 10 minutos (era 5)
   - Production: 15 minutos
   - Isso resolve o erro de timeout que estava ocorrendo

5. **Staging vs Production:**
   - **Staging:** Deploy automático do `main`, ideal para testes
   - **Production:** Deploy via releases/tags, controlado e versionado

6. **Netlify Functions:** O diretório `src/api` é configurado como functions-dir para deploy das Netlify Functions em todos os ambientes.

7. **Variáveis de ambiente:** São injetadas tanto no build (frontend) quanto nas Functions (backend).

## 🐛 Troubleshooting

### Erro: Deploy timeout

**Problema resolvido:** O timeout foi aumentado de 5 para 10 minutos (staging) e 15 minutos (produção).

Se ainda ocorrer timeout:

1. Verifique o tamanho dos arquivos sendo enviados
2. Considere usar `.gitignore` para excluir arquivos desnecessários
3. Verifique o status do Netlify: https://www.netlifystatus.com/

### Erro: Secrets não configurados

Verifique se todos os 5 secrets estão configurados:

- Settings → Secrets and variables → Actions → Repository secrets

### Erro: Tests failing em produção

O deploy de produção **bloqueia** se os testes falharem. Isso é intencional para garantir qualidade.

Para corrigir:

1. Rode `npm test` localmente
2. Corrija os testes que falharam
3. Faça commit das correções
4. Crie uma nova release

## 📚 Documentação Adicional

Para um guia mais detalhado sobre deploy, releases e troubleshooting, consulte:

👉 **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Guia completo de deploy com exemplos práticos
