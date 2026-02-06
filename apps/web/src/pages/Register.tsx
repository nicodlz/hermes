/**
 * Registration Page - Magic Link Signup
 */

import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Zap, Mail, User, Building, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import { useAuth } from "../lib/auth";

export function Register() {
  const [searchParams] = useSearchParams();
  const { requestMagicLink } = useAuth();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await requestMagicLink(email, name, orgName);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send magic link");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-background px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-10 h-10 text-amber-500" />
              <span className="text-3xl font-bold text-foreground dark:text-primary-foreground">Hermes</span>
            </div>
            <p className="text-slate-500 dark:text-muted-foreground">SDR Agent CRM</p>
          </div>

          {/* Success Message */}
          <div className="bg-card rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-600/20 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-foreground dark:text-primary-foreground mb-2">
              Check your email
            </h2>
            <p className="text-slate-500 dark:text-muted-foreground mb-6">
              We sent a confirmation link to <strong className="text-foreground dark:text-slate-300">{email}</strong>.
              Click the link to complete your registration.
            </p>
            <p className="text-sm text-muted-foreground dark:text-slate-500">
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
    <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-background px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-10 h-10 text-amber-500" />
            <span className="text-3xl font-bold text-foreground dark:text-primary-foreground">Hermes</span>
          </div>
          <p className="text-slate-500 dark:text-muted-foreground">SDR Agent CRM</p>
        </div>

        {/* Register Form */}
        <div className="bg-card rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-foreground dark:text-primary-foreground mb-2">
            Create your account
          </h2>
          <p className="text-slate-500 dark:text-muted-foreground text-sm mb-6">
            We'll send you a magic link to confirm your email.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 dark:bg-destructive/30 border border-destructive dark:border-red-800 flex items-center gap-2 text-destructive dark:text-destructive">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground dark:text-slate-300 mb-1">
                Your Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-border bg-card text-foreground dark:text-primary-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground dark:text-slate-300 mb-1">
                Organization Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-border bg-card text-foreground dark:text-primary-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Acme Inc."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground dark:text-slate-300 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-border bg-card text-foreground dark:text-primary-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded-lg bg-primary hover:bg-primary text-primary-foreground font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                "Sending..."
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
