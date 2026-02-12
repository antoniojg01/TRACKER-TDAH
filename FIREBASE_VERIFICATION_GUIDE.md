## ✅ GUIA DE VERIFICAÇÃO DO FIREBASE

### 🔍 PASSO 1: Abra o console do navegador
1. Acesse http://localhost:5174/
2. Faça login com: **EON / 0130**
3. Pressione **F12** para abrir o DevTools
4. Vá para a aba **Console**

### 📊 PASSO 2: Verifique os logs de inicialização
Você deverá ver esses logs em VERDE:
```
🔥 Firebase inicializado com sucesso!
✅ Persistência offline ativada com suporte a múltiplas abas!
📦 Project ID: controle-de-assinaturas
🔄 Iniciando carregamento de dados do Firebase...
✅ Carregamento concluído!
```

### ✅ PASSO 3: Teste o salvamento automático
1. **Crie uma tarefa** (Dashboard > Adicionar Tarefa)
2. Verifique o console para:
   ```
   🔥 Firebase: Salvando tasks... 1
   ✅ Firebase: Tasks salvas com sucesso!
   ```

3. **Edite stats** (Complete uma tarefa, ganhará XP)
4. Verifique:
   ```
   🔥 Firebase: Salvando stats...
   ✅ Firebase: Stats salvos com sucesso!
   ```

### 🧪 PASSO 4: Teste manual de sincronização
Cole isto no console e pressione ENTER:
```javascript
window.testFirebaseConnection()
```

Você deve ver logs de teste de conexão.

### 📝 PASSO 5: Teste o botão "Salvar no Firebase"
1. Vá para **Dashboard**
2. Procure pelo botão **"🔥 Salvar no Firebase"**
3. Clique nele
4. Verifique os logs:
   ```
   🔥 === SALVANDO NO FIREBASE ===
   📊 Dados a salvar: {
     tasks: X,
     stats: "Level Y",
     books: X,
     stories: X,
     links: X,
     products: X,
     purchases: X
   }
   🔍 Verificando conexão com Firebase...
   📤 Enviando dados para Firebase...
   ✅ SUCESSO! Todos os dados salvos no Firebase!
   ```

### 🔗 COLLECTIONS NO FIRESTORE (esperadas):
- **tasks/default_user** - Suas tarefas
- **stats/default_user** - Seus stats/XP
- **books/default_user** - Seus livros
- **stories/default_user** - Suas histórias
- **links/default_user** - Seus links salvos
- **products/default_user** - Seus produtos
- **purchases/default_user** - Suas compras
- **manga/{mangaId}** - Seus mangás (metadados)

### 📦 FIREBASE STORAGE (esperado):
- **manga/{USER_ID}/{mangaId}/** - Imagens dos mangás

### ⚙️ VERIFICAR LOGS DE ERRO
Se houver erro, procure no console por:
```
❌ Firebase: Erro ao...
⚠️ Firebase: Não disponível
```

### 🆘 TROUBLESHOOTING
Se NADA estiver sendo salvo:
1. Verifique se você está logado (EON / 0130)
2. Pressione **F12** e vá para **Network**
3. Verifique se há chamadas para `firestore.googleapis.com`
4. Procure por erros com status `403` (permissões) ou `500` (servidor)

### ✨ SALVAMENTO AUTOMÁTICO ACONTECE EM:
- ✅ Toda mudança em tasks
- ✅ Toda mudança em stats
- ✅ Toda mudança em books
- ✅ Toda mudança em stories
- ✅ Toda mudança em links
- ✅ Toda mudança em products
- ✅ Toda mudança em purchases
- ✅ A cada 5 minutos (auto-backup)
- ✅ Ao sair da página (emergency save)
- ✅ Ao minimizar navegador
- ✅ Ao perder conexão (salva em localStorage)

### 🎯 FLUXO COMPLETO:
1. **Dados são salvos em Firebase automaticamente**
2. **Fallback para localStorage se Firebase estiver offline**
3. **Sincronização automática quando voltar online**
4. **Você sempre terá seus dados protegidos**

---

**Quer que eu execute um teste automático agora? [SIM/NÃO]**
