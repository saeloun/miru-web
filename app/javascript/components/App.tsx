import * as React from "react";
import { Routes, Route, BrowserRouter as Router } from "react-router-dom";
import LoginPage from "./Account/LoginPage";
import SignupPage from "./Account/SignupPage";

const App = () => (
  <Router>
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route path="signup" element={<SignupPage />} />
    </Routes>
  </Router>
);

export default App;
