import { db } from './firebaseConfig';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  updateDoc,
  getDocFromCache,
  getDocFromServer
} from 'firebase/firestore';
import type { Task, UserStats, Book, Story, SavedLink, Product, PurchaseItem } from '@/types';

// Collection names
const COLLECTIONS = {
  TASKS: 'tasks',
  STATS: 'stats',
  BOOKS: 'books',
  STORIES: 'stories',
  LINKS: 'links',
  PRODUCTS: 'products',
  PURCHASES: 'purchases'
};

// User ID - você pode mudar para autenticação real depois
const USER_ID = 'default_user';

// Flag para controlar se Firebase está acessível
let firebaseAvailable = true;
let firebaseCheckAttempted = false;

// Helper para verificar se Firebase está disponível
const checkFirebaseAvailability = async (): Promise<boolean> => {
  if (firebaseCheckAttempted) return firebaseAvailable;
  
  try {
    const testRef = doc(db, 'test', 'connection');
    await getDoc(testRef);
    firebaseAvailable = true;
    firebaseCheckAttempted = true;
    console.log('✅ Firebase: Conectado!');
    return true;
  } catch (error: any) {
    if (error.code === 'unavailable' || error.code === 'permission-denied' || error.code === 'failed-precondition') {
      firebaseAvailable = false;
      firebaseCheckAttempted = true;
      console.warn('⚠️ Firebase: Não disponível, usando apenas localStorage');
      return false;
    }
    // Para outros erros, assume que está disponível
    firebaseAvailable = true;
    firebaseCheckAttempted = true;
    return true;
  }
};

// Helper para buscar com fallback silencioso
const getDocWithFallback = async (docRef: any) => {
  // Se já sabemos que Firebase não está disponível, não tenta
  if (!firebaseAvailable && firebaseCheckAttempted) {
    throw new Error('FIREBASE_UNAVAILABLE');
  }

  try {
    const docSnap = await getDoc(docRef);
    // Se chegou aqui, Firebase está disponível
    if (!firebaseCheckAttempted) {
      firebaseAvailable = true;
      firebaseCheckAttempted = true;
    }
    return docSnap;
  } catch (error: any) {
    // Marca Firebase como indisponível
    if (error.code === 'unavailable' || error.code === 'permission-denied') {
      firebaseAvailable = false;
      firebaseCheckAttempted = true;
    }
    
    // Tenta buscar do cache silenciosamente
    try {
      return await getDocFromCache(docRef);
    } catch (cacheError) {
      throw new Error('FIREBASE_UNAVAILABLE');
    }
  }
};

