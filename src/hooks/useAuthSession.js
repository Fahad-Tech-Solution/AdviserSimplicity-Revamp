import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { App as AntdApp } from "antd";
import { useAtomValue, useSetAtom } from "jotai";
import useApi from "./useApi";
import {
  addDiscoverySectionsModalOpen,
  advisersDataAtom,
  catalogsDataAtom,
  CDFProspectsData,
  creatingNewClientAtom,
  discoveryDataAtom,
  discoverySectionQuestionsAtom,
  goalsDataAtom,
  goalsSectionQuestionsAtom,
  InvestmentOffersData,
  loggedInUser,
  MyClientsData,
  MyTeamData,
  riskProfileDataAtom,
  SelectedClient,
  userDashboardError,
  userDashboardLoading,
} from "../store/authState";
import {
  EMPTY_SESSION,
  getLoginPathForSession,
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
  const resetLoggedInUser = useSetAtom(loggedInUser);
  const resetCDFProspectsData = useSetAtom(CDFProspectsData);
  const resetMyClientsData = useSetAtom(MyClientsData);
  const resetMyTeamData = useSetAtom(MyTeamData);
  const resetInvestmentOffersData = useSetAtom(InvestmentOffersData);
  const resetSelectedClient = useSetAtom(SelectedClient);
  const resetDiscoveryData = useSetAtom(discoveryDataAtom);
  const resetDiscoverySectionQuestions = useSetAtom(
    discoverySectionQuestionsAtom,
  );
  const resetGoalsData = useSetAtom(goalsDataAtom);
  const resetGoalsSectionQuestions = useSetAtom(goalsSectionQuestionsAtom);
  const resetRiskProfileData = useSetAtom(riskProfileDataAtom);
  const resetCreatingNewClient = useSetAtom(creatingNewClientAtom);
  const resetDiscoverySectionsModal = useSetAtom(addDiscoverySectionsModalOpen);
  const resetAdvisersData = useSetAtom(advisersDataAtom);
  const resetCatalogsData = useSetAtom(catalogsDataAtom);
  const resetDashboardLoading = useSetAtom(userDashboardLoading);
  const resetDashboardError = useSetAtom(userDashboardError);
  const LoggedInUser = useAtomValue(loggedInUser);

  const fetchSession = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
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
    resetLoggedInUser();
    resetCDFProspectsData();
    resetMyClientsData();
    resetMyTeamData();
    resetInvestmentOffersData();
    resetSelectedClient();
    resetDiscoveryData();
    resetDiscoverySectionQuestions();
    resetGoalsData();
    resetGoalsSectionQuestions();
    resetRiskProfileData();
    resetCreatingNewClient();
    resetDiscoverySectionsModal();
    resetAdvisersData();
    resetCatalogsData();
    resetDashboardLoading();
    resetDashboardError();
  }, [
    resetAdvisersData,
    resetCatalogsData,
    resetCDFProspectsData,
    resetCreatingNewClient,
    resetDashboardError,
    resetDashboardLoading,
    resetDiscoveryData,
    resetDiscoverySectionQuestions,
    resetDiscoverySectionsModal,
    resetGoalsData,
    resetGoalsSectionQuestions,
    resetInvestmentOffersData,
    resetLoggedInUser,
    resetMyClientsData,
    resetMyTeamData,
    resetRiskProfileData,
    resetSelectedClient,
    setLoggedInUser,
  ]);

  const logout = useCallback(
    async (redirectPathOverride = null) => {
      const resolvedRedirectPath = redirectPathOverride
        ? redirectPathOverride
        : getLoginPathForSession(LoggedInUser);

      try {
        await api.post("/auth/logout");
      } catch {
        // Still clear local state if logout API fails.
      } finally {
        clearSession();
        navigate(resolvedRedirectPath, { replace: true });
        message.success("Logged out successfully");
      }
    },
    [api, clearSession, navigate, message, LoggedInUser],
  );

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
