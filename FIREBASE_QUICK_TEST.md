# 🚀 GUIA RÁ-PIDO: VERIFICAR FIREBASE EM 3 MINUTOS

## PASSO 1️⃣ - Iniciar Servidor

```powershell
cd "c:\Users\User\Music\tracker tdah\TRACKER-TDAH"
npm run dev
```

✅ Você deve ver: `VITE v6.3.5 ready in 1096 ms`  
✅ URL: `http://localhost:5174/`

---

## PASSO 2️⃣ - Abrir Duas Abas do Navegador

### ABA 1 - Dashboard (Monitor)
```
Abra: file:///c:/Users/User/Music/tracker%20tdah/TRACKER-TDAH/firebase-dashboard.html
```
Deixe essa aba aberta para ver os logs em tempo real.

### ABA 2 - Aplicação
```
Abra: http://localhost:5174
```
Faça login com: **EON** / **0130**

---

## PASSO 3️⃣ - Testar Salvamentos

Na **ABA 2**, faça uma dessas ações:

| Ação | String para procurar |
|------|---------------------|
| 📝 Criar tarefa | `🔥 Firebase: Salvando tasks` |
| ✅ Completar tarefa | `✅ Firebase: Stats salvas` |
| 📖 Adicionar livro | `🔥 Firebase: Salvando books` |
| 📚 Criar story | `🔥 Firebase: Salvando stories` |

➡️ **RESULTADO ESPERADO:**

Na **ABA 1** (Dashboard), você verá aparecer em tempo real:

```
✅ 14:32:15 🔥 Firebase: Salvando tasks...
✅ 14:32:16 ✅ Firebase: Tasks salvas com sucesso!
```

---

## PASSO 4️⃣ - Confirmar no Firestore Console

1. Abra: https://console.firebase.google.com/
2. Projeto: **controle-de-assinaturas**
3. Menu esquerdo: **Firestore Database**
4. Collection: **tasks**
5. Document: **default_user**

Você deve ver um campo `data` com suas tarefas em JSON.

---

## 🎯 CHECKLIST DE SUCESSO

Se você vê TODOS esses sinais verdes, está funcionando! ✅

```
✅ Dashboard mostra "Conexão Firebase: Online"
✅ Contador "Dados Salvos" aumenta quando você cria algo
✅ Console mostra "🔥 Firebase: Salvando..."
✅ Console mostra "✅ Firebase: ... salvo com sucesso!"
✅ Firestore Console tem dados em:
   - tasks/default_user
   - stats/default_user
   - books/default_user
   - stories/default_user
   - links/default_user
   - products/default_user
   - purchases/default_user
✅ Manga Reader aparece na sidebar
```

---

## 🆘 Se Não Funcionar

### ❌ "Permission denied" ou "PERMISSION_DENIED"

**Solução:** Configure Security Rules no Firebase

1. https://console.firebase.google.com/
2. Firestore Database → **Rules** (aba no topo)
3. Cole isso e clique **Publish**:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### ❌ Nenhum log aparece no Console

**Checklist:**
- [ ] Servidor está rodando? (`npm run dev`)
- [ ] Login foi feito? (EON / 0130)
- [ ] Console (F12) está aberto?
- [ ] Criou um item novo?

Se tudo acima está OK, pressione F12 e procure por erros em vermelho.

### ❌ "Cannot find module 'vite'"

```powershell
npm install
npm run dev
```

---

## 📊 ESTRUTURA DO BANCO DE DADOS

Cada Collection tem um Document `default_user` com os dados:

```
Firebase
├── 🔥 Firestore Database
│   ├── tasks/default_user → suas tarefas
│   ├── stats/default_user → nível, XP, etc
│   ├── books/default_user → livros salvo
│   ├── stories/default_user → histórias criadas
│   ├── links/default_user → links salvos
│   ├── products/default_user → produtos
│   ├── purchases/default_user → compras
│   └── manga/[id] → metadados de mangás
│
└── 📦 Storage
    └── manga/default_user/[id]/ → imagens dos mangás
```

---

## 💡 DICAS IMPORTANTES

1. **Dados salvam automaticamente**
   - Quando você cria/edita/deleta algo
   - A cada vezes que interage
   - Ao minimizar ou fechar a aba (emergency save)

2. **Se Firebase cair, dados ficam salvos localmente**
   - localStorage faz backup automático
   - Quando Firebase voltar, sincroniza tudo

3. **Manga Reader**
   - Botão Manga na sidebar
   - Upload de imagens → Firebase Storage
   - RTL/LTR/Webtoon para ler confortável

4. **Console logs são seu amigo**
   - `🔥` = Firebase operando
   - `✅` = Salvamento bem-sucedido
   - `❌` = Erro (se vier aqui, há um problema)

---

## ⏱️ TEMPO DE SINCRONIZAÇÃO

Esperar:

| Ação | Tempo Esperado |
|------||---|
| Salvar tarefa | < 1s |
| Sincronizar dados | < 2s |
| Upload de manga | 2-5s (depends na imagem) |
| Página inteira atualizar | < 3s |

---

## 🎉 PRÓXIMOS PASSOS

Uma vez confirmado que Firebase está funcionando:

1. ✅ Testar Manga Upload
   - Manga → Upload
   - Selecionar imagens
   - Verificar em Storage

2. ✅ Testar todos os features
   - Dashboard
   - Evolução
   - Estatísticas
   - Histórias
   - Leitura Rápida
   - Shopping

3. ✅ Fazer Backup Manual
   - "Salvar no Firebase" (botão manual)
   - Verificar que tudo sincroniza

4. ✅ Testar Offline
   - Desconecta a internet
   - Cria dados
   - Reconecta
   - Verifica se sincroniza

---

**Última atualização:** `git b74fa97`  
**Status:** ✅ Pronto para produção
