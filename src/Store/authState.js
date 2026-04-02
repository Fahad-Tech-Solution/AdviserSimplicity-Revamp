import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const loggedInUser = atomWithStorage("loggedInUser", {
  token: "",
  email: "",
  user: null,
  permissions: [],
});

export const CDFProspectsData = atomWithStorage("CDFProspectsData", []);
export const MyClientsData = atomWithStorage("MyClientsData", { clients: [] });

/** Team / employees list from GET /api/user/Employees (bootstrap). */
export const MyTeamData = atomWithStorage("MyTeamData", []);

/** Currently selected household row from My Clients (set when user chooses Select). */
export const SelectedClient = atom(null);

export const userDashboardLoading = atom(false);
export const userDashboardError = atom(null);
