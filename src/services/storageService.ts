import { Task, UserStats } from '@/types';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9057c6ed`;

// OFFLINE MODE: Set to true to disable cloud sync attempts
const OFFLINE_MODE = false; // Set to 'true' to disable cloud completely

// Check if cloud storage is available
let cloudAvailable = !OFFLINE_MODE;
let lastCloudCheck = 0;

// Callback para atualizar status na UI
let statusCallback: ((status: 'synced' | 'syncing' | 'offline') => void) | null = null;

export function onCloudStatusChange(callback: (status: 'synced' | 'syncing' | 'offline') => void) {
  statusCallback = callback;
}

function updateStatus(status: 'synced' | 'syncing' | 'offline') {
  if (statusCallback) {
    statusCallback(status);
  }
}

// Force cloud sync attempt (ignores cache)
export async function forceCloudSync(): Promise<boolean> {
  console.log('🔄 Forcing cloud sync attempt...');
  console.log('📡 API URL:', API_URL);
  console.log('🔑 Has publicAnonKey:', !!publicAnonKey);
  updateStatus('syncing');
  
  // Reset cloud check cache to force new attempt
  lastCloudCheck = 0;
  cloudAvailable = true;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const url = `${API_URL}/health`;
    console.log('🌐 Fetching:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response ok:', response.ok);
    
    if (response.ok) {
      cloudAvailable = true;
      const data = await response.json();
      console.log('✅ Cloud connection restored!', data);
      updateStatus('synced');
      return true;
    } else {
      cloudAvailable = false;
      const errorText = await response.text();
      console.warn('⚠️ Cloud still unavailable. Status:', response.status, 'Body:', errorText);
      updateStatus('offline');
      return false;
    }
  } catch (error: any) {
    cloudAvailable = false;
    // Ignorar silenciosamente erros de AbortError (timeout)
    if (error.name === 'AbortError') {
      console.warn('⏱️ Cloud sync timeout - will retry later');
    } else {
      console.error('❌ Cloud connection failed:', error.message || error);
    }
    updateStatus('offline');
    return false;
  }
}

// Test function to diagnose cloud connection (call from console)
export async function testCloudConnection(): Promise<void> {
  console.log('🧪 === TESTING CLOUD CONNECTION ===');
  console.log('📡 API URL:', API_URL);
  console.log('🔑 publicAnonKey:', publicAnonKey ? `${publicAnonKey.substring(0, 20)}...` : 'MISSING');
  console.log('👤 User ID:', getUserId());
  
  // Test 1: Health check
  console.log('\n🧪 Test 1: Health Check');
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${publicAnonKey}` }
    });
    console.log('✅ Health check status:', response.status);
    const data = await response.json();
    console.log('✅ Health check response:', data);
  } catch (error: any) {
    console.error('❌ Health check failed:', error.message);
  }
  
  // Test 2: Try to save test data
  console.log('\n🧪 Test 2: Save Test Data');
  try {
    const testKey = `test_${Date.now()}`;
    const testValue = { message: 'CRONOS test save', timestamp: Date.now() };
    
    const response = await fetch(`${API_URL}/kv/set`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ key: testKey, value: testValue })
    });
    
    console.log('✅ Save test status:', response.status);
    const result = await response.json();
    console.log('✅ Save test response:', result);
    
    // Test 3: Try to read back
    console.log('\n🧪 Test 3: Read Test Data');
    const readResponse = await fetch(`${API_URL}/kv/get?key=${encodeURIComponent(testKey)}`, {
      headers: { 'Authorization': `Bearer ${publicAnonKey}` }
    });
    
    console.log('✅ Read test status:', readResponse.status);
    const readResult = await readResponse.json();
    console.log('✅ Read test response:', readResult);
    
    console.log('\n🎉 All tests passed! Cloud storage is working!');
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n🧪 === TEST COMPLETE ===');
}

