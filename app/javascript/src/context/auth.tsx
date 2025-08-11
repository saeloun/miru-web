import React, { createContext, useReducer } from "react";

import PropTypes from "prop-types";
import { getValueFromLocalStorage } from "utils/storage";

import authReducer from "../reducers/auth";

const AuthStateContext = createContext({});
const AuthDispatchContext = createContext({});

const token = getValueFromLocalStorage("authToken");
const email = getValueFromLocalStorage("authEmail");

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
