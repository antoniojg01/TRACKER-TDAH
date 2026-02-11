import { Task, UserStats } from '@/types';

// Get or create user ID (stored in localStorage)
export function getUserId(): string {
  let userId = localStorage.getItem('cronos_user_id');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('cronos_user_id', userId);
  }
  return userId;
}

// Save tasks to localStorage
export async function saveTasks(tasks: Task[]): Promise<void> {
  try {
    localStorage.setItem('cronos_tasks', JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving tasks:', error);
  }
}

// Load tasks from localStorage
export async function loadTasks(): Promise<Task[]> {
  try {
    const saved = localStorage.getItem('cronos_tasks');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading tasks:', error);
    return [];
  }
}

// Delete a task (no-op for now, handled in App.tsx)
export async function deleteTask(taskId: string): Promise<void> {
  // Tasks are managed in App.tsx state and auto-saved
  return;
}

// Save stats to localStorage
export async function saveStats(stats: UserStats): Promise<void> {
  try {
    localStorage.setItem('cronos_stats', JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving stats:', error);
  }
}

// Load stats from localStorage
export async function loadStats(): Promise<UserStats | null> {
  try {
    const saved = localStorage.getItem('cronos_stats');
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Error loading stats:', error);
    return null;
  }
}
