import { parseProject, type Project } from './domain';
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open('kueche90-pilot', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('projects', { keyPath: 'id' });
    r.onsuccess = () => resolve(r.result);
    r.onerror = () =>
      reject(
        new Error(
          'Die lokale Ablage ist in diesem Browser nicht verfügbar. Bitte Projektdatei exportieren.',
        ),
      );
  });
}
export async function saveProject(project: Project) {
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('projects', 'readwrite');
    tx.objectStore('projects').put(parseProject(project));
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(
        new Error('Speichern fehlgeschlagen. Gerätespeicher prüfen oder Projektdatei exportieren.'),
      );
    };
  });
}
export async function listProjects(): Promise<Project[]> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('projects', 'readonly');
    const req = tx.objectStore('projects').getAll();
    req.onsuccess = () => {
      const projects: Project[] = [];
      for (const raw of req.result) {
        try {
          projects.push(parseProject(raw));
        } catch {
          /* Ignore invalid stored versions. */
        }
      }
      resolve(projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    };
    req.onerror = () => reject(new Error('Lokale Projekte konnten nicht gelesen werden.'));
    tx.oncomplete = () => db.close();
  });
}
export async function deleteProject(id: string) {
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('projects', 'readwrite');
    tx.objectStore('projects').delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(new Error('Projekt konnte nicht gelöscht werden.'));
    };
  });
}
