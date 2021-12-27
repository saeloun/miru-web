import * as React from "react";
import { Routes, Route, BrowserRouter as Router } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import { setAuthHeaders, registerIntercepts } from "apis/axios";

import ForgotPassword from "components/Users/ForgotPassword";
import Login from "components/Users/Login";
import SetPassword from "components/Users/SetPassword";
import Signup from "components/Users/Signup";
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
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="users/password/reset" element={<ForgotPassword />} />
        <Route path="users/password/set" element={<SetPassword />} />
      </Routes>
    </Router>
  );
};

export default App;
