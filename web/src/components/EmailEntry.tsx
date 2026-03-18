import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Mail, Loader2 } from "lucide-react";
import { apiClient } from "../lib/api-client";

export const EmailEntry = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const domain = email.split("@")[1];
      if (!domain) {
        throw new Error("Invalid email address");
      }

      const resp = await apiClient.get(
        `/realms?domain=${encodeURIComponent(domain)}`
      );
      const realm = resp.realm;

      if (realm) {
        localStorage.setItem("user_realm", realm);
        globalThis.location.reload();
      } else {
        setError("No organization found for this email.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to find organization. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-white overflow-hidden relative flex flex-col items-center justify-center font-sans">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/30 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/30 rounded-full blur-[120px]" />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-linear-to-r from-white via-gray-200 to-gray-400">
            Sign in to your <br /> Workspace.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground/70 max-w-2xl mx-auto mb-10">
            Enter your work email to be redirected to your organization's login
            page.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="max-w-md mx-auto"
        >
          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute -inset-0.5 bg-linear-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-background rounded-lg p-1">
              <div className="pl-4 text-muted-foreground/70">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-transparent text-foreground placeholder-muted-foreground px-4 py-3 focus:outline-none"
                required
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-background text-black px-6 py-3 rounded-md font-medium hover:bg-muted transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 mt-4 text-sm"
            >
              {error}
            </motion.p>
          )}
        </motion.div>
      </div>

      <div className="absolute bottom-8 text-center text-muted-foreground text-sm">
        &copy; SecureLearning {new Date().getFullYear()}. All rights reserved.
      </div>
    </div>
  );
};
