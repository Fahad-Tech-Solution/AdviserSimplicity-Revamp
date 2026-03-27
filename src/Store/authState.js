import { atomWithStorage } from "jotai/utils";

export const loggedInUser = atomWithStorage("loggedInUser", {
    token: "",
    email: "",
    user: null,
    permissions: [],
});