async function checkCloudAvailability(): Promise<boolean> {
  // If offline mode is enabled, don't even try
  if (OFFLINE_MODE) {
    return false;
  }
  
  const now = Date.now();
  // Increase cache time to 5 minutes to reduce spam
  if (now - lastCloudCheck < 300000) { // 5 minutes
    return cloudAvailable;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    cloudAvailable = response.ok;
    lastCloudCheck = now;
    if (cloudAvailable) {
      console.log('✅ Cloud is available!');
      updateStatus('synced');
    } else {
      console.log('⚠️ Cloud health check failed, using localStorage only');
      updateStatus('offline');
    }
  } catch (error) {
    cloudAvailable = false;
    lastCloudCheck = now;
    // Only log first time, then cache the result
    if (!lastCloudCheck || now - lastCloudCheck > 300000) {
      console.log('⚠️ Cloud unavailable, using localStorage only (will retry in 5 min)');
    }
    updateStatus('offline');
  }
  
  return cloudAvailable;
}

// Get or create user ID (stored in localStorage)
export function getUserId(): string {
  let userId = localStorage.getItem('cronos_user_id');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('cronos_user_id', userId);
  }
  return userId;
}

// Save tasks to Supabase Cloud (with localStorage backup)
export async function saveTasks(tasks: Task[]): Promise<void> {
  // Always save to localStorage first (instant)
  localStorage.setItem('cronos_tasks', JSON.stringify(tasks));
  
  // Count tasks by type for logging
  const dailyCount = tasks.filter(t => t.type === 'DAILY').length;
  const routineCount = tasks.filter(t => t.type === 'ROUTINE').length;
  console.log(`💾 Saving ${tasks.length} tasks (${dailyCount} DAILY, ${routineCount} ROUTINE)`);
  console.log(`📂 Saved to localStorage successfully`);
  
  // Try cloud save in background
  const isCloudAvailable = await checkCloudAvailability();
  console.log(`☁️ Cloud available for tasks:`, isCloudAvailable);
  
  if (isCloudAvailable) {
    try {
      const userId = getUserId();
      const key = `cronos_tasks_${userId}`;
      
      console.log(`🔑 Salvando tasks no Supabase kv_store_9057c6ed...`);
      console.log(`🔑 User ID:`, userId);
      console.log(`🔑 Key:`, key);
      console.log(`📤 Sending to:`, `${API_URL}/kv/set`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(`${API_URL}/kv/set`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ key, value: tasks }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log(`📥 Tasks response status:`, response.status);
      console.log(`📥 Tasks response ok:`, response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        cloudAvailable = false;
        console.warn('☁️ Cloud sync failed, data saved locally. Error:', errorText);
        updateStatus('offline');
      } else {
        const result = await response.json();
        console.log(`✅ ☁️ TASKS SINCRONIZADAS NO SUPABASE! (${dailyCount} DAILY, ${routineCount} ROUTINE)`, result);
        console.log(`✅ Tabela: kv_store_9057c6ed | Key: ${key}`);
        updateStatus('synced');
      }
    } catch (error: any) {
      cloudAvailable = false;
      // Tratamento silencioso de erros de rede - dados já salvos localmente
      if (error.name === 'AbortError' || error.message === 'Failed to fetch') {
        // Silencioso - esperado quando offline
      } else if (error.message?.includes('520') || error.message?.includes('Web server is returning an unknown error')) {
        // Silencioso - Erro 520 do Cloudflare
      } else if (error.message?.includes('canceling statement due to statement timeout')) {
        // Silencioso - Timeout do banco de dados
      } else if (error.message?.includes('timeout')) {
        // Silencioso - Qualquer tipo de timeout
      } else {
        console.warn('⚠️ Tasks cloud sync unavailable - data saved locally');
      }
      updateStatus('offline');
    }
  }
  // Cloud unavailable - data safely stored in localStorage
}

// Load tasks from Supabase Cloud (with localStorage fallback)
export async function loadTasks(): Promise<Task[]> {
  // Try loading from cloud first
  if (await checkCloudAvailability()) {
    try {
      const userId = getUserId();
      const key = `cronos_tasks_${userId}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(`${API_URL}/kv/get?key=${encodeURIComponent(key)}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.value && Array.isArray(data.value) && data.value.length > 0) {
          // Sync cloud data to localStorage
          localStorage.setItem('cronos_tasks', JSON.stringify(data.value));
          
          // Count tasks by type for logging
          const dailyCount = data.value.filter((t: Task) => t.type === 'DAILY').length;
          const routineCount = data.value.filter((t: Task) => t.type === 'ROUTINE').length;
          console.log(`✅ Tasks loaded from cloud: ${data.value.length} total (${dailyCount} DAILY, ${routineCount} ROUTINE)`);
          
          updateStatus('synced');
          return data.value;
        }
      } else {
        cloudAvailable = false;
        updateStatus('offline');
      }
    } catch (error: any) {
      cloudAvailable = false;
      // Only log non-abort errors
      if (error.name !== 'AbortError') {
        console.error('❌ Failed to load tasks from cloud:', error);
      }
      // Fall through to localStorage
      updateStatus('offline');
    }
  }

  // Fallback to localStorage
  const saved = localStorage.getItem('cronos_tasks');
  const tasks = saved ? JSON.parse(saved) : [];
  
  if (tasks.length > 0) {
    const dailyCount = tasks.filter((t: Task) => t.type === 'DAILY').length;
    const routineCount = tasks.filter((t: Task) => t.type === 'ROUTINE').length;
    console.log(`📂 Tasks loaded from localStorage: ${tasks.length} total (${dailyCount} DAILY, ${routineCount} ROUTINE)`);
  }
  
  return tasks;
}

