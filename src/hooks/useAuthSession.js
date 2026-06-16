import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { App as AntdApp } from "antd";
import { useSetAtom } from "jotai";
import useApi from "./useApi";
import { loggedInUser } from "../store/authState";
import {
  EMPTY_SESSION,
  normalizeSessionFromApi,
} from "../utils/authSession";

/*
 * Validates the HttpOnly cookie session with the backend and syncs user state.
 */

export default function useAuthSession() {
  const api = useApi();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const setLoggedInUser = useSetAtom(loggedInUser);

  const fetchSession = useCallback(async () => {
    try {
      const res = await api.get("/api/auth/me");
      const session = normalizeSessionFromApi(res);
      setLoggedInUser(session);
      return { ok: true, session };
    } catch (error) {
      setLoggedInUser(EMPTY_SESSION);
      return { ok: false, error };
    }
  }, [api, setLoggedInUser]);

  const clearSession = useCallback(() => {
    setLoggedInUser(EMPTY_SESSION);
  }, [setLoggedInUser]);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // Still clear local state if logout API fails.
    } finally {
      clearSession();
      navigate("/auth/login", { replace: true });
      message.success("Logged out successfully");
    }
  }, [api, clearSession, navigate, message]);

  const saveSessionFromAuthResponse = useCallback(
    (res, fallbackEmail = "") => {
      const session = normalizeSessionFromApi(res, fallbackEmail);
      setLoggedInUser(session);
      return session;
    },
    [setLoggedInUser],
  );

  return {
    fetchSession,
    clearSession,
    logout,
    saveSessionFromAuthResponse,
  };
}
