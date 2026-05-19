import React, { createContext, useReducer, Dispatch } from "react";

import { getStoredAuthCredentials } from "utils/authHeaders";

import authReducer, { AuthAction, AuthState } from "../reducers/auth";

const AuthStateContext = createContext<AuthState | undefined>(undefined);
const AuthDispatchContext = createContext<Dispatch<AuthAction> | undefined>(
  undefined
);

const credentials = getStoredAuthCredentials();

const initialState: AuthState = {
  isLoggedIn: Boolean(credentials),
  authToken: credentials?.token || null,
  authEmail: credentials?.email || null,
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  return (
    <AuthStateContext.Provider value={state}>
      <AuthDispatchContext.Provider value={dispatch}>
        {children}
      </AuthDispatchContext.Provider>
    </AuthStateContext.Provider>
  );
};

const useAuthState = (): AuthState => {
  const context = React.useContext(AuthStateContext);
  if (context === undefined) {
    throw new Error("useAuthState must be used within a AuthProvider");
  }

  return context;
};

const useAuthDispatch = (): Dispatch<AuthAction> => {
  const context = React.useContext(AuthDispatchContext);
  if (context === undefined) {
    throw new Error("useAuthDispatch must be used within a AuthProvider");
  }

  return context;
};

const useAuth = (): [AuthState, Dispatch<AuthAction>] => [
  useAuthState(),
  useAuthDispatch(),
];

export { AuthProvider, useAuthState, useAuthDispatch, useAuth };
