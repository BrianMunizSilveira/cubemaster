# CubeMaster v2.0 🎲

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.2.0-green.svg)](https://github.com/BrianMunizSilveira/cubemaster)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

> **Painel de análise avançada para speedcubers** - Acompanhe sua evolução, analise estatísticas detalhadas e atinja novos recordes pessoais.

![CubeMaster Dashboard](https://i.imgur.com/UnIH6wH.png)

---

## 📋 Índice

- [Sobre](#-sobre)
- [Funcionalidades](#-funcionalidades)
- [Instalação](#-instalação)
- [Uso](#-uso)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Tecnologias](#-tecnologias)
- [Contribuindo](#-contribuindo)
- [Roadmap](#-roadmap)
- [Licença](#-licença)
- [Autor](#-autor)

---

## 🎯 Sobre

**CubeMaster** é uma aplicação web moderna e responsiva desenvolvida para speedcubers que desejam acompanhar sua evolução de forma profissional. Com análises estatísticas avançadas, gráficos interativos e suporte a grandes volumes de dados, o CubeMaster é a ferramenta perfeita para quem leva o cubing a sério.

### Por que CubeMaster?

- ✅ **100% Gratuito e Open Source**
- ✅ **Sem necessidade de cadastro ou login**
- ✅ **Funciona offline** (após carregamento inicial)
- ✅ **Análises estatísticas avançadas**
- ✅ **Importação direta do csTimer**
- ✅ **Modo escuro automático**
- ✅ **Totalmente responsivo**

---

## ✨ Funcionalidades

### 📊 Dashboard Inteligente
- **Cards de Métricas**: PB, Ao5, Ao12, consistência e total de solves
- **Análise Evolutiva**: Comparação de períodos (7 dias, 30 dias, geral)
- **Métricas Avançadas**: Nível estimado, probabilidade de PB, melhor horário
- **Metas Semanais**: Progresso visual de objetivos

### 📈 Gráficos Interativos
- **Evolução Temporal**: Últimos 30 solves com média móvel
- **Distribuição de Tempos**: Histograma dinâmico com meta customizável
- **Performance por Horário**: Identifique seu pico de produtividade
- **Método e Volume**: Compare estratégias e acompanhe sessões

### 📝 Gestão de Tempos
- **Histórico Completo**: Visualize todos os seus solves com filtros
- **Paginação Inteligente**: 100, 250, 500, 1000 ou todos os registros
- **Adicionar/Editar/Excluir**: Gestão manual de tempos
- **Badges Visuais**: PB, DNF, +2 e classificação de performance

### 🔄 Importação e Exportação
- **Importação csTimer**: Suporte completo ao formato `.txt`
- **Exportação CSV**: Dados estruturados para análise externa
- **Reset Seguro**: Confirmação em duas etapas com opção de reimportação

### ⚙️ Configurações
- **Cartões Compactos**: Otimize espaço vertical
- **Animações**: Controle transições em gráficos
- **Modo Escuro**: Ativação automática baseada no sistema

---

## 🚀 Instalação

### Opção 1: Uso Direto (Simples)

```bash
# Clone o repositório
git clone https://github.com/briansilveira/cubemaster.git
cd cubemaster

# Abra index.html no navegador
# Duplo clique no arquivo OU
start index.html  # Windows
open index.html   # macOS
xdg-open index.html  # Linux
```

> ⚠️ **Nota**: Reimportação do `meus-tempos.txt` após reset requer servidor HTTP.

### Opção 2: Servidor Local (Recomendado)

#### Python
```bash
# Python 3.x
python -m http.server 8000
# Acesse: http://localhost:8000
```

#### Node.js
```bash
# Com npx (sem instalação)
npx serve -s .

# Com http-server global
npm install -g http-server
http-server -p 8000
```

#### PHP
```bash
php -S localhost:8000
```

#### Live Server (VS Code)
1. Instale a extensão **Live Server**
2. Clique direito em `index.html`
3. Selecione "Open with Live Server"

---

## 📖 Uso

### Importar Tempos do csTimer

1. **Exporte do csTimer**:
   - Abra o csTimer
   - Menu → Export/Import
   - Copie ou salve como `.txt`

2. **Importe no CubeMaster**:
   - Navegue até **Histórico**
   - Clique em **Importar Tempos**
   - Selecione seu arquivo `.txt`

**Formato Esperado**:
```
Gerado pelo csTimer em 2024-12-15
solves/total: 233/238

Lista de Tempos:
1. 22.95   [scramble]
2. DNF(27.58)   [scramble]
3. 20.57+   [scramble]
```

### Adicionar Tempo Manual

```javascript
// Via Interface
Histórico → Adicionar Tempo → Preencher formulário

// Campos
- Tempo (segundos): 22.35
- Método: CFOP / Roux / ZZ
- Cubo: 3x3 / 2x2 / 4x4
- Penalidades: +2 / DNF
```

### Resetar Dados

```bash
# Via Interface
Histórico → Resetar Tempos → Confirmar

# Via Console do Navegador (F12)
localStorage.clear();
location.reload();
```

### Exportar para Excel/Python

```bash
Histórico → Exportar CSV

# Arquivo gerado: cubemaster-tempos.csv
# Estrutura:
data,tempo,penalidade,metodo,cubo
2024-12-15T10:30:00.000Z,22.35,none,CFOP,3x3x3
```

---

## 📁 Estrutura do Projeto

```
cubemaster/
├── index.html              # Dashboard principal
├── historico.html          # Gestão de solves
├── estatisticas.html       # Análises avançadas
├── treinos.html            # Planos de treino
├── configuracoes.html      # Preferências
├── ajuda.html              # FAQ e suporte
├── meus-tempos.txt         # Dados exemplo (opcional)
├── LICENSE                 # MIT License
├── README.md               # Este arquivo
│
├── assets/
│   ├── css/
│   │   └── styles.css      # Design tokens + estilos
│   └── js/
│       └── script.js       # Lógica da aplicação
│
└── docs/                   # (futuro) Documentação adicional
```

### Arquivos Principais

| Arquivo | Descrição | Linhas |
|---------|-----------|--------|
| `styles.css` | Design tokens, responsividade, modo escuro | ~800 |
| `script.js` | Importação, paginação, gráficos, estatísticas | ~1200 |
| `index.html` | Dashboard com métricas e gráficos principais | ~250 |
| `historico.html` | Tabela de tempos com CRUD completo | ~150 |

---

## 🛠️ Tecnologias

### Core
- **HTML5**: Estrutura semântica
- **CSS3**: Grid, Flexbox, Custom Properties
- **JavaScript ES6+**: Modules, Arrow Functions, Async/Await

### Bibliotecas (via CDN)
```html
<!-- Gráficos -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0"></script>

<!-- Ícones -->
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

### APIs Utilizadas
- `localStorage`: Persistência local
- `FileReader`: Importação de arquivos
- `Blob` / `URL.createObjectURL`: Exportação CSV
- `IntersectionObserver`: Lazy loading de gráficos
- `prefers-color-scheme`: Modo escuro automático

### Padrões e Boas Práticas
- ✅ **BEM** (Block Element Modifier) para CSS
- ✅ **Mobile First** para responsividade
- ✅ **Progressive Enhancement**
- ✅ **WCAG 2.1** (contraste, touch targets, semântica)
- ✅ **ISO 8601** para datas

---

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Para contribuir:

### 1. Fork e Clone
```bash
git clone https://github.com/SEU-USUARIO/cubemaster.git
cd cubemaster
git checkout -b feature/minha-feature
```

### 2. Faça suas Alterações
- Siga as convenções de código existentes
- Use design tokens CSS sempre que possível
- Teste em diferentes navegadores e tamanhos de tela

### 3. Commit e Push
```bash
git add .
git commit -m "feat(historico): adiciona filtro por data"
git push origin feature/minha-feature
```

### 4. Abra um Pull Request
- Descreva suas mudanças claramente
- Adicione screenshots se aplicável
- Mencione issues relacionadas

### Convenções de Commit
```
feat(escopo): nova funcionalidade
fix(escopo): correção de bug
docs(escopo): documentação
style(escopo): formatação, sem mudança de lógica
refactor(escopo): refatoração de código
perf(escopo): melhoria de performance
test(escopo): adição de testes
```

### Áreas para Contribuir
- 🐛 Reportar bugs
- 💡 Sugerir funcionalidades
- 📝 Melhorar documentação
- 🌐 Traduzir para outros idiomas
- 🎨 Propor melhorias de UI/UX
- ⚡ Otimizar performance

---

## 🗺️ Roadmap

### v2.1 (Q1 2025)
- [ ] Filtros avançados (data, método, cubo, penalidade)
- [ ] Exportação completa (ignorando paginação)
- [ ] Gráfico de progressão temporal (linha do tempo)
- [ ] Estatísticas por sessão de treino

### v2.2 (Q2 2025)
- [ ] PWA (Progressive Web App)
- [ ] Sincronização via Google Drive/Dropbox
- [ ] Comparação de PBs entre períodos
- [ ] Metas customizáveis

### v3.0 (Q3 2025)
- [ ] Backend opcional (Node.js + MongoDB)
- [ ] Autenticação e perfis de usuário
- [ ] Ranking comunitário
- [ ] Integração com WCA

### Backlog
- Virtualização de tabelas (react-window)
- Análise de algoritmos (F2L, OLL, PLL)
- Timers integrado (cronômetro nativo)
- Modo offline completo (Service Worker)
- Temas customizáveis

---

## 📄 Licença

Este projeto está licenciado sob a **MIT License**.

```
Copyright (c) 2025 Brian Muniz Silveira

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

Veja [LICENSE](LICENSE) para o texto completo.

---

## 👨‍💻 Autor

**Brian Muniz Silveira** (WCA ID: 2024SILV15)

- 🌐 GitHub: [@BrianMunizSilveira](https://github.com/BrianMunizSilveira)
- 📧 Email: brian.muniz.silveira@gmail.com
- 🎲 WCA: [2024SILV15](https://www.worldcubeassociation.org/persons/2024SILV15)

---

## 🙏 Agradecimentos

- **csTimer** - Inspiração e formato de exportação
- **Chart.js** - Biblioteca de gráficos elegante
- **Font Awesome** - Ícones consistentes
- **Comunidade WCA** - Por todo o suporte ao speedcubing

---

## 📞 Suporte

Encontrou um bug ou tem uma sugestão?

- 🐛 [Reporte um bug](https://github.com/briansilveira/cubemaster/issues/new?template=bug_report.md)
- 💡 [Sugira uma feature](https://github.com/briansilveira/cubemaster/issues/new?template=feature_request.md)
- 💬 [Discussões](https://github.com/briansilveira/cubemaster/discussions)

---

## 📊 Status do Projeto

![GitHub stars](https://img.shields.io/github/stars/briansilveira/cubemaster?style=social)
![GitHub forks](https://img.shields.io/github/forks/briansilveira/cubemaster?style=social)
![GitHub issues](https://img.shields.io/github/issues/briansilveira/cubemaster)
![GitHub pull requests](https://img.shields.io/github/issues-pr/briansilveira/cubemaster)

---

<div align="center">

**[⬆ Voltar ao topo](#cubemaster-v20-)**

Feito com ❤️ e muito cubo mágico 🎲

</div>