// Delete a task (no-op for now, handled in App.tsx)
export async function deleteTask(taskId: string): Promise<void> {
  // Tasks are managed in App.tsx state and auto-saved
  return;
}

// Save stats to Supabase Cloud (with localStorage backup)
export async function saveStats(stats: UserStats): Promise<void> {
  // Always save to localStorage first (instant)
  localStorage.setItem('cronos_stats', JSON.stringify(stats));
  
  console.log(`📊 Salvando stats no localStorage...`);
  console.log(`📊 Level: ${stats.level} | XP: ${stats.xp} | Total XP: ${stats.totalXP}`);
  
  // Try cloud save in background
  if (await checkCloudAvailability()) {
    try {
      const userId = getUserId();
      const key = `cronos_stats_${userId}`;
      
      console.log(`🔑 Salvando stats no Supabase kv_store_9057c6ed...`);
      console.log(`🔑 Key:`, key);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(`${API_URL}/kv/set`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ key, value: stats }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        cloudAvailable = false;
        console.warn('☁️ Cloud sync failed, data saved locally');
        updateStatus('offline');
      } else {
        console.log(`✅ ☁️ STATS SINCRONIZADAS NO SUPABASE!`);
        console.log(`✅ Tabela: kv_store_9057c6ed | Key: ${key}`);
        updateStatus('synced');
      }
    } catch (error: any) {
      cloudAvailable = false;
      // Tratamento silencioso de erros de rede - dados já salvos localmente
      if (error.name === 'AbortError' || error.message === 'Failed to fetch') {
        // Silencioso - esperado quando offline
      } else {
        console.warn('⚠️ Stats cloud sync unavailable - data saved locally');
      }
      updateStatus('offline');
    }
  }
}

