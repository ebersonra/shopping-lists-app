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

### 2. Deploy to Netlify (`deploy.yml`)

**Objetivo:** Fazer deploy automático da aplicação para o Netlify.

**Quando executa:**

- Automaticamente em pushes para a branch `main`
- Manualmente através do botão "Run workflow" no GitHub Actions

**O que faz:**

- 🚀 Faz build do projeto
- 🌐 Deploy para produção no Netlify
- 💬 Adiciona comentários no commit e PRs com URL do deploy
- ⚡ Deploy das Netlify Functions (src/api)

**Etapas:**

1. Faz checkout do código
2. Configura Node.js 18.x
3. Instala dependências com `npm ci`
4. Executa o build (`npm run build`)
5. Faz deploy para o Netlify usando a action `nwtgck/actions-netlify`

## 🔐 Secrets Necessários

Para que o workflow de deploy funcione corretamente, você precisa configurar os seguintes secrets no GitHub:

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

## 🎯 Como Usar

### Para Desenvolvedores

1. **Ao criar um Pull Request:**
   - O workflow CI será executado automaticamente
   - Verifique os resultados na aba "Checks" do PR
   - Corrija eventuais erros antes de fazer merge

2. **Ao fazer merge para main:**
   - O workflow de deploy será executado automaticamente
   - A aplicação será atualizada no Netlify
   - Um comentário com o URL do deploy será adicionado ao commit

3. **Para fazer deploy manual:**
   - Vá em **Actions** no GitHub
   - Selecione "Deploy to Netlify"
   - Clique em **Run workflow**
   - Escolha a branch e clique em **Run workflow**

### Para Administradores

1. **Configurar secrets:** Siga as instruções na seção "Secrets Necessários"
2. **Monitorar workflows:** Acesse a aba **Actions** para ver o histórico de execuções
3. **Ajustar configurações:** Edite os arquivos `.github/workflows/*.yml` conforme necessário

## 🛠️ Estrutura dos Arquivos

```
.github/
└── workflows/
    ├── ci.yml          # Workflow de CI (build e testes)
    └── deploy.yml      # Workflow de deploy para Netlify
```

## 📊 Status dos Workflows

Você pode adicionar badges no README.md para mostrar o status dos workflows:

```markdown
![CI](https://github.com/ebersonra/shopping-lists-app/workflows/CI%20-%20Build%20and%20Test/badge.svg)
![Deploy](https://github.com/ebersonra/shopping-lists-app/workflows/Deploy%20to%20Netlify/badge.svg)
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

1. **Testes não bloqueantes:** Os testes e formatação estão configurados com `continue-on-error: true` para não bloquear o workflow enquanto os testes estão sendo corrigidos. Remova essa opção quando os testes estiverem estáveis.

2. **Cache do npm:** Os workflows usam cache do npm para acelerar a instalação de dependências.

3. **Timeout:** O deploy tem um timeout de 5 minutos. Ajuste se necessário.

4. **Netlify Functions:** O diretório `src/api` é configurado como functions-dir para deploy das Netlify Functions.
