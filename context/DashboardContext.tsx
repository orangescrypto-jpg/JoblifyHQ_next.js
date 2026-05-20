'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DashboardService } from '@/src/services/dashboard';
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
  const [savedJobs, setSavedJobs]               = useState<SavedItem[]>([]);
  const [savedScholarships, setSavedScholarships] = useState<SavedItem[]>([]);
  const [applications, setApplications]           = useState<Application[]>([]);
  const [loading, setLoading]                     = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setSavedJobs([]); setSavedScholarships([]); setApplications([]); setLoading(false);
      return;
    }
    DashboardService.fetchUserData(user.uid)
      .then(({ savedJobs, savedScholarships, applications }) => {
        setSavedJobs(savedJobs);
        setSavedScholarships(savedScholarships);
        setApplications(applications);
      })
      .catch(err => console.error('Error fetching dashboard data:', err))
      .finally(() => setLoading(false));
  }, [user]);

  const toggleSaveJob = async (job: Job) => {
    if (!user) return;
    const existing = savedJobs.find(j => (j.itemData as Job)?.id === job.id || j.jobId === job.id);
    if (existing) {
      await DashboardService.unsaveItem(existing.id);
      setSavedJobs(prev => prev.filter(j => j.id !== existing.id));
    } else {
      const saved = await DashboardService.saveJob(user.uid, job);
      setSavedJobs(prev => [...prev, saved]);
    }
  };

  const toggleSaveScholarship = async (sch: Scholarship) => {
    if (!user) return;
    const existing = savedScholarships.find(s => (s.itemData as Scholarship)?.id === sch.id || s.scholarshipId === sch.id);
    if (existing) {
      await DashboardService.unsaveItem(existing.id);
      setSavedScholarships(prev => prev.filter(s => s.id !== existing.id));
    } else {
      const saved = await DashboardService.saveScholarship(user.uid, sch);
      setSavedScholarships(prev => [...prev, saved]);
    }
  };

  const submitApplication = async ({ type, opportunityId, title, org, cvUrl, coverLetter }: SubmitApplicationParams) => {
    if (!user) return;
    const id = await DashboardService.submitApplication({
      userId: user.uid, userEmail: user.email, userName: user.name,
      type, opportunityId, title, org, cvUrl, coverLetter,
    });
    setApplications(prev => [{
      id, userId: user.uid, userEmail: user.email, userName: user.name,
      type, opportunityId, title, org, cvUrl,
      coverLetter: coverLetter || '', status: 'Submitted', appliedAt: null, updatedAt: null,
    }, ...prev]);
    return id;
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
