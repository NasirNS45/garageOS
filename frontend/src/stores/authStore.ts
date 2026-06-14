import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  userId: string | null;
  role: string | null;
  workshopId: string | null;
  workshopName: string | null;
  setTokens: (access: string, refresh: string) => void;
  setWorkshopName: (name: string) => void;
  logout: () => void;
}

function parseClaims(token: string): { user_id: string; role: string; workshop_id: string } | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      user_id: payload.sub,
      role: payload.role,
      workshop_id: payload.workshop_id,
    };
  } catch {
    return null;
  }
}

/** Read initial auth state synchronously so the first render is already hydrated. */
function initialState() {
  const access = localStorage.getItem("access_token");
  const name = sessionStorage.getItem("workshop_name");
  const claims = access ? parseClaims(access) : null;
  return {
    accessToken: access,
    userId: claims?.user_id ?? null,
    role: claims?.role ?? null,
    workshopId: claims?.workshop_id ?? null,
    workshopName: name,
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState(),

  setTokens: (access, refresh) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    const claims = parseClaims(access);
    set({
      accessToken: access,
      userId: claims?.user_id ?? null,
      role: claims?.role ?? null,
      workshopId: claims?.workshop_id ?? null,
    });
  },

  setWorkshopName: (name) => {
    sessionStorage.setItem("workshop_name", name);
    set({ workshopName: name });
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    sessionStorage.removeItem("workshop_name");
    set({
      accessToken: null,
      userId: null,
      role: null,
      workshopId: null,
      workshopName: null,
    });
  },
}));
