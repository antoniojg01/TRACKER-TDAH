# 📁 GUIA: Como Organizar Seus Backups

## 🎯 RESUMO RÁPIDO

Ao clicar em **"💾 Export"**, o arquivo é baixado para sua **pasta Downloads**.

Depois você pode mover para onde quiser!

```
Export → Downloads → Move para pasta organizada
```

---

## 📂 ONDE SALVAR? (Sugestões)

### **Opção 1: Pasta Dedicada (RECOMENDADO)**

```
C:\Users\SeuNome\Documents\Backups\CRONOS\

✅ Organizado
✅ Fácil de encontrar
✅ Fácil de fazer backup da pasta toda
✅ Não se perde nos Downloads
```

**Como criar:**

```
1. Abra "Documentos" (Windows Explorer)
2. Clique direito → Novo → Pasta
3. Nome: "Backups"
4. Entre na pasta
5. Clique direito → Novo → Pasta
6. Nome: "CRONOS"
7. Pronto!
```

### **Opção 2: OneDrive / Google Drive (Backup na Nuvem)**

```
C:\Users\SeuNome\OneDrive\CRONOS\

OU

C:\Users\SeuNome\Google Drive\CRONOS\

✅ Sincroniza automaticamente na nuvem
✅ Acesso de qualquer lugar
✅ Proteção extra contra perda
```

### **Opção 3: Pendrive (Portátil)**

```
E:\CRONOS\

✅ Leva para onde quiser
✅ Transfere entre PCs facilmente
✅ Backup físico externo
```

### **Opção 4: Área de Trabalho (Rápido)**

```
C:\Users\SeuNome\Desktop\

✅ Fácil acesso visual
✅ Bom para testes
❌ Não recomendado a longo prazo (bagunça)
```

---

## 🔄 ROTINA RECOMENDADA

### **Toda Sexta-feira:**

```
1. Abra o CRONOS
2. Clique "💾 Export"
3. Navegue até: C:\Users\...\Documents\Backups\CRONOS\
4. Arquivo: cronos_backup_2026-01-20.json
5. Clique "Salvar"
6. Pronto! Backup feito ✅
```

### **Todo Mês:**

```
1. Copie a pasta CRONOS inteira
2. Cole em pendrive OU OneDrive
3. Tenha cópia extra de segurança
4. Delete backups com +3 meses (opcional)
```

---

## 💡 DICAS PRO

### **1. Use nomes descritivos (se quiser)**

```
Ao salvar, você pode renomear:

cronos_backup_2026-01-20.json
    ↓ RENOMEAR
cronos_backup_2026-01-20_pre-migracao.json
cronos_backup_2026-01-20_level5.json
cronos_backup_2026-01-20_80tarefas.json
```

### **2. Crie subpastas por mês**

```
CRONOS/
  ├── 2026-01/
  │   ├── cronos_backup_2026-01-06.json
  │   ├── cronos_backup_2026-01-13.json
  │   └── cronos_backup_2026-01-20.json
  ├── 2026-02/
  │   └── ...
  └── 2026-03/
      └── ...
```

### **3. Configure atalho de teclado (Windows)**

```
1. Crie atalho para pasta CRONOS na Área de Trabalho
2. Ao salvar, clique no atalho na barra lateral
3. Acesso rápido!
```

### **4. Backup duplo em 2 locais**

```
Sexta-feira:
  1. Export → Documentos/CRONOS/
  2. Copia para OneDrive/CRONOS/
  
Resultado: 2 cópias (local + nuvem) ✅
```

---

## 🆘 PROBLEMAS E SOLUÇÕES

### **Problema 1: "Não aparece diálogo de Salvar Como"**

**Solução:**

```
Chrome/Edge:
  → Verifique se não bloqueou downloads do site
  → chrome://settings/content/automaticDownloads
  → Permitir para o site do CRONOS

Firefox:
  → Configurações → Geral → Downloads
  → Marcar "Sempre perguntar onde salvar"
```

### **Problema 2: "Não consigo navegar para outras pastas"**

**Solução:**

```
✅ Use Chrome ou Edge (melhor suporte)
❌ No Firefox, configure "Sempre perguntar"
✅ Ou salve em Downloads e mova depois
```

### **Problema 3: "O arquivo vai sempre para Downloads"**

**Solução:**

```
Firefox:
  1. Configurações → Geral
  2. Downloads → "Sempre perguntar onde salvar"
  3. Agora vai perguntar toda vez!

Chrome:
  1. Configurações → Downloads
  2. Marque "Perguntar onde salvar cada arquivo antes de baixar"
  3. Pronto!
```

### **Problema 4: "Não encontro o arquivo depois de salvar"**

**Solução:**

```
1. Procure em: C:\Users\SeuNome\Downloads\
   → É o local padrão se não escolheu outro

2. Use a busca do Windows:
   → Win + S
   → Digite: cronos_backup
   → Vai encontrar todos os backups

3. Verifique "Downloads Recentes"
   → Abra pasta Downloads
   → Organize por "Data de modificação"
```

---

## 📊 COMPARAÇÃO: Chrome vs Firefox

| Recurso | Chrome/Edge | Firefox/Safari |
|---------|-------------|----------------|
| **Diálogo moderno** | ✅ Sim | ❌ Não |
| **Navegar pastas** | ✅ Sim | ⚠️ Com config |
| **Escolher local** | ✅ Sim | ⚠️ Com config |
| **Criar pastas** | ✅ Sim | ❌ Não |
| **Facilidade** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**Recomendação:** Use **Chrome ou Edge** para melhor experiência!

---

## 🎯 CHECKLIST: Primeira Vez

### **Configuração Inicial (5 minutos):**

```
[ ] 1. Crie pasta: C:\Users\...\Documents\Backups\CRONOS\

[ ] 2. Configure navegador:
       Chrome → Configurações → Downloads → Perguntar onde salvar
       Firefox → Configurações → Geral → Sempre perguntar

[ ] 3. Faça primeiro Export:
       → Clique "💾 Export"
       → Navegue até pasta CRONOS
       → Salve

[ ] 4. Verifique se arquivo foi salvo:
       → Abra a pasta
       → Veja o cronos_backup_XXXX.json

[ ] 5. Teste Import:
       → Clique "📂 Import"
       → Selecione o arquivo que acabou de salvar
       → Confirme

[ ] 6. Tudo funcionou? Pronto! ✅
```

---

## ✅ RESUMO FINAL

### **No Chrome/Edge:**
```
1. Clica "💾 Export"
2. Navega para pasta desejada
3. Salva
4. Pronto!
```

### **No Firefox/Safari:**
```
1. Configure "Sempre perguntar"
2. Clica "💾 Export"
3. Escolhe local
4. Salva
5. Pronto!
```

### **OU (mais simples):**
```
1. Clica "💾 Export"
2. Vai para Downloads
3. Move para pasta CRONOS depois
4. Pronto!
```

---

## 🎉 CONCLUSÃO

**Você TEM CONTROLE TOTAL sobre onde salvar seus backups!**

- ✅ No Chrome/Edge: Controle total nativo
- ✅ No Firefox/Safari: Configure uma vez, funciona sempre
- ✅ Qualquer navegador: Sempre pode mover depois

**Agora você sabe exatamente como escolher onde salvar!** 🚀

**Dica Final:** Crie a pasta `Documents/Backups/CRONOS/` e use sempre ela. Simples e organizado! 📁