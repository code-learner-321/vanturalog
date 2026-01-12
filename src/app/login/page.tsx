"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { LOGIN_USER } from "@/graphql/mutations";

export default function LoginPage() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [errorMsg, setErrorMsg] = useState("");

  const [login, { loading }] = useMutation(LOGIN_USER, {
    onCompleted: async (data) => {
      const token = data?.login?.authToken;
      const user = data?.login?.user;
      
      if (token) {
        const userName = user?.displayName || user?.name || "User";
        const userRole = user?.roles?.nodes?.[0]?.name || "subscriber";
        const userEmail = user?.email || "";
        const avatarUrl = user?.avatarUrl || "";
        const userId = user?.databaseId || "";

        try {
          const res = await fetch("/api/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "login",
              token,
              name: userName,
              role: userRole,
              email: userEmail,
              avatarUrl: avatarUrl, // Passing to API
              userId: userId,       // Passing to API
            }),
          });

          if (res.ok) {
            window.location.href = "/admin/dashboard";
          } else {
            setErrorMsg("Failed to create secure session.");
          }
        } catch (err) {
          setErrorMsg("Connection error.");
        }
      } else {
        setErrorMsg("Invalid credentials.");
      }
    },
    onError: (error) => setErrorMsg(error.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ variables: { username: formData.username, password: formData.password } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="p-8 bg-white shadow-xl rounded-2xl w-full max-w-md border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login</h2>
        <div className="space-y-4">
          <input 
            type="text" placeholder="Username" required
            className="w-full p-3 border rounded-xl text-black bg-gray-50 outline-none focus:ring-2 focus:ring-orange-500" 
            onChange={(e) => setFormData({...formData, username: e.target.value})} 
          />
          <input 
            type="password" placeholder="Password" required
            className="w-full p-3 border rounded-xl text-black bg-gray-50 outline-none focus:ring-2 focus:ring-orange-500" 
            onChange={(e) => setFormData({...formData, password: e.target.value})} 
          />
          <button type="submit" disabled={loading} className="w-full bg-orange-500 text-white p-3 rounded-xl font-bold">
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </div>
        {errorMsg && <div className="mt-4 p-3 bg-red-50 text-red-500 text-sm rounded-lg text-center">{errorMsg}</div>}
      </form>
    </div>
  );
}