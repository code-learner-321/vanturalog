'use client'; // Required for state and events in Next.js App Router

import React, { useState } from 'react';

export default function Contact() {
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    // This must match the mutation name we registered in WordPress functions.php
    const SEND_MAIL_MUTATION = `
      mutation SendEmail($name: String!, $email: String!, $subject: String!, $message: String!) {
        sendEmail(input: {name: $name, email: $email, subject: $subject, message: $message}) {
          success
          message
        }
      }
    `;

    try {
      const response = await fetch('https://your-wordpress-domain.com/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: SEND_MAIL_MUTATION,
          variables: formData,
        }),
      });

      const result = await response.json();

      if (result.data?.sendEmail?.success) {
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' }); // Reset form
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error("Submission Error:", error);
      setStatus('error');
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
          {/* FORM SECTION */}
          <div className="lg:col-span-8 order-2 lg:order-1">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="flex flex-col flex-1">
                  <p className="text-[#181610] dark:text-[#f5f3f0] text-base font-medium leading-normal pb-2">Name</p>
                  <input 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="form-input flex w-full rounded-lg text-[#181610] dark:text-white focus:ring-2 focus:ring-primary/50 border border-[#e7e2da] dark:border-[#524636] bg-white dark:bg-[#2d2417] h-14 placeholder:text-[#8d7c5e] p-4 text-base font-normal" 
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
                    className="form-input flex w-full rounded-lg text-[#181610] dark:text-white focus:ring-2 focus:ring-primary/50 border border-[#e7e2da] dark:border-[#524636] bg-white dark:bg-[#2d2417] h-14 placeholder:text-[#8d7c5e] p-4 text-base font-normal" 
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
                  className="form-input flex w-full rounded-lg text-[#181610] dark:text-white focus:ring-2 focus:ring-primary/50 border border-[#e7e2da] dark:border-[#524636] bg-white dark:bg-[#2d2417] h-14 placeholder:text-[#8d7c5e] p-4 text-base font-normal" 
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
                  className="form-input flex w-full rounded-lg text-[#181610] dark:text-white focus:ring-2 focus:ring-primary/50 border border-[#e7e2da] dark:border-[#524636] bg-white dark:bg-[#2d2417] placeholder:text-[#8d7c5e] p-4 text-base font-normal resize-none" 
                  placeholder="How can we help you?" 
                  rows="6"
                ></textarea>
              </label>
              
              <div className="flex flex-col gap-4">
                <div className="flex justify-start">
                  <button 
                    disabled={status === 'loading'}
                    className="flex min-w-[200px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-8 bg-[#ffa500] text-[#181610] text-lg font-bold leading-normal tracking-wide hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none" 
                    type="submit"
                  >
                    {status === 'loading' ? 'Sending...' : 'Send Message'}
                  </button>
                </div>

                {status === 'success' && (
                  <p className="text-green-600 font-bold">✓ Message sent successfully!</p>
                )}
                {status === 'error' && (
                  <p className="text-red-500 font-bold">✕ Failed to send. Please check your connection or try again.</p>
                )}
              </div>
            </form>
          </div>

          {/* SIDEBAR SECTION */}
          <div className="lg:col-span-4 flex flex-col gap-10 order-1 lg:order-2">
            <div className="flex flex-col gap-6 p-8 bg-secondary dark:bg-[#2d2417] rounded-xl border border-[#e7e2da] dark:border-[#3d3428]">
              <div>
                <h3 className="text-xl font-bold mb-2">Email us</h3>
                <p className="text-primary text-base font-medium">hello@vanturalog.com</p>
              </div>
              <div className="pt-4 border-t border-[#e7e2da] dark:border-[#3d3428]">
                <h3 className="text-lg font-bold mb-4">Follow our journey</h3>
                <div className="flex gap-4">
                  <a className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-[#3d3428] text-[#181610] dark:text-[#f5f3f0] hover:bg-primary hover:text-[#181610] transition-colors border border-[#e7e2da] dark:border-transparent" href="#">
                    <span className="material-symbols-outlined text-[20px]">share</span>
                  </a>
                  <a className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-[#3d3428] text-[#181610] dark:text-[#f5f3f0] hover:bg-primary hover:text-[#181610] transition-colors border border-[#e7e2da] dark:border-transparent" href="#">
                    <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                  </a>
                  <a className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-[#3d3428] text-[#181610] dark:text-[#f5f3f0] hover:bg-primary hover:text-[#181610] transition-colors border border-[#e7e2da] dark:border-transparent" href="#">
                    <span className="material-symbols-outlined text-[20px]">alternate_email</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 p-8 bg-white dark:bg-[#ffa500] rounded-xl border-l-4 border-[#ffa500] shadow-sm border-t border-r border-b border-[#e7e2da] dark:border-[#3d3428]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">lightbulb</span>
                <h3 className="text-xl font-bold">Quick Tips</h3>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-xs uppercase tracking-widest font-bold text-[#8d7c5e]">Best time to reach out</p>
                  <p className="text-base font-medium">9am - 5pm EST, Monday to Friday</p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-xs uppercase tracking-widest font-bold text-[#8d7c5e]">Response time</p>
                  <p className="text-base font-medium">Within 48 hours</p>
                </div>
              </div>
            </div>
          </div>
          {/* END SIDEBAR */}
        </div>
      </div>
    </main>
  );
}