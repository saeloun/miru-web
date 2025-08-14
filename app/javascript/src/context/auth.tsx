import React, { createContext, useReducer, Dispatch } from "react";

import PropTypes from "prop-types";
import { getValueFromLocalStorage } from "utils/storage";

import authReducer, { AuthAction, AuthState } from "../reducers/auth";

const AuthStateContext = createContext<AuthState | undefined>(undefined);
const AuthDispatchContext = createContext<Dispatch<AuthAction> | undefined>(
  undefined
);

const token = getValueFromLocalStorage("authToken");
const email = getValueFromLocalStorage("authEmail");

const initialState: AuthState = {
  isLoggedIn: !!token,
  authToken: token || null,
  authEmail: email || null,
};

const AuthProvider = ({ children }) => {
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

AuthProvider.propTypes = {
  children: PropTypes.node,
};

export { AuthProvider, useAuthState, useAuthDispatch, useAuth };
