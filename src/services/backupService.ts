import { Task, UserStats, Book, SavedLink, Product, PurchaseItem } from '@/types';

export interface BackupData {
  version: string;
  timestamp: number;
  exportDate: string;
  userId: string;
  data: {
    tasks: Task[];
    stats: UserStats;
    books: Book[];
    links: SavedLink[];
    products: Product[];
    purchases: PurchaseItem[];
  };
}

// Export all data as JSON file
export function exportBackup(
  tasks: Task[],
  stats: UserStats,
  books: Book[],
  links: SavedLink[],
  products: Product[],
  purchases: PurchaseItem[]
): void {
  const userId = localStorage.getItem('cronos_user_id') || 'unknown';
  
  const backup: BackupData = {
    version: '1.0.0',
    timestamp: Date.now(),
    exportDate: new Date().toISOString(),
    userId,
    data: {
      tasks,
      stats,
      books,
      links,
      products,
      purchases
    }
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const fileName = `cronos_backup_${new Date().toISOString().split('T')[0]}.json`;
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  
  // Force download
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
  
  console.log('✅ Backup exported successfully!');
  console.log(`📦 Tasks: ${tasks.length} | Stats: Level ${stats.level} | Books: ${books.length} | Links: ${links.length} | Products: ${products.length} | Purchases: ${purchases.length}`);
}

// Import backup from JSON file
export async function importBackup(
  file: File
): Promise<BackupData | null> {
  try {
    const text = await file.text();
    const backup: BackupData = JSON.parse(text);
    
    // Validate backup structure
    if (!backup.version || !backup.data) {
      throw new Error('Invalid backup file format');
    }
    
    console.log('✅ Backup file validated!');
    console.log(`📦 Version: ${backup.version}`);
    console.log(`📅 Export date: ${backup.exportDate}`);
    console.log(`📦 Tasks: ${backup.data.tasks.length} | Level: ${backup.data.stats.level} | Books: ${backup.data.books.length}`);
    
    return backup;
  } catch (error: any) {
    console.error('❌ Failed to import backup:', error.message);
    return null;
  }
}

// Restore data from backup
export function restoreFromBackup(
  backup: BackupData,
  mode: 'replace' | 'merge' = 'replace'
): boolean {
  try {
    if (mode === 'replace') {
      // Replace all data
      localStorage.setItem('cronos_tasks', JSON.stringify(backup.data.tasks));
      localStorage.setItem('cronos_stats', JSON.stringify(backup.data.stats));
      localStorage.setItem('cronos_books', JSON.stringify(backup.data.books));
      localStorage.setItem('cronos_links', JSON.stringify(backup.data.links));
      localStorage.setItem('cronos_products', JSON.stringify(backup.data.products));
      localStorage.setItem('cronos_purchases', JSON.stringify(backup.data.purchases));
      
      console.log('✅ Data restored from backup (REPLACE mode)');
    } else {
      // Merge with existing data
      const existingTasks = JSON.parse(localStorage.getItem('cronos_tasks') || '[]');
      const existingBooks = JSON.parse(localStorage.getItem('cronos_books') || '[]');
      const existingLinks = JSON.parse(localStorage.getItem('cronos_links') || '[]');
      
      // Merge tasks (avoid duplicates by ID)
      const mergedTasks = [...existingTasks];
      backup.data.tasks.forEach(task => {
        if (!mergedTasks.find(t => t.id === task.id)) {
          mergedTasks.push(task);
        }
      });
      
      // Merge books (avoid duplicates by ID)
      const mergedBooks = [...existingBooks];
      backup.data.books.forEach(book => {
        if (!mergedBooks.find(b => b.id === book.id)) {
          mergedBooks.push(book);
        }
      });
      
      // Merge links (avoid duplicates by ID)
      const mergedLinks = [...existingLinks];
      backup.data.links.forEach(link => {
        if (!mergedLinks.find(l => l.id === link.id)) {
          mergedLinks.push(link);
        }
      });
      
      localStorage.setItem('cronos_tasks', JSON.stringify(mergedTasks));
      localStorage.setItem('cronos_books', JSON.stringify(mergedBooks));
      localStorage.setItem('cronos_links', JSON.stringify(mergedLinks));
      localStorage.setItem('cronos_products', JSON.stringify(backup.data.products));
      localStorage.setItem('cronos_purchases', JSON.stringify(backup.data.purchases));
      
      // For stats, use the backup if level is higher
      const existingStats = JSON.parse(localStorage.getItem('cronos_stats') || 'null');
      if (!existingStats || backup.data.stats.level > existingStats.level) {
        localStorage.setItem('cronos_stats', JSON.stringify(backup.data.stats));
      }
      
      console.log('✅ Data restored from backup (MERGE mode)');
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ Failed to restore backup:', error.message);
    return false;
  }
}

// Auto-backup to localStorage (keeps last 5 backups)
export function autoBackup(
  tasks: Task[],
  stats: UserStats,
  books: Book[],
  links: SavedLink[],
  products: Product[],
  purchases: PurchaseItem[]
): void {
  const userId = localStorage.getItem('cronos_user_id') || 'unknown';
  
  const backup: BackupData = {
    version: '1.0.0',
    timestamp: Date.now(),
    exportDate: new Date().toISOString(),
    userId,
    data: { tasks, stats, books, links, products, purchases }
  };
  
  // Get existing auto-backups
  const existing = localStorage.getItem('cronos_auto_backups');
  const backups: BackupData[] = existing ? JSON.parse(existing) : [];
  
  // Add new backup
  backups.unshift(backup);
  
  // Keep only last 5 backups
  if (backups.length > 5) {
    backups.splice(5);
  }
  
  localStorage.setItem('cronos_auto_backups', JSON.stringify(backups));
  
  console.log(`💾 Auto-backup saved (${backups.length}/5)`);
}

// Get list of auto-backups
export function getAutoBackups(): BackupData[] {
  const existing = localStorage.getItem('cronos_auto_backups');
  return existing ? JSON.parse(existing) : [];
}