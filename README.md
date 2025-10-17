# Shopping Lists App

Uma aplicação moderna de listas de compras com design responsivo e tema escuro.

## 🎨 Design System

O projeto implementa um design system moderno com:

- **Dark Theme**: Tema escuro profissional
- **Glassmorphism**: Efeitos de vidro translúcido
- **Tipografia**: Font Inter para melhor legibilidade
- **Componentes**: Sistema de componentes reutilizáveis
- **Responsividade**: Design mobile-first
- **Animações**: Transições suaves e micro-interações

## 📁 Estrutura do Projeto

```
shopping-lists-app/
├── 📄 index.html              # Página principal de entrada
├── 📄 package.json            # Dependências e scripts
├── 📄 .env                    # Variáveis de ambiente
├── 📄 .gitignore             # Arquivos ignorados pelo Git
│
├── 📁 src/                    # Código fonte
│   ├── 📁 pages/             # Páginas HTML
│   │   ├── shopping-lists.html
│   │   ├── create-shopping-list.html
│   │   ├── view-shopping-list.html
│   │   └── shopping-welcome.html
│   │
│   ├── 📁 api/               # Funções de API
│   │   ├── add-shopping-list-item.js
│   │   ├── create-shopping-list.js
│   │   ├── get-shopping-list.js
│   │   ├── get-shopping-lists.js
│   │   ├── remove-shopping-list-item.js
│   │   └── update-shopping-list-item.js
│   │
│   ├── 📁 services/          # Lógica de negócio
│   │   └── shoppingListService.js
│   │
│   ├── 📁 controllers/       # Controladores
│   │   └── shoppingListController.js
│   │
│   ├── 📁 repositories/      # Acesso a dados
│   │   └── shoppingListRepository.js
│   │
│   └── 📁 utils/             # Utilitários (vazio no momento)
│
├── 📁 static/                # Arquivos estáticos
│   ├── 📁 css/              # Estilos
│   │   └── style.css        # Design system principal
│   │
│   ├── 📁 js/               # JavaScript do frontend
│   └── 📁 assets/           # Imagens, ícones, etc.
│
├── 📁 database/             # Scripts de banco de dados
│   ├── shopping_lists_schema.sql
│   ├── convert_shopping_lists_user_id_to_uuid.sql
│   ├── fix_get_shopping_list_by_code.sql
│   └── simple_shopping_lists_uuid_migration.sql
│
├── 📁 tests/                # Testes
│   ├── shoppingListFunctions.test.js
│   ├── shoppingListService.test.js
│   └── shoppingListService.integration.test.js
│
└── 📁 docs/                 # Documentação
    ├── create-shopping-list.js.html
    ├── get-shopping-list.js.html
    ├── remove-shopping-list-item.js.html
    ├── shoppingListController.js.html
    ├── shoppingListRepository.js.html
    ├── shoppingListService.js.html
    └── update-shopping-list-item.js.html
```

## 🚀 Como Executar

1. **Instalar dependências:**

   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente:**
   - Copie `.env.example` para `.env`
   - Configure as variáveis do Supabase

3. **Executar o projeto:**

   ```bash
   npm start
   ```

4. **Acessar a aplicação:**
   - Abra `index.html` no navegador
   - Ou acesse via servidor local

## 🎯 Funcionalidades

- ✅ **Criar Listas**: Interface moderna para criar listas de compras
- ✅ **Gerenciar Itens**: Adicionar, editar e remover itens das listas
- ✅ **Compartilhamento**: Compartilhar listas via código único
- ✅ **Usuários**: Sistema de perfis de usuário
- ✅ **Mercados**: Seleção de mercados para organização
- ✅ **Responsivo**: Interface adaptada para mobile e desktop

## 🛠️ Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Supabase (PostgreSQL)
- **Deploy**: Netlify
- **Testes**: Jest
- **Fonte**: Inter (Google Fonts)

## 📱 Design Responsivo

O projeto implementa design mobile-first com breakpoints:

- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

## 🎨 Variáveis CSS

O design system utiliza CSS Custom Properties para:

```css
:root {
  /* Cores principais */
  --primary-color: #6366f1;
  --background: #0a0a0a;
  --surface: #151515;

  /* Tipografia */
  --font-family: 'Inter', system-ui, sans-serif;
  --text-primary: #ffffff;
  --text-secondary: #a1a1aa;

  /* Espaçamentos */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
}
```

## 🧪 Testes

Execute os testes com:

```bash
npm test
```

## 🔄 CI/CD - GitHub Actions

O projeto está configurado com GitHub Actions para automação de build e deploy:

### Workflows Disponíveis

- **CI - Build and Test**: Executa build e testes em cada pull request e push
  - Testa em Node.js 18.x e 20.x
  - Verifica formatação do código
  - Executa testes automatizados

- **Deploy to Netlify**: Deploy automático para produção
  - Executa automaticamente em pushes para `main`
  - Deploy manual disponível via GitHub Actions
  - Inclui deploy das Netlify Functions

### Configuração dos Secrets

Para habilitar o deploy automático, configure os seguintes secrets no repositório:

- `NETLIFY_AUTH_TOKEN`: Token de autenticação do Netlify
- `NETLIFY_SITE_ID`: ID do site no Netlify

📚 Para mais detalhes, consulte [.github/WORKFLOWS.md](.github/WORKFLOWS.md)

## 📄 Documentação

A documentação técnica está disponível na pasta `docs/` com arquivos HTML detalhados para cada módulo.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
