import { useCallback } from "react";
import { useApp } from "@/contexts/AppContext";
import {
  loginWithGoogle,
  loginWithApple,
  createPersistentKey,
  listKeys,
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

  const handleGoogleLogin = useCallback(
    async (credential: string) => {
      const { token, user: userData } = await loginWithGoogle(credential);
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

  const handleAppleLogin = useCallback(
    async (authorizationCode: string, identityToken: string) => {
      const { token, user: userData } = await loginWithApple(
        authorizationCode,
        identityToken
      );
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
    logout,
  };
}
