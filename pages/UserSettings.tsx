'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/firebase/config';
import type { UserNotificationSettings, UserPrivacySettings } from '@/types';

const DEFAULT_NOTIFS: UserNotificationSettings = {
  emailJobAlerts:        true,
  emailApplicationUpdates: true,
  emailGigUpdates:       true,
  emailNewsletter:       true,
  pushNotifications:     false,
};

const DEFAULT_PRIVACY: UserPrivacySettings = {
  profileVisible: true,
  showEmail:      false,
  showPhone:      false,
};

export default function UserSettings() {
  const { user, updateUserProfile } = useAuth();
  const [tab, setTab]   = useState<'profile' | 'notifications' | 'privacy' | 'security' | 'subscription'>('profile');
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState('');
  const [error, setError]     = useState('');

  // Profile
  const [name, setName]       = useState(user?.name || '');
  const [bio, setBio]         = useState((user as any)?.bio || '');
  const [phone, setPhone]     = useState((user as any)?.phone || '');
  const [website, setWebsite] = useState((user as any)?.website || '');
  const [linkedin, setLinkedin] = useState((user as any)?.linkedin || '');
  const [country, setCountry] = useState((user as any)?.country || 'Nigeria');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills]   = useState<string[]>((user as any)?.skills || []);

  // Notifications
  const [notifs, setNotifs]   = useState<UserNotificationSettings>(DEFAULT_NOTIFS);

  // Privacy
  const [privacy, setPrivacy] = useState<UserPrivacySettings>(DEFAULT_PRIVACY);

  // Security
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setBio((user as any).bio || '');
    setPhone((user as any).phone || '');
    setWebsite((user as any).website || '');
    setLinkedin((user as any).linkedin || '');
    setCountry((user as any).country || 'Nigeria');
    setSkills((user as any).skills || []);
    setNotifs({ ...DEFAULT_NOTIFS, ...(user.notifications || {}) });
    setPrivacy({ ...DEFAULT_PRIVACY, ...(user.privacySettings || {}) });
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true); setError('');
    try {
      await updateUserProfile({ name, bio, phone, website, linkedin, country, skills } as any);
      setSaved('Profile updated!'); setTimeout(() => setSaved(''), 2000);
    } catch { setError('Failed to save profile.'); }
    finally { setSaving(false); }
  };

  const saveNotifs = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { notifications: notifs, updatedAt: serverTimestamp() });
      setSaved('Notification preferences saved!'); setTimeout(() => setSaved(''), 2000);
    } finally { setSaving(false); }
  };

  const savePrivacy = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { privacySettings: privacy, updatedAt: serverTimestamp() });
      setSaved('Privacy settings saved!'); setTimeout(() => setSaved(''), 2000);
    } finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!user || !auth.currentUser) return;
    if (newPw !== confirmPw) { setError('Passwords do not match.'); return; }
    if (newPw.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setSaving(true); setError('');
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, newPw);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setSaved('Password changed!'); setTimeout(() => setSaved(''), 2000);
    } catch (e: any) {
      setError(e.code === 'auth/wrong-password' ? 'Current password is incorrect.' : 'Failed to change password.');
    } finally { setSaving(false); }
  };

  const inp = "w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const lbl = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide";

  const AFRICAN_COUNTRIES = ['Nigeria','Ghana','Kenya','South Africa','Uganda','Tanzania','Ethiopia','Rwanda','Senegal','Cameroon','Zimbabwe','Zambia','Egypt','Morocco','Other'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm text-gray-500">Manage your account, preferences, and security.</p>
        </div>

        {(saved || error) && (
          <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${saved ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
            {saved || error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Sidebar tabs */}
          <div className="sm:w-48 shrink-0">
            <nav className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {([
                { key: 'profile',      icon: '👤', label: 'Profile' },
                { key: 'notifications',icon: '🔔', label: 'Notifications' },
                { key: 'privacy',      icon: '🔒', label: 'Privacy' },
                { key: 'security',     icon: '🛡️', label: 'Security' },
                { key: 'subscription', icon: '⭐', label: 'Subscription' },
              ] as { key: typeof tab; icon: string; label: string }[]).map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition border-b border-gray-100 dark:border-gray-700 last:border-0 ${tab === t.key ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  <span>{t.icon}</span>{t.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {tab === 'profile' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                <h2 className="font-semibold text-gray-900 dark:text-white">Profile Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className={lbl}>Full Name</label><input className={inp} value={name} onChange={e => setName(e.target.value)} /></div>
                  <div className="col-span-2"><label className={lbl}>Bio</label><textarea className={inp + ' resize-none'} rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell employers/clients about yourself..." /></div>
                  <div><label className={lbl}>Phone</label><input className={inp} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234..." /></div>
                  <div>
                    <label className={lbl}>Country</label>
                    <select className={inp} value={country} onChange={e => setCountry(e.target.value)}>
                      {AFRICAN_COUNTRIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div><label className={lbl}>Website</label><input className={inp} value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yoursite.com" /></div>
                  <div><label className={lbl}>LinkedIn</label><input className={inp} value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="linkedin.com/in/you" /></div>
                </div>
                {/* Skills */}
                <div>
                  <label className={lbl}>Skills</label>
                  <div className="flex gap-2 mb-2">
                    <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (skillInput.trim()) { setSkills([...skills, skillInput.trim()]); setSkillInput(''); }}}} placeholder="Add a skill..." className={inp} />
                    <button onClick={() => { if (skillInput.trim()) { setSkills([...skills, skillInput.trim()]); setSkillInput(''); }}} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm">+</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map(s => (
                      <span key={s} className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2.5 py-1 rounded-full">
                        {s}<button onClick={() => setSkills(skills.filter(x => x !== s))} className="hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-500">
                  <p>Email: <span className="text-gray-900 dark:text-white font-medium">{user?.email}</span> (cannot change)</p>
                  <p className="mt-1">Role: <span className="capitalize font-medium text-blue-600">{user?.role}</span></p>
                </div>
                <button onClick={saveProfile} disabled={saving} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            )}

            {tab === 'notifications' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Notification Preferences</h2>
                <div className="space-y-4">
                  {([
                    { key: 'emailJobAlerts',          label: 'Job Alerts',           desc: 'New jobs matching your saved searches' },
                    { key: 'emailApplicationUpdates', label: 'Application Updates',  desc: 'When your application status changes' },
                    { key: 'emailGigUpdates',         label: 'Gig & Escrow Updates', desc: 'Proposals, escrow actions, and work submissions' },
                    { key: 'emailNewsletter',         label: 'Newsletter',           desc: 'Weekly career tips and platform news' },
                    { key: 'pushNotifications',       label: 'Push Notifications',   desc: 'Browser push notifications (when supported)' },
                  ] as { key: keyof UserNotificationSettings; label: string; desc: string }[]).map(({ key, label: lbl, desc }) => (
                    <div key={key} className="flex items-start justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{lbl}</p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                      <button onClick={() => setNotifs(n => ({ ...n, [key]: !n[key] }))}
                        className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifs[key] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifs[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={saveNotifs} disabled={saving} className="mt-6 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            )}

            {tab === 'privacy' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Privacy Settings</h2>
                <div className="space-y-4">
                  {([
                    { key: 'profileVisible', label: 'Public Profile',    desc: 'Allow employers and clients to view your profile' },
                    { key: 'showEmail',      label: 'Show Email',        desc: 'Display your email on your public profile' },
                    { key: 'showPhone',      label: 'Show Phone Number', desc: 'Display your phone number on your public profile' },
                  ] as { key: keyof UserPrivacySettings; label: string; desc: string }[]).map(({ key, label: lbl, desc }) => (
                    <div key={key} className="flex items-start justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{lbl}</p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                      <button onClick={() => setPrivacy(p => ({ ...p, [key]: !p[key] }))}
                        className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${privacy[key] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${privacy[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={savePrivacy} disabled={saving} className="mt-6 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Privacy Settings'}
                </button>
              </div>
            )}

            {tab === 'security' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                <h2 className="font-semibold text-gray-900 dark:text-white">Change Password</h2>
                {user?.provider === 'google' && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-sm rounded-lg p-3">
                    You signed in with Google. Password change is not available for Google accounts.
                  </div>
                )}
                <div className="space-y-3">
                  <div><label className={lbl}>Current Password</label><input type="password" className={inp} value={currentPw} onChange={e => setCurrentPw(e.target.value)} /></div>
                  <div><label className={lbl}>New Password</label><input type="password" className={inp} value={newPw} onChange={e => setNewPw(e.target.value)} /></div>
                  <div><label className={lbl}>Confirm New Password</label><input type="password" className={inp} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} /></div>
                </div>
                <button onClick={changePassword} disabled={saving || user?.provider === 'google'}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            )}

            {tab === 'subscription' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Your Subscription</h2>
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-5 mb-4">
                  <p className="text-sm opacity-80">Current Plan</p>
                  <p className="text-2xl font-bold capitalize">{user?.tier?.replace(/-/g,' ') || 'Free'}</p>
                  {(user as any)?.premiumExpiresAt && (
                    <p className="text-sm opacity-80 mt-1">Renews: {new Date((user as any).premiumExpiresAt.seconds * 1000).toLocaleDateString()}</p>
                  )}
                </div>
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <p>Upgrade to unlock more features like priority applications, AI matching, and more.</p>
                </div>
                <a href="/premium" className="mt-4 inline-block bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">
                  Upgrade Plan
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
