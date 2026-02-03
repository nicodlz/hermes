/**
 * Magic Link Verification Page
 * 
 * Handles the callback from magic link emails.
 * Verifies the token and redirects to dashboard on success.
 */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Zap, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "../lib/auth";

export function VerifyMagicLink() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyMagicLink } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Invalid link - no token provided");
      return;
    }

    verifyMagicLink(token)
      .then(() => {
        setStatus("success");
        // Redirect to dashboard after short delay
        setTimeout(() => navigate("/"), 1500);
      })
      .catch((err) => {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Verification failed");
      });
  }, [token, verifyMagicLink, navigate]);

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

        {/* Status Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center">
          {status === "loading" && (
            <>
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Verifying...
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Please wait while we verify your magic link.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                You're in!
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Redirecting you to the dashboard...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Verification failed
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                {error}
              </p>
              <Link
                to="/login"
                className="inline-block py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
