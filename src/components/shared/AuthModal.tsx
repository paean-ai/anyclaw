import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/hooks/useAuth";
import { GOOGLE_CLIENT_ID, APPLE_CLIENT_ID, APPLE_REDIRECT_URI } from "@/config/env";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { sendRegistrationCode, sendPasswordResetCode, resetPassword, sendSmsLoginCode } from "@/lib/api";
import { COUNTRY_CODES, getDefaultCountry, type CountryCode } from "@/lib/countries";
import QRCode from "qrcode";
import {
  X,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  QrCode,
  ChevronDown,
  Check,
  RefreshCw,
  Smartphone,
  User,
  Hash,
  ArrowLeft,
} from "lucide-react";

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
          authorization: { code: string; id_token: string };
          user?: { name?: { firstName?: string; lastName?: string }; email?: string };
        }>;
      };
    };
  }
}

type View = "login" | "register" | "forgot-password";
type LoginTab = "email" | "phone" | "qr";
type RegisterStep = "form" | "verify";
type QrStatus = "loading" | "pending" | "scanned" | "confirmed" | "expired" | "error";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

// ── Shared styles ────────────────────────────────────────────────────────────

const inputCls = cn(
  "w-full px-3 py-2.5 rounded-lg text-sm",
  "bg-neutral-800 border border-neutral-700 text-neutral-100",
  "placeholder:text-neutral-500",
  "focus:outline-none focus:border-claw-500/50",
  "light:bg-white light:border-neutral-300 light:text-neutral-900",
  "light:placeholder:text-neutral-400",
  "transition-fast"
);

const primaryBtnCls = cn(
  "w-full py-2.5 rounded-lg text-sm font-medium",
  "bg-claw-500/20 text-claw-400 border border-claw-500/30",
  "hover:bg-claw-500/30 disabled:opacity-40",
  "flex items-center justify-center gap-2",
  "transition-fast"
);

const secondaryBtnCls = cn(
  "flex items-center justify-center gap-2",
  "w-full px-4 py-2.5 rounded-lg text-sm font-medium",
  "bg-neutral-800 text-neutral-100 border border-neutral-700",
  "hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed",
  "light:bg-neutral-100 light:text-neutral-900 light:border-neutral-300",
  "light:hover:bg-neutral-200",
  "transition-fast"
);

// ── Main Component ───────────────────────────────────────────────────────────

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [view, setView] = useState<View>("login");
  const [error, setError] = useState<string | null>(null);
  const [appleSdkLoaded, setAppleSdkLoaded] = useState(false);

  const {
    handleGoogleLogin,
    handleAppleLogin,
    handleEmailLogin,
    handleSmsLogin,
    handleRegister,
    handleQrConfirmed,
    createQrSession,
    getQrStatus,
  } = useAuth();

  useEffect(() => {
    if (!open) {
      setView("login");
      setError(null);
    }
  }, [open]);

  // Load Apple Sign-In SDK
  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    if (window.AppleID) { setAppleSdkLoaded(true); return; }
    const script = document.createElement("script");
    script.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
    script.async = true;
    script.onload = () => setAppleSdkLoaded(true);
    document.body.appendChild(script);
  }, [open]);

  useEffect(() => {
    if (!appleSdkLoaded || !window.AppleID) return;
    try {
      window.AppleID.auth.init({
        clientId: APPLE_CLIENT_ID,
        scope: "name email",
        redirectURI: APPLE_REDIRECT_URI,
        usePopup: true,
      });
    } catch { /* ignore */ }
  }, [appleSdkLoaded]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 w-full max-w-sm max-h-[90vh] overflow-y-auto",
          "border rounded-xl p-6 shadow-2xl",
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

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error-400/10 border border-error-400/20 text-xs text-error-400">
            {error}
          </div>
        )}

        {view === "login" && (
          <LoginView
            setError={setError}
            onClose={onClose}
            onSwitchToRegister={() => { setView("register"); setError(null); }}
            onForgotPassword={() => { setView("forgot-password"); setError(null); }}
            handleGoogleLogin={handleGoogleLogin}
            handleAppleLogin={handleAppleLogin}
            handleEmailLogin={handleEmailLogin}
            handleSmsLogin={handleSmsLogin}
            handleQrConfirmed={handleQrConfirmed}
            createQrSession={createQrSession}
            getQrStatus={getQrStatus}
            appleSdkLoaded={appleSdkLoaded}
          />
        )}

        {view === "register" && (
          <RegisterView
            setError={setError}
            onClose={onClose}
            onSwitchToLogin={() => { setView("login"); setError(null); }}
            handleRegister={handleRegister}
          />
        )}

        {view === "forgot-password" && (
          <ForgotPasswordView
            setError={setError}
            onBack={() => { setView("login"); setError(null); }}
          />
        )}
      </div>
    </div>
  );
}

