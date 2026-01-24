'use client';

import React, { useState, useEffect } from 'react';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Interface for the Sidebar Post Type
interface SidebarNode {
  title: string;
  content: string;
}

export default function Contact() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  // --- UPDATED: State is now an array ---
  const [sidebarAuthors, setSidebarAuthors] = useState<SidebarNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- UPDATED: Fetch Sidebar Content ---
  useEffect(() => {
    const fetchSidebar = async () => {
      const wpUrl = process.env.NEXT_PUBLIC_WP_GRAPHQL_URL;
      const GET_SIDEBAR_CONTENT = `
              query GetContactSidebar {
                contactMeSidebars(where: { orderby: { field: DATE, order: ASC } }) {
                  nodes {
                    title
                    content
                  }
                }
              }
            `;

      try {
        const res = await fetch(wpUrl!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: GET_SIDEBAR_CONTENT }),
        });
        const json = await res.json();
        if (json.data?.contactMeSidebars?.nodes) {
          setSidebarAuthors(json.data.contactMeSidebars.nodes);
        }
      } catch (err) {
        console.error("Error fetching sidebar:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSidebar();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    const wpUrl = process.env.NEXT_PUBLIC_WP_GRAPHQL_URL;
    e.preventDefault();
    setStatus('loading');

    const SEND_MAIL_MUTATION = `
      mutation SendEmail($name: String!, $email: String!, $subject: String!, $message: String!) {
        sendEmail(input: {name: $name, email: $email, subject: $subject, message: $message}) {
          success
        }
      }
    `;

    try {
      const response = await fetch(wpUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          query: SEND_MAIL_MUTATION,
          variables: formData,
        }),
      });

      const result = await response.json();

      if (result.data?.sendEmail?.success) {
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 5000);
      }
    } catch (error) {
      console.error("Submission Error:", error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <main className="layout-container h-full grow flex-col">
      <div className="px-4 md:px-10 lg:px-20 xl:px-40 justify-center py-5">
        <div className="flex pt-12 pb-24 flex-col gap-3">
          <h1 className="text-[#181610] dark:text-[#f5f3f0] text-5xl lg:text-6xl font-black leading-tight tracking-tighter italic">Let’s Connect</h1>
          <p className="text-[#8d7c5e] dark:text-[#b0a086] text-lg lg:text-xl font-normal leading-normal max-w-2xl">
            Have a question about a destination or want to collaborate on a future adventure? Drop a line below and let's start a conversation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mt-4">
          <div className="lg:col-span-8 order-2 lg:order-1">
            {/* Form code remains the same... */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="flex flex-col flex-1">
                  <p className="text-[#181610] dark:text-[#f5f3f0] text-base font-medium leading-normal pb-2">Name</p>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="form-input flex w-full rounded-lg text-[#181610] dark:text-white border border-[#e7e2da] dark:border-[#524636] bg-white dark:bg-[#2d2417] h-14 p-4"
                    placeholder="Your name"
                    type="text"
                  />
                </label>
                <label className="flex flex-col flex-1">
                  <p className="text-[#181610] dark:text-[#f5f3f0] text-base font-medium leading-normal pb-2">Email Address</p>
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="form-input flex w-full rounded-lg text-[#181610] dark:text-white border border-[#e7e2da] dark:border-[#524636] bg-white dark:bg-[#2d2417] h-14 p-4"
                    placeholder="hello@example.com"
                    type="email"
                  />
                </label>
              </div>
              <label className="flex flex-col">
                <p className="text-[#181610] dark:text-[#f5f3f0] text-base font-medium leading-normal pb-2">Subject</p>
                <input
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="form-input flex w-full rounded-lg text-[#181610] dark:text-white border border-[#e7e2da] dark:border-[#524636] bg-white dark:bg-[#2d2417] h-14 p-4"
                  placeholder="What is this about?"
                  type="text"
                />
              </label>
              <label className="flex flex-col">
                <p className="text-[#181610] dark:text-[#f5f3f0] text-base font-medium leading-normal pb-2">Message</p>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="form-input flex w-full rounded-lg text-[#181610] dark:text-white border border-[#e7e2da] dark:border-[#524636] bg-white dark:bg-[#2d2417] p-4 resize-none"
                  placeholder="How can we help you?"
                  rows={6}
                ></textarea>
              </label>

              <div className="flex flex-col gap-4">
                <div className="flex justify-start">
                  <button
                    disabled={status === 'loading'}
                    className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-lg h-14 px-8 bg-[#ffa500] text-[#181610] text-lg font-bold hover:shadow-lg transition-all disabled:opacity-50"
                    type="submit"
                  >
                    {status === 'loading' ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
                {status === 'success' && <p className="text-green-600 font-bold">✓ Message sent successfully!</p>}
                {status === 'error' && <p className="text-red-500 font-bold">✕ Failed to send. Please try again.</p>}
              </div>
            </form>
          </div>

          {/* SIDEBAR */}
          <div className="lg:col-span-4 flex flex-col gap-10 order-1 lg:order-2">
            {isLoading ? (
              // --- LOADING SKELETON STATE ---
              <>
                {[1, 2].map((i) => (
                  <div key={i} className="bg-secondary rounded-xl border-[1px] border-primary/10 p-6 animate-pulse">
                    <div className="h-4 bg-primary/10 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-primary/5 rounded w-full mb-2"></div>
                    <div className="h-3 bg-primary/5 rounded w-5/6 mb-2"></div>
                    <div className="h-3 bg-primary/5 rounded w-4/6"></div>
                  </div>
                ))}
              </>
            ) : sidebarAuthors.length > 0 ? (
              // --- ACTUAL CONTENT ---
              sidebarAuthors.map((sidebar: SidebarNode, index: number) => (
                <div key={index} className="overflow-hidden rounded-xl">
                  <div
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: sidebar.content }}
                  />
                </div>
              ))
            ) : (
              // --- EMPTY STATE ---
              <p className="text-sm italic opacity-50">No sidebar content found.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}