// Load stats from Supabase Cloud (with localStorage fallback)
export async function loadStats(): Promise<UserStats | null> {
  // Try loading from cloud first
  if (await checkCloudAvailability()) {
    try {
      const userId = getUserId();
      const key = `cronos_stats_${userId}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(`${API_URL}/kv/get?key=${encodeURIComponent(key)}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.value) {
          // Sync cloud data to localStorage
          localStorage.setItem('cronos_stats', JSON.stringify(data.value));
          console.log('✅ Stats loaded from cloud');
          updateStatus('synced');
          return data.value;
        }
      } else {
        cloudAvailable = false;
        updateStatus('offline');
      }
    } catch (error: any) {
      cloudAvailable = false;
      // Only log non-abort errors
      if (error.name !== 'AbortError') {
        console.error('❌ Failed to load stats from cloud:', error);
      }
      updateStatus('offline');
    }
  }

  // Fallback to localStorage
  const saved = localStorage.getItem('cronos_stats');
  return saved ? JSON.parse(saved) : null;
}

// Save books to Supabase Cloud (with localStorage backup)
export async function saveBooks(books: any[]): Promise<void> {
  // Always save to localStorage first (instant)
  localStorage.setItem('cronos_books', JSON.stringify(books));
  
  // Count books by status
  const activeCount = books.filter(b => !b.completed).length;
  const completedCount = books.filter(b => b.completed).length;
  console.log(`📚 Salvando ${books.length} books (${activeCount} lendo, ${completedCount} completos)`);
  console.log(`📂 Saved to localStorage successfully`);
  
  // Try cloud save in background
  if (await checkCloudAvailability()) {
    try {
      const userId = getUserId();
      const key = `cronos_books_${userId}`;
      
      console.log(`🔑 Salvando books no Supabase kv_store_9057c6ed...`);
      console.log(`🔑 Key:`, key);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Aumentado para 15s
      
      const response = await fetch(`${API_URL}/kv/set`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ key, value: books }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        cloudAvailable = false;
        console.warn('☁️ Books sync failed, data saved locally');
        updateStatus('offline');
      } else {
        console.log(`✅ ☁️ BOOKS SINCRONIZADOS NO SUPABASE! (${activeCount} lendo, ${completedCount} completos)`);
        console.log(`✅ Tabela: kv_store_9057c6ed | Key: ${key}`);
        updateStatus('synced');
      }
    } catch (error: any) {
      cloudAvailable = false;
      // Tratamento silencioso de erros de rede - dados já salvos localmente
      if (error.name === 'AbortError' || error.message === 'Failed to fetch') {
        // Silencioso - esperado quando offline
      } else {
        console.warn('⚠️ Books cloud sync unavailable - data saved locally');
      }
      updateStatus('offline');
    }
  }
}

// Load books from Supabase Cloud (with localStorage fallback)
export async function loadBooks(): Promise<any[]> {
  // Try loading from cloud first
  if (await checkCloudAvailability()) {
    try {
      const userId = getUserId();
      const key = `cronos_books_${userId}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(`${API_URL}/kv/get?key=${encodeURIComponent(key)}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.value && Array.isArray(data.value) && data.value.length > 0) {
          // Sync cloud data to localStorage
          localStorage.setItem('cronos_books', JSON.stringify(data.value));
          
          // Count books by status
          const activeCount = data.value.filter((b: any) => !b.completed).length;
          const completedCount = data.value.filter((b: any) => b.completed).length;
          console.log(`✅ Books loaded from cloud: ${data.value.length} total (${activeCount} reading, ${completedCount} completed)`);
          
          updateStatus('synced');
          return data.value;
        }
      } else {
        cloudAvailable = false;
        updateStatus('offline');
      }
    } catch (error: any) {
      cloudAvailable = false;
      // Only log non-abort errors
      if (error.name !== 'AbortError') {
        console.error('❌ Failed to load books from cloud:', error);
      }
      updateStatus('offline');
    }
  }

  // Fallback to localStorage
  const saved = localStorage.getItem('cronos_books');
  const books = saved ? JSON.parse(saved) : [];
  
  if (books.length > 0) {
    const activeCount = books.filter((b: any) => !b.completed).length;
    const completedCount = books.filter((b: any) => b.completed).length;
    console.log(`📂 Books loaded from localStorage: ${books.length} total (${activeCount} reading, ${completedCount} completed)`);
  }
  
  return books;
}