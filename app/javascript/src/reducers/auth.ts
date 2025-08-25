import { setToLocalStorage } from "utils/storage";

export interface AuthState {
  isLoggedIn: boolean;
  authToken: string | null;
  authEmail: string | null;
}

export type AuthAction =
  | { type: "LOGIN"; payload: { token: string; email: string } }
  | { type: "LOGOUT" };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOGIN": {
      setToLocalStorage("authToken", action.payload.token);
      setToLocalStorage("authEmail", action.payload.email);

      return {
        isLoggedIn: true,
        authToken: action.payload.token,
        authEmail: action.payload.email,
      };
    }
    case "LOGOUT": {
      setToLocalStorage("authToken", null);
      setToLocalStorage("authEmail", null);

      return { isLoggedIn: false, authToken: null, authEmail: null };
    }
    default: {
      const _exhaustive: never = action;
      throw new Error(`Unhandled action type`);
    }
  }
};

export default authReducer;
