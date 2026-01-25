"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { wpFetch } from '@/lib/apollo-client';
import { REGISTER_USER_MUTATION } from '@/graphql/mutations';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Auto-dismiss error messages after 8 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await wpFetch(REGISTER_USER_MUTATION, formData);
      
      // Check if registration was successful
      if (result?.registerUser?.user) {
        // Redirect to login with success message
        router.push('/login?registered=true');
      } else {
        setError("Registration failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      
      // Provide more helpful error messages
      let errorMessage = err.message || "Something went wrong. Please try again.";
      
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("Unable to connect")) {
        errorMessage = "Unable to connect to the server. Please check your internet connection and try again.";
      } else if (errorMessage.includes("username") || errorMessage.includes("email")) {
        // WordPress validation errors
        errorMessage = errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] p-4">
      <div className="bg-[#FFFFFF] p-10 rounded-xl shadow-sm w-full max-w-md border border-gray-100">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            <span className="text-[#FFA500]">Register New User</span>
          </h1>
          <p className="text-gray-500 mt-2">Join the world's travel stories</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 mb-4 border border-red-200 transition-all duration-300">
            <span className="text-lg font-bold">✗</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
            <input
              required
              className="w-full px-4 py-3 bg-[#F5F5F5] border-none rounded-lg focus:ring-2 focus:ring-[#FFA500] outline-none transition-all"
              type="text"
              placeholder="Username"
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              required
              className="w-full px-4 py-3 bg-[#F5F5F5] border-none rounded-lg focus:ring-2 focus:ring-[#FFA500] outline-none transition-all"
              type="email"
              placeholder="email@example.com"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input
              required
              className="w-full px-4 py-3 bg-[#F5F5F5] border-none rounded-lg focus:ring-2 focus:ring-[#FFA500] outline-none transition-all"
              type="password"
              placeholder="••••••••"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-[#FFA500] hover:bg-[#e69500] text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-orange-200 disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          Already a member? 
          <a href="/login" className="text-[#FFA500] font-bold ml-1 hover:underline">Sign In</a>
        </p>
      </div>
    </div>
  );
}