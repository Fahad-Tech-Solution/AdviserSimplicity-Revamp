import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";

const { persistAtom } = recoilPersist({
  key: "advisor-auth",
  storage: localStorage,
});

export const loggedInUser = atom({
  key: "loggedInUser",
  default: {
    token: "",
    email: "",
    user: null,
    permissions: [],
  },
  effects_UNSTABLE: [persistAtom],
});
