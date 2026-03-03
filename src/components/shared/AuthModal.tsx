import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/hooks/useAuth";
import { GOOGLE_CLIENT_ID, APPLE_CLIENT_ID, APPLE_REDIRECT_URI } from "@/config/env";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { X, Loader2 } from "lucide-react";

// Apple Sign-In types
declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string;
          scope: string;
          redirectURI: string;
          usePopup: boolean;
        }) => void;
        signIn: () => Promise<{
          authorization: {
            code: string;
            id_token: string;
          };
          user?: {
            name?: { firstName?: string; lastName?: string };
            email?: string;
          };
        }>;
      };
    };
  }
}

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [loading, setLoading] = useState<"google" | "apple" | "paean" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [appleSdkLoaded, setAppleSdkLoaded] = useState(false);
  const { handleGoogleLogin, handleAppleLogin } = useAuth();

  // Load Apple Sign-In SDK
  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    if (window.AppleID) {
      setAppleSdkLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
    script.async = true;
    script.onload = () => setAppleSdkLoaded(true);
    script.onerror = () => console.error("Failed to load Apple Sign-In SDK");
    document.body.appendChild(script);
  }, [open]);

  // Initialize Apple Sign-In when SDK loaded
  useEffect(() => {
    if (!appleSdkLoaded || !window.AppleID) return;
    try {
      window.AppleID.auth.init({
        clientId: APPLE_CLIENT_ID,
        scope: "name email",
        redirectURI: APPLE_REDIRECT_URI,
        usePopup: true,
      });
    } catch (err) {
      console.error("Failed to init Apple Sign-In:", err);
    }
  }, [appleSdkLoaded]);

  const onGoogleSuccess = useCallback(
    async (credentialResponse: { credential?: string }) => {
      if (!credentialResponse.credential) {
        setError("Failed to get Google credentials");
        return;
      }
      setLoading("google");
      setError(null);
      try {
        await handleGoogleLogin(credentialResponse.credential);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Google Sign-In failed");
      } finally {
        setLoading(null);
      }
    },
    [handleGoogleLogin, onClose]
  );

  const onGoogleError = useCallback(() => {
    setError("Google Sign-In failed. Please try again.");
  }, []);

  const onAppleSignIn = useCallback(async () => {
    if (!window.AppleID) {
      setError("Apple Sign-In is not available.");
      return;
    }
    setLoading("apple");
    setError(null);
    try {
      const response = await window.AppleID.auth.signIn();
      if (response.authorization?.id_token) {
        await handleAppleLogin(
          response.authorization.code,
          response.authorization.id_token
        );
        onClose();
      } else {
        setError("Failed to get Apple identity token");
      }
    } catch (err: unknown) {
      if (err && typeof err === "object" && "error" in err) {
        const appleError = err as { error: string };
        if (appleError.error === "popup_closed_by_user") {
          // User cancelled, no error
          setLoading(null);
          return;
        }
        setError(appleError.error || "Apple Sign-In failed");
      } else {
        setError("Apple Sign-In failed. Please try again.");
      }
    } finally {
      setLoading(null);
    }
  }, [handleAppleLogin, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-sm",
          "border rounded-xl p-6 shadow-2xl animate-fade-in-up",
          "bg-neutral-900 border-neutral-800",
          "light:bg-white light:border-neutral-200"
        )}
      >
        <button
          onClick={onClose}
          className={cn(
            "absolute top-4 right-4 transition-fast",
            "text-neutral-500 hover:text-neutral-300",
            "light:hover:text-neutral-700"
          )}
        >
          <X size={18} />
        </button>

        <div className="text-center mb-6">
          <h2
            className={cn(
              "text-lg font-semibold",
              "text-neutral-100 light:text-neutral-900"
            )}
          >
            Sign in to AnyClaw
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Get a persistent key tied to your account
          </p>
        </div>

        {hint && (
          <div className="mb-4 p-3 rounded-lg bg-claw-500/10 border border-claw-500/20 text-xs text-claw-400">
            {hint}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error-400/10 border border-error-400/20 text-xs text-error-400">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {/* Google Sign-In */}
          {GOOGLE_CLIENT_ID ? (
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
              <div
                className={cn(
                  "w-full overflow-hidden rounded-lg",
                  "[&>div]:w-full [&>div>div]:w-full [&_iframe]:!w-full",
                  loading === "google" && "opacity-50 pointer-events-none"
                )}
              >
                <GoogleLogin
                  onSuccess={onGoogleSuccess}
                  onError={onGoogleError}
                  useOneTap={false}
                  theme="filled_black"
                  shape="rectangular"
                  size="large"
                  text="continue_with"
                  width="350"
                  logo_alignment="center"
                />
              </div>
            </GoogleOAuthProvider>
          ) : (
            <button
              disabled
              className={cn(
                "flex items-center justify-center gap-3",
                "w-full px-4 py-3 rounded-lg text-sm font-medium",
                "bg-neutral-800 text-neutral-500 border border-neutral-700",
                "opacity-50 cursor-not-allowed"
              )}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google (Not Configured)
            </button>
          )}

          {/* Apple Sign-In */}
          <button
            onClick={onAppleSignIn}
            disabled={loading === "apple" || !appleSdkLoaded}
            className={cn(
              "flex items-center justify-center gap-3",
              "w-full px-4 py-3 rounded-lg text-sm font-medium",
              "bg-neutral-800 text-neutral-100 border border-neutral-700",
              "hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed",
              "light:bg-neutral-900 light:text-white light:border-neutral-800",
              "light:hover:bg-neutral-800",
              "transition-fast"
            )}
          >
            {loading === "apple" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
            )}
            Continue with Apple
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="h-px flex-1 bg-neutral-800 light:bg-neutral-200" />
            <span className="text-xs text-neutral-600 light:text-neutral-400">or</span>
            <div className="h-px flex-1 bg-neutral-800 light:bg-neutral-200" />
          </div>

          {/* Paean Account — same as Google Sign-In (Paean accounts ARE Google/Apple OAuth) */}
          <button
            onClick={() => {
              setError(null);
              setHint("Please use Google or Apple above to sign in with your Paean account.");
            }}
            className={cn(
              "flex items-center justify-center gap-3",
              "w-full px-4 py-3 rounded-lg text-sm font-medium",
              "bg-claw-500/10 text-claw-400 border border-claw-500/20",
              "hover:bg-claw-500/20",
              "transition-fast"
            )}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-claw-400">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
            </svg>
            Paean Account
          </button>
        </div>

        <p
          className={cn(
            "text-center text-xs mt-4",
            "text-neutral-600 light:text-neutral-500"
          )}
        >
          Sign in to create persistent keys that survive across sessions.
        </p>
      </div>
    </div>
  );
}
