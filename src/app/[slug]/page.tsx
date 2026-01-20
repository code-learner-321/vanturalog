"use client";

import { useState, useEffect, useMemo } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { useParams } from "next/navigation";
import Image from "next/image"; // Added for user images

const GET_SINGLE_POST = gql`
  query GetSinglePost($slug: String!) {
    postBy(slug: $slug) {
      databaseId
      title
      content
      comments(where: { orderby: COMMENT_DATE }) {
        nodes {
          id
          databaseId
          content
          date
          status
          parentDatabaseId
          author { 
            node { 
              name 
              # Added avatar field
              avatar {
                url
              }
            } 
          }
        }
      }
    }
  }
`;

const CREATE_COMMENT = gql`
  mutation CreateComment($author: String!, $email: String!, $content: String!, $postId: Int!, $clientMutationId: String!) {
    createComment(input: {
      author: $author, 
      authorEmail: $email, 
      content: $content, 
      commentOn: $postId,
      clientMutationId: $clientMutationId
    }) {
      success
      clientMutationId
      comment { 
        id 
        databaseId
        content 
        status
      }
    }
  }
`;

export default function SinglePost() {
  const params = useParams();
  const slugParam = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const slug = typeof slugParam === 'string' ? decodeURIComponent(slugParam) : slugParam;
  const [formData, setFormData] = useState({ author: "", email: "", content: "" });
  const [statusMsg, setStatusMsg] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pendingComment, setPendingComment] = useState<string | null>(null);

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

  const { loading, error, data, refetch } = useQuery<{ postBy?: { databaseId: number; title: string; content: string; comments?: { nodes: any[] } } }>(GET_SINGLE_POST, {
    variables: { slug: slug },
    skip: !slug,
    errorPolicy: "all",
    fetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: false
  });

  useEffect(() => {
    if (!slug || loading) return;
    const pollInterval = setInterval(async () => {
      try {
        await refetch({ fetchPolicy: 'network-only' });
      } catch (error) {
        console.error('Error polling for comments:', error);
      }
    }, 30000);
    return () => clearInterval(pollInterval);
  }, [slug, refetch, loading]);

  const [createComment, { loading: submitting }] = useMutation(CREATE_COMMENT, {
    onCompleted: (mutationData: any) => {
      if (mutationData?.createComment?.success === false || !mutationData?.createComment?.comment) {
        const errorMsg = "Failed to submit comment. Please try again.";
        setStatusMsg("Error: " + errorMsg);
        setPendingComment(null);
        setTimeout(() => setStatusMsg(""), 10000);
        return;
      }
      const submittedContent = formData.content.trim();
      setPendingComment(submittedContent);
      setStatusMsg("✓ Comment submitted successfully! It will appear after approval.");
      setFormData(prev => ({ ...prev, content: "" }));
      setTimeout(() => setStatusMsg(""), 5000);
      setTimeout(() => refetch(), 1000);
    },
    onError: (err) => {
      setStatusMsg("Error: " + err.message);
      setPendingComment(null);
      setTimeout(() => setStatusMsg(""), 10000);
    }
  });

  const post = data?.postBy as any;
  const allComments = useMemo(() => {
    return (post?.comments?.nodes || []).filter((comment: any) =>
      comment.status === 'APPROVE' || comment.status === 'approve'
    );
  }, [post?.comments?.nodes]);

  useEffect(() => {
    if (pendingComment && allComments.length > 0) {
      const isApproved = allComments.some((comment: any) => {
        const commentText = comment.content?.replace(/<[^>]*>/g, '').trim() || '';
        const pendingText = pendingComment.replace(/<[^>]*>/g, '').trim();
        return commentText === pendingText || commentText.includes(pendingText) || pendingText.includes(commentText);
      });
      if (isApproved) {
        setStatusMsg("✓ Your comment has been approved and is now visible!");
        setPendingComment(null);
        setTimeout(() => setStatusMsg(""), 5000);
      }
    }
  }, [allComments, pendingComment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn || !data?.postBy || submitting) return;
    if (!formData.content.trim()) {
      setStatusMsg("Please enter a comment.");
      return;
    }

    let emailToUse = formData.email;
    if (!emailToUse || !emailToUse.includes("@")) {
      const storedEmail = localStorage.getItem("user_email");
      if (storedEmail && storedEmail.includes("@")) emailToUse = storedEmail;
    }

    if (!emailToUse || !emailToUse.includes("@")) {
      setStatusMsg("Error: A valid email address is required to comment.");
      return;
    }

    await createComment({
      variables: {
        author: formData.author || "Anonymous",
        email: emailToUse,
        content: formData.content.trim(),
        postId: (data.postBy as any).databaseId,
        clientMutationId: `comment-${Date.now()}`
      }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const buildCommentTree = (comments: any[]) => {
    const commentMap = new Map();
    const rootComments: any[] = [];
    comments.forEach(comment => {
      commentMap.set(comment.databaseId, { ...comment, replies: [] });
    });
    comments.forEach(comment => {
      const commentNode = commentMap.get(comment.databaseId);
      if (comment.parentDatabaseId && comment.parentDatabaseId !== 0) {
        const parent = commentMap.get(comment.parentDatabaseId);
        if (parent) parent.replies.push(commentNode);
        else rootComments.push(commentNode);
      } else {
        rootComments.push(commentNode);
      }
    });
    return rootComments;
  };

  const commentTree = buildCommentTree(allComments);

  const renderComment = (comment: any, depth: number = 0) => {
    const isReply = depth > 0;
    const authorName = comment.author?.node?.name || 'Anonymous';
    const avatarUrl = comment.author?.node?.avatar?.url;

    return (
      <div
        key={comment.id}
        className={`${isReply ? 'ml-8 mt-4 border-l-2 border-orange-200 pl-4' : 'mb-6'} bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow`}
      >
        <div className="flex items-start gap-3">
          {/* User Image Start */}
          <div className="flex-shrink-0">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={authorName}
                width={40}
                height={40}
                className="rounded-full"
                unoptimized
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                {authorName.charAt(0)}
              </div>
            )}
          </div>
          {/* User Image End */}

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {/* Text starts very small (text-[10px]), becomes larger (sm:text-sm) on tablets/desktops */}
              <span className="font-bold text-[14px] sm:text-sm text-gray-800">
                {authorName}
              </span>

              {/* Text starts small (text-xs), becomes standard (sm:text-sm) on tablets/desktops */}
              <span className="font-bold text-[14px] sm:text-sm text-gray-500">
                {formatDate(comment.date)}
              </span>
            </div>
            <div
              className="text-[14px] sm:text-sm text-gray-700 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: comment.content }}
            />
          </div>
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4">
            {comment.replies.map((reply: any) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <p className="flex h-screen items-center justify-center text-slate-500 bg-white animate-pulse">Loading...</p>;
  if (error || !data?.postBy) return <div className="text-center bg-white py-20">Post not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <h1 className="text-3xl font-bold mb-6 text-slate-900">{post.title}</h1>
      <div className="prose mb-10 text-slate-500" dangerouslySetInnerHTML={{ __html: post.content }} />

      {commentTree.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-6 text-slate-900">Comments ({allComments.length})</h2>
          <div className="space-y-4">
            {commentTree.map((comment: any) => renderComment(comment))}
          </div>
        </section>
      )}

      <section className="bg-gray-50 p-6 rounded-xl border">
        <h3 className="text-xl font-bold mb-4 text-slate-900">Leave a Comment</h3>
        {statusMsg && (
          <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 transition-all duration-300 ${statusMsg.includes('Error') ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
            }`}>
            <span className="flex-1">{statusMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {!isLoggedIn ? (
            <div className="p-4 bg-red-50 text-red-600 rounded">You must be logged in to comment.</div>
          ) : (
            <p className="text-sm italic text-gray-600">Logged in as {formData.author}</p>
          )}

          <textarea
            className="w-full p-4 border rounded-xl text-black focus:ring-2 focus:ring-orange-500"
            rows={4}
            placeholder="What's on your mind?"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            disabled={!isLoggedIn || submitting}
          />

          <button
            type="submit"
            disabled={!isLoggedIn || submitting || !formData.content.trim()}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-bold disabled:bg-gray-300 transition-colors"
          >
            {submitting ? "Posting..." : "Post Comment"}
          </button>
        </form>
      </section>
    </div>
  );
}