# Quick Start - GitHub Actions

## 🚀 Para Começar

### 1. Configurar Secrets (OBRIGATÓRIO para Deploy)

Acesse: https://github.com/ebersonra/shopping-lists-app/settings/secrets/actions

Adicione dois secrets:

#### NETLIFY_AUTH_TOKEN
1. Vá para https://app.netlify.com
2. User Settings → Applications → Personal Access Tokens
3. Crie novo token e copie o valor

#### NETLIFY_SITE_ID
1. Vá para https://app.netlify.com
2. Selecione seu site
3. Site Settings → General → Site ID (ou API ID)
4. Copie o valor

### 2. Testar os Workflows

Após configurar os secrets:

1. Crie uma branch de teste
2. Faça uma pequena alteração
3. Abra um Pull Request
4. Veja o CI executar automaticamente
5. Merge para main
6. Veja o Deploy executar automaticamente

### 3. Deploy Manual (Opcional)

1. Vá para: https://github.com/ebersonra/shopping-lists-app/actions
2. Selecione "Deploy to Netlify"
3. Clique em "Run workflow"
4. Escolha a branch (main)
5. Clique em "Run workflow"

## 📊 Monitorar Workflows

- **Ver execuções**: https://github.com/ebersonra/shopping-lists-app/actions
- **Ver logs**: Clique em qualquer workflow run → Clique em um job
- **Status no PR**: Vá na aba "Checks" do Pull Request

## 🔧 Troubleshooting

### Se o CI falhar:
- ✅ Normal! Testes e formatação têm `continue-on-error`
- ⚠️ Verifique os logs para ver problemas reais
- 📝 Corrija os testes gradualmente

### Se o Deploy falhar:
- ❌ Verifique se os secrets estão configurados
- ❌ Verifique os valores dos secrets
- ❌ Veja os logs completos na aba Actions

## 📚 Documentação

- Guia completo: [WORKFLOWS.md](WORKFLOWS.md)
- README do projeto: [README.md](../README.md)

## ✨ Features

✅ CI automático em PRs
✅ Deploy automático para produção
✅ Testes em múltiplas versões do Node.js
✅ Deploy de Netlify Functions
✅ Comentários automáticos nos commits
✅ Deploy manual disponível

---

**Dúvidas?** Consulte [WORKFLOWS.md](WORKFLOWS.md) para mais detalhes.
