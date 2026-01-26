"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { GET_SINGLE_POST, CREATE_COMMENT } from "@/graphql/mutations";

interface CreateCommentResponse {
  createComment: {
    comment: {
      status: string;
    };
  };
}

export default function SinglePost() {
  const params = useParams();
  const slugParam = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const slug = typeof slugParam === 'string' ? decodeURIComponent(slugParam) : "";

  const [formData, setFormData] = useState({ author: "", email: "", content: "" });
  const [statusMsg, setStatusMsg] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Track comment count to detect backend changes
  const lastCommentCount = useRef<number | null>(null);

  // Initial Auth Check
  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const userName = getCookie("user_name");
    const userEmail = getCookie("user_email");
    if (userName) {
      setIsLoggedIn(true);
      setFormData(prev => ({
        ...prev,
        author: decodeURIComponent(userName),
        email: userEmail ? decodeURIComponent(userEmail) : ""
      }));
    }
  }, []);

  const { loading, error, data, refetch } = useQuery<{
    postBy?: {
      databaseId: number;
      title: string;
      content: string;
      comments?: { nodes: any[] }
      author?: { node: { name: string } }
    };
    globalStyles?: { css: string; }
  }>(GET_SINGLE_POST, {
    variables: { slug },
    skip: !slug,
    fetchPolicy: 'cache-and-network'
  });

  // --- SMART POLLING LOGIC ---
  // Detects backend replies by comparing lengths
  useEffect(() => {
    if (!slug || !refetch) return;

    const pollInterval = setInterval(async () => {
      if (document.visibilityState === 'visible') {
        const result = await refetch();
        const currentCount = result.data?.postBy?.comments?.nodes?.length || 0;
        
        // If the number of comments increased, the page has effectively refreshed internally
        if (lastCommentCount.current !== null && currentCount > lastCommentCount.current) {
          console.log("New backend reply detected!");
        }
        lastCommentCount.current = currentCount;
      }
    }, 15000); // Poll every 15 seconds for a "snappy" feel

    return () => clearInterval(pollInterval);
  }, [slug, refetch]);

