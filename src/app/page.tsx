"use client";

import Image from "next/image";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useState, Suspense } from "react"; // Added Suspense
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const GET_POSTS = gql`
  query get_posts($categoryName: String) {
    posts(where: { categoryName: $categoryName }, first: 100) {
      nodes {
        id
        title
        uri
        excerpt
        content 
        categories {
          nodes {
            name
          }
        }
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

const GET_ADMIN_SETTINGS = gql`
  query GetAdminSettings {
    user(id: "1", idType: DATABASE_ID) {
      userSettingsGroup {
        userSettings
      }
    }
  }
`;

// --- TYPES ---
interface PostsData {
  posts: {
    nodes: Array<{
      id: string;
      title: string;
      uri: string;
      excerpt: string;
      content: string;
      categories: {
        nodes: Array<{ name: string }>;
      };
      featuredImage?: {
        node: {
          sourceUrl: string;
          altText: string;
        };
      };
      author: {
        node: {
          name: string;
          description: string;
          avatar: {
            url: string;
          };
          slug?: string;
        };
      };
    }>;
  };
}

interface SettingsData {
  user: {
    userSettingsGroup: {
      userSettings: string;
    };
  };
}

// 1. Move the original logic into a sub-component
function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? parseInt(pageParam) : 1;

  const [searchQuery, setSearchQuery] = useState("");
  const postsPerPage = 6;

  // Fetch settings
  const { data: settingsData } = useQuery<SettingsData>(GET_ADMIN_SETTINGS);
  const activeCategory = settingsData?.user?.userSettingsGroup?.userSettings || "india-tour";

  // Fetch posts
  const { loading, error, data } = useQuery<PostsData>(GET_POSTS, {
    variables: { categoryName: activeCategory },
    skip: !settingsData, 
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

  const cleanExcerptForLatestPost = (html = "", limit = 200) => {
    if (!html) return "";
    const textOnly = html.replace(/<[^>]*>/g, '').replace(/\[&hellip;\]/g, '').trim();
    const words = textOnly.split(/\s+/).filter(word => word.length > 0);
    if (words.length <= limit) return textOnly;
    return words.slice(0, limit).join(" ") + "...";
  };

  const allPosts = data?.posts?.nodes || [];
  
  const filteredPosts = allPosts.filter((post) =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const latestPost = filteredPosts[0];
  const gridPosts = filteredPosts.slice(1);

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentGridPosts = gridPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(gridPosts.length / postsPerPage);

  const handlePageChange = (pageNumber: number) => {
    router.push(`?page=${pageNumber}`, { scroll: false });
    window.scrollTo({ top: 500, behavior: 'smooth' });
  };

  const authorData = latestPost?.author?.node;

  if (loading) return <div className="flex h-screen items-center justify-center animate-pulse text-slate-500 font-bold">Loading India Tour...</div>;
  if (error) return <div className="p-10 text-red-500 text-center">Error: {error.message}</div>;

  return (
    <main className="font-heading font-extralight layout-container flex h-full grow flex-col bg-white">
      <div className="px-4 md:px-10 lg:px-20 xl:px-40 flex flex-1 justify-center py-5">
        <div className="layout-content-container w-full flex flex-col max-w-[1280px] flex-1">

          {/* AUTHOR SECTION */}
          <div className="py-12 border-b border-gray-100 mb-6">
            <div className="flex flex-col md:flex-row items-center gap-8 bg-[#F5F5F5] p-8 rounded-3xl">
              <Link href={`/author/${authorData?.slug || '#'}`} className="relative flex-shrink-0 group/avatar">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden ring-4 ring-white shadow-xl bg-slate-200 transition-transform duration-500 group-hover/avatar:scale-105">
                  {authorData?.avatar?.url && (
                    <img alt={authorData.name} className="w-full h-full object-cover" src={authorData.avatar.url} />
                  )}
                </div>
              </Link>
              <div className="flex flex-col text-center md:text-left">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-2">Written by {authorData?.name || "Sarah Jenkins"}</h3>
                <p className="text-lg text-slate-600 font-normal leading-relaxed mb-4 max-w-2xl font-body">
                  {authorData?.description && authorData.description !== activeCategory 
                    ? authorData.description 
                    : "Professional travel writer and tour guide sharing insights from the heart of India."}
                </p>
                <Link href={`/author/${authorData?.slug || '#'}`} className="group/author-link inline-flex items-center justify-center md:justify-start gap-2 text-accent-100 font-bold text-xs uppercase tracking-widest transition-colors">
                  <span>Know More</span>
                  <svg className="w-4 h-4 transition-transform duration-300 group-hover/author-link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* SEARCH SECTION */}
          <div className="flex flex-col w-full mt-4 mb-2">
            <div className="mb-8">
              <label className="flex flex-col gap-3 w-full max-w-[480px]">
                <h3 className="font-heading text-xl capitalize font-bold text-slate-900 mb-3 leading-snug">Search your favourite tour spot</h3>
                <div className="flex w-full flex-1 items-stretch rounded-full h-14 shadow-sm bg-secondary border border-gray-200 transition-all duration-300 focus-within:shadow-md focus-within:border-[#ffa500] focus-within:ring-1 focus-within:ring-[#ffa500] overflow-hidden">
                  <div className="text-slate-400 flex items-center justify-center pl-5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                  </div>
                  <input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (currentPage !== 1) router.push(`?page=1`, { scroll: false });
                    }}
                    className="flex w-full h-9 min-w-0 flex-1 text-slate-900 focus:outline-0 bg-transparent px-4 text-base border-none focus:ring-0"
                    placeholder="Search articles..."
                  />
                </div>
              </label>
            </div>
          </div>

          {/* FEATURED POST */}
          {latestPost && currentPage === 1 && !searchQuery && (
            <div className="@container mb-10">
              <div className="group flex flex-col gap-6 py-10 @[864px]:flex-row items-center">
                <div className="flex flex-col gap-6 flex-1 w-full">
                  <div className="flex flex-col gap-2 text-left">
                    <div className="inline-block px-3 py-1 bg-orange-50 text-orange-600 text-xs font-bold rounded-full w-fit mb-2 uppercase tracking-widest">
                      {calculateReadTime(latestPost.content)}
                    </div>
                    <h1 className="text-4xl font-black leading-tight @[480px]:text-5xl lg:text-6xl text-slate-900">
                      <Link href={latestPost.uri} className="hover:text-accent-100 transition-colors">{latestPost.title}</Link>
                    </h1>
                    <div className="flex flex-col gap-3">
                      <div className="font-body text-slate-500 text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: cleanExcerptForLatestPost(latestPost.content, 60) }} />
                      <Link href={latestPost.uri} className="group/link inline-flex items-center gap-2 text-accent-100 font-bold text-sm uppercase tracking-wider transition-colors">
                        <span>Read Full Article</span>
                        <svg className="w-5 h-5 transition-transform duration-300 group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="w-full aspect-video rounded-xl overflow-hidden @[864px]:w-1/2 shadow-2xl relative bg-slate-200">
                  <Link href={latestPost.uri} className="block w-full h-full">
                    <Image src={latestPost.featuredImage?.node?.sourceUrl || ""} alt={latestPost.title} fill className="object-cover transition-transform duration-1000 ease-in-out group-hover:scale-110" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* GRID SECTION */}
          {searchQuery && filteredPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-[#F5F5F5] rounded-3xl border-2 border-dashed border-gray-200 mb-12">
              <h3 className="text-xl font-bold text-slate-900 mb-2">No search results found</h3>
              <button onClick={() => setSearchQuery("")} className="mt-6 text-sm font-bold text-accent-100 hover:underline cursor-pointer">Clear search</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {(searchQuery ? filteredPosts : currentGridPosts).map((post) => (
                <article key={post.id} className="group flex flex-col bg-[#F5F5F5] rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
                  <div className="w-full aspect-[16/10] relative bg-gray-200 overflow-hidden">
                    <Link href={post.uri}>
                      <Image src={post.featuredImage?.node?.sourceUrl || "https://via.placeholder.com/600x400?text=No+Image+Available"} alt={post.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                    </Link>
                  </div>
                  <div className="flex justify-between items-center px-6 pt-6">
                    <span className="text-[10px] font-bold text-accent-100 uppercase tracking-widest">{post.categories?.nodes?.[0]?.name || "Travel"}</span>
                    <span className="text-[11px] font-medium tracking-tighter text-slate-400">{calculateReadTime(post.content || post.excerpt)}</span>
                  </div>
                  <div className="flex flex-col flex-1 p-6 pt-3">
                    <h3 className="font-heading text-xl font-light text-slate-900 mb-3 leading-snug group-hover:text-accent-100 transition-colors">
                      <Link href={post.uri}>{post.title}</Link>
                    </h3>
                    <div className="font-body text-slate-500 text-sm line-clamp-3 mb-6 leading-relaxed" dangerouslySetInnerHTML={{ __html: cleanExcerpt(post.excerpt, 25) }} />
                    <div className="mt-auto pt-5 border-t border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden relative bg-white border border-slate-100">
                          {post.author?.node?.avatar?.url ? <img src={post.author.node.avatar.url} alt={post.author.node.name} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full bg-accent-100 text-white text-[10px]">{post.author?.node?.name?.charAt(0)}</div>}
                        </div>
                        <span className="text-xs font-bold text-slate-700">{post.author?.node?.name}</span>
                      </div>
                      <Link href={post.uri} className="flex items-center gap-1 text-accent-100 font-bold text-xs uppercase group/link">
                        <span>Read</span>
                        <svg className="w-5 h-5 transition-transform duration-300 group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* PAGINATION UI */}
          {!searchQuery && totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mb-20">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 cursor-pointer rounded-full border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button key={index + 1} onClick={() => handlePageChange(index + 1)} className={`w-10 cursor-pointer h-10 rounded-full text-sm font-bold transition-all ${currentPage === index + 1 ? "bg-accent-100 text-white shadow-md" : "text-slate-600 hover:bg-gray-100"}`}>
                  {index + 1}
                </button>
              ))}
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 cursor-pointer rounded-full border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// 2. Default export with Suspense Wrapper
export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center animate-pulse text-slate-500">
        Loading Page...
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}