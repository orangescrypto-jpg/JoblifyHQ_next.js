import { 
  collection, addDoc, getDocs, getDoc, doc, 
  updateDoc, deleteDoc, query, where, orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/firebase/config';

export const createScholarship = async (data, userId) => {
  const docRef = await addDoc(collection(db, 'scholarships'), {
    ...data,
    postedBy: userId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    applications: 0,
    views: 0,
    isFeatured: false,
    status: 'active'
  });
  return docRef.id;
};


interface ScholarshipFilters {
  category?: string; country?: string; funding?: string; search?: string;
  [key: string]: unknown;
}
export const getScholarships = async (filters: ScholarshipFilters = {}) => {
  let q = query(collection(db, 'scholarships'), orderBy('createdAt', 'desc'));

  if (filters.category) {
    q = query(q, where('category', '==', filters.category));
  }
  if (filters.country) {
    q = query(q, where('country', '==', filters.country));
  }
  if (filters.funding) {
    q = query(q, where('funding', '==', filters.funding));
  }
  if (filters.search) {
    q = query(q, where('title', '>=', filters.search), where('title', '<=', filters.search + '\uf8ff'));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
};

export const getScholarshipById = async (id: string) => {
  const docRef = doc(db, 'scholarships', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    // Increment view count silently — don't block on failure (guests can't write)
    updateDoc(docRef, {
      views: (docSnap.data().views || 0) + 1,
      updatedAt: Timestamp.now()
    }).catch(() => {});
    return { id: docSnap.id, ...docSnap.data() } as any;
  }
  return null;
};

export const updateScholarship = async (id: string, updates: Record<string, unknown>, userId: string) => {
  const schRef = doc(db, 'scholarships', id);
  await updateDoc(schRef, {
    ...updates,
    updatedAt: Timestamp.now()
  });
};

export const deleteScholarship = async (id: string, userId: string) => {
  await deleteDoc(doc(db, 'scholarships', id));
};

export const getEmployerScholarships = async (userId: string) => {
  // Uses only 'where' — no composite index needed in Firestore
  // Sorting is done in JS after fetching
  const q = query(
    collection(db, 'scholarships'),
    where('postedBy', '==', userId)
  );
  const snapshot = await getDocs(q);
  const scholarships = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
  // Sort newest first in JavaScript
  return scholarships.sort((a, b) => {
    const aTime = a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.seconds || 0;
    return bTime - aTime;
  });
};

export const boostScholarship = async (id: string, userId: string, durationDays = 14) => {
  const schRef = doc(db, 'scholarships', id);
  const schSnap = await getDoc(schRef);

  if (!schSnap.exists()) throw new Error('Scholarship not found');
  if (schSnap.data().postedBy !== userId) throw new Error('Unauthorized');

  await updateDoc(schRef, {
    isFeatured: true,
    featuredUntil: Timestamp.fromMillis(Date.now() + durationDays * 24 * 60 * 60 * 1000),
    updatedAt: Timestamp.now()
  });
};
