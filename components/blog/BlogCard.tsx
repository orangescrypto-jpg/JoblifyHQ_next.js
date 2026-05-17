'use client';
import Link from 'next/link';
import type { BlogPost } from '@/types';

interface BlogCardProps {
  post: any;
  [key: string]: any;
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <Link href={`/blog/${post.id}`} className="card overflow-hidden group flex flex-col">
      <img src={post.image || post.coverImage || ''} alt={post.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
      <div className="p-5 flex flex-col gap-2 flex-grow">
        <span className="text-xs font-medium text-primary-600 uppercase tracking-wide">{post.category || (post.tags?.[0] ?? '')}</span>
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition line-clamp-2">{post.title}</h3>
        <p className="text-sm text-gray-600 line-clamp-3 flex-grow">{post.excerpt}</p>
        <div className="pt-3 flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 mt-2">
          <span>By {post.author}</span>
          <span>{post.date || (typeof post.publishedAt === 'string' ? post.publishedAt.slice(0, 10) : '')}</span>
        </div>
      </div>
    </Link>
  );
}
