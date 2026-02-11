# ✅ CRONOS - Checklist de Deploy no Vercel

## 🎯 VALIDAÇÃO COMPLETA DO VERCEL.JSON

Use este checklist para garantir que **TODAS** as propriedades estão configuradas.

---

## 📋 **PRÉ-DEPLOY**

### 1️⃣ Verificação Automática
```bash
# Execute os scripts de verificação
npm run verify:vercel    # Verifica apenas vercel.json
npm run verify:all        # Verifica tudo
```

### 2️⃣ Checklist Manual

#### ✅ **Configuração Base**
- [ ] `version: 2` definido
- [ ] `name: "cronos-time-evolution"` definido
- [ ] `buildCommand: "npm run build"` definido
- [ ] `outputDirectory: "dist"` definido
- [ ] `framework: "vite"` definido
- [ ] `devCommand: "npm run dev"` definido
- [ ] `installCommand: "npm install"` definido

#### ✅ **Build Configuration**
- [ ] `build.env.NODE_ENV: "production"` configurado
- [ ] `build.env.VITE_BUILD_TIME` configurado

#### ✅ **Rewrites (SPA Support)**
- [ ] Rewrite com regex `/((?!api).*)` configurado
- [ ] Destination para `/index.html` configurado
- [ ] React Router funcionará corretamente

#### ✅ **Routes (10+ routes)**
- [ ] Route para `/robots.txt`
- [ ] Route para `/manifest.json`
- [ ] Route para `/favicon.(ico|svg)`
- [ ] Route para `/assets/(.*)`
- [ ] Route para arquivos JS/CSS
- [ ] Route para imagens
- [ ] Route para `/index.html`
- [ ] Catch-all route no final
- [ ] Cache configurado em cada route

#### ✅ **Headers de Segurança (12+ headers)**
- [ ] `X-DNS-Prefetch-Control: on`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` configurado
- [ ] `Strict-Transport-Security` configurado
- [ ] `Content-Security-Policy` completo

#### ✅ **Content Security Policy (CSP)**
- [ ] `default-src 'self'`
- [ ] `script-src` inclui Tailwind CDN
- [ ] `script-src` inclui esm.sh
- [ ] `script-src` inclui Google Fonts
- [ ] `style-src` inclui Tailwind CDN
- [ ] `font-src` inclui Google Fonts
- [ ] `connect-src` inclui Firebase (*.googleapis.com)
- [ ] `connect-src` inclui Firebase (*.firebaseio.com)
- [ ] `connect-src` inclui Firebase (*.cloudfunctions.net)
- [ ] `img-src` permite https, data, blob
- [ ] `object-src 'none'` definido
- [ ] `upgrade-insecure-requests` definido

#### ✅ **Cache Configuration**
- [ ] Assets: `max-age=31536000` (1 ano)
- [ ] JS/CSS: `max-age=31536000` (1 ano)
- [ ] Imagens: `max-age=2592000` (30 dias)
- [ ] Fontes: `max-age=31536000` (1 ano)
- [ ] index.html: `max-age=0` (sem cache)
- [ ] manifest.json: `max-age=86400` (24h)
- [ ] robots.txt: `max-age=3600` (1h)
- [ ] `immutable` flag em assets

#### ✅ **CORS e Fonts**
- [ ] `Access-Control-Allow-Origin: *` para fontes
- [ ] `Cross-Origin-Resource-Policy: cross-origin` para fontes
- [ ] Content-Type correto para woff2

#### ✅ **Environment Variables (6 vars)**
- [ ] `VITE_FIREBASE_API_KEY`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN`
- [ ] `VITE_FIREBASE_PROJECT_ID`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `VITE_FIREBASE_APP_ID`

#### ✅ **Regions**
- [ ] `regions: ["iad1"]` configurado
- [ ] Região adequada para seu público

