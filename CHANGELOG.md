# Changelog

Todas as mudanças notáveis neste projeto serão documentadas aqui.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [1.0.0] - 2026-02-08

### 🎉 Lançamento Inicial

#### ✨ Adicionado
- **Sistema de Tarefas Completo**
  - Tarefas diárias com reset automático
  - Rotinas organizadas por período (Manhã, Tarde, Noite)
  - Sistema de prioridades (Baixa, Média, Alta)
  - Categorias customizadas
  - Sub-tarefas modulares com checklist

- **Sistema de Gamificação**
  - 17 níveis evolutivos (Big Bang → Futuro)
  - Sistema de XP por tarefas completadas
  - Recompensas progressivas
  - Universo visual isométrico que evolui

- **Timer Profissional Multi-Modo**
  - Modo Pomodoro (25min + 5min)
  - Modo Stopwatch (cronômetro)
  - Modo Countdown (temporizador)
  - XP por tempo trabalhado
  - Histórico de sessões

- **Fast Reader Dinâmico**
  - Suporte para TXT, PDF, EPUB
  - Controle de velocidade (WPM)
  - Personalização de fonte e tamanho
  - Salvamento automático de progresso
  - Gerenciamento de múltiplos livros

- **Story Builder Pro**
  - Editor completo de histórias
  - Sistema de versões
  - Contexto e personagens
  - Contador de palavras
  - Auto-save

- **Sistema de Shopping**
  - Cadastro de produtos
  - Registro de compras
  - Cálculo automático de lucro
  - Dashboard financeiro
  - Filtros por período (semana/mês)
  - Lucro líquido com desconto de 10%

- **Sistema de Persistência Robusto**
  - Firebase Firestore (nuvem)
  - LocalStorage (backup local)
  - Auto-backup a cada 5 minutos
  - Export/Import manual (.json)
  - Salvamento antes de fechar página
  - Fallback automático se offline

- **Design e UX**
  - Glassmorphism futurista
  - Paleta laranja/âmbar/fogo
  - Animações fluidas (Motion)
  - Totalmente responsivo (mobile-first)
  - PWA-ready

#### 🔧 Configuração e Deploy
- **Vercel Configuration**
  - `vercel.json` otimizado
  - Build automático
  - Cache agressivo de assets
  - Rewrites para SPA
  - Headers de segurança

- **Vite Optimization**
  - Code splitting
  - Chunk manual vendors
  - Minificação Terser
  - Source maps desabilitados em prod

- **Scripts de Deploy**
  - Pre-deploy check automático
  - Verificação de variáveis de ambiente
  - Validação de arquivos críticos
  - Resumo de erros/warnings

#### 📚 Documentação
- README.md completo
- DEPLOY.md (guia de deploy)
- QUICK-START.md (início rápido)
- CHANGELOG.md (este arquivo)
- .env.example (template de variáveis)

#### 🔐 Segurança
- Variáveis de ambiente
- Firebase rules configuráveis
- Headers de segurança (Vercel)
- CORS configurado
- Rate limiting (Firebase)

---

## [Unreleased]

### 🚀 Planejado para v1.1
- [ ] PWA completo com service worker
- [ ] Firebase Authentication
- [ ] Sistema de notificações push
- [ ] Sistema de conquistas
- [ ] Leaderboard global
- [ ] Dark mode toggle
- [ ] Temas customizáveis

### 🔮 Planejado para v2.0
- [ ] Mobile app (React Native)
- [ ] Modo colaborativo/multiplayer
- [ ] Integração com Google Calendar
- [ ] IA para sugestões de tarefas
- [ ] Sistema de hábitos
- [ ] Estatísticas avançadas
- [ ] Export para PDF
- [ ] API pública

---

## Tipos de Mudanças

- `Added` para novas funcionalidades
- `Changed` para mudanças em funcionalidades existentes
- `Deprecated` para funcionalidades que serão removidas
- `Removed` para funcionalidades removidas
- `Fixed` para correção de bugs
- `Security` para vulnerabilidades corrigidas

---

## Links

- [Repositório](https://github.com/seu-usuario/cronos)
- [Issues](https://github.com/seu-usuario/cronos/issues)
- [Pull Requests](https://github.com/seu-usuario/cronos/pulls)
- [Produção](https://seu-projeto.vercel.app)
