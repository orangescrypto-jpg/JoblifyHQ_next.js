'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getBlogById, getBlogs } from '@/services/firebase/blog';
import BlogCard from '@/components/blog/BlogCard';
import BlogComments from '@/components/blog/BlogComments';
import ShareButtons from '@/components/blog/ShareButtons';
import { FiCalendar, FiUser, FiArrowLeft } from 'react-icons/fi';

export default function BlogDetails() {
  const params = useParams(); const id = params?.id as string;
  const [post, setPost] = useState<Record<string, unknown> | null>(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const blogPost = await getBlogById(id);
        setPost(blogPost);
        
        // Fetch related posts (excluding current)
        const allBlogs = await getBlogs();
        setRelated(allBlogs.filter(p => p.id !== id).slice(0, 2));
      } catch (error) {
        console.error('Error fetching blog:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 p-10 max-w-3xl mx-auto">
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        <div className="h-8 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }
  
  if (!post) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Article Not Found</h2>
        <Link href="/blog" className="btn-primary inline-block">Back to Blog</Link>
      </div>
    );
  }

  const currentUrl = window.location.href;

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/blog" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 mb-6 transition">
        <FiArrowLeft /> Back to Articles
      </Link>

      <article className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {post.image && (
          <img src={post.image} alt={post.title} className="w-full h-64 md:h-80 object-cover" />
        )}
        <div className="p-6 md:p-8">
          {post.category && (
            <span className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-semibold rounded-full mb-3">
              {post.category}
            </span>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">{post.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-8 pb-6 border-b border-gray-200 dark:border-gray-800">
            {post.author && (
              <span className="flex items-center gap-2">
                <FiUser /> {post.author}
              </span>
            )}
            <span className="flex items-center gap-2">
              <FiCalendar /> {post.createdAt?.toDate().toLocaleDateString() || post.date || 'Recently'}
            </span>
            <div className="ml-auto">
              <ShareButtons title={post.title} url={currentUrl} />
            </div>
          </div>

          <div 
            className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: post.content || post.excerpt || '' }}
          />
        </div>
      </article>

      <BlogComments postId={post.id} />

      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {related.map(p => <BlogCard key={p.id} post={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
