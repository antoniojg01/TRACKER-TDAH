# 🌌 CRONOS - A Evolução do Tempo

<div align="center">
  
  ![Version](https://img.shields.io/badge/version-1.0.0-orange)
  ![React](https://img.shields.io/badge/react-18.3.1-blue)
  ![Firebase](https://img.shields.io/badge/firebase-12.9.0-yellow)
  ![Tailwind](https://img.shields.io/badge/tailwind-4.1.12-cyan)
  ![License](https://img.shields.io/badge/license-MIT-green)
  
  **Gerenciador de Tarefas Gamificado com Evolução do Universo**
  
  [Demo](https://cronos.vercel.app) • [Documentação](#-funcionalidades) • [Deploy](./DEPLOY.md) • [Quick Start](./QUICK-START.md)
  
</div>

---

## 🎯 Sobre o Projeto

**CRONOS** é um gerenciador de tarefas gamificado revolucionário onde cada tarefa completada concede **XP** que te leva através de **17 níveis evolutivos** - desde o **Big Bang** até os **dias atuais**! 

### 💎 Principais Destaques

- 🎮 **Sistema de XP Gamificado**: Ganhe experiência completando tarefas
- 🌌 **17 Níveis Evolutivos**: Do Big Bang aos dias atuais
- 🎨 **Design Futurista**: Glassmorphism com paleta laranja/âmbar/fogo
- ⏱️ **Timer Profissional**: Pomodoro, Stopwatch, Countdown
- 📚 **Fast Reader**: Leitura dinâmica e emocionante
- ✍️ **Story Builder Pro**: Sistema completo de criação de histórias
- 🛒 **Shopping Manager**: Gestão financeira com cálculo de lucro
- 💾 **Persistência Total**: Firebase + LocalStorage + Backups automáticos

---

## ✨ Funcionalidades

### 🎯 Core Features

#### 1. Sistema de Tarefas Completo
- ✅ **Tarefas Diárias**: Reset automático à meia-noite
- ✅ **Rotinas**: Organizadas por período (Manhã, Tarde, Noite)
- ✅ **Prioridades**: Baixa, Média, Alta
- ✅ **Categorias**: Trabalho, Pessoal, Saúde, etc.
- ✅ **Sub-tarefas**: Sistema modular de checklist

#### 2. Sistema de Evolução
```
Big Bang → Formação do Universo → Nascimento da Terra → 
Vida Unicelular → Plantas → Dinossauros → Mamíferos → 
Primatas → Homo Sapiens → Idade do Bronze → Idade do Ferro → 
Idade Média → Renascimento → Revolução Industrial → 
Era Moderna → Era Digital → Futuro
```

#### 3. Timer Multi-Modo
- ⏲️ **Pomodoro**: 25min trabalho + 5min pausa
- ⏱️ **Stopwatch**: Cronômetro progressivo
- ⏰ **Countdown**: Temporizador regressivo
- 🎯 **XP por Tempo**: Ganhe XP enquanto trabalha!

#### 4. Fast Reader
- 📖 Suporte para TXT, PDF, EPUB
- ⚡ Controle de velocidade (WPM)
- 🎨 Personalização de fonte e tamanho
- 💾 Salva progresso automaticamente
- 🔄 Múltiplos livros simultâneos

#### 5. Story Builder Pro
- ✍️ Editor completo de histórias
- 📝 Múltiplas versões por história
- 🎭 Sistema de contexto e personagens
- 📊 Contador de palavras
- 💾 Auto-save

#### 6. Shopping Manager
- 📦 Cadastro de produtos com preço
- 🛒 Registro de compras
- 💰 Cálculo automático de lucro
- 📊 Dashboard financeiro
- 📅 Filtros por período (semana/mês)
- 💵 Lucro líquido (10% desconto automático)

---

## 🛠️ Tecnologias

### Frontend
- ⚛️ **React 18.3.1**: Framework principal
- 🎨 **Tailwind CSS 4**: Styling moderno
- 🎭 **Motion (Framer Motion)**: Animações fluidas
- 🧩 **Radix UI**: Componentes acessíveis
- 🎯 **Lucide React**: Ícones modernos

### Backend & Database
- 🔥 **Firebase Firestore**: Banco de dados NoSQL
- 💾 **LocalStorage**: Backup local automático
- ☁️ **Vercel**: Hosting e CDN global

### Build & Dev Tools
- ⚡ **Vite 6**: Build tool ultra-rápido
- 📦 **PNPM**: Gerenciador de pacotes eficiente
- 🔧 **TypeScript**: Type safety (via JSDoc)

---

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- Conta no [Firebase](https://firebase.google.com)
- Conta no [Vercel](https://vercel.com) (para deploy)

### Instalação Local

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/cronos.git
cd cronos

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do Firebase

# 4. Rode em desenvolvimento
npm run dev

# Acesse: http://localhost:5173
```

### Deploy no Vercel

```bash
# Via CLI
npm install -g vercel
vercel login
npm run deploy

# Ou via Dashboard
# 1. Push para GitHub
# 2. Vá em vercel.com/new
# 3. Importe o repositório
# 4. Configure variáveis de ambiente
# 5. Deploy!
```

📖 **[Guia Completo de Deploy](./DEPLOY.md)**

---

## 📁 Estrutura do Projeto

```
cronos/
├── src/
│   ├── app/
│   │   ├── App.tsx              # Componente principal
│   │   └── components/          # Componentes React
│   │       ├── TimerModal.tsx
│   │       ├── FlashReader.tsx
│   │       ├── StoryBuilder.tsx
│   │       ├── UniverseVisual.tsx
│   │       └── GoogleDrivePanel.tsx
│   ├── services/
│   │   ├── firebaseConfig.ts    # Config do Firebase
│   │   ├── firebaseService.ts   # CRUD Firebase
│   │   ├── storageService.ts    # LocalStorage
│   │   ├── backupService.ts     # Sistema de backup
│   │   └── googleDriveService.ts
│   ├── styles/
│   │   ├── theme.css            # Tema e variáveis
│   │   └── fonts.css            # Importação de fontes
│   └── types.ts                 # TypeScript types
├── scripts/
│   └── pre-deploy-check.js      # Verificação pré-deploy
├── vercel.json                  # Config do Vercel
├── vite.config.ts               # Config do Vite
├── package.json                 # Dependências
├── DEPLOY.md                    # Guia de deploy
├── QUICK-START.md               # Guia rápido
└── README.md                    # Este arquivo
```

---

## 🎮 Como Usar

### 1. Criar Tarefas
1. Clique no botão "+" no dashboard
2. Escolha tipo (Diária ou Rotina)
3. Preencha os detalhes
4. Adicione sub-tarefas (opcional)
5. Salvar!

### 2. Ganhar XP
- Complete tarefas: **+10 XP**
- Use o timer: **+1 XP por minuto**
- Complete sub-tarefas: **+5 XP cada**

### 3. Evoluir
- Acumule XP para subir de nível
- Desbloqueie novas eras da história
- Veja o universo evoluir visualmente

### 4. Gerenciar Finanças
1. Vá para aba "Shopping"
2. Cadastre produtos com preço de venda
3. Registre compras com valor pago
4. Veja lucro calculado automaticamente
5. Filtre por semana/mês

---

## 💾 Sistema de Persistência

### 3 Camadas de Segurança

1. **Firebase Cloud** 🔥
   - Sincronização automática
   - Acesso de qualquer dispositivo
   - Backup na nuvem

2. **LocalStorage** 💾
   - Backup local instantâneo
   - Funciona offline
   - Salvamento antes de fechar página

3. **Auto-Backup** 📦
   - Backup automático a cada 5 minutos
   - Mantém últimos 5 backups
   - Export/Import manual (.json)

### Garantias
- ✅ Dados salvos ao fechar aba
- ✅ Dados salvos ao trocar de aba
- ✅ Dados salvos ao navegar para outro site
- ✅ Fallback automático se Firebase offline
- ✅ Export manual para segurança extra

---

## 📊 Performance

### Métricas Esperadas
- **Lighthouse Score**: 90+ em todas categorias
- **First Paint**: < 2s
- **Time to Interactive**: < 3s
- **Bundle Size**: ~500KB (gzip)

### Otimizações Implementadas
- ✅ Code splitting automático
- ✅ Lazy loading de componentes
- ✅ Cache agressivo de assets
- ✅ Compressão Gzip/Brotli
- ✅ CDN global (Vercel)
- ✅ Imagens otimizadas

---

## 🔐 Segurança

### Desenvolvimento
```javascript
// Firebase Rules (Dev)
allow read, write: if true;
```

### Produção (Recomendado)
```javascript
// Firebase Rules (Prod)
allow read, write: if request.auth != null;
```

### Boas Práticas
- ✅ Variáveis de ambiente (.env)
- ✅ CORS configurado
- ✅ Headers de segurança
- ✅ Rate limiting (Firebase)
- ⚠️ Implementar autenticação em produção

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga estes passos:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### Convenções de Commit
- `Add:` Nova funcionalidade
- `Fix:` Correção de bug
- `Update:` Atualização de código
- `Refactor:` Refatoração
- `Docs:` Documentação

---

## 📝 Roadmap

### v1.0 (Atual) ✅
- [x] Sistema de tarefas gamificado
- [x] 17 níveis evolutivos
- [x] Timer multi-modo
- [x] Fast Reader
- [x] Story Builder
- [x] Shopping Manager
- [x] Sistema de persistência

### v1.1 (Próximo)
- [ ] PWA (Progressive Web App)
- [ ] Firebase Authentication
- [ ] Notificações push
- [ ] Sistema de conquistas
- [ ] Leaderboard global

### v2.0 (Futuro)
- [ ] Mobile app (React Native)
- [ ] Modo colaborativo
- [ ] Integração com calendários
- [ ] IA para sugestões de tarefas
- [ ] Dark mode completo

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🌟 Agradecimentos

- **React Team**: Pelo framework incrível
- **Vercel**: Pela plataforma de deploy
- **Firebase**: Pelo backend robusto
- **Tailwind**: Pelo CSS utility-first
- **Comunidade Open Source**: Por todas as bibliotecas

---

## 📞 Contato

- **GitHub**: [@seu-usuario](https://github.com/seu-usuario)
- **Email**: seu-email@example.com
- **Website**: https://seu-site.com

---

<div align="center">
  
  **Desenvolvido com 🔥 e ⏰**
  
  [⬆ Voltar ao topo](#-cronos---a-evolução-do-tempo)
  
</div>
