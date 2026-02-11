# 📦 Sistema de Backup e Exportação - CRONOS

## 🎯 Recursos Implementados

### ✅ **1. Google Drive Integration (🔗 Drive)** ⭐ NOVO!
- Sincronização **direta** com Google Drive
- Salvar/Carregar da pasta específica
- Auto-sync a cada 10 minutos
- Lista todos os backups salvos
- **REQUER CONFIGURAÇÃO** - Veja `GOOGLE_DRIVE_SETUP.md`

### ✅ **2. Export Manual (💾 Export)**
- Clique no botão **💾 Export** no dashboard
- Baixa arquivo JSON com todos os dados:
  - 📋 Todas as tarefas (DAILY + ROUTINE)
  - ⭐ Estatísticas e XP
  - 📚 Livros do FastReader
  - 🔗 Links salvos
- Nome do arquivo: `cronos_backup_YYYY-MM-DD.json`

### ✅ **3. Import Manual (📂 Import)**
- Clique no botão **📂 Import** 
- Selecione um arquivo de backup `.json`
- Confirma os dados e substitui tudo

### ✅ **4. Auto-Backup (💾 Automático)**
- Salva automaticamente a cada **5 minutos**
- Mantém os últimos **5 backups** no localStorage
- Não precisa fazer nada, é automático!

### ✅ **5. Sincronização Cloud (☁️ Supabase)**
- Sincroniza com Supabase em tempo real
- Botão mostra status:
  - 🟢 **Verde** = Sincronizado
  - 🟠 **Laranja** = Sincronizando
  - 🔴 **Vermelho** = Offline (clique para tentar sync)

---

## 📁 Como Salvar no Google Drive

### **⭐ Método 1: Integração Direta (MELHOR!)**

1. **Configure a API do Google Drive:**
   - Siga o guia completo em: `GOOGLE_DRIVE_SETUP.md`
   - Crie credenciais no Google Cloud Console
   - Configure CLIENT_ID e API_KEY

2. **No CRONOS:**
   - Clique em **🔗 Drive**
   - Clique em **"Conectar Google Drive"**
   - Faça login com sua conta Google
   - Autorize o acesso

3. **Use as funcionalidades:**
   - **☁️ Salvar no Drive** - Upload instantâneo
   - **📥 Carregar Último** - Restaura backup mais recente
   - **📋 Ver Todos** - Lista e escolha qual backup restaurar
   - **🔄 Auto-Sync** - Sincroniza a cada 10 minutos

### **Método 2: Manual (Sem configuração)**

1. **No CRONOS:**
   - Clique em **💾 Export**
   - Baixa arquivo `cronos_backup_2025-01-20.json`

2. **No Google Drive:**
   - Abra: https://drive.google.com/drive/folders/1Irg8XqgU-DhMcSA3i_ZteLPKedrYgMBu
   - Clique em **"Novo" → "Upload de arquivos"**
   - Selecione o arquivo `cronos_backup_*.json`
   - ✅ Pronto! Backup salvo no Drive

3. **Para Restaurar:**
   - Baixe o arquivo do Google Drive
   - No CRONOS, clique em **📂 Import**
   - Selecione o arquivo baixado
   - Confirme a restauração

### **Método 3: Automático com Google Drive Desktop**

1. **Instale o Google Drive Desktop:**
   - Windows/Mac: https://www.google.com/drive/download/
   - Configura sincronização automática

2. **Configure pasta de download:**
   - Configure seu navegador para baixar arquivos em:
   - `C:\Users\SeuNome\Google Drive\CRONOS\Backups`
   
3. **Exporte regularmente:**
   - Clique em **💾 Export** periodicamente
   - Arquivos vão automaticamente para o Drive

---

## 🔧 Diagnóstico de Problemas

### **Teste de Conexão com Supabase**

1. Abra o Console (F12)
2. Digite: `testCloudConnection()`
3. Veja os resultados dos testes

Isso mostra se o problema é:
- 🚨 Servidor offline
- 🔑 Chave de API inválida
- 🌐 Problema de CORS
- 📡 Problema de rede

---

## 📊 Formato do Backup

```json
{
  "version": "1.0.0",
  "timestamp": 1705776000000,
  "exportDate": "2025-01-20T12:00:00.000Z",
  "userId": "abc-123-def-456",
  "data": {
    "tasks": [...],
    "stats": {...},
    "books": [...],
    "links": [...]
  }
}
```

---

## 💡 Dicas

- **Export regularmente** antes de grandes mudanças
- **Mantenha backups antigos** no Drive para histórico
- **Nomeie arquivos** com datas para organização
- **Teste a restauração** periodicamente

---

## 🔒 Segurança

- ✅ Dados salvos localmente (localStorage)
- ✅ Sincronização cloud (Supabase)
- ✅ Backups automáticos (a cada 5 min)
- ✅ Export manual (Google Drive)
- ✅ Múltiplas camadas de proteção!