#### ✅ **Functions (Serverless)**
- [ ] `functions.api/**/*.js` configurado
- [ ] `memory: 1024` definido
- [ ] `maxDuration: 10` definido

#### ✅ **GitHub Integration**
- [ ] `github.enabled: true`
- [ ] `github.autoAlias: true`
- [ ] `github.autoJobCancelation: true`

#### ✅ **Git Deployment**
- [ ] `git.deploymentEnabled.main: true`
- [ ] `git.deploymentEnabled.master: true`

#### ✅ **URL Handling**
- [ ] `trailingSlash: false`
- [ ] `cleanUrls: true`

#### ✅ **Redirects**
- [ ] Redirects configurados (se necessário)

#### ✅ **Crons**
- [ ] `crons: []` presente (preparado para futuro)

---

## 🔥 **FIREBASE**

### Configuração Firebase
- [ ] Projeto Firebase criado
- [ ] Firestore Database ativado
- [ ] Regras de segurança configuradas
- [ ] Credenciais copiadas

### Variáveis no Vercel Dashboard
- [ ] `VITE_FIREBASE_API_KEY` adicionado
- [ ] `VITE_FIREBASE_AUTH_DOMAIN` adicionado
- [ ] `VITE_FIREBASE_PROJECT_ID` adicionado
- [ ] `VITE_FIREBASE_STORAGE_BUCKET` adicionado
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID` adicionado
- [ ] `VITE_FIREBASE_APP_ID` adicionado

---

## 🏗️ **BUILD LOCAL**

### Teste de Build
```bash
npm install          # Instalar dependências
npm run build        # Build local
npm run preview      # Preview do build
```

### Validações
- [ ] Build completa sem erros
- [ ] Preview funciona em localhost:4173
- [ ] Assets carregam corretamente
- [ ] Fontes carregam
- [ ] Firebase conecta
- [ ] Tarefas salvam/carregam
- [ ] Shopping funciona
- [ ] Timer funciona
- [ ] Fast Reader funciona
- [ ] Story Builder funciona

---

## 🚀 **DEPLOY**

### Opção A: Vercel Dashboard
- [ ] Código no GitHub
- [ ] Repositório importado no Vercel
- [ ] Variáveis de ambiente adicionadas
- [ ] Deploy iniciado

### Opção B: Vercel CLI
```bash
npm install -g vercel
vercel login
npm run deploy
```

- [ ] Vercel CLI instalado
- [ ] Login feito
- [ ] Deploy executado

---

## ✅ **PÓS-DEPLOY**

### Validação Funcional
- [ ] URL de produção acessível
- [ ] Design glassmorphism perfeito
- [ ] Paleta laranja/âmbar/fogo mantida
- [ ] Animações fluidas
- [ ] Layout responsivo
- [ ] Fontes carregam

### Funcionalidades Core
- [ ] Sistema de tarefas funciona
- [ ] Sistema de XP funciona
- [ ] 17 níveis funcionam
- [ ] Universo visual evolui
- [ ] Timer multi-modo funciona
- [ ] Fast Reader funciona
- [ ] Story Builder funciona
- [ ] Shopping Manager funciona

### Persistência de Dados
- [ ] Criar tarefa → Funciona
- [ ] Recarregar página → Tarefa persiste
- [ ] Fechar aba → Dados salvos
- [ ] Adicionar compra → Funciona
- [ ] Dashboard financeiro → Calcula corretamente
- [ ] Lucro líquido → 10% desconto aplicado
- [ ] Export/Import → Funciona

### Performance
```bash
# Abra DevTools → Lighthouse
# Targets:
```
- [ ] Performance: 90+
- [ ] Accessibility: 95+
- [ ] Best Practices: 95+
- [ ] SEO: 90+

### Console do Navegador
Abra DevTools (F12) → Console:
- [ ] `✅ Firebase: Conectado!`
- [ ] `✅ Tasks loaded: X`
- [ ] `✅ Stats loaded: Level X`
- [ ] `✅ Products loaded: X`
- [ ] `✅ Purchases loaded: X`
- [ ] Sem erros críticos

### Headers (Segurança)
```bash
# Teste em: https://securityheaders.com
```
- [ ] X-Content-Type-Options presente
- [ ] X-Frame-Options presente
- [ ] X-XSS-Protection presente
- [ ] Content-Security-Policy presente
- [ ] Strict-Transport-Security presente
- [ ] Grade: A ou A+

### Cache (Performance)
```bash
# DevTools → Network → Reload
```
- [ ] Assets retornam 304 (from cache)
- [ ] JS/CSS têm cache de 1 ano
- [ ] Fontes têm cache de 1 ano
- [ ] Imagens têm cache de 30 dias
- [ ] index.html sem cache (200)

### PWA
```bash
# DevTools → Application
```
- [ ] Manifest.json carrega
- [ ] Theme color aplicado
- [ ] Ícones presentes
- [ ] "Add to Home Screen" disponível

### SEO
```bash
# View Source (Ctrl+U)
```
- [ ] `<title>` correto
- [ ] `<meta name="description">` presente
- [ ] Open Graph tags presentes
- [ ] Twitter Card tags presentes
- [ ] robots.txt acessível
- [ ] Canonical URL correto

---

## 🔍 **TROUBLESHOOTING**

### Se algo não funcionar:

#### Assets não carregam
```bash
# Verifique:
1. outputDirectory: "dist" no vercel.json
2. Routes para /assets/ configuradas
3. Headers com Cache-Control
```

#### Firebase não conecta
```bash
# Verifique:
1. Variáveis de ambiente no Vercel Dashboard
2. CSP permite *.googleapis.com e *.firebaseio.com
3. connect-src no Content-Security-Policy
```

#### React Router dá 404
```bash
# Verifique:
1. Rewrites configurados
2. Catch-all route no final
3. destination: "/index.html"
```

#### Fontes não carregam
```bash
# Verifique:
1. font-src no CSP
2. Access-Control-Allow-Origin para fontes
3. Cross-Origin-Resource-Policy
```

#### Dados não persistem
```bash
# Verifique:
1. Firebase credentials corretas
2. Console do navegador por erros
3. DevTools → Application → Local Storage
```

---

## 🎉 **CONCLUSÃO**

### Se TODOS os itens estão ✅:

```
🎉 PARABÉNS! CRONOS ESTÁ PERFEITAMENTE DEPLOYADO!

