import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { Shield, Key, Mail, User, ArrowRight } from "lucide-react";

export default function Login() {
  const { login, register, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegistering) {
        await register(username, email, password);
      } else {
        await login(email, password); // takes email/username
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.response?.data?.error || "Authentication failed. Check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#151619] flex items-center justify-center px-4 font-sans select-none text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-lg shadow-xl relative overflow-hidden">
        
        {/* Background Accent Lines */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-400" />
        
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8 mt-2">
          <div className="flex items-center gap-3.5 mb-2">
            <img
              src="/logo-icon.png"
              alt="Snortweb Logo Icon"
              className="h-12 w-12 object-contain"
            />
            <h2 className="text-2xl font-bold tracking-widest uppercase text-slate-100 mt-1">Snortweb</h2>
          </div>
          <p className="text-xs text-slate-400 font-mono tracking-widest uppercase mt-1">Control Terminal</p>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-500/30 text-red-400 p-4 rounded text-xs font-semibold mb-6 flex items-start gap-2.5">
            <span className="mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegistering && (
            <div className="relative">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-10 py-3 text-xs outline-none focus:border-amber-500 transition-colors placeholder-slate-600 text-slate-100"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
              {isRegistering ? "Email Address" : "Username or Email"}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-slate-500 w-4 h-4" />
              <input
                type={isRegistering ? "email" : "text"}
                required
                placeholder={isRegistering ? "admin@snortweb.com" : "admin / admin@snortweb.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-10 py-3 text-xs outline-none focus:border-amber-500 transition-colors placeholder-slate-600 text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Password</label>
            <div className="relative">
              <Key className="absolute left-3.5 top-3.5 text-slate-500 w-4 h-4" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-10 py-3 text-xs outline-none focus:border-amber-500 transition-colors placeholder-slate-600 text-slate-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 py-3.5 px-4 rounded font-bold tracking-widest text-xs uppercase flex items-center justify-center gap-2 mt-8 transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{isRegistering ? "Create Account" : "Access Terminal"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError("");
            }}
            className="text-[10px] font-bold tracking-wider uppercase text-amber-500/80 hover:text-amber-500 cursor-pointer bg-transparent border-0"
          >
            {isRegistering ? "Back to Login" : "Create new admin account"}
          </button>
        </div>

      </div>
    </div>
  );
}
