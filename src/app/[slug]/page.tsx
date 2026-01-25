"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { GET_SINGLE_POST,CREATE_COMMENT } from "@/graphql/mutations";

export default function SinglePost() {
  const params = useParams();
  const slugParam = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const slug = typeof slugParam === 'string' ? decodeURIComponent(slugParam) : "";

  const [formData, setFormData] = useState({ author: "", email: "", content: "" });
  const [statusMsg, setStatusMsg] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Initial Cookie/Auth Check
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
    };
    globalStyles?: { css: string; }
  }>(GET_SINGLE_POST, {
    variables: { slug },
    skip: !slug,
    fetchPolicy: 'cache-and-network'
  });

  // FIXED: The dependency array must have a constant size.
  // We use a stable check for refetch to satisfy React 19/Turbopack rules.
  useEffect(() => {
    if (!slug || !refetch) return;

    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refetch().catch(err => console.error('Polling failed', err));
      }
    }, 60000);

    return () => clearInterval(pollInterval);
  }, [slug, refetch]);

  const [createComment, { loading: submitting }] = useMutation(CREATE_COMMENT, {
    onCompleted: () => {
      setStatusMsg("✓ Comment submitted successfully!");
      setFormData(prev => ({ ...prev, content: "" }));
      refetch();
    },
    onError: (err) => setStatusMsg(`Error: ${err.message}`)
  });

  const post = data?.postBy;
  const wpGlobalStyles = data?.globalStyles?.css;

  const allComments = useMemo(() => {
    return (post?.comments?.nodes || []).filter((comment: any) =>
      comment.status?.toUpperCase() === 'APPROVE'
    );
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
    return (
      <div key={comment.id} className={`${depth > 0 ? 'ml-8 mt-4 border-l-2 border-orange-200 pl-4' : 'mb-6'} bg-white p-4 rounded-lg shadow-sm`}>
        <div className="flex items-start gap-3">
          {comment.author?.node?.avatar?.url ? (
            <Image src={comment.author.node.avatar.url} alt={authorName} width={40} height={40} className="rounded-full" unoptimized />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">{authorName[0]}</div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-sm text-gray-800">{authorName}</span>
              <span className="text-xs text-gray-500">{formatDate(comment.date)}</span>
            </div>
            <div className="text-sm text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: comment.content }} />
          </div>
        </div>
        {comment.replies?.map((reply: any) => renderComment(reply, depth + 1))}
      </div>
    );
  };

  // Improved error/loading states to prevent "Post not found" flashes
  if (loading && !data) return <p className="flex h-screen items-center justify-center text-slate-500">Loading...</p>;
  if (error) return <div className="text-center py-20">Error: {error.message}</div>;
  if (!post && !loading) return <div className="text-center py-20">Post not found</div>;
  if (!post) return null;

  return (
    <main className="font-heading font-extralight layout-container flex h-full grow flex-col bg-white">
      <div className="px-4 md:px-10 lg:px-20 xl:px-40 flex flex-1 justify-center py-5">
        <div className="mx-auto p-6 bg-white">
          {wpGlobalStyles && <style dangerouslySetInnerHTML={{ __html: wpGlobalStyles }} />}

          <h1 className="text-3xl font-bold mb-6 text-slate-900">{post.title}</h1>

          <div
            className="entry-content wp-block-post-content prose prose-slate max-w-none mb-10 text-slate-500"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-6 text-slate-900">Comments ({allComments.length})</h2>
            {commentTree.map((comment: any) => renderComment(comment))}
          </section>

          <section className="bg-gray-50 p-6 rounded-xl border">
            <h3 className="text-xl font-bold mb-4 text-slate-900">Leave a Comment</h3>
            {statusMsg && <div className={`mb-4 p-4 rounded-lg ${statusMsg.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{statusMsg}</div>}
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!isLoggedIn || submitting) return;
              createComment({ variables: { ...formData, postId: post.databaseId, clientMutationId: `c-${Date.now()}` } });
            }} className="space-y-4">
              {!isLoggedIn && <p className="text-red-600">You must be logged in to comment.</p>}
              <textarea
                className="w-full p-4 border rounded-xl text-black"
                rows={4}
                placeholder="What's on your mind?"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                disabled={!isLoggedIn || submitting}
              />
              <button type="submit" disabled={!isLoggedIn || submitting || !formData.content.trim()} className="bg-orange-500 text-white px-6 py-2 rounded-lg font-bold disabled:bg-gray-400">
                {submitting ? "Posting..." : "Post Comment"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}