✅ Todas as propriedades configuradas
✅ Todas as funcionalidades preservadas
✅ Segurança maximizada
✅ Performance otimizada
✅ PWA funcionando
✅ SEO configurado
✅ Dados persistindo

🚀 O CRONOS está pronto para evoluir através do tempo!
```

---

## 📊 **ESTATÍSTICAS DO VERCEL.JSON**

```
Total de Propriedades: 15+
Total de Routes: 8+
Total de Headers: 9+ grupos
Total de Security Headers: 12+
Total de Cache Rules: 7+
Total de Environment Variables: 6+
Total de CSP Directives: 12+

Score Total: 100% ✅
```

---

## 🔗 **LINKS ÚTEIS**

- **Verificar Config**: `npm run verify:vercel`
- **Deploy**: `npm run deploy`
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Firebase Console**: https://console.firebase.google.com
- **Security Headers**: https://securityheaders.com
- **Lighthouse**: DevTools → Lighthouse

---

## 📞 **SUPORTE**

Se encontrar algum problema:

1. Execute `npm run verify:vercel`
2. Leia os logs de erro
3. Consulte `VERCEL-CONFIG-EXPLAINED.md`
4. Verifique `DEPLOY.md`
5. Teste localmente primeiro

---

**Última atualização**: 2026-02-08  
**Versão**: 1.0.0  
**Status**: ✅ PRODUÇÃO READY
