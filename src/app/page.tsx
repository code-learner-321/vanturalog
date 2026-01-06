"use client";

import Image from "next/image";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useState } from "react";

const GET_POSTS = gql`
  query get_posts($categoryName: String) {
    posts(where: { categoryName: $categoryName }, first: 100) {
      nodes {
        id
        title
        uri
        excerpt
        content 
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        author {
          node {
            name
            avatar {
              url
            }
          }
        }
      }
    }
  }
`;


export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  const { loading, error, data } = useQuery(GET_POSTS, {
    variables: { categoryName: "india-tour" },
  });

  // Helper to calculate reading time based on full content
  const calculateReadTime = (htmlContent = "") => {
    const wordsPerMinute = 200;
    const textOnly = htmlContent.replace(/<[^>]*>/g, '');
    const wordCount = textOnly.split(/\s+/).filter(word => word.length > 0).length;
    const time = Math.ceil(wordCount / wordsPerMinute);
    return `${time} min read`;
  };

  const cleanExcerpt = (html = "", limit = 50) => {
    const textOnly = html.replace(/<[^>]*>/g, '');
    const words = textOnly.split(/\s+/);
    if (words.length <= limit) return textOnly;
    return words.slice(0, limit).join(" ") + "...";
  };

  const allPosts = data?.posts?.nodes || [];
  const filteredPosts = allPosts.filter((post) =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const latestPost = filteredPosts[0];
  const gridPosts = filteredPosts.slice(1);

  if (loading) return <div className="flex h-screen items-center justify-center animate-pulse">Loading India Tour...</div>;
  if (error) return <div className="p-10 text-red-500 text-center">Error: {error.message}</div>;

  return (
    <main className="font-heading font-extralight layout-container flex h-full grow flex-col bg-white">
      <div className="px-4 md:px-10 lg:px-20 xl:px-40 flex flex-1 justify-center py-5">
        <div className="layout-content-container w-full flex flex-col max-w-[1280px] flex-1">

          {/* SEARCH SECTION */}
          <div className="flex flex-col w-full mx-auto mt-10 mb-16 items-center text-center">
            <div className="relative w-full max-w-2xl">
              <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none z-20">
                <svg className="w-6 h-6 text-accent-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search destinations..."
                className="block w-full h-16 pl-14 pr-12 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* FEATURED POST */}
          {latestPost && (
            <div className="@container mb-10">
              <div className="flex flex-col gap-6 py-10 @[864px]:flex-row items-center">
                <div className="flex flex-col gap-6 flex-1 w-full">
                  <div className="flex flex-col gap-2 text-left">
                    <div className="inline-block px-3 py-1 bg-orange-50 text-orange-600 text-xs font-bold rounded-full w-fit mb-2 uppercase tracking-widest">
                      {calculateReadTime(latestPost.content)}
                    </div>
                    <h1 className="text-4xl font-black leading-tight @[480px]:text-5xl lg:text-6xl text-slate-900">
                      <a href={latestPost.uri} className="hover:text-accent-100 transition-colors">{latestPost.title}</a>
                    </h1>
                    <div className="font-body text-slate-500 text-base line-clamp-4" dangerouslySetInnerHTML={{ __html: cleanExcerpt(latestPost.excerpt, 50) }} />
                  </div>
                </div>
                <div className="w-full aspect-video rounded-xl overflow-hidden @[864px]:w-1/2 shadow-2xl relative bg-slate-200">
                  <Image src={latestPost.featuredImage?.node?.sourceUrl || ""} alt={latestPost.title} fill className="object-cover" />
                </div>
              </div>
            </div>
          )}

          {/* GRID SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {(searchQuery ? filteredPosts : gridPosts).map((post) => (
              <article key={post.id} className="group flex flex-col bg-[#F5F5F5] rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">

                {/* Image Section */}
                <div className="w-full aspect-[16/10] relative bg-gray-200 overflow-hidden">
                  <a href={post.uri}>
                    <Image src={post.featuredImage?.node?.sourceUrl || ""} alt={post.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                  </a>
                </div>

                {/* Metadata Bar */}
                <div className="flex justify-between items-center px-6 pt-6">
                  <span className="text-[10px] font-bold text-accent-100 uppercase tracking-widest">India Tour</span>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span className="text-[11px] font-medium uppercase tracking-tighter">{calculateReadTime(post.content || post.excerpt)}</span>
                  </div>
                </div>

                <div className="flex flex-col flex-1 p-6 pt-3">
                  {/* Title */}
                  <h3 className="font-heading text-xl font-light text-slate-900 mb-3 leading-snug group-hover:text-accent-100 transition-colors">
                    <a href={post.uri}>{post.title}</a>
                  </h3>

                  {/* Excerpt */}
                  <div className="font-body text-slate-500 text-sm line-clamp-3 mb-6 leading-relaxed" dangerouslySetInnerHTML={{ __html: cleanExcerpt(post.excerpt, 25) }} />

                  {/* AUTHOR & READ MORE ROW (Aligned horizontally) */}
                  <div className="mt-auto pt-5 border-t border-slate-200 flex items-center justify-between">

                    {/* Left Side: Author Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden relative bg-white border border-slate-100">
                        {post.author?.node?.avatar?.url ? (
                          <Image src={post.author.node.avatar.url} alt={post.author.node.name} fill className="object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-accent-100 text-white text-[10px]">{post.author?.node?.name?.charAt(0)}</div>
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-700">{post.author?.node?.name}</span>
                    </div>

                    {/* Right Side: Read More Arrow */}
                    <a
                      href={post.uri}
                      className="flex items-center gap-1 text-accent-100 font-bold text-xs uppercase tracking-tight group/link"
                    >
                      <span>Read</span>
                      <svg
                        className="w-5 h-5 transition-transform duration-300 group-hover/link:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </a>

                  </div>
                </div>
              </article>
            ))}
          </div>


        </div>
      </div>
    </main>
  );
}
