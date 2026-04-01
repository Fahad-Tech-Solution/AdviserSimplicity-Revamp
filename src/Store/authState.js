import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const loggedInUser = atomWithStorage("loggedInUser", {
  token: "",
  email: "",
  user: null,
  permissions: [],
});

export const CDFProspectsData = atomWithStorage("CDFProspectsData", []);

export const userDashboardLoading = atom(false);
export const userDashboardError = atom(null);
