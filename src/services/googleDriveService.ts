import { Task, UserStats, Book, SavedLink } from '@/types';

// Google Drive API Configuration
const FOLDER_ID = '1Irg8XqgU-DhMcSA3i_ZteLPKedrYgMBu';
const API_KEY = ''; // User will need to provide this
const CLIENT_ID = ''; // User will need to provide this
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let gapiLoaded = false;
let gisLoaded = false;
let tokenClient: any = null;
let accessToken: string | null = null;

interface BackupFile {
  id: string;
  name: string;
  modifiedTime: string;
  size: number;
}

interface BackupData {
  version: string;
  timestamp: number;
  exportDate: string;
  userId: string;
  data: {
    tasks: Task[];
    stats: UserStats;
    books: Book[];
    links: SavedLink[];
  };
}

// Load Google API scripts
export function initGoogleDrive(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (gapiLoaded && gisLoaded) {
      resolve();
      return;
    }

    // Load gapi script
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.async = true;
    gapiScript.defer = true;
    gapiScript.onload = () => {
      (window as any).gapi.load('client', async () => {
        await (window as any).gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });
        gapiLoaded = true;
        console.log('✅ Google Drive API loaded');
        if (gisLoaded) resolve();
      });
    };
    gapiScript.onerror = reject;
    document.body.appendChild(gapiScript);

    // Load gis script (Google Identity Services)
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.async = true;
    gisScript.defer = true;
    gisScript.onload = () => {
      if (!CLIENT_ID) {
        console.warn('⚠️ Google Drive CLIENT_ID not configured');
        gisLoaded = true;
        if (gapiLoaded) resolve();
        return;
      }

      tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // Will be set later
      });
      gisLoaded = true;
      console.log('✅ Google Identity Services loaded');
      if (gapiLoaded) resolve();
    };
    gisScript.onerror = reject;
    document.body.appendChild(gisScript);
  });
}

// Request authorization and get access token
export function authorizeGoogleDrive(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google Identity Services not loaded'));
      return;
    }

    tokenClient.callback = (response: any) => {
      if (response.error) {
        reject(new Error(response.error));
        return;
      }
      accessToken = response.access_token;
      localStorage.setItem('google_drive_token', accessToken);
      console.log('✅ Google Drive authorized!');
      resolve(accessToken);
    };

    // Check if we have a stored token
    const storedToken = localStorage.getItem('google_drive_token');
    if (storedToken) {
      accessToken = storedToken;
      // Verify token is still valid
      fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: { Authorization: `Bearer ${storedToken}` }
      })
        .then(response => {
          if (response.ok) {
            console.log('✅ Using cached Google Drive token');
            resolve(storedToken);
          } else {
            // Token expired, request new one
            localStorage.removeItem('google_drive_token');
            tokenClient.requestAccessToken({ prompt: 'consent' });
          }
        })
        .catch(() => {
          // Token invalid, request new one
          localStorage.removeItem('google_drive_token');
          tokenClient.requestAccessToken({ prompt: 'consent' });
        });
    } else {
      // Request new token
      tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  });
}

// Check if user is authorized
export function isAuthorized(): boolean {
  const token = localStorage.getItem('google_drive_token');
  return !!token;
}

// Sign out
export function signOutGoogleDrive(): void {
  accessToken = null;
  localStorage.removeItem('google_drive_token');
  if ((window as any).google?.accounts?.oauth2) {
    const token = localStorage.getItem('google_drive_token');
    if (token) {
      (window as any).google.accounts.oauth2.revoke(token);
    }
  }
  console.log('✅ Signed out from Google Drive');
}

// List backup files in the folder
export async function listBackupFiles(): Promise<BackupFile[]> {
  if (!accessToken) {
    throw new Error('Not authorized. Please sign in first.');
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?` +
      `q='${FOLDER_ID}'+in+parents+and+name+contains+'cronos_backup'+and+trashed=false` +
      `&fields=files(id,name,modifiedTime,size)` +
      `&orderBy=modifiedTime desc`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.statusText}`);
    }

    const data = await response.json();
    return data.files || [];
  } catch (error: any) {
    console.error('❌ Failed to list backup files:', error);
    throw error;
  }
}

// Upload backup to Google Drive
export async function uploadBackupToDrive(
  tasks: Task[],
  stats: UserStats,
  books: Book[],
  links: SavedLink[]
): Promise<string> {
  if (!accessToken) {
    throw new Error('Not authorized. Please sign in first.');
  }

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
      links
    }
  };

  const fileName = `cronos_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
  const fileContent = JSON.stringify(backup, null, 2);
  const blob = new Blob([fileContent], { type: 'application/json' });

  // Create metadata
  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    parents: [FOLDER_ID]
  };

  // Create form data for multipart upload
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  try {
    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload failed: ${error}`);
    }

    const result = await response.json();
    console.log('✅ Backup uploaded to Google Drive:', result.name);
    console.log(`📦 Tasks: ${tasks.length} | Stats: Level ${stats.level} | Books: ${books.length} | Links: ${links.length}`);
    return result.id;
  } catch (error: any) {
    console.error('❌ Failed to upload backup:', error);
    throw error;
  }
}

// Download backup from Google Drive
export async function downloadBackupFromDrive(fileId: string): Promise<BackupData | null> {
  if (!accessToken) {
    throw new Error('Not authorized. Please sign in first.');
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    const backup: BackupData = await response.json();
    
    // Validate backup structure
    if (!backup.version || !backup.data) {
      throw new Error('Invalid backup file format');
    }

    console.log('✅ Backup downloaded from Google Drive');
    console.log(`📦 Version: ${backup.version}`);
    console.log(`📅 Export date: ${backup.exportDate}`);
    console.log(`📦 Tasks: ${backup.data.tasks.length} | Level: ${backup.data.stats.level} | Books: ${backup.data.books.length}`);

    return backup;
  } catch (error: any) {
    console.error('❌ Failed to download backup:', error);
    return null;
  }
}

// Auto-sync to Google Drive (called periodically)
export async function autoSyncToDrive(
  tasks: Task[],
  stats: UserStats,
  books: Book[],
  links: SavedLink[]
): Promise<boolean> {
  if (!isAuthorized()) {
    console.log('⚠️ Google Drive not authorized, skipping auto-sync');
    return false;
  }

  try {
    // Check when was the last sync
    const lastSync = localStorage.getItem('last_drive_sync');
    const now = Date.now();
    
    // Only sync if more than 10 minutes have passed
    if (lastSync && now - parseInt(lastSync) < 10 * 60 * 1000) {
      console.log('⏭️ Skipping auto-sync (last sync was recent)');
      return false;
    }

    await uploadBackupToDrive(tasks, stats, books, links);
    localStorage.setItem('last_drive_sync', now.toString());
    return true;
  } catch (error: any) {
    console.error('❌ Auto-sync to Drive failed:', error);
    return false;
  }
}

// Load latest backup from Google Drive
export async function loadLatestBackupFromDrive(): Promise<BackupData | null> {
  if (!isAuthorized()) {
    throw new Error('Not authorized. Please sign in first.');
  }

  try {
    const files = await listBackupFiles();
    if (files.length === 0) {
      console.log('📂 No backups found in Google Drive');
      return null;
    }

    // Get the most recent file
    const latestFile = files[0];
    console.log(`📥 Loading latest backup: ${latestFile.name}`);
    
    return await downloadBackupFromDrive(latestFile.id);
  } catch (error: any) {
    console.error('❌ Failed to load latest backup:', error);
    return null;
  }
}
