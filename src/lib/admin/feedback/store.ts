// src/lib/admin/feedback/store.ts
import type { Feedback } from "./types";
import { MOCK_FEEDBACK } from "./mock";

const STORAGE_KEY = "feedbackRepo";

function loadCache(): Feedback[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Feedback[]) : [];
  } catch {
    return [];
  }
}

function saveCache(rows: Feedback[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  }
}

function ensureSeed() {
  const cur = loadCache();
  if (!cur || cur.length === 0) {
    saveCache(MOCK_FEEDBACK);
  }
}

export const FeedbackRepo = {
  /** Call on mount — seeds when empty */
  init() {
    ensureSeed();
  },

  async list(): Promise<Feedback[]> {
    try {
      const response = await fetch('/api/feedback?limit=100');
      const result = await response.json();
      
      if (result.ok && result.data) {
        // Transform from DB format
        const feedback: Feedback[] = result.data.map((d: any) => ({
          id: d.id,
          createdAt: d.created_at,
          user: d.user_name || 'Anonymous',
          message: d.message,
          rating: d.rating,
          status: (d.status === 'new' ? 'NEW' : d.status === 'reviewed' ? 'REVIEWED' : 'RESOLVED') as Feedback['status'],
        }));
        
        saveCache(feedback);
        return feedback;
      }
    } catch (error) {
      console.error('[FeedbackRepo] API list failed:', error);
    }
    
    // Fallback to cache
    ensureSeed();
    return loadCache();
  },

  async get(id: string): Promise<Feedback | undefined> {
    const all = await this.list();
    return all.find((f) => f.id === id);
  },

  async create(data: Omit<Feedback, "id" | "createdAt">): Promise<Feedback> {
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: data.user || 'Anonymous',
          rating: data.rating,
          message: data.message,
          category: 'general',
        }),
      });
      
      const result = await response.json();
      
      if (result.ok && result.data) {
        const fb: Feedback = {
          id: result.data.id,
          createdAt: result.data.created_at,
          user: result.data.user_name || 'Anonymous',
          message: result.data.message,
          rating: result.data.rating,
          status: 'NEW',
        };
        
        // Update cache
        const all = loadCache();
        all.push(fb);
        saveCache(all);
        
        return fb;
      }
    } catch (error) {
      console.error('[FeedbackRepo] API create failed:', error);
    }
    
    // Fallback to local
    const all = loadCache();
    const fb: Feedback = {
      id: crypto?.randomUUID ? crypto.randomUUID() : `FB-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
      ...data,
    };
    all.push(fb);
    saveCache(all);
    return fb;
  },

  async update(id: string, patch: Partial<Feedback>): Promise<Feedback | undefined> {
    try {
      const response = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: patch.status?.toLowerCase() || 'new',
        }),
      });
      
      const result = await response.json();
      
      if (result.ok && result.data) {
        // Update cache
        const all = loadCache();
        const i = all.findIndex((f) => f.id === id);
        if (i >= 0) {
          all[i] = { ...all[i], ...patch };
          saveCache(all);
          return all[i];
        }
      }
    } catch (error) {
      console.error('[FeedbackRepo] API update failed:', error);
    }
    
    // Fallback to local
    const all = loadCache();
    const i = all.findIndex((f) => f.id === id);
    if (i >= 0) {
      all[i] = { ...all[i], ...patch };
      saveCache(all);
      return all[i];
    }
    return undefined;
  },

  async setStatus(id: string, status: Feedback["status"]): Promise<Feedback | undefined> {
    return this.update(id, { status });
  },

  async removeMany(ids: string[]): Promise<void> {
    try {
      // Delete from API
      await Promise.all(
        ids.map(id => 
          fetch(`/api/feedback?id=${id}`, { method: 'DELETE' })
        )
      );
      
      // Update cache
      const all = loadCache().filter((f) => !ids.includes(f.id));
      saveCache(all);
    } catch (error) {
      console.error('[FeedbackRepo] API removeMany failed:', error);
      // Fallback to local
      const all = loadCache().filter((f) => !ids.includes(f.id));
      saveCache(all);
    }
  },

  /** Dev helper: clear and re-seed */
  resetToMock() {
    saveCache([]);
    ensureSeed();
    return loadCache();
  },
};
