import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Task, UserStats, Period, PriorityLevel, TaskCategory, LevelInfo, NebulaTheme, SavedLink, Book, Story, Product, PurchaseItem } from '@/types';
import { LEVELS, XP_COMPLETED, XP_CYCLE, XP_GAVE_UP, XP_IGNORED, XP_STEP, XP_TIME_BLOCK } from '@/constants';
import { getLevelNarrative } from '@/services/geminiService';
import { 
  saveTasks, 
  loadTasks, 
  deleteTask as deleteTaskFromDB, 
  saveStats, 
  loadStats, 
  saveBooks, 
  loadBooks,
  saveStories,
  loadStories,
  saveLinks,
  loadLinks,
  saveProducts,
  loadProducts,
  savePurchases,
  loadPurchases,
  forceFirebaseSync,
  migrateFromLocalStorage
} from '@/services/firebaseService';
import { exportBackup, importBackup, restoreFromBackup, autoBackup } from '@/services/backupService';
import GoogleDrivePanel from '@/app/components/GoogleDrivePanel';
import TimerModal from '@/app/components/TimerModal';
import UniverseVisual from '@/app/components/UniverseVisual';
import FastReader from '@/app/components/FastReader';
import MangaReader from '@/app/components/MangaReader';
import { StoryBuilder } from '@/app/components/StoryBuilder';

// Expose Firebase sync function to window for debugging
if (typeof window !== 'undefined') {
  (window as any).testFirebaseConnection = forceFirebaseSync;
}

type MainView = 'DASHBOARD' | 'EVOLUTION' | 'STATISTICS' | 'LINKS' | 'READER' | 'MANGA' | 'STORIES' | 'SHOPPING';

const PERIODS: Period[] = [
  { id: 'p1', name: 'Manhã' }, 
  { id: 'p2', name: 'Tarde' }, 
  { id: 'p3', name: 'Noite' },
  { id: 'p4', name: '♾️ Constantes' }
];

const ENCOURAGEMENTS = [
  "O Universo vibra com sua nova frequência.",
  "As estrelas se alinham ao seu comando.",
  "Você transcendeu as limitações da matéria.",
  "Sua luz atravessa as nébulas do tempo.",
  "A sincronia perfeita foi estabelecida."
];

const NEBULA_PRESETS: NebulaTheme[] = [
  { name: 'Vácuo Índigo', primary: '#4338ca', secondary: '#1e1b4b' },
  { name: 'Supernova Rubi', primary: '#e11d48', secondary: '#4c0519' },
  { name: 'Aurora Esmeralda', primary: '#10b981', secondary: '#064e3b' },
  { name: 'Névoa Dourada', primary: '#f59e0b', secondary: '#78350f' },
  { name: 'Abismo Cinzento', primary: '#475569', secondary: '#0f172a' },
  { name: 'Plasma Violeta', primary: '#a855f7', secondary: '#3b0764' },
];

