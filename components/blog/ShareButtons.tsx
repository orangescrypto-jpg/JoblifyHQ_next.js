'use client';
import { useState } from 'react';
import { FiLink, FiTwitter, FiLinkedin, FiFacebook, FiCheck, FiShare2 } from 'react-icons/fi';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

interface ShareButtonsProps {
  title: string;
  url: string;
  compact?: boolean;
}

export default function ShareButtons({ title, url, compact = false }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareUrls = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title}\n\n${url}`)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encoded}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
  };

  const buttons = [
    { href: shareUrls.whatsapp, label: 'WhatsApp', icon: <WhatsAppIcon />, color: 'hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-400' },
    { href: shareUrls.twitter, label: 'Twitter/X', icon: <FiTwitter size={15} />, color: 'hover:bg-sky-100 hover:text-sky-600 dark:hover:bg-sky-900/30 dark:hover:text-sky-400' },
    { href: shareUrls.linkedin, label: 'LinkedIn', icon: <FiLinkedin size={15} />, color: 'hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-400' },
    { href: shareUrls.facebook, label: 'Facebook', icon: <FiFacebook size={15} />, color: 'hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400' },
  ];

  // Compact mode — used on cards (just WhatsApp + copy)
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <a href={shareUrls.whatsapp} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-400 text-gray-500 dark:text-gray-400 transition"
          title="Share on WhatsApp">
          <WhatsAppIcon />
        </a>
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCopy(); }}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition"
          title="Copy link">
          {copied ? <FiCheck size={14} className="text-green-500" /> : <FiLink size={14} />}
        </button>
      </div>
    );
  }

  // Full mode — used on detail pages
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
        <FiShare2 size={14} /> Share:
      </span>
      {buttons.map(btn => (
        <a key={btn.label} href={btn.href} target="_blank" rel="noopener noreferrer"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium transition ${btn.color}`}
          aria-label={`Share on ${btn.label}`}>
          {btn.icon} {btn.label}
        </a>
      ))}
      <button onClick={handleCopy}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition">
        {copied ? <><FiCheck size={13} className="text-green-500" /> Copied!</> : <><FiLink size={13} /> Copy Link</>}
      </button>
    </div>
  );
}

