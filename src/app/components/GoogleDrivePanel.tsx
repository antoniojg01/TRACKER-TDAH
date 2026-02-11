import { useState, useEffect } from 'react';
import {
  initGoogleDrive,
  authorizeGoogleDrive,
  isAuthorized,
  signOutGoogleDrive,
  uploadBackupToDrive,
  listBackupFiles,
  downloadBackupFromDrive,
  loadLatestBackupFromDrive,
  autoSyncToDrive
} from '@/services/googleDriveService';
import { Task, UserStats, Book, SavedLink } from '@/types';

interface GoogleDrivePanelProps {
  tasks: Task[];
  stats: UserStats;
  books: Book[];
  links: SavedLink[];
  onRestoreBackup: (tasks: Task[], stats: UserStats, books: Book[], links: SavedLink[]) => void;
}

interface BackupFile {
  id: string;
  name: string;
  modifiedTime: string;
  size: number;
}

export default function GoogleDrivePanel({
  tasks,
  stats,
  books,
  links,
  onRestoreBackup
}: GoogleDrivePanelProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([]);
  const [showBackupList, setShowBackupList] = useState(false);
  const [error, setError] = useState<string>('');
  const [needsConfig, setNeedsConfig] = useState(false);

  useEffect(() => {
    // Check if user is already signed in
    setIsSignedIn(isAuthorized());
    
    // Initialize Google Drive API
    initGoogleDrive()
      .then(() => {
        setIsInitialized(true);
        console.log('✅ Google Drive initialized');
      })
      .catch((err) => {
        console.error('❌ Failed to initialize Google Drive:', err);
        setNeedsConfig(true);
      });
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await authorizeGoogleDrive();
      setIsSignedIn(true);
      console.log('✅ Signed in to Google Drive');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      console.error('❌ Sign in error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    signOutGoogleDrive();
    setIsSignedIn(false);
    setBackupFiles([]);
    setShowBackupList(false);
  };

  const handleUploadBackup = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await uploadBackupToDrive(tasks, stats, books, links);
      alert('✅ Backup salvo no Google Drive com sucesso!');
    } catch (err: any) {
      setError(err.message || 'Failed to upload backup');
      alert('❌ Erro ao salvar no Google Drive: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleListBackups = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const files = await listBackupFiles();
      setBackupFiles(files);
      setShowBackupList(true);
    } catch (err: any) {
      setError(err.message || 'Failed to list backups');
      alert('❌ Erro ao listar backups: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadBackup = async (fileId: string, fileName: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      const backup = await downloadBackupFromDrive(fileId);
      if (!backup) {
        alert('❌ Falha ao baixar backup');
        return;
      }

      const confirmed = confirm(
        `📦 Restaurar backup "${fileName}"?\n\n` +
        `📅 Data: ${new Date(backup.timestamp).toLocaleString('pt-BR')}\n` +
        `📋 Tarefas: ${backup.data.tasks.length}\n` +
        `⭐ Level: ${backup.data.stats.level}\n` +
        `📚 Livros: ${backup.data.books.length}\n\n` +
        `Isso vai SUBSTITUIR todos os dados atuais!`
      );

      if (confirmed) {
        onRestoreBackup(
          backup.data.tasks,
          backup.data.stats,
          backup.data.books,
          backup.data.links
        );
        alert('✅ Dados restaurados com sucesso!');
        setShowBackupList(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to download backup');
      alert('❌ Erro ao baixar backup: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadLatest = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const backup = await loadLatestBackupFromDrive();
      if (!backup) {
        alert('📂 Nenhum backup encontrado no Google Drive');
        return;
      }

      const confirmed = confirm(
        `📦 Restaurar backup mais recente?\n\n` +
        `📅 Data: ${new Date(backup.timestamp).toLocaleString('pt-BR')}\n` +
        `📋 Tarefas: ${backup.data.tasks.length}\n` +
        `⭐ Level: ${backup.data.stats.level}\n` +
        `📚 Livros: ${backup.data.books.length}\n\n` +
        `Isso vai SUBSTITUIR todos os dados atuais!`
      );

      if (confirmed) {
        onRestoreBackup(
          backup.data.tasks,
          backup.data.stats,
          backup.data.books,
          backup.data.links
        );
        alert('✅ Dados restaurados com sucesso!');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load latest backup');
      alert('❌ Erro ao carregar backup: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (needsConfig) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-red-400 mb-3">⚙️ Configuração Necessária</h3>
        <p className="text-xs text-red-300/80 mb-4">
          Para usar Google Drive, você precisa configurar as credenciais da API.
        </p>
        <ol className="text-xs text-red-300/80 space-y-2 mb-4 list-decimal list-inside">
          <li>Acesse: <a href="https://console.cloud.google.com/" target="_blank" className="underline">Google Cloud Console</a></li>
          <li>Crie um projeto e ative a Google Drive API</li>
          <li>Crie credenciais OAuth 2.0</li>
          <li>Configure em: <code className="bg-red-500/20 px-2 py-1 rounded">/src/services/googleDriveService.ts</code></li>
        </ol>
        <p className="text-xs text-red-300/60">
          Por enquanto, use os botões Export/Import manual.
        </p>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
        <p className="text-xs text-blue-300/80">🔄 Carregando Google Drive API...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sign In / Sign Out */}
      {!isSignedIn ? (
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl">
              🔗
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Google Drive Sync</h3>
              <p className="text-xs text-slate-400">Salve automaticamente no Drive</p>
            </div>
          </div>
          
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? '🔄 Conectando...' : '🔗 Conectar Google Drive'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-xl">
                ✅
              </div>
              <div>
                <h3 className="text-xs font-bold text-green-400">Conectado ao Google Drive</h3>
                <p className="text-[10px] text-green-300/60">Pasta: CRONOS Backups</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="text-[8px] font-bold text-red-400 hover:text-red-300 transition-colors px-3 py-2 rounded-lg border border-red-400/20 hover:bg-red-400/5"
            >
              Desconectar
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleUploadBackup}
              disabled={isLoading}
              className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 font-bold py-3 px-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 text-xs flex flex-col items-center gap-1"
            >
              <span className="text-lg">☁️</span>
              {isLoading ? 'Salvando...' : 'Salvar no Drive'}
            </button>

            <button
              onClick={handleLoadLatest}
              disabled={isLoading}
              className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 font-bold py-3 px-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 text-xs flex flex-col items-center gap-1"
            >
              <span className="text-lg">📥</span>
              {isLoading ? 'Carregando...' : 'Carregar Último'}
            </button>
          </div>

          <button
            onClick={handleListBackups}
            disabled={isLoading}
            className="w-full bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700 text-slate-300 font-bold py-3 px-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 text-xs"
          >
            {isLoading ? '🔄 Carregando...' : '📋 Ver Todos os Backups'}
          </button>
        </div>
      )}

      {/* Backup List Modal */}
      {showBackupList && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">📂 Backups no Google Drive</h3>
                <button
                  onClick={() => setShowBackupList(false)}
                  className="text-slate-400 hover:text-white transition-colors text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {backupFiles.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400 text-sm">📂 Nenhum backup encontrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {backupFiles.map((file) => (
                    <div
                      key={file.id}
                      className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:bg-slate-800/70 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-white truncate mb-1">
                            {file.name}
                          </h4>
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span>📅 {formatDate(file.modifiedTime)}</span>
                            <span>💾 {formatFileSize(file.size)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadBackup(file.id, file.name)}
                          disabled={isLoading}
                          className="bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 font-bold py-2 px-4 rounded-lg transition-all active:scale-95 disabled:opacity-50 text-xs whitespace-nowrap"
                        >
                          📥 Restaurar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-xs text-red-400">❌ {error}</p>
        </div>
      )}
    </div>
  );
}
