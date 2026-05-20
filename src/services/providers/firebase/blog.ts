// src/services/providers/firebase/blog.ts
// ─── Firebase Blog Provider ───────────────────────────────────────────────────
// All Firebase blog logic lives here. Nothing outside this folder touches Firebase.

import {
  collection, addDoc, getDocs, getDoc, doc,
  updateDoc, deleteDoc, query, orderBy,
  where, limit, Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { BlogPost } from '@/types';

export const BlogService = {

  async getBlogs(limitCount = 20): Promise<BlogPost[]> {
    const q = query(
      collection(db, 'blog'),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as BlogPost[];
  },

  async getBlogById(id: string): Promise<BlogPost | null> {
    const docRef = doc(db, 'blog', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    updateDoc(docRef, {
      views: (docSnap.data().views || 0) + 1,
    }).catch(() => {});
    return { id: docSnap.id, ...docSnap.data() } as BlogPost;
  },

  async createBlog(postData: Partial<BlogPost>, userId: string): Promise<string> {
    const docRef = await addDoc(collection(db, 'blog'), {
      ...postData,
      authorId: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      views: 0,
      status: 'published',
    });
    return docRef.id;
  },

  async updateBlog(id: string, updates: Partial<BlogPost>): Promise<void> {
    await updateDoc(doc(db, 'blog', id), {
      ...updates,
      status: updates.status ?? 'published',
      updatedAt: Timestamp.now(),
    });
  },

  async deleteBlog(id: string): Promise<void> {
    await deleteDoc(doc(db, 'blog', id));
  },
};
