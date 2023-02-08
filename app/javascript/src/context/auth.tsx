import React, { createContext, useReducer } from "react";

import PropTypes from "prop-types";

import authReducer from "../reducers/auth";
import { getFromLocalStorage } from "utils/storage";

// @ts-ignore
const AuthStateContext = createContext(); // @ts-ignore
const AuthDispatchContext = createContext();

const token = getFromLocalStorage("authToken");
const email = getFromLocalStorage("authEmail");
console.log("token auth context", token)
const initialState = {
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

const useAuthState = () => {
  const context = React.useContext(AuthStateContext);
  if (context === undefined) {
    throw new Error("useAuthState must be used within a AuthProvider");
  }
  console.log("useAuthState context", context)

  return context;
};

const useAuthDispatch = () => {
  const context = React.useContext(AuthDispatchContext);
  if (context === undefined) {
    throw new Error("useAuthDispatch must be used within a AuthProvider");
  }

  return context;
};

const useAuth = () => [useAuthState(), useAuthDispatch()];

AuthProvider.propTypes = {
  children: PropTypes.node,
};

export { AuthProvider, useAuthState, useAuthDispatch, useAuth };