const App: React.FC = () => {
  type SaveTimerKey = 'tasks' | 'stats' | 'books' | 'stories' | 'links' | 'products' | 'purchases';

  // Login States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<UserStats>({ 
    xp: 0, 
    level: 1, 
    completedCount: 0, 
    gaveUpCount: 0, 
    ignoredCount: 0, 
    timeLogs: [], 
    nebulaTheme: NEBULA_PRESETS[0] 
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const [mainView, setMainView] = useState<MainView>('DASHBOARD');
  const [narrative, setNarrative] = useState('');
  const [isLoadingNarrative, setIsLoadingNarrative] = useState(false);
  const [activeTaskIds, setActiveTaskIds] = useState<string[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'DAILY' | 'ROUTINE'>('DAILY');
  const [levelUpData, setLevelUpData] = useState<LevelInfo | null>(null);
  const [showDrivePanel, setShowDrivePanel] = useState(false);
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<PriorityLevel>(2);
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>('WORK');
  const [newTaskRequiresInput, setNewTaskRequiresInput] = useState(false);
  const [newTaskStepInput, setNewTaskStepInput] = useState('');
  const [newTaskSteps, setNewTaskSteps] = useState<string[]>([]);

  const [selectedPeriodForAdd, setSelectedPeriodForAdd] = useState('p1');
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [cloudStatus, setCloudStatus] = useState<'synced' | 'syncing' | 'offline'>('syncing');
  const [savedLinks, setSavedLinks] = useState<SavedLink[]>([]);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkCategory, setNewLinkCategory] = useState<SavedLink['category']>('OTHER');
  const [books, setBooks] = useState<Book[]>([]);
  const [stories, setStories] = useState<Story[]>([]);

  // Shopping states
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [pricePaid, setPricePaid] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'week' | 'month'>('month');

  const saveTimersRef = useRef<Record<SaveTimerKey, ReturnType<typeof setTimeout> | null>>({
    tasks: null,
    stats: null,
    books: null,
    stories: null,
    links: null,
    products: null,
    purchases: null
  });

  const scheduleSave = (key: SaveTimerKey, saveFn: () => void, localSaveFn?: () => void) => {
    const timers = saveTimersRef.current;
    if (timers[key]) {
      clearTimeout(timers[key] as ReturnType<typeof setTimeout>);
    }

    timers[key] = setTimeout(() => {
      saveFn();
      if (localSaveFn) localSaveFn();
    }, 800);
  };

  const currentLevel = useMemo(() => LEVELS.find(l => l.level === stats.level) || LEVELS[0], [stats.level]);
  const nextLevel = useMemo(() => LEVELS.find(l => l.level === stats.level + 1), [stats.level]);

  // Login Logic
  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'EON' && password === '0130') {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
    } else {
      alert('Credenciais inválidas. Tente novamente.');
    }
  };
  
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    setUsername('');
    setPassword('');
  };

  // Calculate period totals for purchases
  const periodTotals = useMemo(() => {
    const now = new Date();
    const startOfPeriod = new Date();
    
    if (periodFilter === 'week') {
      // Start of current week (Sunday)
      const dayOfWeek = now.getDay();
      startOfPeriod.setDate(now.getDate() - dayOfWeek);
      startOfPeriod.setHours(0, 0, 0, 0);
    } else {
      // Start of current month
      startOfPeriod.setDate(1);
      startOfPeriod.setHours(0, 0, 0, 0);
    }

    const filteredPurchases = purchases.filter(p => p.createdAt >= startOfPeriod.getTime());
    
    const totalPaid = filteredPurchases.reduce((sum, p) => sum + p.pricePaid, 0);
    const totalSale = filteredPurchases.reduce((sum, p) => sum + p.salePrice, 0);
    const totalProfit = filteredPurchases.reduce((sum, p) => sum + p.profit, 0);
    const totalCompanyDiscount = filteredPurchases.reduce((sum, p) => sum + (p.profit * 0.1), 0);
    const netProfit = totalProfit - totalCompanyDiscount;
    const count = filteredPurchases.length;

    return { totalPaid, totalSale, totalProfit, totalCompanyDiscount, netProfit, count };
  }, [purchases, periodFilter]);

  // Initialize Firebase connection check
  useEffect(() => {
    const checkFirebaseConnection = async () => {
      const isOnline = await forceFirebaseSync();
      setCloudStatus(isOnline ? 'synced' : 'offline');
    };
    checkFirebaseConnection();
  }, []);

  // Auto-reset routines at midnight
  useEffect(() => {
    const checkAndResetRoutines = () => {
      const today = new Date().toDateString();
      const lastCheck = localStorage.getItem('cronos_last_routine_check');
      
      if (lastCheck !== today) {
        // New day detected - reset all routines
        setTasks(prev => prev.map(t => {
          if (t.type === 'ROUTINE' && t.status !== 'PENDING') {
            const lastDone = t.lastDone ? new Date(t.lastDone).toDateString() : null;
            if (lastDone !== today) {
              return {
                ...t,
                status: 'PENDING',
                currentInput: '',
                lastDone: undefined,
                completedAt: undefined,
                steps: t.steps?.map(s => ({ ...s, completed: false })) || []
              };
            }
          }
          return t;
        }));
        
        localStorage.setItem('cronos_last_routine_check', today);
      }
    };

    // Check immediately on mount
    checkAndResetRoutines();

    // Check every minute for date change
    const interval = setInterval(checkAndResetRoutines, 60000);

    return () => clearInterval(interval);
  }, []);

  // Load data from Firebase on mount (com fallback para localStorage)
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      console.log('🔄 Iniciando carregamento de dados do Firebase...');
      
      try {
        // Tentar carregar do Firebase
        const [loadedStats, loadedTasks, loadedBooks, loadedStories, loadedLinks, loadedProducts, loadedPurchases] = await Promise.all([
          loadStats(),
          loadTasks(),
          loadBooks(),
          loadStories(),
          loadLinks(),
          loadProducts(),
          loadPurchases()
        ]);

        // Aplicar dados carregados do Firebase
        let finalStats = loadedStats;
        let finalTasks = loadedTasks;
        let finalBooks = loadedBooks;
        let finalStories = loadedStories;
        let finalLinks = loadedLinks;
        let finalProducts = loadedProducts;
        let finalPurchases = loadedPurchases;

        // Aplicar dados carregados
        if (finalStats) {
          setStats(finalStats);
          console.log('📊 Stats carregados:', finalStats);
        }

        if (finalBooks && finalBooks.length > 0) {
          setBooks(finalBooks);
          console.log('📚 Books carregados:', finalBooks.length);
        }

        if (finalStories && finalStories.length > 0) {
          setStories(finalStories);
          console.log('📖 Stories carregadas:', finalStories.length);
        }

        // Load saved links from Firebase
        if (finalLinks && finalLinks.length > 0) {
          setSavedLinks(finalLinks);
          console.log('🔗 Links carregados:', finalLinks.length);
        }

        // Load products and purchases from Firebase
        if (finalProducts && finalProducts.length > 0) {
          setProducts(finalProducts);
          console.log('📦 Products carregados:', finalProducts.length);
        }
        if (finalPurchases && finalPurchases.length > 0) {
          setPurchases(finalPurchases);
          console.log('🛒 Purchases carregados:', finalPurchases.length);
        }

        if (finalTasks && finalTasks.length > 0) {
          const today = new Date().toDateString();
          const validPeriodIds = PERIODS.map(p => p.id);
          
          const processedTasks = finalTasks.map((t): Task => {
            if (!t.periodId || !validPeriodIds.includes(t.periodId)) {
              t.periodId = 'p1';
            }
            const lastDate = t.lastDone ? new Date(t.lastDone).toDateString() : null;

            if (t.type === 'ROUTINE' && t.status !== 'PENDING' && lastDate !== today) {
              return { 
                ...t, 
                status: 'PENDING', 
                currentInput: '', 
                lastDone: undefined,
                completedAt: undefined,
                steps: t.steps?.map(s => ({ ...s, completed: false })) || []
              };
            }
            return t;
          }).filter(t => {
            if (t.type === 'DAILY' && t.status !== 'PENDING' && t.lastDone) {
              return new Date(t.lastDone).toDateString() === today;
            }
            return true; 
          });

          setTasks(processedTasks);
          console.log('✅ Tasks processadas e carregadas:', processedTasks.length);
        } else {
          console.log('⚠️ Nenhuma task encontrada');
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        
        // 🔥 FALLBACK TOTAL: Se tudo falhar, carregar do localStorage
        console.log('🆘 Tentando recuperação total do localStorage...');
        try {
          const localStats = localStorage.getItem('cronos_stats');
          const localTasks = localStorage.getItem('cronos_tasks');
          const localBooks = localStorage.getItem('cronos_books');
          
          if (localStats) setStats(JSON.parse(localStats));
          if (localTasks) setTasks(JSON.parse(localTasks));
          if (localBooks) setBooks(JSON.parse(localBooks));
          
          console.log('✅ Dados recuperados do localStorage após erro!');
        } catch (fallbackError) {
          console.error('❌ Erro no fallback do localStorage:', fallbackError);
        }
      } finally {
        setIsLoading(false);
        console.log('✅ Carregamento concluído!');
      }
    };

    loadData();
  }, []);

  // Save tasks to Firebase whenever they change
  useEffect(() => {
    if (!isLoading && tasks.length >= 0) {
      scheduleSave(
        'tasks',
        () => saveTasks(tasks),
        () => localStorage.setItem('cronos_tasks', JSON.stringify(tasks))
      );
    }
  }, [tasks, isLoading]);

  // Save stats to Firebase whenever they change
  useEffect(() => {
    if (!isLoading) {
      scheduleSave(
        'stats',
        () => saveStats(stats),
        () => localStorage.setItem('cronos_stats', JSON.stringify(stats))
      );
    }
  }, [stats, isLoading]);

  // Auto-backup every 5 minutes
  useEffect(() => {
    if (isLoading) return;
    
    const interval = setInterval(() => {
      autoBackup(tasks, stats, books, savedLinks, products, purchases);
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [tasks, stats, books, savedLinks, isLoading]);

  // 🔥 CRÍTICO: Salvar dados ANTES de sair da página (PC, mobile, tablet)
  useEffect(() => {
    // Função para forçar salvamento imediato
    const forceSave = () => {
      console.log('🚨 SALVAMENTO EMERGENCIAL - Usuário saindo da página!');
      
      // Salvar TUDO no localStorage IMEDIATAMENTE (síncrono)
      try {
        localStorage.setItem('cronos_tasks', JSON.stringify(tasks));
        localStorage.setItem('cronos_stats', JSON.stringify(stats));
        localStorage.setItem('cronos_books', JSON.stringify(books));
        localStorage.setItem('cronos_stories', JSON.stringify(stories));
        localStorage.setItem('cronos_links', JSON.stringify(savedLinks));
        localStorage.setItem('cronos_products', JSON.stringify(products));
        localStorage.setItem('cronos_purchases', JSON.stringify(purchases));
        console.log('✅ Dados salvos com sucesso no localStorage!');
      } catch (error) {
        console.error('❌ ERRO ao salvar dados:', error);
      }
      
      // Tentar salvar na nuvem também (pode não completar se o usuário fechar rápido)
      saveTasks(tasks).catch(() => {});
      saveStats(stats).catch(() => {});
      saveBooks(books).catch(() => {});
      saveStories(stories).catch(() => {});
      saveLinks(savedLinks).catch(() => {});
      saveProducts(products).catch(() => {});
      savePurchases(purchases).catch(() => {});
    };

    // 1. beforeunload: Quando o usuário fecha a aba/janela ou navega para outro site
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      forceSave();
      
      // Aviso ao usuário (alguns navegadores mostram, outros não)
      // Apenas mostra se houver mudanças não salvas
      if (tasks.some(t => t.status === 'IN_PROGRESS')) {
        e.preventDefault();
        return (e.returnValue = 'Você tem tarefas em andamento. Tem certeza que deseja sair?');
      }
    };

    // 2. visibilitychange: Quando o usuário muda de aba ou minimiza o navegador
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('👁️ Página ficou invisível - salvando dados...');
        forceSave();
      }
    };

    // 3. pagehide: Quando a página está sendo descarregada (especialmente importante no mobile)
    const handlePageHide = (e: PageTransitionEvent) => {
      console.log('📱 Página sendo descarregada (mobile/tablet) - salvando...');
      forceSave();
    };

    // 4. blur: Quando a janela perde foco
    const handleBlur = () => {
      console.log('🔍 Janela perdeu foco - salvando por precaução...');
      forceSave();
    };

    // Registrar todos os event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('blur', handleBlur);

    // Cleanup ao desmontar
    return () => {
      // Salvar uma última vez ao desmontar o componente
      forceSave();
      
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('blur', handleBlur);
    };
  }, [tasks, stats, books, stories, savedLinks, products, purchases, isLoading]);

  useEffect(() => {
    if ((window as any).hideAppLoader) (window as any).hideAppLoader();
  }, []);

  // Save books to Firebase whenever they change
  useEffect(() => {
    if (!isLoading && books.length >= 0) {
      scheduleSave('books', () => saveBooks(books));
    }
  }, [books, isLoading]);

  // Save links to Firebase whenever they change
  useEffect(() => {
    if (!isLoading && savedLinks.length >= 0) {
      scheduleSave('links', () => saveLinks(savedLinks));
    }
  }, [savedLinks, isLoading]);

  // Save stories to Firebase whenever they change
  useEffect(() => {
    if (!isLoading && stories.length >= 0) {
      scheduleSave(
        'stories',
        () => saveStories(stories),
        () => localStorage.setItem('cronos_stories', JSON.stringify(stories))
      );
    }
  }, [stories, isLoading]);

  // Save products to Firebase whenever they change
  useEffect(() => {
    if (!isLoading && products.length >= 0) {
      scheduleSave('products', () => saveProducts(products));
    }
  }, [products, isLoading]);

  // Save purchases to Firebase whenever they change
  useEffect(() => {
    if (!isLoading && purchases.length >= 0) {
      scheduleSave(
        'purchases',
        () => savePurchases(purchases),
        () => localStorage.setItem('cronos_purchases', JSON.stringify(purchases))
      );
    }
  }, [purchases, isLoading]);

  useEffect(() => {
    if (mainView === 'EVOLUTION' && !narrative) loadNarrative();
  }, [mainView, stats.level]);

  const loadNarrative = async () => {
    setIsLoadingNarrative(true);
    const text = await getLevelNarrative(currentLevel);
    setNarrative(text);
    setIsLoadingNarrative(false);
  };

  const exportData = () => {
    const data = {
      tasks,
      stats,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cronos_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.tasks && imported.stats) {
          if (confirm("Isso substituirá todos os seus dados atuais. Continuar?")) {
            setTasks(imported.tasks);
            setStats(imported.stats);
            alert("Protocolo restaurado com sucesso!");
          }
        } else {
          alert("Arquivo de backup inválido.");
        }
      } catch (err) {
        alert("Erro ao ler o arquivo de backup.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const updateStats = (xpChange: number, status: string, secondsSpent: number = 0, specificTask?: Task) => {
    setStats(prev => {
      let newXp = Math.max(0, (prev.xp || 0) + xpChange);
      const levelFound = LEVELS.filter(l => l.xpRequired <= newXp).pop();
      let newLevel = levelFound ? levelFound.level : 1;
      
      if (newLevel > prev.level) {
        setLevelUpData(levelFound || null);
      }

      const newLog = secondsSpent > 0 ? {
        timestamp: Date.now(),
        seconds: secondsSpent,
        taskId: specificTask?.id || 'unknown',
        taskTitle: specificTask?.title || 'Sincronia'
      } : null;

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        completedCount: status === 'COMPLETED' ? (prev.completedCount || 0) + 1 : (prev.completedCount || 0),
        gaveUpCount: status === 'GAVE_UP' ? (prev.gaveUpCount || 0) + 1 : (prev.gaveUpCount || 0),
        ignoredCount: status === 'IGNORED' ? (prev.ignoredCount || 0) + 1 : (prev.ignoredCount || 0),
        timeLogs: newLog ? [newLog, ...(prev.timeLogs || [])].slice(0, 100) : (prev.timeLogs || [])
      };
    });
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = { 
      id: crypto.randomUUID(), 
      title: newTaskTitle, 
      type: activeSubTab, 
      category: newTaskCategory,
      priority: newTaskPriority,
      completionMode: 'TIMER',
      requiresInput: newTaskRequiresInput,
      currentInput: '',
      status: 'PENDING', 
      createdAt: Date.now(),
      periodId: selectedPeriodForAdd,
      steps: newTaskSteps.map(s => ({ id: crypto.randomUUID(), title: s, completed: false }))
    };
    
    console.log(`➕ Adding ${activeSubTab} task:`, newTask.title);
    setTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
    setNewTaskSteps([]);
  };

  const addStepToNewTask = () => {
    if (!newTaskStepInput.trim()) return;
    setNewTaskSteps(prev => [...prev, newTaskStepInput.trim()]);
    setNewTaskStepInput('');
  };

  const removeStepFromNewTask = (index: number) => {
    setNewTaskSteps(prev => prev.filter((_, i) => i !== index));
  };

  const resetAllRoutines = () => {
    if(!confirm("Reiniciar todas as rotinas para hoje?")) return;
    setTasks(prev => prev.map(t => 
      t.type === 'ROUTINE' 
        ? { 
            ...t, 
            status: 'PENDING', 
            currentInput: '', 
            lastDone: undefined, 
            completedAt: undefined,
            steps: t.steps?.map(s => ({ ...s, completed: false })) || []
          } 
        : t
    ));
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const toggleStep = (taskId: string, stepId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const newSteps = task.steps?.map(step => {
          if (step.id === stepId) {
            const newStatus = !step.completed;
            if (newStatus) updateStats(XP_STEP, 'STEP_COMPLETED', 0, task);
            else updateStats(-XP_STEP, 'STEP_UNCHECKED', 0, task);
            return { ...step, completed: newStatus };
          }
          return step;
        });
        return { ...task, steps: newSteps };
      }
      return task;
    }));
  };

  const handleTaskAction = (status: 'COMPLETED' | 'CYCLE_FINISHED' | 'GAVE_UP' | 'IGNORED', seconds: number, taskOverride: Task) => {
    let xp = 0;
    if (status === 'COMPLETED') xp = XP_COMPLETED;
    else if (status === 'CYCLE_FINISHED') xp = XP_CYCLE;
    else if (status === 'GAVE_UP') xp = XP_GAVE_UP;
    else if (status === 'IGNORED') xp = XP_IGNORED;
    
    updateStats(xp, status, seconds, taskOverride);
    
    setTasks(prev => prev.map(t => {
      if (t.id === taskOverride.id) {
        return { 
          ...t, 
          status: status === 'COMPLETED' ? 'COMPLETED' : t.status,
          lastDone: Date.now(), 
          completedAt: status === 'COMPLETED' ? Date.now() : t.completedAt 
        };
      }
      return t;
    }));

    setActiveTaskIds(prev => prev.filter(id => id !== taskOverride.id));
    
    if (status === 'COMPLETED') {
      setExpandedTasks(prev => {
        const newState = { ...prev };
        delete newState[taskOverride.id];
        return newState;
      });
    }
  };

  const toggleTaskTimer = (taskId: string) => {
    setActiveTaskIds(prev => prev.includes(taskId) ? prev : [...prev, taskId]);
  };

  const restoreTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    updateStats(-XP_COMPLETED, 'RESTORED', 0, task);
    setTasks(prev => prev.map(t => t.id === taskId ? { 
      ...t, 
      status: 'PENDING', 
      lastDone: undefined, 
      completedAt: undefined,
      steps: t.steps?.map(s => ({ ...s, completed: false })) || []
    } : t));
  };

  const formatSeconds = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  const changeNebulaTheme = (theme: Partial<NebulaTheme>) => {
    setStats(prev => ({
      ...prev,
      nebulaTheme: { ...prev.nebulaTheme!, ...theme }
    }));
  };

  const addSavedLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkUrl.trim() || !newLinkTitle.trim()) return;

    const newLink: SavedLink = {
      id: crypto.randomUUID(),
      url: newLinkUrl,
      title: newLinkTitle,
      category: newLinkCategory,
      createdAt: Date.now()
    };

    setSavedLinks(prev => [...prev, newLink]);
    setNewLinkUrl('');
    setNewLinkTitle('');
    setNewLinkCategory('OTHER');
  };

  const deleteSavedLink = (id: string) => {
    setSavedLinks(prev => prev.filter(link => link.id !== id));
  };

  const handleSaveBook = (book: Book) => {
    console.log(`📚 ${book.completed ? 'Updating' : 'Adding'} book:`, book.title);
    setBooks(prev => {
      const exists = prev.find(b => b.id === book.id);
      if (exists) {
        return prev.map(b => b.id === book.id ? book : b);
      }
      return [...prev, book];
    });
  };

  const handleDeleteBook = (id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id));
  };

  const handleSaveStory = (story: Story) => {
    console.log(`✍️ ${story.updatedAt > story.createdAt ? 'Updating' : 'Adding'} story:`, story.title);
    setStories(prev => {
      const exists = prev.find(s => s.id === story.id);
      if (exists) {
        return prev.map(s => s.id === story.id ? story : s);
      }
      return [...prev, story];
    });
  };

  const handleDeleteStory = (id: string) => {
    setStories(prev => prev.filter(s => s.id !== id));
  };

  // Shopping handlers
  const handleAddProduct = () => {
    if (!newProductName.trim() || !newProductPrice.trim()) return;

    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: newProductName.trim(),
      salePrice: parseFloat(newProductPrice),
      createdAt: Date.now()
    };

    setProducts(prev => [...prev, newProduct]);
    setNewProductName('');
    setNewProductPrice('');
    setShowAddProduct(false);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    // Also remove any purchases with this product
    setPurchases(prev => prev.filter(p => p.productId !== id));
  };

  const handleAddPurchase = () => {
    if (!selectedProductId || !pricePaid.trim()) return;

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const paid = parseFloat(pricePaid);
    const profit = product.salePrice - paid;

    const newPurchase: PurchaseItem = {
      id: crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      pricePaid: paid,
      salePrice: product.salePrice,
      profit: profit,
      createdAt: Date.now()
    };

    setPurchases(prev => [...prev, newPurchase]);
    setSelectedProductId('');
    setPricePaid('');
  };

  const handleDeletePurchase = (id: string) => {
    setPurchases(prev => prev.filter(p => p.id !== id));
  };

  const handleSaveToFirebase = async () => {
    console.log('🔥 === SALVANDO NO FIREBASE ===');
    console.log('📊 Dados a salvar:', {
      tasks: tasks.length,
      stats: `Level ${stats.level}`,
      books: books.length,
      stories: stories.length,
      links: savedLinks.length,
      products: products.length,
      purchases: purchases.length
    });
    
    // Atualizar status
    setCloudStatus('syncing');
    
    try {
      // Force cloud connection check
      console.log('🔍 Verificando conexão com Firebase...');
      const isOnline = await forceFirebaseSync();
      
      if (!isOnline) {
        console.error('❌ Firebase não está acessível!');
        alert(
          '❌ ERRO: Firebase Offline\n\n' +
          'O servidor Firebase não está respondendo.\n\n' +
          'Verifique:\n' +
          '1. Conexão com internet\n' +
          '2. Console (F12) para mais detalhes\n\n' +
          'Seus dados continuam salvos localmente.'
        );
        setCloudStatus('offline');
        return;
      }
      
      // Save everything to Firebase
      console.log('📤 Enviando dados para Firebase...');
      
      await Promise.all([
        saveTasks(tasks),
        saveStats(stats),
        saveBooks(books),
        saveStories(stories),
        saveLinks(savedLinks),
        saveProducts(products),
        savePurchases(purchases)
      ]);
      
      console.log('✅ SUCESSO! Todos os dados salvos no Firebase!');
      setCloudStatus('synced');
      
      alert(
        '🔥 SALVO NO FIREBASE!\n\n' +
        `📋 Tasks: ${tasks.length}\n` +
        `⭐ Stats: Level ${stats.level} (${stats.xp} XP)\n` +
        `📚 Books: ${books.length}\n` +
        `📖 Stories: ${stories.length}\n` +
        `🔗 Links: ${savedLinks.length}\n` +
        `📦 Produtos: ${products.length}\n` +
        `🛒 Compras: ${purchases.length}\n\n` +
        'Todos os dados foram enviados para a nuvem!'
      );
      
    } catch (error) {
      console.error('❌ Erro ao salvar no Firebase:', error);
      setCloudStatus('offline');
      alert(
        '❌ ERRO ao salvar!\n\n' +
        'Veja o console (F12) para detalhes.\n\n' +
        'Seus dados estão salvos localmente.'
      );
    }
  };

  const handleSyncBooks = async () => {
    await handleSaveToFirebase();
  };

  const handleMigrateToFirebase = async () => {
    if (!confirm('🔄 Migrar dados do localStorage para Firebase?\n\nIsso vai transferir todos os seus dados locais para a nuvem.')) {
      return;
    }

    setCloudStatus('syncing');
    try {
      await migrateFromLocalStorage();
      alert('✅ Migração concluída!\n\nTodos os dados foram transferidos para o Firebase.');
      setCloudStatus('synced');
    } catch (error) {
      console.error('❌ Erro na migração:', error);
      alert('❌ Erro na migração!\n\nVeja o console para detalhes.');
      setCloudStatus('offline');
    }
  };

  const handleDebugStorage = () => {
    console.log('🧪 === DEBUG DO SISTEMA DE SALVAMENTO ===\n');
    
    // FORCE IMMEDIATE SAVE
    console.log('💾 FORÇANDO SALVAMENTO IMEDIATO...');
    localStorage.setItem('cronos_tasks', JSON.stringify(tasks));
    localStorage.setItem('cronos_stats', JSON.stringify(stats));
    localStorage.setItem('cronos_books', JSON.stringify(books));
    localStorage.setItem('cronos_links', JSON.stringify(savedLinks));
    localStorage.setItem('cronos_products', JSON.stringify(products));
    localStorage.setItem('cronos_purchases', JSON.stringify(purchases));
    console.log('✅ Dados forçados para localStorage!');
    
    // Check React State
    console.log('\n📊 Estado do React:');
    console.log('  Tasks:', tasks.length, '(', tasks.filter(t => t.type === 'DAILY').length, 'DAILY,', tasks.filter(t => t.type === 'ROUTINE').length, 'ROUTINE)');
    console.log('  Stats: Level', stats.level, '| XP:', stats.xp);
    console.log('  Books:', books.length);
    console.log('  Links:', savedLinks.length);
    console.log('  Products:', products.length);
    console.log('  Purchases:', purchases.length);
    
    // Check localStorage
    console.log('\n💾 localStorage (após forçar save):');
    const localTasks = localStorage.getItem('cronos_tasks');
    const localStats = localStorage.getItem('cronos_stats');
    const localBooks = localStorage.getItem('cronos_books');
    const localLinks = localStorage.getItem('cronos_links');
    
    console.log('  Tasks:', localTasks ? JSON.parse(localTasks).length + ' salvas' : '❌ VAZIO');
    console.log('  Stats:', localStats ? 'Level ' + JSON.parse(localStats).level : '❌ VAZIO');
    console.log('  Books:', localBooks ? JSON.parse(localBooks).length + ' salvos' : '❌ VAZIO');
    console.log('  Links:', localLinks ? JSON.parse(localLinks).length + ' salvos' : '❌ VAZIO');
    
    // Verify data matches
    const tasksMatch = localTasks && JSON.parse(localTasks).length === tasks.length;
    const statsMatch = localStats && JSON.parse(localStats).level === stats.level;
    const booksMatch = localBooks && JSON.parse(localBooks).length === books.length;
    
    console.log('\n🔍 Verificação de integridade:');
    console.log('  Tasks:', tasksMatch ? '✅ Match!' : '❌ Divergência!');
    console.log('  Stats:', statsMatch ? '✅ Match!' : '❌ Divergência!');
    console.log('  Books:', booksMatch ? '✅ Match!' : '❌ Divergência!');
    
    // Storage size
    let totalSize = 0;
    for (let key in localStorage) {
      if (key.startsWith('cronos_')) {
        totalSize += (localStorage.getItem(key) || '').length;
      }
    }
    console.log('\n📈 Uso do localStorage:', (totalSize / 1024).toFixed(2), 'KB');
    
    // Test save
    console.log('\n🧪 Testando capacidade de escrita...');
    const testData = { test: true, timestamp: Date.now() };
    try {
      localStorage.setItem('cronos_test', JSON.stringify(testData));
      const retrieved = localStorage.getItem('cronos_test');
      if (retrieved && JSON.parse(retrieved).test) {
        console.log('✅ localStorage tem permissão de escrita!');
        localStorage.removeItem('cronos_test');
      } else {
        console.log('❌ ERRO: Não foi possível ler de volta!');
      }
    } catch (error) {
      console.log('❌ ERRO ao escrever:', error);
    }
    
    console.log('\n☁️ Status da nuvem:', cloudStatus);
    console.log('\n🧪 === FIM DO DEBUG ===');
    
    const allSaved = tasksMatch && statsMatch && booksMatch;
    
    alert(
      `📊 DEBUG DO CRONOS\n\n` +
      `${allSaved ? '✅ TUDO SALVO CORRETAMENTE!' : '⚠️ POSSÍVEL PROBLEMA DE SALVAMENTO'}\n\n` +
      `📋 Tasks: ${tasks.length} ${tasksMatch ? '✅' : '❌'}\n` +
      `⭐ Level: ${stats.level} (${stats.xp} XP) ${statsMatch ? '✅' : '❌'}\n` +
      `📚 Books: ${books.length} ${booksMatch ? '✅' : '❌'}\n` +
      `🔗 Links: ${savedLinks.length}\n\n` +
      `💾 localStorage: ${(totalSize / 1024).toFixed(2)} KB\n` +
      `☁️ Status: ${cloudStatus}\n\n` +
      `Veja o console (F12) para mais detalhes!`
    );
  };

  const handleExportBackup = () => {
    console.log('📦 Iniciando export...');
    console.log('💡 O arquivo será baixado para sua pasta de Downloads');
    exportBackup(tasks, stats, books, savedLinks, products, purchases);
  };

  const handleImportBackup = () => {
    // Create a hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const backup = await importBackup(file);
      if (!backup) {
        alert('❌ Falha ao importar backup. Verifique o arquivo.');
        return;
      }
      
      const confirmed = confirm(
        `📦 Backup encontrado!\n\n` +
        `📅 Data: ${new Date(backup.timestamp).toLocaleString('pt-BR')}\n` +
        `📋 Tarefas: ${backup.data.tasks.length}\n` +
        `⭐ Level: ${backup.data.stats.level}\n` +
        `📚 Livros: ${backup.data.books.length}\n` +
        `📦 Produtos: ${backup.data.products?.length || 0}\n` +
        `🛒 Compras: ${backup.data.purchases?.length || 0}\n\n` +
        `Deseja SUBSTITUIR todos os dados atuais?`
      );
      
      if (confirmed) {
        const success = restoreFromBackup(backup, 'replace');
        if (success) {
          // Reload data
          setTasks(backup.data.tasks);
          setStats(backup.data.stats);
          setBooks(backup.data.books);
          setSavedLinks(backup.data.links);
          setProducts(backup.data.products || []);
          setPurchases(backup.data.purchases || []);
          alert('✅ Dados restaurados com sucesso!');
        } else {
          alert('❌ Falha ao restaurar backup.');
        }
      }
    };
    
    // Trigger file picker
    input.click();
  };

  const handleRestoreFromDrive = (
    restoredTasks: Task[],
    restoredStats: UserStats,
    restoredBooks: Book[],
    restoredLinks: SavedLink[],
    restoredProducts?: Product[],
    restoredPurchases?: PurchaseItem[]
  ) => {
    setTasks(restoredTasks);
    setStats(restoredStats);
    setBooks(restoredBooks);
    setSavedLinks(restoredLinks);
    if (restoredProducts) setProducts(restoredProducts);
    if (restoredPurchases) setPurchases(restoredPurchases);
    
    // Also save to localStorage
    localStorage.setItem('cronos_tasks', JSON.stringify(restoredTasks));
    localStorage.setItem('cronos_stats', JSON.stringify(restoredStats));
    localStorage.setItem('cronos_books', JSON.stringify(restoredBooks));
    localStorage.setItem('cronos_links', JSON.stringify(restoredLinks));
    if (restoredProducts) localStorage.setItem('cronos_products', JSON.stringify(restoredProducts));
    if (restoredPurchases) localStorage.setItem('cronos_purchases', JSON.stringify(restoredPurchases));
  };

  const getDaysOld = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  // Load and save savedLinks to localStorage
  useEffect(() => {
    const stored = localStorage.getItem('cronos_saved_links');
    if (stored) {
      try {
        setSavedLinks(JSON.parse(stored));
      } catch(e) {}
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('cronos_saved_links', JSON.stringify(savedLinks));
    }
  }, [savedLinks, isLoading]);

  // Save books to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('cronos_books', JSON.stringify(books));
    }
  }, [books, isLoading]);

  // Stories are loaded from Firebase with localStorage fallback in loadData

  const priorityLabels = { 1: "ALTA", 2: "MÉDIA", 3: "BAIXA" };
  const priorityColors = { 1: "bg-red-500", 2: "bg-indigo-500", 3: "bg-slate-700" };
  const priorityText = { 1: "text-red-400", 2: "text-indigo-400", 3: "text-slate-500" };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white relative overflow-hidden font-inter selection:bg-purple-500/30">
        {/* Animated Background Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
           <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
           <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <form onSubmit={handleLogin} className="z-10 bg-slate-900/80 p-10 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-sm relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          
          <div className="mb-10 text-center relative group">
             <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
             <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 font-space tracking-tight relative z-10">CRONOS</h2>
             <p className="text-[10px] text-slate-500 font-mono tracking-[0.3em] uppercase mt-2">Sistema de Gestão Temporal</p>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Identidade</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-4 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-slate-200 transition-all placeholder-slate-600/50 text-sm font-medium"
                  placeholder="Nome de usuário"
                  autoFocus
                />
                <div className="absolute inset-0 rounded-xl bg-indigo-500/5 pointer-events-none"></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Chave de Acesso</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 text-slate-200 transition-all placeholder-slate-600/50 text-sm font-medium"
                  placeholder="Senha"
                />
                 <div className="absolute inset-0 rounded-xl bg-purple-500/5 pointer-events-none"></div>
              </div>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="w-full mt-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 px-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 group"
          >
            <span>Inicializar Sistema</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
          </button>
          
          <div className="mt-8 text-center flex justify-center gap-4 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
             <div className="h-1 w-1 rounded-full bg-indigo-500"></div>
             <div className="h-1 w-1 rounded-full bg-purple-500"></div>
             <div className="h-1 w-1 rounded-full bg-pink-500"></div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col md:flex-row bg-[#020617] text-slate-200 overflow-hidden font-inter select-none relative">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-600/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <style>{`
        .tab-glow { text-shadow: 0 0 15px rgba(129, 140, 248, 0.4); }
        .active-text-gradient {
          background: linear-gradient(135deg, #fff 0%, #818cf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .inactive-text-style { color: rgba(148, 163, 184, 0.3); }
        .console-blur { backdrop-filter: blur(24px) saturate(180%); }
        .hologram-card { 
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(139, 92, 246, 0.02) 100%);
          border: 1px solid rgba(129, 140, 248, 0.1);
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            0 4px 24px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(99, 102, 241, 0.05);
          transition: all 0.3s ease;
        }
        .hologram-card:hover {
          border-color: rgba(129, 140, 248, 0.2);
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            0 8px 32px rgba(99, 102, 241, 0.15),
            0 0 0 1px rgba(99, 102, 241, 0.1);
          transform: translateY(-2px);
        }
        .task-card {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%);
          border: 1px solid rgba(148, 163, 184, 0.1);
          box-shadow: 
            0 10px 30px -10px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .task-card:hover {
          border-color: rgba(129, 140, 248, 0.3);
          box-shadow: 
            0 20px 40px -15px rgba(99, 102, 241, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
          transform: translateY(-3px) scale(1.01);
        }
        .priority-glow-high {
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
          animation: pulse-glow-red 2s ease-in-out infinite;
        }
        .priority-glow-medium {
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.2);
        }
        @keyframes pulse-glow-red {
          0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.3); }
          50% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.5); }
        }
        .input-glow:focus {
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1), 0 0 20px rgba(99, 102, 241, 0.2);
        }
        .button-glow {
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
          transition: all 0.3s ease;
        }
        .button-glow:hover {
          box-shadow: 0 0 30px rgba(99, 102, 241, 0.5);
          transform: scale(1.05);
        }
        .stat-card {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.03) 100%);
          border: 1px solid rgba(129, 140, 248, 0.15);
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            0 10px 30px rgba(0, 0, 0, 0.3);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .floating-nav {
          box-shadow: 0 -10px 40px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.05);
        }
      `}</style>
      <input type="file" onChange={handleImport} accept=".json" className="hidden" />

      {isLoading && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-950">
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 border-2 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
            <p className="font-space text-indigo-400 text-[8px] tracking-[0.8em] uppercase animate-pulse">Sincronizando com o Cosmos...</p>
          </div>
        </div>
      )}

      {/* Ascension Modal */}
      {levelUpData && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl animate-in fade-in zoom-in duration-500 overflow-hidden">
          <div className="max-w-xl w-full text-center space-y-8 relative z-10">
            <div className="space-y-2">
              <span className="text-[10px] font-black text-indigo-400 tracking-[0.8em] uppercase block animate-pulse">Evolução Detectada</span>
              <div className="text-8xl md:text-[180px] font-space font-bold text-white leading-none filter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                {levelUpData.level}
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-space font-bold text-white uppercase tracking-tight">{levelUpData.name}</h2>
              <p className="text-slate-400 text-sm md:text-lg font-light italic max-w-xs mx-auto">"{ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]}"</p>
            </div>
            <button onClick={() => { setLevelUpData(null); setMainView('EVOLUTION'); }} className="w-full max-w-xs mx-auto h-16 bg-white text-slate-950 rounded-2xl font-space font-bold uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">Sincronizar</button>
          </div>
        </div>
      )}

      {/* Navigation - Floating Tablet/Console for Mobile, Sidebar for Desktop */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-16 md:h-screen md:w-20 lg:w-24 md:static md:translate-x-0 md:left-0 md:max-w-none bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-slate-800/80 console-blur border border-white/20 md:border-white/10 rounded-3xl md:rounded-none flex md:flex-col items-center justify-around md:justify-start gap-0 md:gap-6 z-50 floating-nav md:py-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          {/* Logo Icon - Desktop Only */}
          <div className="hidden md:flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-500 to-pink-500 items-center justify-center font-space font-bold text-white text-xl mb-6 shadow-[0_0_30px_rgba(99,102,241,0.5)] relative overflow-hidden group">
            <span className="relative z-10">C</span>
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
          
          {/* Dashboard Button */}
          <button 
            onClick={() => setMainView('DASHBOARD')} 
            className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-300 group ${
              mainView === 'DASHBOARD' 
                ? 'text-indigo-400 scale-110 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.3)]' 
                : 'text-slate-500 hover:text-indigo-300 hover:scale-105'
            }`}
          >
            {mainView === 'DASHBOARD' && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/30" />
            )}
            <svg className={`w-6 h-6 relative z-10 transition-all duration-300 ${mainView === 'DASHBOARD' ? 'drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'group-hover:drop-shadow-[0_0_4px_rgba(99,102,241,0.4)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
            <span className="text-[6px] font-black uppercase tracking-[0.2em] md:hidden relative z-10">Sincronia</span>
            {mainView === 'DASHBOARD' && (
              <div className="absolute -bottom-1 md:bottom-auto md:-right-1 left-1/2 md:left-auto md:top-1/2 -translate-x-1/2 md:translate-x-0 md:-translate-y-1/2 w-6 md:w-1 h-1 md:h-6 bg-gradient-to-r md:bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            )}
          </button>
          
          {/* Evolution Button */}
          <button 
            onClick={() => setMainView('EVOLUTION')} 
            className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-300 group ${
              mainView === 'EVOLUTION' 
                ? 'text-violet-400 scale-110 bg-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.3)]' 
                : 'text-slate-500 hover:text-violet-300 hover:scale-105'
            }`}
          >
            {mainView === 'EVOLUTION' && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 border border-violet-500/30" />
            )}
            <svg className={`w-6 h-6 relative z-10 transition-all duration-300 ${mainView === 'EVOLUTION' ? 'drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]' : 'group-hover:drop-shadow-[0_0_4px_rgba(139,92,246,0.4)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-[6px] font-black uppercase tracking-[0.2em] md:hidden relative z-10">Cosmos</span>
            {mainView === 'EVOLUTION' && (
              <div className="absolute -bottom-1 md:bottom-auto md:-right-1 left-1/2 md:left-auto md:top-1/2 -translate-x-1/2 md:translate-x-0 md:-translate-y-1/2 w-6 md:w-1 h-1 md:h-6 bg-gradient-to-r md:bg-gradient-to-b from-violet-500 to-fuchsia-500 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
            )}
          </button>
          
          {/* Statistics Button */}
          <button 
            onClick={() => setMainView('STATISTICS')} 
            className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-300 group ${
              mainView === 'STATISTICS' 
                ? 'text-emerald-400 scale-110 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                : 'text-slate-500 hover:text-emerald-300 hover:scale-105'
            }`}
          >
            {mainView === 'STATISTICS' && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30" />
            )}
            <svg className={`w-6 h-6 relative z-10 transition-all duration-300 ${mainView === 'STATISTICS' ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'group-hover:drop-shadow-[0_0_4px_rgba(16,185,129,0.4)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-[6px] font-black uppercase tracking-[0.2em] md:hidden relative z-10">Arquivo</span>
            {mainView === 'STATISTICS' && (
              <div className="absolute -bottom-1 md:bottom-auto md:-right-1 left-1/2 md:left-auto md:top-1/2 -translate-x-1/2 md:translate-x-0 md:-translate-y-1/2 w-6 md:w-1 h-1 md:h-6 bg-gradient-to-r md:bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            )}
          </button>
          
          {/* Links Button */}
          <button 
            onClick={() => setMainView('LINKS')} 
            className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-300 group ${
              mainView === 'LINKS' 
                ? 'text-cyan-400 scale-110 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.3)]' 
                : 'text-slate-500 hover:text-cyan-300 hover:scale-105'
            }`}
          >
            {mainView === 'LINKS' && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30" />
            )}
            <svg className={`w-6 h-6 relative z-10 transition-all duration-300 ${mainView === 'LINKS' ? 'drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'group-hover:drop-shadow-[0_0_4px_rgba(6,182,212,0.4)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <path strokeWidth="2" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path strokeWidth="2" d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span className="text-[6px] font-black uppercase tracking-[0.2em] md:hidden relative z-10">Links</span>
            {mainView === 'LINKS' && (
              <div className="absolute -bottom-1 md:bottom-auto md:-right-1 left-1/2 md:left-auto md:top-1/2 -translate-x-1/2 md:translate-x-0 md:-translate-y-1/2 w-6 md:w-1 h-1 md:h-6 bg-gradient-to-r md:bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            )}
          </button>
          
          {/* Fast Reader Button */}
          <button 
            onClick={() => setMainView('READER')} 
            className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-300 group ${
              mainView === 'READER' 
                ? 'text-orange-400 scale-110 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.3)]' 
                : 'text-slate-500 hover:text-orange-300 hover:scale-105'
            }`}
          >
            {mainView === 'READER' && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/30" />
            )}
            <svg className={`w-6 h-6 relative z-10 transition-all duration-300 ${mainView === 'READER' ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'group-hover:drop-shadow-[0_0_4px_rgba(249,115,22,0.4)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <path strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              <path strokeWidth="2" d="M8 8h.01M16 8h.01" opacity="0.6" />
            </svg>
            <span className="text-[6px] font-black uppercase tracking-[0.2em] md:hidden relative z-10">Reader</span>
            {mainView === 'READER' && (
              <div className="absolute -bottom-1 md:bottom-auto md:-right-1 left-1/2 md:left-auto md:top-1/2 -translate-x-1/2 md:translate-x-0 md:-translate-y-1/2 w-6 md:w-1 h-1 md:h-6 bg-gradient-to-r md:bg-gradient-to-b from-orange-500 to-amber-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
            )}
          </button>
          
          {/* Story Creator Button */}
          <button 
            onClick={() => setMainView('STORIES')} 
            className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-300 group ${
              mainView === 'STORIES' 
                ? 'text-fuchsia-400 scale-110 bg-fuchsia-500/10 shadow-[0_0_20px_rgba(217,70,239,0.3)]' 
                : 'text-slate-500 hover:text-fuchsia-300 hover:scale-105'
            }`}
          >
            {mainView === 'STORIES' && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-violet-500/10 border border-fuchsia-500/30" />
            )}
            <svg className={`w-6 h-6 relative z-10 transition-all duration-300 ${mainView === 'STORIES' ? 'drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]' : 'group-hover:drop-shadow-[0_0_4px_rgba(217,70,239,0.4)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <path strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              <path strokeWidth="2" d="M9 10h.01M15 10h.01M9 14h6" opacity="0.7" />
            </svg>
            <span className="text-[6px] font-black uppercase tracking-[0.2em] md:hidden relative z-10">Stories</span>
            {mainView === 'STORIES' && (
              <div className="absolute -bottom-1 md:bottom-auto md:-right-1 left-1/2 md:left-auto md:top-1/2 -translate-x-1/2 md:translate-x-0 md:-translate-y-1/2 w-6 md:w-1 h-1 md:h-6 bg-gradient-to-r md:bg-gradient-to-b from-fuchsia-500 to-violet-500 rounded-full shadow-[0_0_8px_rgba(217,70,239,0.8)]" />
            )}
          </button>
          
          {/* Manga Reader Button */}
          <button 
            onClick={() => setMainView('MANGA')} 
            className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-300 group ${
              mainView === 'MANGA' 
                ? 'text-red-400 scale-110 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
                : 'text-slate-500 hover:text-red-300 hover:scale-105'
            }`}
          >
            {mainView === 'MANGA' && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/20 to-pink-500/10 border border-red-500/30" />
            )}
            <svg className={`w-6 h-6 relative z-10 transition-all duration-300 ${mainView === 'MANGA' ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'group-hover:drop-shadow-[0_0_4px_rgba(239,68,68,0.4)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <path strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-[6px] font-black uppercase tracking-[0.2em] md:hidden relative z-10">Manga</span>
            {mainView === 'MANGA' && (
              <div className="absolute -bottom-1 md:bottom-auto md:-right-1 left-1/2 md:left-auto md:top-1/2 -translate-x-1/2 md:translate-x-0 md:-translate-y-1/2 w-6 md:w-1 h-1 md:h-6 bg-gradient-to-r md:bg-gradient-to-b from-red-500 to-pink-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            )}
          </button>
          
          {/* Shopping Button */}
          <button 
            onClick={() => setMainView('SHOPPING')} 
            className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-300 group ${
              mainView === 'SHOPPING' 
                ? 'text-amber-400 scale-110 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.3)]' 
                : 'text-slate-500 hover:text-amber-300 hover:scale-105'
            }`}
          >
            {mainView === 'SHOPPING' && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/30" />
            )}
            <svg className={`w-6 h-6 relative z-10 transition-all duration-300 ${mainView === 'SHOPPING' ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'group-hover:drop-shadow-[0_0_4px_rgba(245,158,11,0.4)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <path strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-[6px] font-black uppercase tracking-[0.2em] md:hidden relative z-10">Compras</span>
            {mainView === 'SHOPPING' && (
              <div className="absolute -bottom-1 md:bottom-auto md:-right-1 left-1/2 md:left-auto md:top-1/2 -translate-x-1/2 md:translate-x-0 md:-translate-y-1/2 w-6 md:w-1 h-1 md:h-6 bg-gradient-to-r md:bg-gradient-to-b from-amber-500 to-yellow-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            )}
          </button>
          
          {/* Logout Button */}
          <button 
            onClick={handleLogout} 
            className="relative flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-300 group text-slate-500 hover:text-red-400 hover:scale-105 md:mt-auto"
            title="Sair do Sistema"
          >
            <svg className="w-6 h-6 relative z-10 group-hover:drop-shadow-[0_0_4px_rgba(248,113,113,0.4)] transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
      </nav>

      <main className="flex-1 overflow-y-auto px-5 py-8 md:px-16 lg:px-24 custom-scrollbar pb-32 md:pb-8 pt-safe">
        
        {mainView === 'DASHBOARD' && (
          <div className="max-w-4xl mx-auto space-y-10 md:space-y-12 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2 md:gap-4 border-b border-white/5 pb-6">
              <div className="space-y-1">
                <h1 className="text-3xl md:text-5xl font-space font-bold tracking-tighter text-white uppercase leading-none">Status Orbital</h1>
                <p className="text-[8px] md:text-[9px] tracking-[0.5em] text-slate-500 font-bold uppercase italic opacity-60">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
              <div className="flex gap-3 items-center w-full md:w-auto flex-wrap">
                <button
                  onClick={handleExportBackup}
                  className="flex items-center gap-2 text-[8px] font-black text-purple-400 border border-purple-400/20 px-4 py-3 rounded-2xl uppercase tracking-[0.3em] bg-purple-400/5 active:scale-95 transition-all hover:opacity-80"
                  title="Exportar backup dos dados (JSON)"
                >
                  💾 Export
                </button>
                
                <button
                  onClick={handleImportBackup}
                  className="flex items-center gap-2 text-[8px] font-black text-cyan-400 border border-cyan-400/20 px-4 py-3 rounded-2xl uppercase tracking-[0.3em] bg-cyan-400/5 active:scale-95 transition-all hover:opacity-80"
                  title="Importar backup dos dados (JSON)"
                >
                  📂 Import
                </button>
                
                <button
                  onClick={handleSaveToFirebase}
                  className={`flex items-center gap-2 text-[8px] font-black px-4 py-3 rounded-2xl uppercase tracking-[0.3em] active:scale-95 transition-all hover:opacity-80 ${
                    cloudStatus === 'synced' ? 'text-emerald-400 border border-emerald-400/20 bg-emerald-400/5' :
                    cloudStatus === 'syncing' ? 'text-amber-400 border border-amber-400/20 bg-amber-400/5' :
                    'text-red-400 border border-red-400/20 bg-red-400/5'
                  }`}
                  title="Sincronizar com Firebase Cloud"
                >
                  {cloudStatus === 'syncing' ? '⏳' : cloudStatus === 'synced' ? '🔥' : '❌'} Firebase
                </button>
                
                {activeSubTab === 'ROUTINE' && (
                  <button onClick={resetAllRoutines} className="flex-1 md:flex-initial text-[8px] font-black text-cyan-400 border border-cyan-400/20 px-6 py-3 rounded-2xl uppercase tracking-[0.3em] bg-cyan-400/5 active:scale-95 transition-all">Reiniciar Órbita</button>
                )}
              </div>
            </header>

            {/* Segmented Control - Futuro Style */}
            <div className="bg-white/[0.03] p-1 rounded-2xl border border-white/5 flex gap-1">
              {['DAILY', 'ROUTINE'].map(t => (
                <button 
                  key={t} 
                  onClick={() => setActiveSubTab(t as any)} 
                  className={`flex-1 py-3 rounded-xl text-[10px] md:text-[12px] font-space font-bold tracking-[0.2em] uppercase transition-all duration-300 relative ${activeSubTab === t ? 'bg-indigo-500/20 text-white shadow-lg' : 'text-slate-500 hover:text-slate-400'}`}
                >
                  {t === 'DAILY' ? 'Singularidades' : 'Ciclos Orbitais'}
                </button>
              ))}
            </div>

            {/* Input Terminal */}
            <form onSubmit={addTask} className="space-y-6 bg-indigo-500/[0.02] p-6 rounded-[2rem] border border-indigo-500/10 shadow-inner">
              <div className="relative">
                <input type="text" placeholder="Injetar novos dados no sistema..." value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} className="w-full h-12 md:h-16 bg-transparent border-b border-indigo-500/20 text-lg md:text-2xl text-white outline-none focus:border-indigo-400 transition-all placeholder:text-slate-700 font-space" />
                <button type="submit" className="absolute right-0 bottom-2 text-indigo-400 text-[10px] font-black tracking-widest uppercase">+ ADD</button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.4em]">Protocolos Secundários</span>
                  <div className="flex gap-2">
                      <input type="text" placeholder="Novo módulo..." value={newTaskStepInput} onChange={e => setNewTaskStepInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addStepToNewTask())} className="flex-1 bg-white/5 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 ring-indigo-500 border border-white/5" />
                      <button type="button" onClick={addStepToNewTask} className="px-5 bg-indigo-500/20 text-indigo-400 rounded-xl text-lg">+</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                      {newTaskSteps.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 bg-indigo-500/5 px-3 py-1.5 rounded-lg border border-indigo-500/10">
                          <span className="text-[8px] text-indigo-300/70 font-bold uppercase">{s}</span>
                          <button type="button" onClick={() => removeStepFromNewTask(i)} className="text-red-500/50 text-xs">&times;</button>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.4em]">Tipo de Carga</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setNewTaskCategory('WORK')} className={`flex-1 py-4 rounded-xl text-[9px] font-bold uppercase border transition-all ${newTaskCategory === 'WORK' ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300 shadow-md' : 'bg-white/5 border-white/5 text-slate-600'}`}>Executivo</button>
                    <button type="button" onClick={() => setNewTaskCategory('LEISURE')} className={`flex-1 py-4 rounded-xl text-[9px] font-bold uppercase border transition-all ${newTaskCategory === 'LEISURE' ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-md' : 'bg-white/5 border-white/5 text-slate-600'}`}>Lúdico</button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-[8px] md:text-[9px] font-black tracking-[0.3em] uppercase pt-6 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-[7px] text-slate-700 tracking-[0.4em] font-black uppercase">Urgência</span>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(p => (
                      <button 
                        key={p} 
                        type="button" 
                        onClick={() => setNewTaskPriority(p as any)} 
                        className={`
                          px-4 py-2 rounded-xl text-[7px] font-black tracking-[0.25em] uppercase
                          transition-all duration-300 active:scale-95 border
                          ${newTaskPriority === p 
                            ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-400/10 text-cyan-300 border-cyan-400/40 shadow-[0_0_20px_rgba(34,211,238,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]' 
                            : 'bg-white/[0.02] text-slate-600 border-white/5 hover:text-slate-400 hover:border-white/10 hover:bg-white/[0.04]'
                          }
                        `}
                      >
                        {priorityLabels[p as PriorityLevel]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1" />
                <div className="flex items-center gap-3">
                  <span className="text-[7px] text-slate-700 tracking-[0.4em] font-black uppercase hidden md:inline">Período</span>
                  <div className="relative group">
                    <select 
                      value={selectedPeriodForAdd} 
                      onChange={e => setSelectedPeriodForAdd(e.target.value)} 
                      className="
                        appearance-none bg-gradient-to-br from-indigo-500/10 to-purple-500/5 
                        text-indigo-300 outline-none cursor-pointer 
                        border border-indigo-500/30 rounded-xl
                        px-4 py-2 pr-10
                        text-[8px] font-black tracking-[0.25em] uppercase
                        transition-all duration-300
                        hover:border-indigo-400/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]
                        focus:border-indigo-400/60 focus:shadow-[0_0_20px_rgba(99,102,241,0.3)]
                      "
                    >
                      {PERIODS.map(p => <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">{p.name}</option>)}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-indigo-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </form>

            {/* List of Tasks - Hologram Style */}
            <div className="space-y-12 pb-20">
              {PERIODS.map(period => {
                const filteredTasks = tasks.filter(t => t.type === activeSubTab && t.periodId === period.id);
                const pending = filteredTasks.filter(t => t.status === 'PENDING').sort((a,b) => (a.priority || 2) - (b.priority || 2));
                const completed = filteredTasks.filter(t => t.status !== 'PENDING');
                if (filteredTasks.length === 0) return null;
                return (
                  <section key={period.id} className="space-y-4">
                    <h2 className="text-[9px] tracking-[0.6em] text-indigo-500/50 font-black uppercase flex items-center gap-4">
                      {period.name} <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/20 to-transparent" />
                    </h2>
                    <div className="space-y-3">
                      {pending.map(task => (
                        <div key={task.id} className={`task-card rounded-2xl overflow-hidden ${task.priority === 1 ? 'priority-glow-high' : task.priority === 2 ? 'priority-glow-medium' : ''}`}>
                          <div className="flex items-center gap-4 py-5 px-5">
                            <div className={`w-1.5 h-10 rounded-full ${priorityColors[task.priority || 2]} ${task.priority === 1 ? 'shadow-[0_0_15px_currentColor]' : 'shadow-[0_0_8px_currentColor]'}`} />
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedTasks(p => ({...p, [task.id]: !p[task.id]}))}>
                                <h3 className="text-base md:text-lg font-space font-semibold text-white truncate">{task.title}</h3>
                                <div className="flex gap-2 items-center mt-1.5">
                                  <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${priorityText[task.priority || 2]} bg-white/5`}>{priorityLabels[task.priority || 2]}</span>
                                  <div className="w-1 h-1 rounded-full bg-slate-700" />
                                  <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">
                                    {task.steps?.filter(s => s.completed).length}/{task.steps?.length} Módulos
                                  </span>
                                  {task.category === 'LEISURE' && (
                                    <span className="text-[7px] font-black text-amber-400/60 uppercase tracking-widest">● Lúdico</span>
                                  )}
                                </div>
                            </div>
                            <button onClick={() => toggleTaskTimer(task.id)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all button-glow ${task.category === 'LEISURE' ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/20' : 'bg-gradient-to-br from-indigo-500/20 to-purple-500/10 text-indigo-400 border-indigo-500/20'} border`}>
                              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                          </div>
                          {expandedTasks[task.id] && (
                            <div className="px-5 pb-6 pt-4 space-y-6 animate-in slide-in-from-top-2 duration-300 border-t border-white/5">
                               <div className="space-y-3">
                                  <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.4em] block">Status de Prioridade</span>
                                  <div className="flex gap-2">
                                    {[1, 2, 3].map(p => (
                                      <button 
                                        key={p} 
                                        onClick={(e) => { e.stopPropagation(); updateTask(task.id, { priority: p as PriorityLevel }); }}
                                        className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${task.priority === p ? `${priorityColors[p as PriorityLevel]} border-transparent text-white shadow-lg` : 'bg-white/5 border-white/5 text-slate-500'}`}
                                      >
                                        {priorityLabels[p as PriorityLevel]}
                                      </button>
                                    ))}
                                  </div>
                               </div>

                               <div className="space-y-3">
                                  <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.4em] block">Protocolos Secundários</span>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                     {task.steps?.map(step => (
                                       <div key={step.id} onClick={(e) => { e.stopPropagation(); toggleStep(task.id, step.id); }} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${step.completed ? 'bg-indigo-500/10 border-indigo-500/20 opacity-60' : 'bg-white/[0.02] border-white/5'}`}>
                                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${step.completed ? 'bg-indigo-500 border-indigo-400' : 'border-white/20'}`}>{step.completed && <span className="text-[10px]">✓</span>}</div>
                                          <span className={`text-xs flex-1 ${step.completed ? 'text-slate-600 line-through' : 'text-slate-300'}`}>{step.title}</span>
                                       </div>
                                     ))}
                                  </div>
                               </div>

                               <div className="flex gap-2">
                                  <button onClick={(e) => { e.stopPropagation(); handleTaskAction('COMPLETED', 0, task); }} className="flex-1 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em]">Finalizar Protocolo</button>
                                  <button onClick={(e) => { e.stopPropagation(); updateTask(task.id, { category: task.category === 'WORK' ? 'LEISURE' : 'WORK' }) }} className="p-3 rounded-xl bg-white/5 border border-white/5 text-slate-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg></button>
                                  <button onClick={(e) => { e.stopPropagation(); if(confirm("Apagar permanentemente?")) { deleteTaskFromDB(task.id); setTasks(prev => prev.filter(t => t.id !== task.id)); } }} className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                               </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {completed.map(task => (
                        <div key={task.id} className="flex flex-row items-center gap-4 py-3 px-5 rounded-xl border border-white/5 bg-slate-950/20 opacity-30">
                           <div className="w-1 h-3 rounded-full bg-emerald-500/50" />
                           <span className="text-xs font-space line-through text-slate-600 flex-1 truncate">{task.title}</span>
                           <button onClick={() => restoreTask(task.id)} className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Reativar</button>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        )}

        {mainView === 'STATISTICS' && (
          <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom-5 duration-700">
            <header className="border-b border-white/5 pb-6">
              <h1 className="text-3xl md:text-5xl font-space font-bold tracking-tighter text-white uppercase leading-none">Arquivo de Dados</h1>
            </header>
            
            <div className="hologram-card rounded-[2.5rem] p-8 space-y-8">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.4em]">Nível de Evolução</span>
                  <h2 className="text-3xl font-space font-bold text-white uppercase tracking-widest leading-tight">{currentLevel.level} - {currentLevel.name}</h2>
                </div>
              </div>
              <div className="space-y-4">
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  {nextLevel && (<div className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: `${Math.min(100, ((stats.xp - currentLevel.xpRequired) / (nextLevel.xpRequired - currentLevel.xpRequired)) * 100)}%` }} />)}
                </div>
                <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">
                  <span>{stats.xp} XP</span>
                  {nextLevel ? <span>Próximo nível em {nextLevel.xpRequired - stats.xp} XP</span> : <span>Nível Máximo</span>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="hologram-card p-6 rounded-3xl text-center space-y-1">
                  <span className="text-[7px] font-black text-indigo-400 uppercase tracking-[0.4em]">Sincronias</span>
                  <p className="text-3xl font-space font-bold text-white">{stats.completedCount || 0}</p>
               </div>
               <div className="hologram-card p-6 rounded-3xl text-center space-y-1">
                  <span className="text-[7px] font-black text-red-400 uppercase tracking-[0.4em]">Perdas</span>
                  <p className="text-3xl font-space font-bold text-white">{stats.gaveUpCount || 0}</p>
               </div>
            </div>

            <div className="space-y-4 pb-20">
               <h3 className="text-[9px] tracking-[0.6em] text-indigo-500/50 font-black uppercase flex items-center gap-4">Logs Recentes</h3>
               <div className="divide-y divide-white/5 bg-white/[0.01] rounded-2xl border border-white/5">
                  {stats.timeLogs?.slice(0, 8).map((log, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5">
                      <div className="flex flex-col"><span className="text-xs font-bold text-slate-300 uppercase">{log.taskTitle}</span><span className="text-[7px] text-slate-600 font-bold uppercase">{new Date(log.timestamp).toLocaleString('pt-BR')}</span></div>
                      <span className="text-xs font-space font-bold text-indigo-400">+{formatSeconds(log.seconds)}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {mainView === 'EVOLUTION' && (
          <div className="h-full flex flex-col items-center justify-center pb-24 space-y-8 pt-safe">
            <div className="w-full max-w-5xl aspect-square md:aspect-auto md:h-[500px] relative">
              <UniverseVisual 
                level={stats.level} 
                nebulaTheme={stats.nebulaTheme} 
              />
              
              {/* Removed nebula theme selector */}
            </div>

            {/* Stats Panel */}
            <div className="max-w-md text-center space-y-4 px-6">
               <div className="space-y-1">
                 <span className="text-[8px] font-black text-indigo-400 tracking-[0.5em] uppercase">Era Atual</span>
                 <h2 className="text-2xl font-space font-bold text-white uppercase tracking-widest leading-tight">{currentLevel.storyEra}</h2>
               </div>
               <p className="text-[11px] md:text-sm text-slate-400 italic font-light leading-relaxed">{isLoadingNarrative ? 'Conectando ao núcleo de dados...' : narrative}</p>
            </div>
          </div>
        )}

        {mainView === 'LINKS' && (
          <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom-5 duration-700">
            <header className="border-b border-cyan-500/10 pb-6">
              <h1 className="text-3xl md:text-5xl font-space font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 uppercase leading-none mb-2">
                Links Arquivados
              </h1>
              <p className="text-xs md:text-sm text-slate-400">
                Salve links importantes para consultar depois
              </p>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="hologram-card p-5 rounded-2xl">
                <div className="text-[8px] font-black text-cyan-400 uppercase tracking-wider mb-2">Total</div>
                <div className="text-3xl font-space font-bold text-white">{savedLinks.length}</div>
              </div>
              <div className="hologram-card p-5 rounded-2xl">
                <div className="text-[8px] font-black text-emerald-400 uppercase tracking-wider mb-2">Recentes</div>
                <div className="text-3xl font-space font-bold text-white">{savedLinks.filter(l => getDaysOld(l.createdAt) <= 3).length}</div>
              </div>
              <div className="hologram-card p-5 rounded-2xl">
                <div className="text-[8px] font-black text-amber-400 uppercase tracking-wider mb-2">Atrasados</div>
                <div className="text-3xl font-space font-bold text-white">{savedLinks.filter(l => getDaysOld(l.createdAt) > 10).length}</div>
              </div>
              <div className="hologram-card p-5 rounded-2xl">
                <div className="text-[8px] font-black text-purple-400 uppercase tracking-wider mb-2">Compras</div>
                <div className="text-3xl font-space font-bold text-white">{savedLinks.filter(l => l.category === 'SHOPPING').length}</div>
              </div>
            </div>

            {/* Add Link Form */}
            <form onSubmit={addSavedLink} className="relative bg-gradient-to-br from-cyan-500/[0.08] to-indigo-500/[0.05] border border-cyan-500/20 rounded-2xl p-6 space-y-5 backdrop-blur-sm shadow-[0_0_30px_rgba(6,182,212,0.1)]">
              {/* Decorative corner accents */}
              <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-cyan-500/30 rounded-tl-2xl" />
              <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-indigo-500/30 rounded-br-2xl" />
              
              {/* Header with icon */}
              <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <span className="text-lg">🔗</span>
                </div>
                <span className="text-[8px] font-black tracking-[0.3em] uppercase text-cyan-400/80">
                  Novo Arquivo
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                  <label className="absolute -top-2 left-3 px-2 bg-slate-950 text-[7px] font-bold uppercase tracking-wider text-cyan-500/60">
                    URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newLinkUrl}
                    onChange={e => setNewLinkUrl(e.target.value)}
                    className="w-full bg-black/30 rounded-xl px-4 py-3.5 text-xs outline-none focus:ring-2 ring-cyan-500/50 border border-white/10 text-white placeholder:text-slate-600 transition-all group-hover:border-cyan-500/20"
                  />
                  <div className="absolute inset-0 rounded-xl bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
                
                <div className="relative group">
                  <label className="absolute -top-2 left-3 px-2 bg-slate-950 text-[7px] font-bold uppercase tracking-wider text-cyan-500/60">
                    Título
                  </label>
                  <input
                    type="text"
                    placeholder="Descrição do link..."
                    value={newLinkTitle}
                    onChange={e => setNewLinkTitle(e.target.value)}
                    className="w-full bg-black/30 rounded-xl px-4 py-3.5 text-xs outline-none focus:ring-2 ring-cyan-500/50 border border-white/10 text-white placeholder:text-slate-600 transition-all group-hover:border-cyan-500/20"
                  />
                  <div className="absolute inset-0 rounded-xl bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-4 bg-gradient-to-b from-cyan-500 to-indigo-500 rounded-full" />
                  <span className="text-[8px] font-black uppercase tracking-[0.4em] text-cyan-400/70 flex items-center gap-2">
                    Categoria
                    <span className="text-[6px] text-slate-600 font-normal tracking-normal">Selecione o tipo</span>
                  </span>
                </div>
                
                <div className="grid grid-cols-5 gap-3">
                  {(['SHOPPING', 'NEWS', 'RESEARCH', 'VIDEO', 'OTHER'] as const).map(cat => {
                    const isSelected = newLinkCategory === cat;
                    const icons = { SHOPPING: '🛒', NEWS: '📰', RESEARCH: '🔬', VIDEO: '🎬', OTHER: '📎' };
                    const labels = { SHOPPING: 'Shop', NEWS: 'News', RESEARCH: 'Study', VIDEO: 'Video', OTHER: 'Other' };
                    const colors = {
                      SHOPPING: 'from-purple-500/20 to-pink-500/20 border-purple-500/40 shadow-purple-500/30',
                      NEWS: 'from-blue-500/20 to-cyan-500/20 border-blue-500/40 shadow-blue-500/30',
                      RESEARCH: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 shadow-emerald-500/30',
                      VIDEO: 'from-red-500/20 to-orange-500/20 border-red-500/40 shadow-red-500/30',
                      OTHER: 'from-slate-500/20 to-gray-500/20 border-slate-500/40 shadow-slate-500/30'
                    };
                    
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewLinkCategory(cat)}
                        className={`group relative py-4 rounded-2xl text-[7px] font-black uppercase border-2 transition-all duration-500 overflow-hidden ${
                          isSelected
                            ? `bg-gradient-to-br ${colors[cat]} text-white shadow-[0_0_25px_rgba(6,182,212,0.4)] scale-105`
                            : 'bg-gradient-to-br from-white/[0.02] to-white/[0.01] border-white/10 text-slate-500 hover:scale-[1.02] hover:border-cyan-500/30'
                        }`}
                      >
                        {/* Animated background glow */}
                        {isSelected && (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-indigo-500/10 animate-pulse" />
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                          </>
                        )}
                        
                        {/* Icon with animation */}
                        <div className={`relative text-2xl mb-1.5 transition-all duration-300 ${
                          isSelected ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'group-hover:scale-105'
                        }`}>
                          {icons[cat]}
                        </div>
                        
                        {/* Label */}
                        <div className={`relative tracking-[0.15em] transition-all duration-300 ${
                          isSelected ? 'text-white font-extrabold' : 'group-hover:text-cyan-400'
                        }`}>
                          {labels[cat]}
                        </div>
                        
                        {/* Selection indicator */}
                        {isSelected && (
                          <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-cyan-400 to-indigo-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                        )}
                        
                        {/* Hover shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <button
                type="submit"
                className="relative w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-300 text-[9px] font-black uppercase tracking-[0.3em] hover:from-cyan-500/30 hover:to-indigo-500/30 hover:border-cyan-400/50 transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] group overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="text-lg group-hover:scale-110 transition-transform">+</span>
                  Arquivar Link
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </button>
            </form>

            {/* Links List */}
            <div className="space-y-3 pb-20">
              <h3 className="text-[9px] tracking-[0.6em] text-cyan-500/50 font-black uppercase flex items-center gap-4">
                Seus Links <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/20 to-transparent" />
              </h3>
              
              {savedLinks.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <div className="text-6xl opacity-20">🔗</div>
                  <p className="text-slate-600 text-sm">Nenhum link arquivado ainda.</p>
                  <p className="text-slate-700 text-xs">Adicione links importantes no formulário acima.</p>
                </div>
              ) : (
                savedLinks.map(link => {
                  const daysOld = getDaysOld(link.createdAt);
                  const isOld = daysOld > 10;
                  return (
                    <div
                      key={link.id}
                      className={`bg-white/[0.02] border rounded-xl p-4 transition-all hover:bg-white/[0.04] ${
                        isOld ? 'border-red-500/30' : 'border-white/5'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors line-clamp-1"
                          >
                            {link.title}
                          </a>
                          <p className="text-[10px] text-slate-600 truncate mt-1">{link.url}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-slate-500">
                              {link.category === 'SHOPPING' ? '🛒 Compras' :
                               link.category === 'NEWS' ? '📰 Notícias' :
                               link.category === 'RESEARCH' ? '🔬 Pesquisa' :
                               link.category === 'VIDEO' ? '🎬 Vídeo' : '📎 Outro'}
                            </span>
                            <span
                              className={`text-[7px] font-mono ${
                                isOld ? 'text-red-400 font-bold' : 'text-slate-600'
                              }`}
                            >
                              {daysOld === 0 ? 'Hoje' : `${daysOld}d atrás`}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteSavedLink(link.id)}
                          className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {mainView === 'READER' && (
          <FastReader
            books={books}
            onSaveBook={handleSaveBook}
            onDeleteBook={handleDeleteBook}
            onSyncBooks={handleSyncBooks}
            cloudStatus={cloudStatus}
          />
        )}

        {mainView === 'MANGA' && (
          <MangaReader cloudStatus={cloudStatus} />
        )}

        {mainView === 'STORIES' && (
          <StoryBuilder />
        )}

        {mainView === 'SHOPPING' && (
          <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-5 duration-700">
            {/* Header */}
            <header className="border-b border-amber-500/10 pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="font-space text-3xl font-bold text-amber-400 tracking-wide">Gestão de Compras</h1>
                    <p className="text-slate-400 text-sm">Controle compras, preços e lucros</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddProduct(!showAddProduct)}
                  className="px-6 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-medium hover:bg-amber-500/20 transition-all"
                >
                  {showAddProduct ? '✕ Fechar' : '+ Novo Produto'}
                </button>
              </div>
            </header>

            {/* Period Summary Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Period Filter */}
              <div className="hologram-card p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-amber-400">Resumo do Período</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPeriodFilter('week')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        periodFilter === 'week'
                          ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400'
                          : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-amber-400'
                      }`}
                    >
                      Semana
                    </button>
                    <button
                      onClick={() => setPeriodFilter('month')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        periodFilter === 'month'
                          ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400'
                          : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-amber-400'
                      }`}
                    >
                      Mês
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Total Paid */}
                  <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
                    <div className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">💰 Total Pago</div>
                    <div className="text-3xl font-space font-bold text-orange-400">
                      R$ {periodTotals.totalPaid.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{periodTotals.count} compra{periodTotals.count !== 1 ? 's' : ''}</div>
                  </div>

                  {/* Total Sale */}
                  <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                    <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">🏷️ Total Vendas</div>
                    <div className="text-3xl font-space font-bold text-cyan-400">
                      R$ {periodTotals.totalSale.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Valor previsto de vendas</div>
                  </div>
                </div>
              </div>

              {/* Profit Card */}
              <div className="hologram-card p-6 rounded-2xl flex flex-col justify-center">
                <div className="text-center">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    📈 Lucro Bruto
                  </div>
                  <div className={`text-5xl md:text-6xl font-space font-bold mb-4 ${
                    periodTotals.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    R$ {periodTotals.totalProfit.toFixed(2)}
                  </div>
                  <div className="text-sm text-slate-400">
                    {periodTotals.totalProfit >= 0 ? '✅' : '⚠️'} 
                    {' '}Venda Total - Compra Total
                  </div>
                  {periodTotals.totalSale > 0 && (
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <span className="text-xs font-bold text-amber-400">MARGEM:</span>
                      <span className="text-lg font-space font-bold text-amber-400">
                        {((periodTotals.totalProfit / periodTotals.totalSale) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Company Discount Card */}
              {periodTotals.totalCompanyDiscount > 0 && (
                <div className="hologram-card p-6 rounded-2xl flex flex-col justify-center">
                  <div className="text-center">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      🏢 Desconto Empresa (10%)
                    </div>
                    <div className="text-4xl md:text-5xl font-space font-bold text-purple-400 mb-2">
                      R$ {periodTotals.totalCompanyDiscount.toFixed(2)}
                    </div>
                    <div className="text-sm text-slate-400">
                      💼 Desconto sobre o lucro bruto
                    </div>
                  </div>
                </div>
              )}
              
              {/* Net Profit Card */}
              {periodTotals.count > 0 && (
                <div className="md:col-span-2 hologram-card p-8 rounded-2xl border-2 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.3)] bg-gradient-to-br from-amber-500/5 to-yellow-500/5">
                  <div className="text-center">
                    <div className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3">
                      💰 Lucro Líquido Final {periodFilter === 'week' ? 'da Semana' : 'do Mês'}
                    </div>
                    <div className={`text-6xl md:text-8xl font-space font-bold mb-4 ${periodTotals.netProfit >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                      R$ {periodTotals.netProfit.toFixed(2)}
                    </div>
                    <div className="text-base text-slate-300 mb-4">
                      🧮 Lucro após desconto de 10% da empresa
                    </div>
                    <div className="flex items-center justify-center gap-4 text-sm flex-wrap">
                      <div className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                        Lucro Bruto: R$ {periodTotals.totalProfit.toFixed(2)}
                      </div>
                      <div className="text-slate-500 text-xl">−</div>
                      <div className="px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold">
                        Desconto 10%: R$ {periodTotals.totalCompanyDiscount.toFixed(2)}
                      </div>
                      <div className="text-amber-500 text-xl">=</div>
                      <div className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-400 font-bold">
                        Líquido: R$ {periodTotals.netProfit.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Add Product Form */}
            {showAddProduct && (
              <div className="hologram-card p-6 rounded-2xl space-y-4">
                <h3 className="text-lg font-bold text-amber-400">Cadastrar Novo Produto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nome do Produto</label>
                    <input
                      type="text"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      placeholder="Ex: Chocolate Nestlé"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-amber-500/20 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Valor de Venda (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      placeholder="Ex: 5.50"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-amber-500/20 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddProduct}
                  disabled={!newProductName.trim() || !newProductPrice.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all"
                >
                  Salvar Produto
                </button>
              </div>
            )}

            {/* Products List */}
            {products.length > 0 && (
              <div className="hologram-card p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-amber-400 mb-4">Produtos Cadastrados ({products.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {products.map(product => (
                    <div key={product.id} className="p-4 rounded-xl bg-slate-800/50 border border-amber-500/20 hover:border-amber-500/40 transition-all group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-bold text-white mb-1">{product.name}</div>
                          <div className="text-sm text-emerald-400">R$ {product.salePrice.toFixed(2)}</div>
                        </div>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Purchase Form */}
            <div className="hologram-card p-6 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold text-amber-400">Registrar Nova Compra</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Produto</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-amber-500/20 text-white focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="">Selecione...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Valor Pago (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={pricePaid}
                    onChange={(e) => setPricePaid(e.target.value)}
                    placeholder="Ex: 3.50"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-amber-500/20 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Valor de Venda (R$)</label>
                  <input
                    type="text"
                    value={selectedProductId ? `R$ ${products.find(p => p.id === selectedProductId)?.salePrice.toFixed(2) || '0.00'}` : 'Selecione o produto'}
                    disabled
                    className="w-full px-4 py-3 rounded-xl bg-slate-700/30 border border-amber-500/10 text-emerald-400 font-bold cursor-not-allowed"
                  />
                </div>
              </div>
              <button
                onClick={handleAddPurchase}
                disabled={!selectedProductId || !pricePaid.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all"
              >
                Registrar Compra
              </button>
            </div>

            {/* Purchases List */}
            {purchases.length > 0 && (
              <div className="hologram-card p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-amber-400">Histórico de Compras ({purchases.length})</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div>
                      Lucro Total: <span className="font-bold text-emerald-400">R$ {purchases.reduce((sum, p) => sum + p.profit, 0).toFixed(2)}</span>
                    </div>
                    <div>
                      Desc. 10%: <span className="font-bold text-purple-400">R$ {purchases.reduce((sum, p) => sum + (p.profit * 0.1), 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-amber-500/20">
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Produto</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Valor Pago</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Valor Venda</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Lucro</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Desc. 10%</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.map(purchase => (
                        <tr key={purchase.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-all group">
                          <td className="py-3 px-4 text-white">{purchase.productName}</td>
                          <td className="py-3 px-4 text-right text-orange-400">R$ {purchase.pricePaid.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right text-cyan-400">R$ {purchase.salePrice.toFixed(2)}</td>
                          <td className={`py-3 px-4 text-right font-bold ${purchase.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            R$ {purchase.profit.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right text-purple-400 font-bold">
                            R$ {(purchase.profit * 0.1).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeletePurchase(purchase.id)}
                              className="opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty State */}
            {products.length === 0 && (
              <div className="hologram-card p-12 rounded-2xl text-center">
                <svg className="w-20 h-20 mx-auto mb-4 text-amber-400/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-xl font-bold text-white mb-2">Nenhum produto cadastrado</h3>
                <p className="text-slate-400 mb-6">Comece adicionando seus primeiros produtos</p>
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all"
                >
                  + Adicionar Produto
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {tasks.filter(t => activeTaskIds.includes(t.id)).map((task, index) => (
        <TimerModal key={task.id} task={task} stackIndex={index} onUpdateTask={(updates) => updateTask(task.id, updates)} onClose={() => setActiveTaskIds(prev => prev.filter(id => id !== task.id))} onComplete={(status, seconds) => handleTaskAction(status as any, seconds, task)} onToggleStep={(stepId) => toggleStep(task.id, stepId)} onReward={(xp) => updateStats(xp, 'TIME_REWARD', 0, task)} />
      ))}

      {/* Google Drive Panel Modal */}
      {showDrivePanel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">🔗 Google Drive</h2>
                <p className="text-xs text-slate-400 mt-1">Sincronize com a nuvem</p>
              </div>
              <button
                onClick={() => setShowDrivePanel(false)}
                className="text-slate-400 hover:text-white transition-colors text-3xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <GoogleDrivePanel
                tasks={tasks}
                stats={stats}
                books={books}
                links={savedLinks}
                onRestoreBackup={handleRestoreFromDrive}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;