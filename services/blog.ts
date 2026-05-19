import { 
  collection, addDoc, getDocs, getDoc, doc, 
  updateDoc, deleteDoc, query, orderBy, 
  Timestamp, serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/firebase/config';

export const createBlog = async (postData: any, userId: string) => {
  const docRef = await addDoc(collection(db, 'blog'), {
    ...postData,
    authorId: userId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    views: 0,
    published: true
  });
  return docRef.id;
};

export const getBlogs = async () => {
  const q = query(collection(db, 'blog'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
};

export const getBlogById = async (id: string) => {
  const docRef = doc(db, 'blog', id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    // Increment view count silently — don't block on failure (guests can't write)
    updateDoc(docRef, {
      views: (docSnap.data().views || 0) + 1
    }).catch(() => {});
    return { id: docSnap.id, ...docSnap.data() } as any;
  }
  return null;
};

export const updateBlog = async (id: string, updates: any, userId: string) => {
  const blogRef = doc(db, 'blog', id);
  await updateDoc(blogRef, {
    ...updates,
    published: updates.published ?? true, // ensure post is always visible
    updatedAt: Timestamp.now()
  });
};

export const deleteBlog = async (id: string) => {
  await deleteDoc(doc(db, 'blog', id));
};
