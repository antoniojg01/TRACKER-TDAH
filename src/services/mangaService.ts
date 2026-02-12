import { collection, doc, getDocs, query, setDoc, serverTimestamp, where } from 'firebase/firestore';
import { getDownloadURL, listAll, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from './firebaseConfig';

export interface MangaMeta {
  id: string;
  title: string;
  pageCount: number;
  createdAt?: number;
  coverUrl?: string;
}

const COLLECTIONS = {
  MANGA: 'manga'
};

const USER_ID = 'default_user';

const sortByName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, undefined, { numeric: true });

const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

export const uploadMangaFromImages = async (title: string, files: File[]): Promise<MangaMeta> => {
  if (!files.length) {
    throw new Error('Nenhuma imagem selecionada');
  }

  const mangaId = crypto.randomUUID();
  const orderedFiles = [...files].sort(sortByName);
  const basePath = `manga/${USER_ID}/${mangaId}`;

  let coverUrl: string | undefined;

  await Promise.all(
    orderedFiles.map(async (file, index) => {
      const safeName = sanitizeFileName(file.name || `page_${index + 1}`);
      const fileName = `${String(index + 1).padStart(4, '0')}_${safeName}`;
      const fileRef = ref(storage, `${basePath}/${fileName}`);
      await uploadBytes(fileRef, file);
      if (index === 0) {
        coverUrl = await getDownloadURL(fileRef);
      }
    })
  );

  const meta: MangaMeta = {
    id: mangaId,
    title,
    pageCount: orderedFiles.length,
    coverUrl
  };

  await setDoc(doc(db, COLLECTIONS.MANGA, mangaId), {
    ...meta,
    userId: USER_ID,
    createdAt: serverTimestamp()
  });

  return meta;
};

export const loadMangaList = async (): Promise<MangaMeta[]> => {
  const q = query(collection(db, COLLECTIONS.MANGA), where('userId', '==', USER_ID));
  const snapshot = await getDocs(q);

  const mangas = snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as MangaMeta & { createdAt?: { toMillis?: () => number } };
    return {
      id: docSnap.id,
      title: data.title,
      pageCount: data.pageCount,
      coverUrl: data.coverUrl,
      createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : undefined
    };
  });

  return mangas.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
};

export const loadMangaPages = async (mangaId: string): Promise<string[]> => {
  const folderRef = ref(storage, `manga/${USER_ID}/${mangaId}`);
  const list = await listAll(folderRef);
  const orderedItems = list.items.sort(sortByName);

  return Promise.all(orderedItems.map((item) => getDownloadURL(item)));
};
