/**
 * 🔥 FIREBASE MONITOR - Cole isso no Console (F12) da aplicação
 * 
 * Uso: Cole todo este código no Console (F12) da aplicação rodando em localhost:5174
 * Depois abra firebase-dashboard.html em outra aba para monitorar em tempo real
 * 
 * O que faz:
 * ✅ Intercepta todos os logs de Firebase
 * ✅ Envia para o localStorage para outra aba poder ler
 * ✅ Mostra alertas visuais para cada salvamento
 * ✅ Registra métricas de performance
 */

(function() {
  const SESSION_ID = 'SESSION_' + Math.random().toString(36).substr(2, 9).toUpperCase();
  window.FIREBASE_MONITOR = {
    sessionId: SESSION_ID,
    stats: {
      saves: 0,
      errors: 0,
      syncTime: 0,
      lastSaveTime: null
    }
  };

  // Estilo para notificações
  const style = document.createElement('style');
  style.textContent = `
    .firebase-toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 15px 20px;
      background: #1f2937;
      color: #fff;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      animation: slideInUp 0.3s ease;
      border-left: 4px solid #ff6b35;
      max-width: 400px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    
    .firebase-toast.success {
      border-left-color: #10b981;
      background: #064e3b;
    }
    
    .firebase-toast.error {
      border-left-color: #ef4444;
      background: #7f1d1d;
    }
    
    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);

  // Função para mostrar notificação
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `firebase-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideInUp 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Interceptar console.log
  const originalLog = console.log;
  console.log = function(...args) {
    const message = args.join(' ');
    
    // Enviar Firebase logs para localStorage
    if (message.includes('🔥') || message.includes('✅')) {
      const type = message.includes('✅') ? 'success' : 
                   message.includes('❌') ? 'error' : 
                   'info';
      
      localStorage.setItem(`${SESSION_ID}_FIREBASE_LOG`, JSON.stringify({
        type,
        message,
        timestamp: new Date().toLocaleTimeString('pt-BR')
      }));

      // Mostrar toast visual
      if (message.includes('Firebase')) {
        showToast(message, type);
      }

      // Registrar estatísticas
      if (message.includes('salvas com sucesso') || message.includes('saved successfully')) {
        window.FIREBASE_MONITOR.stats.saves++;
        window.FIREBASE_MONITOR.stats.lastSaveTime = new Date();
      }
    }
    
    return originalLog.apply(console, args);
  };

  // Interceptar console.error
  const originalError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    
    localStorage.setItem(`${SESSION_ID}_FIREBASE_LOG`, JSON.stringify({
      type: 'error',
      message,
      timestamp: new Date().toLocaleTimeString('pt-BR')
    }));

    showToast(`❌ ${message.substring(0, 50)}...`, 'error');
    window.FIREBASE_MONITOR.stats.errors++;
    
    return originalError.apply(console, args);
  };

  // Função para atualizar métricas
  window.FIREBASE_MONITOR.updateMetrics = function() {
    const metrics = {
      sessionId: SESSION_ID,
      stats: this.stats,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(`${SESSION_ID}_METRICS`, JSON.stringify(metrics));
    return metrics;
  };

  // Função para listar todos os logs capturados
  window.FIREBASE_MONITOR.getLogs = function() {
    try {
      const logs = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes(SESSION_ID) && key.includes('LOG')) {
          const data = JSON.parse(localStorage.getItem(key));
          logs.push(data);
        }
      }
      return logs;
    } catch (e) {
      console.error('Erro ao recuperar logs:', e);
      return [];
    }
  };

  // Função para limpar logs
  window.FIREBASE_MONITOR.clearLogs = function() {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.includes(SESSION_ID)) {
        localStorage.removeItem(key);
      }
    }
    showToast('✅ Logs limpos', 'success');
  };

  // Função para ver estatísticas
  window.FIREBASE_MONITOR.stats.toString = function() {
    return `
📊 FIREBASE MONITOR - Estatísticas
├── Sessão: ${SESSION_ID}
├── Total de Salvamentos: ${this.saves}
├── Erros: ${this.errors}
├── Último Salvamento: ${this.lastSaveTime ? this.lastSaveTime.toLocaleTimeString('pt-BR') : 'Nenhum'}
└── Taxa de Sucesso: ${this.saves > 0 ? ((this.saves / (this.saves + this.errors)) * 100).toFixed(1) % : 'N/A'}
    `;
  };

  // Mostrar informações iniciais
  console.log('%c🔥 FIREBASE MONITOR ATIVADO', 'color: #FF6B35; font-size: 16px; font-weight: bold;');
  console.log(`%cSessão: ${SESSION_ID}`, 'color: #667eea; font-size: 12px;');
  console.log('%cComandos disponíveis:', 'color: #10b981; font-size: 12px;');
  console.log(`%c
  • firebase_monitor.getLogs()      → Ver todos os logs capturados
  • firebase_monitor.stats          → Ver estatísticas
  • firebase_monitor.clearLogs()    → Limpar logs
  • firebase_monitor.updateMetrics()→ Atualizar métricas
  
  Abra firebase-dashboard.html em outra aba para monitorar em tempo real!
  `, 'color: #999; font-size: 11px; font-family: monospace;');

  // Exportar como firebase_monitor para fácil acesso
  window.firebase_monitor = window.FIREBASE_MONITOR;

  // Atualizar métricas a cada 5 segundos
  setInterval(() => {
    window.FIREBASE_MONITOR.updateMetrics();
  }, 5000);

})();

// Depois de colar esse código, você pode usar:
// firebase_monitor.getLogs()       - para ver os logs
// firebase_monitor.stats           - para ver estatísticas
// firebase_monitor.clearLogs()     - para limpar