const [createComment, { loading: submitting }] = useMutation<CreateCommentResponse>(CREATE_COMMENT, {
  onCompleted: (data) => {
    // Now TypeScript knows that data.createComment exists!
    const status = data?.createComment?.comment?.status;
    if (status?.toUpperCase() !== 'APPROVE') {
      setStatusMsg("✓ Comment submitted! Awaiting moderation.");
    } else {
      setStatusMsg("✓ Comment posted successfully!");
    }
    setFormData(prev => ({ ...prev, content: "" }));
    setTimeout(() => setStatusMsg(""), 10000);
    refetch();
  },
  onError: (err) => setStatusMsg(`Error: ${err.message}`)
});

  const post = data?.postBy;
  const wpGlobalStyles = data?.globalStyles?.css;

  const allComments = useMemo(() => {
    const comments = (post?.comments?.nodes || []).filter((comment: any) =>
      comment.status?.toUpperCase() === 'APPROVE'
    );
    // Sync the ref count whenever comments change
    lastCommentCount.current = post?.comments?.nodes?.length || 0;
    return comments;
  }, [post?.comments?.nodes]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const buildCommentTree = useCallback((comments: any[]) => {
    const commentMap = new Map();
    const rootComments: any[] = [];
    comments.forEach(c => commentMap.set(c.databaseId, { ...c, replies: [] }));
    comments.forEach(c => {
      const node = commentMap.get(c.databaseId);
      if (c.parentDatabaseId && commentMap.has(c.parentDatabaseId)) {
        commentMap.get(c.parentDatabaseId).replies.push(node);
      } else {
        rootComments.push(node);
      }
    });
    return rootComments;
  }, []);

  const commentTree = useMemo(() => buildCommentTree(allComments), [allComments, buildCommentTree]);

  const renderComment = (comment: any, depth: number = 0) => {
    const authorName = comment.author?.node?.name || 'Anonymous';
    const isReply = depth > 0;

    return (
      <div key={comment.id} className={`relative ${isReply ? 'ml-6 md:ml-12 mt-6' : 'mb-10'}`}>
        {isReply && (
          <div 
            className="absolute -left-6 md:-left-8 top-0 bottom-0 w-[2px] opacity-30" 
            style={{ backgroundColor: '#ffa500' }} 
          />
        )}

        <div className={`group flex flex-col gap-4 p-6 rounded-2xl bg-white border transition-all duration-300 ${
          isReply ? 'border-slate-100 shadow-sm' : 'border-slate-200 shadow-md hover:shadow-lg'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden p-[2px]" style={{ backgroundColor: '#ffa500' }}>
                <div className="w-full h-full rounded-full bg-white relative overflow-hidden">
                  {comment.author?.node?.avatar?.url ? (
                    <Image src={comment.author.node.avatar.url} alt={authorName} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 font-bold">{authorName[0]}</div>
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 text-sm leading-none">{authorName}</span>
                <span className="text-[10px] uppercase tracking-widest text-slate-400 mt-1 font-bold">{formatDate(comment.date)}</span>
              </div>
            </div>
            {comment.author?.node?.name === post?.author?.node?.name && (
              <span className="text-[10px] px-2 py-1 rounded font-black text-white" style={{ backgroundColor: '#ffa500' }}>AUTHOR</span>
            )}
          </div>
          <div className="text-slate-600 text-sm md:text-base leading-relaxed prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: comment.content }} />
        </div>
        {comment.replies?.map((reply: any) => renderComment(reply, depth + 1))}
      </div>
    );
  };

  if (loading && !data) return <p className="flex h-screen items-center justify-center text-slate-500">Loading Article...</p>;
  if (error) return <div className="text-center py-20">Error: {error.message}</div>;
  if (!post) return <div className="text-center py-20">Post not found</div>;

  return (
    <main className="min-h-screen bg-white pb-20">
      <div className="px-4 md:px-10 lg:px-20 xl:px-40 max-w-7xl mx-auto py-10">
        {wpGlobalStyles && <style dangerouslySetInnerHTML={{ __html: wpGlobalStyles }} />}

        <article className="mb-16">
          <h1 className="text-4xl md:text-5xl font-black mb-8 text-slate-900 tracking-tighter leading-tight">
            {post.title}
          </h1>
          <div className="entry-content prose prose-slate lg:prose-xl max-w-none text-slate-600" dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>

        {/* --- COMMENTS SECTION --- */}
        <div className="border-t border-slate-100 pt-16">
          <div className="flex items-center gap-4 mb-12">
            <h2 className="text-2xl font-black text-slate-900 italic">Discussion</h2>
            <div className="h-[2px] grow bg-slate-50 relative">
               <div className="absolute left-0 top-0 h-full w-12" style={{ backgroundColor: '#ffa500' }} />
            </div>
            <span className="text-white px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#ffa500' }}>
              {allComments.length}
            </span>
          </div>

          <div className="mb-16">
            {commentTree.length > 0 ? commentTree.map((comment: any) => renderComment(comment)) : (
              <p className="text-slate-400 italic py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">Be the first to share a thought...</p>
            )}
          </div>

          {/* --- FORM SECTION --- */}
          <div className="bg-slate-900 p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ backgroundColor: '#ffa500' }} />
            
            <div className="relative z-10">
              <h3 className="text-2xl font-black text-white mb-6">Leave a Reply</h3>
              
              {statusMsg && (
                <div className={`mb-6 p-4 rounded-xl font-bold text-sm border animate-bounce ${
                  statusMsg.includes('Error') ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-green-500/10 border-green-500 text-green-400'
                }`}>
                  {statusMsg}
                </div>
              )}

              <form onSubmit={(e) => {
                e.preventDefault();
                if (!isLoggedIn || submitting) return;
                createComment({ variables: { ...formData, postId: post.databaseId, clientMutationId: `c-${Date.now()}` } });
              }} className="space-y-4">
                {!isLoggedIn ? (
                  <div className="p-6 rounded-2xl border border-slate-700 bg-slate-800/50 text-center">
                    <p className="text-slate-400">Join the community to post a comment.</p>
                  </div>
                ) : (
                  <>
                    <textarea
                      className="w-full p-6 bg-slate-800 border-2 border-transparent rounded-3xl text-white outline-none transition-all focus:border-[#ffa500] resize-none"
                      rows={4}
                      placeholder="Share your experience..."
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    />
                    <div className="flex justify-end">
                      <button 
                        type="submit" 
                        disabled={submitting || !formData.content.trim()} 
                        className="px-10 py-3 rounded-full font-black text-slate-900 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                        style={{ backgroundColor: '#ffa500', boxShadow: '0 8px 20px -5px rgba(255,165,0,0.4)' }}
                      >
                        {submitting ? "SENDING..." : "POST COMMENT"}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}