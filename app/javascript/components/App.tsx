import * as React from "react";
import { Routes, Route, BrowserRouter as Router } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import { setAuthHeaders, registerIntercepts } from "apis/axios";

import { getFromLocalStorage } from "helpers/storage";

const App = () => {
  const [loading, setLoading] = React.useState<boolean>(true);
  const isLoggedIn = getFromLocalStorage("isLoggedIn") === "true";

  React.useEffect(() => {
    registerIntercepts();
    setAuthHeaders(setLoading);
  }, []);
  return (
    <Router>
      <ToastContainer />
      <Routes></Routes>
    </Router>
  );
};

export default App;
