# 🚀 CRONOS - Guia de Deploy no Vercel

## 📋 Pré-requisitos

- Conta no [Vercel](https://vercel.com)
- Conta no [Firebase](https://firebase.google.com) (para banco de dados)
- Repositório Git (GitHub, GitLab, ou Bitbucket)

---

## 🔥 Configuração do Firebase

### 1. Criar Projeto Firebase
1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Clique em "Adicionar projeto"
3. Nomeie seu projeto (ex: `cronos-production`)
4. Ative Google Analytics (opcional)

### 2. Configurar Firestore Database
1. No menu lateral, vá em **Build** → **Firestore Database**
2. Clique em "Criar banco de dados"
3. Escolha modo **Produção**
4. Selecione a localização (recomendado: `southamerica-east1` para Brasil)

### 3. Configurar Regras de Segurança
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura/escrita para todos (desenvolvimento)
    // IMPORTANTE: Adicionar autenticação em produção!
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 4. Obter Credenciais
1. Vá em **Configurações do Projeto** (ícone de engrenagem)
2. Role até "Seus aplicativos"
3. Clique no ícone **Web** (`</>`)
4. Registre o app (nome: `CRONOS Web`)
5. **Copie as credenciais** que aparecem:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "cronos-xxxxx.firebaseapp.com",
  projectId: "cronos-xxxxx",
  storageBucket: "cronos-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxx"
};
```

---

## 🌐 Deploy no Vercel

### Método 1: Deploy via Dashboard (Recomendado)

#### Passo 1: Fazer Push para GitHub
```bash
git init
git add .
git commit -m "Initial commit - CRONOS Time Evolution"
git branch -M main
git remote add origin https://github.com/seu-usuario/cronos.git
git push -u origin main
```

#### Passo 2: Importar no Vercel
1. Acesse [vercel.com/new](https://vercel.com/new)
2. Clique em "Import Git Repository"
3. Selecione seu repositório
4. Clique em "Import"

#### Passo 3: Configurar Variáveis de Ambiente
Na tela de configuração, adicione as variáveis:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=cronos-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=cronos-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=cronos-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:xxxxx
```

#### Passo 4: Deploy
1. Clique em **Deploy**
2. Aguarde o build (geralmente 2-3 minutos)
3. Acesse sua URL: `https://cronos-xxxxx.vercel.app`

---

### Método 2: Deploy via CLI

#### Passo 1: Instalar Vercel CLI
```bash
npm install -g vercel
```

#### Passo 2: Login
```bash
vercel login
```

#### Passo 3: Criar arquivo .env.production
Crie o arquivo `.env.production` na raiz:
```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=cronos-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=cronos-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=cronos-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:xxxxx
```

#### Passo 4: Deploy
```bash
# Deploy de teste
vercel

# Deploy em produção
vercel --prod
```

---

## ✅ Verificação Pós-Deploy

### 1. Testar Funcionalidades Core
- [ ] ✅ Página carrega corretamente
- [ ] ✅ Design glassmorphism está perfeito
- [ ] ✅ Animações funcionam
- [ ] ✅ Sistema de XP funciona
- [ ] ✅ Timer funciona
- [ ] ✅ Tasks salvam e carregam

### 2. Testar Sistema de Persistência
- [ ] ✅ Adicionar uma task
- [ ] ✅ Fechar e reabrir o navegador
- [ ] ✅ Task ainda está lá
- [ ] ✅ Adicionar compra no Shopping
- [ ] ✅ Recarregar página
- [ ] ✅ Compra persiste

### 3. Verificar Console
Abra DevTools (F12) e verifique:
```
✅ Firebase: Conectado!
✅ Tasks loaded: X
✅ Stats loaded: Level X
✅ Products loaded: X
✅ Purchases loaded: X
```

### 4. Testar Backup/Export
- [ ] ✅ Exportar dados (JSON)
- [ ] ✅ Importar dados
- [ ] ✅ Auto-backup funciona

---

## 🔧 Troubleshooting

### Problema: "Firebase não conecta"
**Solução:**
1. Verifique se as variáveis de ambiente estão corretas
2. Verifique se o Firebase está com regras de segurança corretas
3. Abra o console e procure por erros

### Problema: "Build falha no Vercel"
**Solução:**
1. Verifique se `package.json` tem o script `build`
2. Limpe cache: `vercel --force`
3. Verifique logs de erro no dashboard

### Problema: "Dados não persistem"
**Solução:**
1. Verifique se Firebase está configurado
2. Verifique console por erros de permissão
3. Teste localStorage: abra DevTools → Application → Local Storage

### Problema: "Estilo quebrado"
**Solução:**
1. Verifique se Tailwind v4 está no `package.json`
2. Verifique se `vite.config.ts` tem configuração correta
3. Force rebuild: `vercel --force`

---

## 🎯 Otimizações Pós-Deploy

### 1. Domínio Customizado
1. Vá em Settings → Domains
2. Adicione seu domínio
3. Configure DNS conforme instruções

### 2. Analytics
```bash
# Instalar Vercel Analytics
npm install @vercel/analytics

# Adicionar no App.tsx
import { Analytics } from '@vercel/analytics/react';

<Analytics />
```

### 3. Performance
- Cache otimizado ✅ (já configurado em `vercel.json`)
- Compression ✅ (automático no Vercel)
- CDN Global ✅ (automático no Vercel)

### 4. PWA (Progressive Web App)
Para transformar em PWA, adicione `manifest.json` e service worker.

---

## 📊 Monitoramento

### Vercel Dashboard
- **Deployments**: Histórico de builds
- **Analytics**: Visualizações e performance
- **Logs**: Erros em tempo real
- **Speed Insights**: Core Web Vitals

### Firebase Console
- **Firestore**: Dados em tempo real
- **Usage**: Leituras/escritas
- **Rules**: Segurança

---

## 🔐 Segurança em Produção

### 1. Atualizar Regras do Firestore
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir apenas para usuário específico
    match /{collection}/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 2. Habilitar Autenticação
```javascript
// Adicionar Firebase Auth
import { getAuth } from 'firebase/auth';
const auth = getAuth(app);
```

### 3. Rate Limiting
Configure rate limiting no Firebase:
- Settings → Quota → Configure

---

## 📱 Atualizações Futuras

### Atualizar Deploy
```bash
# Commit suas mudanças
git add .
git commit -m "Update: descrição"
git push

# Vercel fará deploy automático!
```

### Rollback
Se algo der errado:
1. Vá no Dashboard → Deployments
2. Encontre o deploy anterior funcional
3. Clique nos 3 pontos → "Promote to Production"

---

## 🎉 Pronto!

Seu CRONOS está no ar! 🚀

**URL de Produção**: `https://seu-projeto.vercel.app`

**Funcionalidades Ativas:**
✅ Sistema de Tasks gamificado
✅ Evolução do universo (Big Bang → Presente)
✅ Timer profissional multi-modo
✅ Fast Reader dinâmico
✅ Story Builder completo
✅ Sistema de Shopping com lucro
✅ Persistência em Firebase + LocalStorage
✅ Backups automáticos
✅ PWA-ready
✅ Performance otimizada

---

## 🆘 Suporte

- **Vercel Docs**: https://vercel.com/docs
- **Firebase Docs**: https://firebase.google.com/docs
- **Vite Docs**: https://vitejs.dev

**Monitoramento 24/7**: Vercel monitora automaticamente uptime e performance!
