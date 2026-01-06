"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { LOGIN_USER } from "@/graphql/mutations";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [errorMsg, setErrorMsg] = useState("");

  const [login, { loading }] = useMutation(LOGIN_USER, {
    onCompleted: async (data) => {
      const token = data?.login?.authToken;
      const user = data?.login?.user;
      const userName = user?.displayName || user?.name || user?.nickname || "User";
      const userRole = user?.roles?.nodes?.[0]?.name || "subscriber";
      const userEmail = user?.email || "";

      if (token) {
        // STEP 1: Save to localStorage for UI persistence
        localStorage.setItem("user_name", userName);
        if (userEmail) {
          localStorage.setItem("user_email", userEmail);
        }

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
            }),
          });

          if (res.ok) {
            // STEP 2: Use window.location for a hard refresh to update all component states
            window.location.href = "/admin/dashboard";
          } else {
            const errData = await res.json();
            setErrorMsg(errData.error || "Failed to create secure session.");
          }
        } catch (err) {
          setErrorMsg("Connection error to auth server.");
        }
      } else {
        setErrorMsg("Invalid credentials or no token received.");
      }
    },
    onError: (error) => {
      setErrorMsg(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    login({ variables: { username: formData.username, password: formData.password } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="p-8 bg-white shadow-xl rounded-2xl w-full max-w-md border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Vantura<span className="text-orange-500">log</span> Login
        </h2>
        <div className="space-y-4">
          <input 
            type="text" placeholder="Username" required
            className="w-full p-3 border rounded-xl text-black bg-gray-50 outline-none focus:ring-2 focus:ring-orange-500" 
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})} 
          />
          <input 
            type="password" placeholder="Password" required
            className="w-full p-3 border rounded-xl text-black bg-gray-50 outline-none focus:ring-2 focus:ring-orange-500" 
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})} 
          />
          <button 
            type="submit" disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-xl font-bold transition-colors disabled:bg-gray-400"
          >
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </div>
        {errorMsg && <div className="mt-4 p-3 bg-red-50 text-red-500 text-sm rounded-lg text-center border border-red-100">{errorMsg}</div>}
      </form>
    </div>
  );
}