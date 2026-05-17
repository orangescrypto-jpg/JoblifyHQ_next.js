'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/firebase/config';

const TYPE_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  job:         { label: '💼 New Job',      color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-900/30'    },
  scholarship: { label: '🎓 Scholarship',  color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30' },
  salary:      { label: '💰 Salary',       color: 'text-green-600 dark:text-green-400',   bg: 'bg-green-50 dark:bg-green-900/30'  },
};

interface TickerItem {
  id: string;
  _type: string;
  title?: string;
  role?: string;
  company?: string;
  org?: string;
  country?: string;
  location?: string;
  createdAt?: { seconds: number };
  [key: string]: unknown;
}

function timeAgo(ts: { seconds: number } | string | null | undefined): string {
  if (!ts) return '';
  try {
    const date = (ts as { seconds: number })?.seconds
      ? new Date((ts as { seconds: number }).seconds * 1000)
      : new Date(ts as string);
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}m ago`;
    const hrs = Math.floor(diff / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch { return ''; }
}

export default function LiveTicker() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadTicker = async () => {
      try {
        const [jobsSnap, scholsSnap, salarySnap] = await Promise.allSettled([
          getDocs(collection(db, 'jobs')),
          getDocs(collection(db, 'scholarships')),
          getDocs(collection(db, 'salary_data')),
        ]);

        let jobs: TickerItem[] = [];
        let scholarships: TickerItem[] = [];
        let salaries: TickerItem[] = [];

        if (jobsSnap.status === 'fulfilled') {
          jobs = jobsSnap.value.docs
            .map(d => ({ id: d.id, ...d.data(), _type: 'job' } as TickerItem))
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
            .slice(0, 1);
        }

        if (scholsSnap.status === 'fulfilled') {
          scholarships = scholsSnap.value.docs
            .map(d => ({ id: d.id, ...d.data(), _type: 'scholarship' } as TickerItem))
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
            .slice(0, 2);
        }

        if (salarySnap.status === 'fulfilled') {
          salaries = salarySnap.value.docs
            .map(d => ({ id: d.id, ...d.data(), _type: 'salary' } as TickerItem))
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
            .slice(0, 2);
        }

        const merged = [...scholarships, ...jobs, ...salaries].filter(
          item => item.title || item.role
        );

        setItems(merged);
      } catch (err) {
        console.warn('Ticker failed to load:', err);
      } finally {
        setReady(true);
      }
    };

    loadTicker();
  }, []);

  if (!ready || items.length === 0) return null;

  const getLink = (item: TickerItem): string => {
    if (item._type === 'job') return `/jobs/${item.id}`;
    if (item._type === 'scholarship') return `/scholarships/${item.id}`;
    return '/salaries';
  };

  const getLabel = (item: TickerItem): string => {
    if (item._type === 'job') return `${item.title}${item.company ? ` @ ${item.company}` : ''}`;
    if (item._type === 'scholarship') return `${item.title}${item.org ? ` — ${item.org}` : ''}`;
    return `${item.role}${item.country ? ` · ${item.country}` : ''}`;
  };

  const tickerItems = [...items, ...items, ...items];

  return (
    <div
      className="w-full bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="flex items-center h-10">

        <div className="flex-shrink-0 flex items-center gap-2 px-3 h-full bg-primary-600 text-white">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">
            🔥 Latest
          </span>
        </div>

        <div className="flex-1 overflow-hidden relative h-full flex items-center">
          <div
            className="flex items-center"
            style={{
              animation: `tickerMove ${Math.max(items.length * 8, 20)}s linear infinite`,
              animationPlayState: paused ? 'paused' : 'running',
              width: 'max-content',
            }}
          >
            {tickerItems.map((item, idx) => {
              const style = TYPE_STYLES[item._type] || TYPE_STYLES.job;
              return (
                <Link
                  key={`${item.id}-${idx}`}
                  href={getLink(item)}
                  className="flex items-center gap-2 px-4 h-10 whitespace-nowrap group hover:bg-gray-50 dark:hover:bg-gray-800 transition border-r border-gray-100 dark:border-gray-800"
                >
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.color}`}>
                    {style.label}
                  </span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-primary-600 transition">
                    {getLabel(item)}
                  </span>
                  {(item.country || item.location) && (
                    <span className="text-xs text-gray-400">
                      📍 {item.country || item.location}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{timeAgo(item.createdAt)}</span>
                  <span className="text-gray-200 dark:text-gray-700 ml-2">•</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tickerMove {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}