// ── Login View ───────────────────────────────────────────────────────────────

function LoginView({
  setError,
  onClose,
  onSwitchToRegister,
  onForgotPassword,
  handleGoogleLogin,
  handleAppleLogin,
  handleEmailLogin,
  handleSmsLogin,
  handleQrConfirmed,
  createQrSession: createQr,
  getQrStatus: getQr,
  appleSdkLoaded,
}: {
  setError: (e: string | null) => void;
  onClose: () => void;
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
  handleGoogleLogin: (credential: string) => Promise<void>;
  handleAppleLogin: (code: string, token: string) => Promise<void>;
  handleEmailLogin: (email: string, password: string) => Promise<void>;
  handleSmsLogin: (phone: string, code: string) => Promise<void>;
  handleQrConfirmed: (token: string) => Promise<void>;
  createQrSession: () => Promise<{ sessionId: string; qrContent: string }>;
  getQrStatus: (id: string) => Promise<{ status: string; token?: string }>;
  appleSdkLoaded: boolean;
}) {
  const [tab, setTab] = useState<LoginTab>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(getDefaultCountry);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [loading, setLoading] = useState(false);

  // QR state
  const [qrStatus, setQrStatus] = useState<QrStatus>("loading");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredCountries = countrySearch
    ? COUNTRY_CODES.filter(
        (c) =>
          c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
          c.dialCode.includes(countrySearch) ||
          c.code.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : COUNTRY_CODES;

  // QR logic
  const startQrSession = useCallback(async () => {
    setQrStatus("loading");
    if (pollingRef.current) clearTimeout(pollingRef.current);
    try {
      const { sessionId, qrContent } = await createQr();
      const url = await QRCode.toDataURL(qrContent, { width: 200, margin: 2, color: { dark: "#000000", light: "#ffffff" } });
      setQrDataUrl(url);
      setQrStatus("pending");

      const maxPollTime = 5 * 60 * 1000;
      const startTime = Date.now();
      const poll = async () => {
        if (Date.now() - startTime > maxPollTime) { setQrStatus("expired"); return; }
        try {
          const res = await getQr(sessionId);
          if (res.status === "scanned") setQrStatus("scanned");
          else if (res.status === "confirmed" && res.token) {
            setQrStatus("confirmed");
            await handleQrConfirmed(res.token);
            onClose();
            return;
          } else if (res.status === "expired" || res.status === "used") { setQrStatus("expired"); return; }
          pollingRef.current = setTimeout(poll, 2000);
        } catch {
          pollingRef.current = setTimeout(poll, 2000);
        }
      };
      poll();
    } catch {
      setQrStatus("error");
    }
  }, [createQr, getQr, handleQrConfirmed, onClose]);

  useEffect(() => {
    if (tab === "qr") startQrSession();
    return () => { if (pollingRef.current) clearTimeout(pollingRef.current); };
  }, [tab]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      await handleEmailLogin(email.trim(), password);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendSms = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await sendSmsLoginCode(`+${selectedCountry.dialCode}${phone.replace(/\D/g, "")}`, selectedCountry.dialCode);
      setSmsSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsSent) { handleSendSms(); return; }
    if (!smsCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await handleSmsLogin(`+${selectedCountry.dialCode}${phone.replace(/\D/g, "")}`, smsCode.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSuccess = async (cred: { credential?: string }) => {
    if (!cred.credential) { setError("Failed to get Google credentials"); return; }
    setLoading(true);
    setError(null);
    try { await handleGoogleLogin(cred.credential); onClose(); }
    catch (err) { setError(err instanceof Error ? err.message : "Google Sign-In failed"); }
    finally { setLoading(false); }
  };

  const onAppleSignIn = async () => {
    if (!window.AppleID) { setError("Apple Sign-In is not available."); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await window.AppleID.auth.signIn();
      if (res.authorization?.id_token) {
        await handleAppleLogin(res.authorization.code, res.authorization.id_token);
        onClose();
      } else { setError("Failed to get Apple identity token"); }
    } catch (err: unknown) {
      if (err && typeof err === "object" && "error" in err) {
        const ae = err as { error: string };
        if (ae.error === "popup_closed_by_user") { setLoading(false); return; }
        setError(ae.error || "Apple Sign-In failed");
      } else { setError("Apple Sign-In failed"); }
    } finally { setLoading(false); }
  };

  return (
    <>
      <div className="text-center mb-5">
        <h2 className={cn("text-lg font-semibold", "text-neutral-100 light:text-neutral-900")}>
          Sign in to AnyClaw
        </h2>
        <p className="text-sm text-neutral-500 mt-1">Access your account</p>
      </div>

      {/* Tabs */}
      <div className={cn("flex items-center gap-1 p-1 rounded-lg mb-5", "bg-neutral-800/50 light:bg-neutral-100")}>
        {(["email", "phone", "qr"] as LoginTab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(null); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-fast",
              tab === t
                ? "bg-neutral-700 text-neutral-100 light:bg-white light:text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-300 light:hover:text-neutral-700"
            )}
          >
            {t === "email" && <Mail size={13} />}
            {t === "phone" && <Phone size={13} />}
            {t === "qr" && <QrCode size={13} />}
            {t === "email" ? "Email" : t === "phone" ? "Phone" : "QR"}
          </button>
        ))}
      </div>

      {/* Email Tab */}
      {tab === "email" && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 light:text-neutral-600 mb-1.5">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={cn(inputCls, "pl-9")}
                required
                autoComplete="email"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-neutral-400 light:text-neutral-600">Password</label>
              <button type="button" onClick={onForgotPassword} className="text-xs text-claw-400 hover:text-claw-300 transition-fast">
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={cn(inputCls, "pl-9 pr-9")}
                required
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-fast">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className={primaryBtnCls}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            Sign In
          </button>
        </form>
      )}

      {/* Phone Tab */}
      {tab === "phone" && (
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 light:text-neutral-600 mb-1.5">Phone Number</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCountryPicker(true)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-2.5 rounded-lg text-sm shrink-0",
                  "bg-neutral-800 border border-neutral-700 text-neutral-100",
                  "light:bg-white light:border-neutral-300 light:text-neutral-900",
                  "hover:border-neutral-600 transition-fast"
                )}
              >
                <span className="text-base">{selectedCountry.flag}</span>
                <span className="text-xs">+{selectedCountry.dialCode}</span>
                <ChevronDown size={12} className="text-neutral-500" />
              </button>
              <div className="relative flex-1">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="Phone number"
                  className={cn(inputCls, "pl-9")}
                  required
                />
              </div>
            </div>
          </div>

          {smsSent && (
            <div>
              <label className="block text-xs font-medium text-neutral-400 light:text-neutral-600 mb-1.5">Verification Code</label>
              <div className="relative">
                <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value)}
                  placeholder="000000"
                  className={cn(inputCls, "pl-9 text-center tracking-widest font-mono")}
                  maxLength={6}
                  autoFocus
                />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className={primaryBtnCls}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            {smsSent ? "Sign In" : "Send Code"}
          </button>
        </form>
      )}

      {/* QR Tab */}
      {tab === "qr" && (
        <div className="flex flex-col items-center py-2">
          <div className={cn("relative w-44 h-44 rounded-xl p-3 mb-4", "bg-white")}>
            {qrStatus === "loading" ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-neutral-400" />
              </div>
            ) : qrStatus === "expired" || qrStatus === "error" ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <RefreshCw size={28} className="text-neutral-400" />
                <button onClick={startQrSession} className="text-xs text-claw-500 hover:text-claw-400 font-medium">
                  Click to refresh
                </button>
              </div>
            ) : (
              <>
                {qrDataUrl && <img src={qrDataUrl} alt="QR Code" className="w-full h-full rounded" />}
                {qrStatus === "scanned" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-xl">
                    <div className="flex flex-col items-center gap-1.5">
                      <Smartphone size={24} className="text-green-600" />
                      <span className="text-xs font-medium text-green-600">Confirm on device</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <p className={cn("text-sm font-medium", "text-neutral-200 light:text-neutral-800")}>
            {qrStatus === "scanned" ? "Scanned! Confirm on your device" : "Scan with Paean mobile app"}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            {qrStatus === "expired" ? "QR code expired" : "Open Paean app and scan to sign in"}
          </p>
        </div>
      )}

      {/* Social login + divider (not in QR tab) */}
      {tab !== "qr" && (
        <>
          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-neutral-800 light:bg-neutral-200" />
            <span className="text-xs text-neutral-600 light:text-neutral-400">or</span>
            <div className="h-px flex-1 bg-neutral-800 light:bg-neutral-200" />
          </div>

          <div className="space-y-2.5">
            {/* Google */}
            {GOOGLE_CLIENT_ID ? (
              <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <div className={cn("w-full overflow-hidden rounded-lg", "[&>div]:w-full [&>div>div]:w-full [&_iframe]:!w-full", loading && "opacity-50 pointer-events-none")}>
                  <GoogleLogin onSuccess={onGoogleSuccess} onError={() => setError("Google Sign-In failed.")} useOneTap={false} theme="filled_black" shape="rectangular" size="large" text="continue_with" width="350" logo_alignment="center" />
                </div>
              </GoogleOAuthProvider>
            ) : null}

            {/* Apple */}
            <button onClick={onAppleSignIn} disabled={loading || !appleSdkLoaded} className={secondaryBtnCls}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              )}
              Continue with Apple
            </button>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="mt-5 text-center">
        <p className="text-xs text-neutral-500">
          Don&apos;t have an account?{" "}
          <button onClick={onSwitchToRegister} className="text-claw-400 hover:text-claw-300 font-medium transition-fast">
            Sign Up
          </button>
        </p>
      </div>

      {/* Country Picker Overlay */}
      {showCountryPicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70" onClick={() => setShowCountryPicker(false)}>
          <div
            className={cn("w-full max-w-xs max-h-[60vh] rounded-xl overflow-hidden", "bg-neutral-900 border border-neutral-700", "light:bg-white light:border-neutral-200")}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-neutral-700 light:border-neutral-200">
              <input
                type="text"
                placeholder="Search country..."
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                className={inputCls}
                autoFocus
              />
            </div>
            <div className="overflow-y-auto max-h-[45vh]">
              {filteredCountries.map((c) => (
                <button
                  key={c.code}
                  onClick={() => { setSelectedCountry(c); setShowCountryPicker(false); setCountrySearch(""); }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-fast",
                    "hover:bg-neutral-800 light:hover:bg-neutral-100",
                    selectedCountry.code === c.code && "bg-neutral-800 light:bg-neutral-100"
                  )}
                >
                  <span className="text-lg">{c.flag}</span>
                  <span className="flex-1 text-left text-neutral-200 light:text-neutral-800">{c.name}</span>
                  <span className="text-neutral-500 text-xs">+{c.dialCode}</span>
                  {selectedCountry.code === c.code && <Check size={14} className="text-claw-400" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Register View ────────────────────────────────────────────────────────────

function RegisterView({
  setError,
  onClose,
  onSwitchToLogin,
  handleRegister,
}: {
  setError: (e: string | null) => void;
  onClose: () => void;
  onSwitchToLogin: () => void;
  handleRegister: (data: {
    username: string;
    email: string;
    password: string;
    displayName: string;
    verificationCode: string;
  }) => Promise<void>;
}) {
  const [step, setStep] = useState<RegisterStep>("form");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!username || !displayName || !email || !password) {
      setError("Please fill in all fields"); return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters"); return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendRegistrationCode(email);
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "form") { handleSendCode(); return; }
    if (!verificationCode) { setError("Enter the verification code"); return; }
    setLoading(true);
    setError(null);
    try {
      await handleRegister({ username, email, password, displayName, verificationCode });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-5">
        <h2 className={cn("text-lg font-semibold", "text-neutral-100 light:text-neutral-900")}>
          Create Account
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          {step === "form" ? "Sign up for AnyClaw" : "Check your email for the code"}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-5">
        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium", step === "form" ? "bg-claw-500/20 text-claw-400 border border-claw-500/30" : "bg-claw-500/20 text-claw-400")}>
          {step === "verify" ? <Check size={12} /> : "1"}
        </div>
        <div className={cn("w-8 h-0.5 rounded-full", step === "verify" ? "bg-claw-500/40" : "bg-neutral-700 light:bg-neutral-300")} />
        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium", step === "verify" ? "bg-claw-500/20 text-claw-400 border border-claw-500/30" : "bg-neutral-800 text-neutral-500 light:bg-neutral-200")}>
          2
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {step === "form" ? (
          <>
            <div>
              <label className="block text-xs font-medium text-neutral-400 light:text-neutral-600 mb-1.5">Username</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="johndoe" className={cn(inputCls, "pl-9")} required autoCapitalize="none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 light:text-neutral-600 mb-1.5">Display Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="John Doe" className={cn(inputCls, "pl-9")} required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 light:text-neutral-600 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={cn(inputCls, "pl-9")} required autoComplete="email" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 light:text-neutral-600 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={cn(inputCls, "pl-9")} required minLength={8} />
              </div>
              <p className="mt-1 text-[10px] text-neutral-600">At least 8 characters</p>
            </div>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setStep("form")} className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-fast mb-2">
              <ArrowLeft size={13} /> Back
            </button>
            <div className={cn("p-3 rounded-lg text-xs", "bg-claw-500/10 border border-claw-500/20 text-claw-400")}>
              Code sent to <span className="font-medium">{email}</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 light:text-neutral-600 mb-1.5">Verification Code</label>
              <div className="relative">
                <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="000000" className={cn(inputCls, "pl-9 text-center tracking-widest font-mono")} maxLength={6} autoFocus />
              </div>
            </div>
          </>
        )}

        <button type="submit" disabled={loading} className={cn(primaryBtnCls, "mt-1")}>
          {loading ? <Loader2 size={15} className="animate-spin" /> : null}
          {step === "form" ? "Continue" : "Create Account"}
        </button>
      </form>

      <div className="mt-5 text-center">
        <p className="text-xs text-neutral-500">
          Already have an account?{" "}
          <button onClick={onSwitchToLogin} className="text-claw-400 hover:text-claw-300 font-medium transition-fast">
            Sign In
          </button>
        </p>
      </div>
    </>
  );
}

// ── Forgot Password View ─────────────────────────────────────────────────────

function ForgotPasswordView({
  setError,
  onBack,
}: {
  setError: (e: string | null) => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState<"email" | "code" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetCode(email.trim());
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !newPassword) return;
    if (newPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    setError(null);
    try {
      await resetPassword(email.trim(), code.trim(), newPassword);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-fast mb-4">
        <ArrowLeft size={13} /> Back to Sign In
      </button>

      <div className="mb-5">
        <h2 className={cn("text-lg font-semibold", "text-neutral-100 light:text-neutral-900")}>
          {step === "done" ? "Password Reset" : "Forgot Password"}
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          {step === "email" && "Enter your email to receive a reset code"}
          {step === "code" && "Enter the code and your new password"}
          {step === "done" && "Your password has been reset successfully"}
        </p>
      </div>

      {step === "email" && (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 light:text-neutral-600 mb-1.5">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={cn(inputCls, "pl-9")} required autoFocus />
            </div>
          </div>
          <button type="submit" disabled={loading} className={primaryBtnCls}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            Send Reset Code
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={handleReset} className="space-y-4">
          <div className={cn("p-3 rounded-lg text-xs", "bg-claw-500/10 border border-claw-500/20 text-claw-400")}>
            Code sent to <span className="font-medium">{email}</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 light:text-neutral-600 mb-1.5">Reset Code</label>
            <div className="relative">
              <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" className={cn(inputCls, "pl-9 text-center tracking-widest font-mono")} maxLength={6} autoFocus />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 light:text-neutral-600 mb-1.5">New Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className={cn(inputCls, "pl-9")} required minLength={8} />
            </div>
          </div>
          <button type="submit" disabled={loading} className={primaryBtnCls}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            Reset Password
          </button>
        </form>
      )}

      {step === "done" && (
        <div className="text-center py-4">
          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3", "bg-claw-500/10 border border-claw-500/20")}>
            <Check size={20} className="text-claw-400" />
          </div>
          <button onClick={onBack} className={cn(primaryBtnCls, "mt-4")}>
            Back to Sign In
          </button>
        </div>
      )}
    </>
  );
}
