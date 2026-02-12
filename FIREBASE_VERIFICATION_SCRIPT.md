# 🔥 SCRIPT DE VERIFICAÇÃO DO FIREBASE

## ⚡ TESTE RÁPIDO (5 MINUTOS)

### 1️⃣ Verificar Conexão com Firebase

```bash
node firebase-test.js
```

**Esperado:**
```
✅ Firebase está respondendo corretamente
✅ Collections estão prontas:
  • tasks
  • stats
  • books
  • stories
  • links
  • products
  • purchases
```

---

### 2️⃣ Monitorar Salvamentos em Tempo Real

Abra **dois navegadores**:

**ABA 1 - Dashboard de Monitoring:**
```
📂 Abra: file:///{SEU_CAMINHO}/TRACKER-TDAH/firebase-dashboard.html
```

**ABA 2 - Aplicação:**
```
🌐 Abra: http://localhost:5174
🔐 Login: EON / 0130
```

### 3️⃣ Testar cada funcionalidade

Na **ABA 2**, execute cada ação e veja os logs em **ABA 1**:

| Ação | O que testar |
|------|------------|
| ✏️ Criar tarefa | Procure por `🔥 Firebase: Salvando tasks...` |
| ✅ Completar tarefa | Procure por `✅ Firebase: Stats salvas com sucesso!` |
| 📖 Adicionar livro | Procure por `🔥 Firebase: Salvando books...` |
| 🎵 Criar story | Procure por `🔥 Firebase: Salvando stories...` |
| 🔗 Adicionar link | Procure por `🔥 Firebase: Salvando links...` |
| 📦 Adicionar produto | Procure por `🔥 Firebase: Salvando products...` |
| 🛒 Registrar compra | Procure por `🔥 Firebase: Salvando purchases...` |

---

## 🔍 VERIFICAÇÃO MANUAL NO CONSOLE

### 1️⃣ Abra DevTools (F12)

Na aplicação (http://localhost:5174):

```
Pressione: F12 → Console
```

### 2️⃣ Crie um item

```
Crie uma nova tarefa
```

### 3️⃣ Procure pelos logs

Você deve ver:

```
🔥 Firebase: Salvando tasks...
📊 Salvando 1 tarefa(s)
Firestore write succeeded ✓
✅ Firebase: Tasks salvas com sucesso!
```

### 4️⃣ Verifique o Firestore Console

1. Abra: https://console.firebase.google.com/
2. Projeto: `controle-de-assinaturas`
3. Menu: Firestore Database
4. Collection: `tasks`
5. Document: `default_user`

Deve haver um campo `data` com suas tarefas.

---

## ✅ CHECKLIST DE VERIFICAÇÃO COMPLETA

### Dados

- [ ] Tasks salvando no Firestore
- [ ] Stats atualizando após completar tarefa
- [ ] Books persistindo
- [ ] Stories salvando
- [ ] Links sendo armazenados
- [ ] Products no banco
- [ ] Purchases registrando

### Manga Reader

- [ ] Botão "Manga" aparece na sidebar
- [ ] Pode fazer upload de imagens
- [ ] Imagens aparecem em Firebase Storage
- [ ] Pode ler em modo RTL (direita para esquerda)
- [ ] Pode ler em modo LTR (esquerda para direita)
- [ ] Modo Webtoon (scroll vertical) funciona

### Sincronização

- [ ] Manual Sync funciona (botão "Salvar no Firebase")
- [ ] Auto-save durante edições
- [ ] Dados persistem após refresh (F5)
- [ ] Offline indica no status
- [ ] Emergency save ao minimizar navegador

---

## 🚨 TROUBLESHOOTING

### ❌ "Permissão negada" ao salvar

**Solução:** Configure Firebase Security Rules

1. Firebase Console → Firestore Database → Rules
2. Cole esse código:

```firebase
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### ❌ Nenhum log aparecendo

**Checklist:**
- [ ] Dev server está rodando? (`npm run dev`)
- [ ] Login foi feito? (EON / 0130)
- [ ] Console do browser está aberto? (F12)
- [ ] Está criando dados? (tarefa, story, etc?)

### ❌ Dados não aparecem no Firestore Console

**Solução:**
1. Pressione F12 → Console
2. Procure por erros em vermelho
3. Se vir "PERMISSION_DENIED", configure as Security Rules
4. Se vir "NOT_FOUND", a collection ainda não foi criada

---

## 📊 ESTRUTURA DE DADOS NO FIREBASE

```
Firestore:
├── tasks
│   ├── default_user
│   │   ├── data: [...tasks]
│   │   └── lastSync: timestamp
├── stats
│   ├── default_user
│   │   ├── level: number
│   │   ├── totalXP: number
│   │   └── ... outros stats
├── books
├── stories
├── links
├── products
├── purchases
└── manga
    ├── manga_id_123
    │   ├── title: "Nome do Manga"
    │   ├── pageCount: number
    │   └── coverUrl: "gs://..."

Storage:
└── manga/
    └── default_user/
        └── manga_id_123/
            ├── 0_pagina-1.jpg
            ├── 1_pagina-2.jpg
            └── ... mais imagens
```

---

## 🎯 VERIFICAÇÕES ESPECÍFICAS

### Para cada collection:

#### Tasks
```
- Criar tarefa
- Editar tarefa
- Completar tarefa
- Checar logs: "✅ Firebase: Tasks salvas com sucesso!"
- Verificar em Firestore
```

#### Manga
```
- Clicar em "Manga" na sidebar
- Clicar em "Upload"
- Selecionar 2-3 imagens
- Clicar em "Upload para Firebase"
- Checar Firebase Storage em gs://controle-de-assinaturas.firebasestorage.app
- Ler o manga em modo RTL
- Ler o manga em modo Webtoon
```

---

## 🔧 COMANDOS ÚTEIS

### Verificar status do servidor
```bash
npm run dev
```

### Build para produção
```bash
npm run build
```

### Executar testes
```bash
node firebase-test.js
```

### Ver logs do git
```bash
git log --oneline -n 10
```

---

## 📝 NOTAS IMPORTANTES

1. **USER_ID é 'default_user'** por enquanto
   - Em produção, seria o ID do usuário autenticado

2. **Offline-first architecture**
   - Se Firebase estiver down, dados salvam em localStorage
   - Quando Firebase voltar online, sincroniza automaticamente

3. **Emergency saves em 4 eventos**
   - beforeunload (ao fechar aba)
   - visibilitychange (ao minimizar)
   - pagehide (ao navegar pra outra página)
   - blur (ao sair do foco da aba)

4. **Manga storage é separado**
   - Imagens ficam em Firebase Storage
   - Metadados ficam em Firestore collection "manga"

---

## ✨ SUCESSO!

Se você vir todos esses logs no Console:

```
🔥 Firebase: Salvando tasks...
📊 Salvando 1 tarefa(s)
Firestore write succeeded ✓
✅ Firebase: Tasks salvas com sucesso!
```

**Parabéns! Seu Firebase está funcionando perfeitamente! 🎉**

---

**Última atualização:** `git commit b74fa97` - Manga Reader integrado

**Próximo passo:** Testar a funcionalidade de Manga Upload
