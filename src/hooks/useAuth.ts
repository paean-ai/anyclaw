import { useCallback } from "react";
import { useApp } from "@/contexts/AppContext";
import {
  loginWithGoogle,
  loginWithApple,
  loginWithEmail,
  loginWithSms,
  registerAccount,
  createPersistentKey,
  listKeys,
  createQrSession,
  getQrStatus,
  decodeJwtUser,
  type AuthResponse,
} from "@/lib/api";

export function useAuth() {
  const {
    authToken,
    setAuthToken,
    setUser,
    setClawKey,
    setKeyInfo,
    user,
  } = useApp();

  const handleLoginSuccess = useCallback(
    async ({ token, user: userData }: AuthResponse) => {
      setAuthToken(token);
      setUser(userData);

      const keys = await listKeys(token);
      if (keys.length > 0) {
        setClawKey(keys[0].key);
        setKeyInfo(keys[0]);
      } else {
        const newKey = await createPersistentKey(token, "AnyClaw Key");
        setClawKey(newKey.key);
        setKeyInfo(newKey);
      }
    },
    [setAuthToken, setUser, setClawKey, setKeyInfo]
  );

  const handleGoogleLogin = useCallback(
    async (credential: string) => {
      const result = await loginWithGoogle(credential);
      await handleLoginSuccess(result);
    },
    [handleLoginSuccess]
  );

  const handleAppleLogin = useCallback(
    async (authorizationCode: string, identityToken: string) => {
      const result = await loginWithApple(authorizationCode, identityToken);
      await handleLoginSuccess(result);
    },
    [handleLoginSuccess]
  );

  const handleEmailLogin = useCallback(
    async (email: string, password: string) => {
      const result = await loginWithEmail(email, password);
      await handleLoginSuccess(result);
    },
    [handleLoginSuccess]
  );

  const handleSmsLogin = useCallback(
    async (phone: string, code: string) => {
      const result = await loginWithSms(phone, code);
      await handleLoginSuccess(result);
    },
    [handleLoginSuccess]
  );

  const handleRegister = useCallback(
    async (data: {
      username: string;
      email: string;
      password: string;
      displayName: string;
      verificationCode: string;
    }) => {
      const result = await registerAccount(data);
      await handleLoginSuccess(result);
    },
    [handleLoginSuccess]
  );

  const handleQrConfirmed = useCallback(
    async (token: string) => {
      const userData = decodeJwtUser(token);
      await handleLoginSuccess({ token, user: userData });
    },
    [handleLoginSuccess]
  );

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    setClawKey(null);
    setKeyInfo(null);
  }, [setAuthToken, setUser, setClawKey, setKeyInfo]);

  return {
    user,
    authToken,
    isAuthenticated: !!authToken && !!user,
    handleGoogleLogin,
    handleAppleLogin,
    handleEmailLogin,
    handleSmsLogin,
    handleRegister,
    handleQrConfirmed,
    createQrSession,
    getQrStatus,
    logout,
  };
}
