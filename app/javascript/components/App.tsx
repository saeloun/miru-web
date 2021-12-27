import * as React from "react";
import { Routes, Route, BrowserRouter as Router } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import ForgotPasswordPage from "./Account/ForgotPasswordPage";
import LoginPage from "./Account/LoginPage";
import SetPasswordPage from "./Account/SetPasswordPage";
import SignupPage from "./Account/SignupPage";

import { setAuthHeaders, registerIntercepts } from "./apis/axios";
import { getFromLocalStorage } from "./helpers/storage";

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
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="users/password/reset" element={<ForgotPasswordPage />} />
        <Route path="users/password/set" element={<SetPasswordPage />} />
      </Routes>
    </Router>
  );
};

export default App;
