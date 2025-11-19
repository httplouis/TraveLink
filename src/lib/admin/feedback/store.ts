// src/lib/admin/feedback/store.ts
import type { Feedback } from "./types";

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

export const FeedbackRepo = {
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
    
    // Return empty array if API fails - no mock data fallback
    return [];
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
      throw new Error('Failed to create feedback. Please try again.');
    }
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
      throw new Error('Failed to update feedback. Please try again.');
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
      throw new Error('Failed to delete feedback. Please try again.');
    }
  },
};
