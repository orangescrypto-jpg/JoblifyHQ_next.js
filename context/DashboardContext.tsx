'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, getDocs, query, where, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Application, SavedItem, Job, Scholarship, ApplicationType } from '@/types';

interface SubmitApplicationParams {
  type: ApplicationType;
  opportunityId: string;
  title: string;
  org: string;
  cvUrl: string;
  coverLetter?: string;
}

interface DashboardContextValue {
  savedJobs: SavedItem[];
  savedScholarships: SavedItem[];
  applications: Application[];
  loading: boolean;
  toggleSaveJob: (job: Job) => Promise<void>;
  toggleSaveScholarship: (sch: Scholarship) => Promise<void>;
  submitApplication: (params: SubmitApplicationParams) => Promise<string | undefined>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export const DashboardProvider = ({ children }: { children?: ReactNode }) => {
  const { user } = useAuth();
  const [savedJobs, setSavedJobs] = useState<SavedItem[]>([]);
  const [savedScholarships, setSavedScholarships] = useState<SavedItem[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setSavedJobs([]); setSavedScholarships([]); setApplications([]); setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const [jobsSnap, schSnap, appsSnap] = await Promise.all([
          getDocs(query(collection(db, 'user_saves'), where('userId', '==', user.uid), where('type', '==', 'job'))),
          getDocs(query(collection(db, 'user_saves'), where('userId', '==', user.uid), where('type', '==', 'scholarship'))),
          getDocs(query(collection(db, 'applications'), where('userId', '==', user.uid))),
        ]);
        setSavedJobs(jobsSnap.docs.map(d => ({ id: d.id, ...d.data() } as SavedItem)));
        setSavedScholarships(schSnap.docs.map(d => ({ id: d.id, ...d.data() } as SavedItem)));
        setApplications(appsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Application)));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const toggleSaveJob = async (job: Job) => {
    if (!user) return;
    const existing = savedJobs.find(j => (j.itemData as Job)?.id === job.id || j.jobId === job.id);
    if (existing) {
      await deleteDoc(doc(db, 'user_saves', existing.id));
      setSavedJobs(prev => prev.filter(j => j.id !== existing.id));
    } else {
      const ref = await addDoc(collection(db, 'user_saves'), { userId: user.uid, type: 'job', jobId: job.id, itemData: job, savedAt: serverTimestamp() });
      setSavedJobs(prev => [...prev, { id: ref.id, userId: user.uid, type: 'job', jobId: job.id, itemData: job, savedAt: null }]);
    }
  };

  const toggleSaveScholarship = async (sch: Scholarship) => {
    if (!user) return;
    const existing = savedScholarships.find(s => (s.itemData as Scholarship)?.id === sch.id || s.scholarshipId === sch.id);
    if (existing) {
      await deleteDoc(doc(db, 'user_saves', existing.id));
      setSavedScholarships(prev => prev.filter(s => s.id !== existing.id));
    } else {
      const ref = await addDoc(collection(db, 'user_saves'), { userId: user.uid, type: 'scholarship', scholarshipId: sch.id, itemData: sch, savedAt: serverTimestamp() });
      setSavedScholarships(prev => [...prev, { id: ref.id, userId: user.uid, type: 'scholarship', scholarshipId: sch.id, itemData: sch, savedAt: null }]);
    }
  };

  const submitApplication = async ({ type, opportunityId, title, org, cvUrl, coverLetter }: SubmitApplicationParams) => {
    if (!user) return;
    const ref = await addDoc(collection(db, 'applications'), {
      userId: user.uid, userEmail: user.email, userName: user.name,
      type, opportunityId, title, org, cvUrl, coverLetter: coverLetter || '',
      status: 'Submitted', appliedAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    setApplications(prev => [{ id: ref.id, userId: user.uid, userEmail: user.email, userName: user.name, type, opportunityId, title, org, cvUrl, coverLetter: coverLetter || '', status: 'Submitted', appliedAt: null, updatedAt: null }, ...prev]);
    return ref.id;
  };

  return (
    <DashboardContext.Provider value={{ savedJobs, savedScholarships, applications, loading, toggleSaveJob, toggleSaveScholarship, submitApplication }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = (): DashboardContextValue => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
};
