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
            description
            avatar(size: 512) {
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

  // Extract Author Details from the latest post
  const authorData = latestPost?.author?.node;

  if (loading) return <div className="flex h-screen items-center justify-center animate-pulse">Loading India Tour...</div>;
  if (error) return <div className="p-10 text-red-500 text-center">Error: {error.message}</div>;

  return (
    <main className="font-heading font-extralight layout-container flex h-full grow flex-col bg-white">
      <div className="px-4 md:px-10 lg:px-20 xl:px-40 flex flex-1 justify-center py-5">
        <div className="layout-content-container w-full flex flex-col max-w-[1280px] flex-1">

          {/* HOME ABOUT AUTHOR SECTION - UPDATED DYNAMICALLY */}
          <div className="py-12 border-b border-gray-100 mb-6">
            <div className="flex flex-col md:flex-row items-center gap-8 bg-[#F5F5F5] p-8 rounded-3xl">
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden ring-4 ring-white shadow-xl bg-slate-200">
                  {authorData?.avatar?.url && (
                    <img
                      alt={authorData.name}
                      className="w-full h-full object-cover"
                      src={authorData.avatar.url}
                    />
                  )}
                </div>
              </div>
              <div className="flex flex-col text-center md:text-left">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-2">
                  Written by {authorData?.name || "Sarah Jenkins"}
                </h3>
                <p className="text-lg text-slate-600 font-normal leading-relaxed mb-4 max-w-2xl font-body">
                  {authorData?.description || "I'm a Senior Frontend Architect specializing in building high-performance web applications with Next.js and React."}
                </p>
                <a className="group inline-flex items-center justify-center md:justify-start gap-1 text-sm font-bold text-slate-900 hover:text-accent-100 transition-colors" href="#">
                  Read more about my journey
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* SEARCH SECTION */}
          <div className="flex flex-col w-full mt-4 mb-2">
            <div className="mb-8">
              <label className="flex flex-col gap-3 w-full max-w-[480px]">
                <h3 className="font-heading text-xl capitalize font-bold text-slate-900 mb-3 leading-snug group-hover:text-accent-100 transition-colors">
                  Search your favourite tour spot
                </h3>
                <div className="flex w-full flex-1 items-stretch rounded-full h-14 shadow-sm bg-secondary border border-gray-200 focus-within:ring-2 focus-within:ring-primary focus-within:bg-white transition-all overflow-hidden">
                  <div className="text-slate-400 flex items-center justify-center pl-5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                  </div>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex w-full h-9 min-w-0 flex-1 text-slate-900 focus:outline-0 bg-transparent placeholder:text-slate-400 px-4 text-base font-normal border-none focus:ring-0 font-body"
                    placeholder="Search articles..."
                  />
                </div>
              </label>
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
                  <a href={latestPost.uri}><Image src={latestPost.featuredImage?.node?.sourceUrl || ""} alt={latestPost.title} fill className="object-cover" /></a>
                </div>
              </div>
            </div>
          )}

          {/* GRID SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {(searchQuery ? filteredPosts : gridPosts).map((post) => (
              <article key={post.id} className="group flex flex-col bg-[#F5F5F5] rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
                <div className="w-full aspect-[16/10] relative bg-gray-200 overflow-hidden">
                  <a href={post.uri}>
                    <Image src={post.featuredImage?.node?.sourceUrl || ""} alt={post.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                  </a>
                </div>
                <div className="flex justify-between items-center px-6 pt-6">
                  <span className="text-[10px] font-bold text-accent-100 uppercase tracking-widest">India Tour</span>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span className="text-[11px] font-medium uppercase tracking-tighter">{calculateReadTime(post.content || post.excerpt)}</span>
                  </div>
                </div>
                <div className="flex flex-col flex-1 p-6 pt-3">
                  <h3 className="font-heading text-xl font-light text-slate-900 mb-3 leading-snug group-hover:text-accent-100 transition-colors">
                    <a href={post.uri}>{post.title}</a>
                  </h3>
                  <div className="font-body text-slate-500 text-sm line-clamp-3 mb-6 leading-relaxed" dangerouslySetInnerHTML={{ __html: cleanExcerpt(post.excerpt, 25) }} />
                  {/* AUTHOR & READ MORE ROW (Aligned horizontally) */}
                  <div className="mt-auto pt-5 border-t border-slate-200 flex items-center justify-between">

                    {/* Left Side: Author Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden relative bg-white border border-slate-100">
                        {post.author?.node?.avatar?.url ? (
                          <img
                            src={post.author.node.avatar.url}
                            alt={post.author.node.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-accent-100 text-white text-[10px]">
                            {post.author?.node?.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-700">{post.author?.node?.name}</span>
                    </div>

                    {/* Right Side: Read More Arrow */}
                    <a href={post.uri} className="flex items-center gap-1 text-accent-100 font-bold text-xs uppercase tracking-tight group/link">
                      <span>Read</span>
                      <svg className="w-5 h-5 transition-transform duration-300 group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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