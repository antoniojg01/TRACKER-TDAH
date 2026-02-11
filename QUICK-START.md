# ⚡ CRONOS - Quick Start Guide

## 🚀 Deploy em 5 Minutos

### 1️⃣ Configure Firebase (2 min)
```bash
# 1. Vá para: https://console.firebase.google.com
# 2. Crie novo projeto
# 3. Ative Firestore Database
# 4. Copie as credenciais do Firebase Config
```

### 2️⃣ Configure Variáveis de Ambiente (1 min)
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite e cole suas credenciais do Firebase
# VITE_FIREBASE_API_KEY=sua-chave-aqui
# VITE_FIREBASE_AUTH_DOMAIN=seu-dominio-aqui
# ...
```

### 3️⃣ Teste Localmente (1 min)
```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Acessar: http://localhost:5173
```

### 4️⃣ Deploy no Vercel (1 min)
```bash
# Opção A: Via Dashboard
# 1. Push para GitHub
# 2. Vá em vercel.com/new
# 3. Importe o repo
# 4. Adicione variáveis de ambiente
# 5. Deploy!

# Opção B: Via CLI
npm install -g vercel
vercel login
npm run deploy
```

---

## 📦 Comandos Úteis

### Desenvolvimento
```bash
npm run dev              # Iniciar servidor de desenvolvimento
npm run build            # Build para produção
npm run preview          # Preview do build localmente
```

### Deploy
```bash
npm run predeploy        # Verificar se está tudo OK
npm run deploy           # Deploy completo no Vercel
vercel                   # Deploy de teste
vercel --prod            # Deploy em produção
```

### Manutenção
```bash
npm install              # Instalar dependências
npm update               # Atualizar pacotes
npm audit fix            # Corrigir vulnerabilidades
```

---

## 🔧 Configuração Rápida do Firebase

### Regras Básicas de Segurança (Desenvolvimento)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Coleções Criadas Automaticamente
- ✅ `tasks` - Tarefas e rotinas
- ✅ `stats` - Estatísticas e XP do usuário
- ✅ `books` - Biblioteca de leitura
- ✅ `stories` - Histórias criadas
- ✅ `links` - Links salvos
- ✅ `products` - Produtos cadastrados
- ✅ `purchases` - Histórico de compras

---

## ✅ Checklist de Funcionalidades

### Core Features
- [x] Sistema de Tasks com XP
- [x] 17 Níveis Evolutivos (Big Bang → Presente)
- [x] Timer Multi-Modo (Pomodoro/Stopwatch/Countdown)
- [x] Universo Visual Isométrico
- [x] Design Glassmorphism Futurista

### Advanced Features
- [x] Fast Reader com controle de velocidade
- [x] Story Builder Pro completo
- [x] Sistema de Shopping com lucro
- [x] Cálculo automático de lucro líquido (10% desconto)
- [x] Dashboard financeiro por período

### Data & Sync
- [x] Firebase Cloud Storage
- [x] LocalStorage Backup
- [x] Auto-backup (5 min)
- [x] Export/Import JSON
- [x] Persistência multi-camada

---

## 🎯 URLs Importantes

### Desenvolvimento
- **Local**: http://localhost:5173
- **Preview**: http://localhost:4173

### Produção (após deploy)
- **Vercel**: https://seu-projeto.vercel.app
- **Custom Domain**: https://seu-dominio.com

### Admin
- **Firebase Console**: https://console.firebase.google.com
- **Vercel Dashboard**: https://vercel.com/dashboard

---

## 🐛 Troubleshooting Rápido

### Problema: Firebase não conecta
```bash
# Verifique as variáveis de ambiente
cat .env

# Teste a conexão do Firebase
# Abra DevTools (F12) → Console
# Procure por: "✅ Firebase: Conectado!"
```

### Problema: Build falha
```bash
# Limpe e reinstale
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Problema: Dados não persistem
```bash
# Verifique localStorage
# DevTools → Application → Local Storage
# Deve ter: cronos_tasks, cronos_stats, etc.

# Verifique Firebase
# Console → Firestore → Collections
# Deve ter todas as coleções listadas acima
```

---

## 📊 Performance Metrics (Esperado)

### Lighthouse Score (Target)
- **Performance**: 90+ ⚡
- **Accessibility**: 95+ ♿
- **Best Practices**: 95+ ✅
- **SEO**: 90+ 🔍

### Bundle Size
- **Total**: ~500KB (gzip)
- **Initial Load**: ~200KB
- **Lazy Chunks**: ~300KB

### Load Time (3G)
- **First Paint**: < 2s
- **Interactive**: < 3s
- **Fully Loaded**: < 5s

---

## 🔐 Segurança

### Produção Checklist
- [ ] Atualizar regras do Firestore para autenticação
- [ ] Configurar CORS corretamente
- [ ] Habilitar rate limiting
- [ ] Adicionar autenticação de usuário
- [ ] Configurar backup automático

### Variáveis Sensíveis
```bash
# NUNCA commitar .env para Git!
# .env está no .gitignore ✅

# Use Vercel Environment Variables
# Settings → Environment Variables
```

---

## 🎨 Customização

### Cores do Tema
Arquivo: `/src/styles/theme.css`
```css
--color-primary: #fb923c;    /* Laranja principal */
--color-secondary: #f59e0b;  /* Âmbar */
--color-accent: #dc2626;     /* Vermelho fogo */
```

### Níveis de Evolução
Arquivo: `/src/app/App.tsx`
```javascript
const LEVELS = [
  { level: 1, title: 'Big Bang', xpNeeded: 100, era: 'nascimento' },
  // ... customize aqui
];
```

---

## 📈 Próximos Passos

### Melhorias Sugeridas
1. **PWA**: Adicionar manifest.json e service worker
2. **Auth**: Implementar Firebase Authentication
3. **Multi-user**: Suporte para múltiplos usuários
4. **Dark Mode**: Sistema de temas claro/escuro
5. **Mobile App**: React Native version
6. **Analytics**: Google Analytics ou Mixpanel
7. **Notificações**: Push notifications

---

## 🆘 Suporte

### Documentação
- [Vercel Docs](https://vercel.com/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Vite Docs](https://vitejs.dev)
- [React Docs](https://react.dev)

### Logs e Debug
```bash
# Logs do Vercel
vercel logs

# Ver último deploy
vercel ls

# Ver build logs
vercel inspect [deployment-url]
```

---

## 🎉 Pronto!

Seu CRONOS está configurado e pronto para evoluir através do tempo! 🚀

**Comandos Mais Usados:**
```bash
npm run dev        # Desenvolvimento
npm run build      # Build local
npm run deploy     # Deploy no Vercel
```

**Links Rápidos:**
- 📖 [Guia Completo de Deploy](./DEPLOY.md)
- 🔧 [Configuração Vercel](./vercel.json)
- 🌐 [Firebase Console](https://console.firebase.google.com)

---

**Dica Final**: Sempre rode `npm run predeploy` antes de fazer deploy em produção! ✨
