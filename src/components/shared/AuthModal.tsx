import { useState } from "react";
import { cn } from "@/lib/cn";
import { X, Chrome, Loader2 } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      // Production flow uses Google Identity Services SDK.
      // Configure VITE_GOOGLE_CLIENT_ID, then:
      //   const { token, user } = await loginWithGoogle(credential);
      //   setAuthToken(token); setUser(user);
      //   const keyInfo = await createPersistentKey(token);
      //   setClawKey(keyInfo.key); setKeyInfo(keyInfo);
      //   onClose();
      setError(
        "Google Sign-In requires the Google Identity Services SDK. " +
        "Set VITE_GOOGLE_CLIENT_ID in your environment."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-sm mx-4",
          "bg-neutral-900 border border-neutral-800 rounded-xl",
          "p-6 shadow-2xl animate-fade-in-up"
        )}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-300 transition-fast"
        >
          <X size={18} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold text-neutral-100">
            Sign in to AnyClaw
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Get a persistent key tied to your account
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error-400/10 border border-error-400/20 text-xs text-error-400">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className={cn(
              "flex items-center justify-center gap-3",
              "w-full px-4 py-3 rounded-lg text-sm font-medium",
              "bg-white text-neutral-900",
              "hover:bg-neutral-100 disabled:opacity-50",
              "transition-fast"
            )}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Chrome size={16} />
            )}
            Continue with Google
          </button>

          <button
            disabled
            className={cn(
              "flex items-center justify-center gap-3",
              "w-full px-4 py-3 rounded-lg text-sm font-medium",
              "bg-neutral-800 text-neutral-400 border border-neutral-700",
              "opacity-50 cursor-not-allowed"
            )}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Continue with Apple
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="h-px flex-1 bg-neutral-800" />
            <span className="text-xs text-neutral-600">or</span>
            <div className="h-px flex-1 bg-neutral-800" />
          </div>

          <button
            disabled
            className={cn(
              "flex items-center justify-center gap-3",
              "w-full px-4 py-3 rounded-lg text-sm font-medium",
              "bg-claw-500/10 text-claw-400 border border-claw-500/20",
              "opacity-50 cursor-not-allowed"
            )}
          >
            Paean Account
          </button>
        </div>

        <p className="text-center text-xs text-neutral-600 mt-4">
          Sign in to create persistent keys that survive across sessions.
        </p>
      </div>
    </div>
  );
}
