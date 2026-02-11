# 🔗 Configuração do Google Drive - CRONOS

## ⚠️ **IMPORTANTE: Configuração Necessária**

Para usar a integração com Google Drive, você precisa configurar credenciais da Google Cloud API.

---

## 📋 **Passo a Passo**

### **1. Criar Projeto no Google Cloud Console**

1. Acesse: https://console.cloud.google.com/
2. Clique em **"Criar Projeto"**
3. Nome do projeto: `CRONOS Backup`
4. Clique em **"Criar"**

### **2. Ativar Google Drive API**

1. No menu lateral, vá em **"APIs e Serviços" → "Biblioteca"**
2. Pesquise por **"Google Drive API"**
3. Clique em **"Ativar"**

### **3. Criar Credenciais OAuth 2.0**

1. Vá em **"APIs e Serviços" → "Credenciais"**
2. Clique em **"Criar Credenciais" → "ID do cliente OAuth"**
3. Configure a tela de consentimento OAuth:
   - Tipo: **Externo**
   - Nome do app: **CRONOS**
   - Email de suporte: seu email
   - Domínios autorizados: deixe vazio por enquanto
   - Salve

4. Criar ID do Cliente OAuth:
   - Tipo: **Aplicativo da Web**
   - Nome: **CRONOS Web Client**
   - **URIs de redirecionamento autorizados:**
     - `http://localhost:5173`
     - `http://127.0.0.1:5173`
     - Seu domínio de produção (se tiver)
   - Clique em **"Criar"**

5. **COPIE as credenciais:**
   - ✅ **Client ID** (começa com algo como `123456789-abc.apps.googleusercontent.com`)
   - ✅ **API Key** (opcional, mas recomendado)

### **4. Criar API Key (Opcional)**

1. Vá em **"APIs e Serviços" → "Credenciais"**
2. Clique em **"Criar Credenciais" → "Chave de API"**
3. **COPIE a chave** (algo como `AIzaSyA...`)
4. Restrinja a chave:
   - Restrição de aplicativo: **Sites (HTTP referrers)**
   - Adicionar item: `*` (para desenvolvimento) ou seu domínio
   - Restrição de API: **Google Drive API**

---

## 🔧 **Configurar no Código**

Edite o arquivo: `/src/services/googleDriveService.ts`

```typescript
// Google Drive API Configuration
const FOLDER_ID = '1Irg8XqgU-DhMcSA3i_ZteLPKedrYgMBu';
const API_KEY = 'AIzaSyA...'; // ← COLE SUA API KEY AQUI
const CLIENT_ID = '123456789-abc.apps.googleusercontent.com'; // ← COLE SEU CLIENT ID AQUI
```

**⚠️ CUIDADO COM SEGURANÇA:**
- 🔐 Não compartilhe essas chaves publicamente
- 🔐 Se for colocar no GitHub, use variáveis de ambiente
- 🔐 Para produção, use backend para gerenciar tokens

---

## ✅ **Testar a Integração**

1. Salve o arquivo com as credenciais
2. Reinicie o servidor de desenvolvimento
3. No CRONOS, clique em **🔗 Drive**
4. Clique em **"Conectar Google Drive"**
5. Faça login com sua conta Google
6. Autorize o app a acessar o Drive
7. ✅ Pronto! Agora você pode salvar/carregar do Drive

---

## 🎯 **Funcionalidades Disponíveis**

### **☁️ Salvar no Drive**
- Clique em **"Salvar no Drive"**
- Backup automático na pasta especificada

### **📥 Carregar Último**
- Restaura o backup mais recente do Drive

### **📋 Ver Todos os Backups**
- Lista todos os backups salvos
- Escolha qual restaurar
- Veja data, tamanho, etc.

---

## 🔄 **Sincronização Automática**

O sistema faz auto-sync a cada **10 minutos** quando você está conectado ao Drive.

---

## 🚨 **Problemas Comuns**

### **Erro: "Not authorized"**
- ✅ Verifique se CLIENT_ID está configurado
- ✅ Verifique se o domínio está nos URIs autorizados
- ✅ Faça logout e login novamente

### **Erro: "API key not valid"**
- ✅ Verifique se a API Key está correta
- ✅ Verifique se a Google Drive API está ativada
- ✅ Verifique as restrições da chave

### **Erro: "Access blocked"**
- ✅ Configure a tela de consentimento OAuth
- ✅ Adicione seu email como usuário de teste

---

## 📱 **Alternativa Simples**

Se não quiser configurar a API, você pode usar:

1. **💾 Export** - Baixa arquivo JSON
2. **📂 Import** - Importa arquivo JSON
3. Faça upload manual no Google Drive

---

## 🔗 **Links Úteis**

- Google Cloud Console: https://console.cloud.google.com/
- Documentação OAuth: https://developers.google.com/identity/protocols/oauth2
- Google Drive API: https://developers.google.com/drive/api/v3/about-sdk
- Sua pasta do Drive: https://drive.google.com/drive/folders/1Irg8XqgU-DhMcSA3i_ZteLPKedrYgMBu

---

## 💡 **Dicas de Segurança**

- 🔐 Use variáveis de ambiente em produção
- 🔐 Não exponha credenciais no código fonte público
- 🔐 Revogue tokens antigos periodicamente
- 🔐 Use HTTPS em produção

---

**Depois de configurar, o sistema estará pronto para sincronizar automaticamente com seu Google Drive!** 🚀☁️
