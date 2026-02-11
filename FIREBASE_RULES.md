# 🔥 Configuração das Regras do Firebase Firestore

## ⚠️ IMPORTANTE: Configure as Regras de Segurança

Para o Firebase funcionar corretamente, você precisa configurar as regras de segurança do Firestore.

### 📋 Passo a Passo:

1. **Acesse o Firebase Console**:
   - Vá para: https://console.firebase.google.com/
   - Selecione o projeto: `controle-de-assinaturas`

2. **Navegue até Firestore Database**:
   - No menu lateral, clique em **Firestore Database**
   - Clique na aba **Regras** (Rules)

3. **Cole as seguintes regras**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura e escrita para todas as collections
    // (Modo de desenvolvimento - ajuste para produção)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

4. **Publique as regras**:
   - Clique em **Publicar** (Publish)

### 🔒 Regras de Produção (Recomendado depois):

Para produção, use regras mais seguras com autenticação:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir acesso apenas a documentos do próprio usuário
    match /tasks/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /stats/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /books/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /stories/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /links/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /products/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /purchases/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Permitir teste de conexão
    match /test/{document=**} {
      allow read, write: if true;
    }
  }
}
```

### ✅ Verificação

Após configurar as regras:
1. Recarregue a aplicação
2. Abra o console do navegador (F12)
3. Você deve ver:
   - ✅ Firebase: Tasks carregadas!
   - ✅ Firebase: Stats carregados!
   - ✅ Firebase: Books carregados!
   - etc.

### 🔧 Solução de Problemas

**Erro "unavailable" ou "permission-denied"?**
- ✅ Verifique se as regras foram publicadas
- ✅ Aguarde 1-2 minutos para propagação
- ✅ Recarregue a página completamente

**Erro de múltiplas abas?**
- ⚠️ O Firebase só permite persistência offline em uma aba por vez
- Feche outras abas do CRONOS

**Navegador não suporta persistência?**
- ⚠️ Use Chrome, Firefox ou Edge atualizados
- Safari pode ter limitações

### 📊 Verificar Dados no Firestore

1. No Firebase Console, vá em **Firestore Database**
2. Clique na aba **Dados** (Data)
3. Você verá as collections:
   - `tasks/default_user`
   - `stats/default_user`
   - `books/default_user`
   - etc.

### 🎯 Status Atual

O sistema já está configurado com:
- ✅ Persistência offline habilitada
- ✅ Cache ilimitado
- ✅ Fallback para localStorage
- ✅ Função `getDocWithFallback()` para buscar do cache quando offline

**Apenas configure as regras de segurança e está pronto!** 🚀
