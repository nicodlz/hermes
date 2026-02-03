/**
 * Login Page - Magic Link Authentication
 */

import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Zap, Mail, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import { useAuth } from "../lib/auth";

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { requestMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // Check if redirected from needing signup
  const needsSignup = searchParams.get("signup") === "true";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await requestMagicLink(email);
      
      if (result.needsSignup) {
        // Redirect to signup with email pre-filled
        navigate(`/register?email=${encodeURIComponent(email)}`);
        return;
      }
      
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send magic link");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-10 h-10 text-amber-500" />
              <span className="text-3xl font-bold text-slate-900 dark:text-white">Hermes</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400">SDR Agent CRM</p>
          </div>

          {/* Success Message */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Check your email
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              We sent a magic link to <strong className="text-slate-700 dark:text-slate-300">{email}</strong>.
              Click the link in the email to sign in.
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              The link expires in 15 minutes.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="mt-6 text-sm text-blue-600 hover:text-blue-500"
            >
              Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-10 h-10 text-amber-500" />
            <span className="text-3xl font-bold text-slate-900 dark:text-white">Hermes</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400">SDR Agent CRM</p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Sign in to your account
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Enter your email and we'll send you a magic link to sign in.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {needsSignup && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">No account found. Please sign up first.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                "Sending..."
              ) : (
                <>
                  Send magic link
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-600 hover:text-blue-500 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