// ========== TASKS ==========
export const saveTasks = async (tasks: Task[]): Promise<void> => {
  try {
    console.log('🔥 Firebase: Salvando tasks...', tasks.length);
    const tasksRef = doc(db, COLLECTIONS.TASKS, USER_ID);
    await setDoc(tasksRef, {
      tasks: tasks,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Firebase: Tasks salvas com sucesso!');
  } catch (error) {
    console.error('❌ Firebase: Erro ao salvar tasks:', error);
    // Fallback para localStorage
    localStorage.setItem('cronos_tasks', JSON.stringify(tasks));
  }
};

export const loadTasks = async (): Promise<Task[]> => {
  // Fallback direto para localStorage se Firebase não está disponível
  if (!firebaseAvailable && firebaseCheckAttempted) {
    const local = localStorage.getItem('cronos_tasks');
    return local ? JSON.parse(local) : [];
  }

  try {
    const tasksRef = doc(db, COLLECTIONS.TASKS, USER_ID);
    const docSnap = await getDocWithFallback(tasksRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.tasks || [];
    }
    
    return [];
  } catch (error: any) {
    // Fallback silencioso para localStorage
    if (error.message === 'FIREBASE_UNAVAILABLE') {
      const local = localStorage.getItem('cronos_tasks');
      return local ? JSON.parse(local) : [];
    }
    // Para outros erros, também usa localStorage
    const local = localStorage.getItem('cronos_tasks');
    return local ? JSON.parse(local) : [];
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    const tasks = await loadTasks();
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    await saveTasks(updatedTasks);
  } catch (error) {
    console.error('❌ Firebase: Erro ao deletar task:', error);
  }
};

// ========== STATS ==========
export const saveStats = async (stats: UserStats): Promise<void> => {
  try {
    console.log('🔥 Firebase: Salvando stats...');
    const statsRef = doc(db, COLLECTIONS.STATS, USER_ID);
    await setDoc(statsRef, {
      ...stats,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Firebase: Stats salvos com sucesso!');
  } catch (error) {
    console.error('❌ Firebase: Erro ao salvar stats:', error);
    // Fallback para localStorage
    localStorage.setItem('cronos_stats', JSON.stringify(stats));
  }
};

export const loadStats = async (): Promise<UserStats | null> => {
  // Fallback direto para localStorage se Firebase não está disponível
  if (!firebaseAvailable && firebaseCheckAttempted) {
    const local = localStorage.getItem('cronos_stats');
    return local ? JSON.parse(local) : null;
  }

  try {
    const statsRef = doc(db, COLLECTIONS.STATS, USER_ID);
    const docSnap = await getDocWithFallback(statsRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as UserStats;
      return data;
    }
    
    return null;
  } catch (error: any) {
    // Fallback silencioso para localStorage
    const local = localStorage.getItem('cronos_stats');
    return local ? JSON.parse(local) : null;
  }
};

// ========== BOOKS ==========
export const saveBooks = async (books: Book[]): Promise<void> => {
  try {
    console.log('🔥 Firebase: Salvando books...', books.length);
    const booksRef = doc(db, COLLECTIONS.BOOKS, USER_ID);
    await setDoc(booksRef, {
      books: books,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Firebase: Books salvos com sucesso!');
  } catch (error) {
    console.error('❌ Firebase: Erro ao salvar books:', error);
    // Fallback para localStorage
    localStorage.setItem('cronos_books', JSON.stringify(books));
  }
};

export const loadBooks = async (): Promise<Book[]> => {
  if (!firebaseAvailable && firebaseCheckAttempted) {
    const local = localStorage.getItem('cronos_books');
    return local ? JSON.parse(local) : [];
  }

  try {
    const booksRef = doc(db, COLLECTIONS.BOOKS, USER_ID);
    const docSnap = await getDocWithFallback(booksRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.books || [];
    }
    
    return [];
  } catch (error: any) {
    const local = localStorage.getItem('cronos_books');
    return local ? JSON.parse(local) : [];
  }
};

// ========== STORIES ==========
export const saveStories = async (stories: Story[]): Promise<void> => {
  try {
    console.log('🔥 Firebase: Salvando stories...', stories.length);
    const storiesRef = doc(db, COLLECTIONS.STORIES, USER_ID);
    await setDoc(storiesRef, {
      stories: stories,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Firebase: Stories salvos com sucesso!');
  } catch (error) {
    console.error('❌ Firebase: Erro ao salvar stories:', error);
    // Fallback para localStorage
    localStorage.setItem('cronos_stories', JSON.stringify(stories));
  }
};

export const loadStories = async (): Promise<Story[]> => {
  if (!firebaseAvailable && firebaseCheckAttempted) {
    const local = localStorage.getItem('cronos_stories');
    return local ? JSON.parse(local) : [];
  }

  try {
    const storiesRef = doc(db, COLLECTIONS.STORIES, USER_ID);
    const docSnap = await getDocWithFallback(storiesRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.stories || [];
    }
    
    return [];
  } catch (error: any) {
    const local = localStorage.getItem('cronos_stories');
    return local ? JSON.parse(local) : [];
  }
};

// ========== LINKS ==========
export const saveLinks = async (links: SavedLink[]): Promise<void> => {
  try {
    console.log('🔥 Firebase: Salvando links...', links.length);
    const linksRef = doc(db, COLLECTIONS.LINKS, USER_ID);
    await setDoc(linksRef, {
      links: links,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Firebase: Links salvos com sucesso!');
  } catch (error) {
    console.error('❌ Firebase: Erro ao salvar links:', error);
    // Fallback para localStorage
    localStorage.setItem('cronos_links', JSON.stringify(links));
  }
};

export const loadLinks = async (): Promise<SavedLink[]> => {
  if (!firebaseAvailable && firebaseCheckAttempted) {
    const local = localStorage.getItem('cronos_links');
    return local ? JSON.parse(local) : [];
  }

  try {
    const linksRef = doc(db, COLLECTIONS.LINKS, USER_ID);
    const docSnap = await getDocWithFallback(linksRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.links || [];
    }
    
    return [];
  } catch (error: any) {
    const local = localStorage.getItem('cronos_links');
    return local ? JSON.parse(local) : [];
  }
};

// ========== PRODUCTS ==========
export const saveProducts = async (products: Product[]): Promise<void> => {
  try {
    console.log('🔥 Firebase: Salvando products...', products.length);
    const productsRef = doc(db, COLLECTIONS.PRODUCTS, USER_ID);
    await setDoc(productsRef, {
      products: products,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Firebase: Products salvos com sucesso!');
  } catch (error) {
    console.error('❌ Firebase: Erro ao salvar products:', error);
    // Fallback para localStorage
    localStorage.setItem('cronos_products', JSON.stringify(products));
  }
};

export const loadProducts = async (): Promise<Product[]> => {
  if (!firebaseAvailable && firebaseCheckAttempted) {
    const local = localStorage.getItem('cronos_products');
    return local ? JSON.parse(local) : [];
  }

  try {
    const productsRef = doc(db, COLLECTIONS.PRODUCTS, USER_ID);
    const docSnap = await getDocWithFallback(productsRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.products || [];
    }
    
    return [];
  } catch (error: any) {
    const local = localStorage.getItem('cronos_products');
    return local ? JSON.parse(local) : [];
  }
};

// ========== PURCHASES ==========
export const savePurchases = async (purchases: PurchaseItem[]): Promise<void> => {
  try {
    console.log('🔥 Firebase: Salvando purchases...', purchases.length);
    const purchasesRef = doc(db, COLLECTIONS.PURCHASES, USER_ID);
    await setDoc(purchasesRef, {
      purchases: purchases,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Firebase: Purchases salvos com sucesso!');
  } catch (error) {
    console.error('❌ Firebase: Erro ao salvar purchases:', error);
    // Fallback para localStorage
    localStorage.setItem('cronos_purchases', JSON.stringify(purchases));
  }
};

export const loadPurchases = async (): Promise<PurchaseItem[]> => {
  if (!firebaseAvailable && firebaseCheckAttempted) {
    const local = localStorage.getItem('cronos_purchases');
    return local ? JSON.parse(local) : [];
  }

  try {
    const purchasesRef = doc(db, COLLECTIONS.PURCHASES, USER_ID);
    const docSnap = await getDocWithFallback(purchasesRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.purchases || [];
    }
    
    return [];
  } catch (error: any) {
    const local = localStorage.getItem('cronos_purchases');
    return local ? JSON.parse(local) : [];
  }
};

// ========== UTILITY FUNCTIONS ==========
export const forceFirebaseSync = async (): Promise<boolean> => {
  try {
    console.log('🔥 Firebase: Testando conexão...');
    const testRef = doc(db, 'test', 'connection');
    await setDoc(testRef, { timestamp: serverTimestamp() });
    console.log('✅ Firebase: Conexão OK!');
    return true;
  } catch (error) {
    console.error('❌ Firebase: Offline ou erro de conexão:', error);
    return false;
  }
};

export const migrateFromLocalStorage = async (): Promise<void> => {
  try {
    console.log('🔄 Firebase: Iniciando migração do localStorage...');
    
    // Migrate tasks
    const localTasks = localStorage.getItem('cronos_tasks');
    if (localTasks) {
      const tasks = JSON.parse(localTasks);
      await saveTasks(tasks);
      console.log('✅ Tasks migradas!');
    }
    
    // Migrate stats
    const localStats = localStorage.getItem('cronos_stats');
    if (localStats) {
      const stats = JSON.parse(localStats);
      await saveStats(stats);
      console.log('✅ Stats migradas!');
    }
    
    // Migrate books
    const localBooks = localStorage.getItem('cronos_books');
    if (localBooks) {
      const books = JSON.parse(localBooks);
      await saveBooks(books);
      console.log('✅ Books migrados!');
    }

    // Migrate stories
    const localStories = localStorage.getItem('cronos_stories');
    if (localStories) {
      const stories = JSON.parse(localStories);
      await saveStories(stories);
      console.log('✅ Stories migradas!');
    }
    
    // Migrate links
    const localLinks = localStorage.getItem('cronos_links');
    if (localLinks) {
      const links = JSON.parse(localLinks);
      await saveLinks(links);
      console.log('✅ Links migrados!');
    }
    
    // Migrate products
    const localProducts = localStorage.getItem('cronos_products');
    if (localProducts) {
      const products = JSON.parse(localProducts);
      await saveProducts(products);
      console.log('✅ Products migrados!');
    }
    
    // Migrate purchases
    const localPurchases = localStorage.getItem('cronos_purchases');
    if (localPurchases) {
      const purchases = JSON.parse(localPurchases);
      await savePurchases(purchases);
      console.log('✅ Purchases migradas!');
    }
    
    console.log('🎉 Migração completa do localStorage para Firebase!');
  } catch (error) {
    console.error('❌ Erro na migração:', error);
  }
};