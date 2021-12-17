import * as React from "react";
import { Routes, Route, BrowserRouter as Router } from "react-router-dom";
import Login from "./Authentication/Login";

const App = () => (
  <Router>
    <Routes>
      <Route path="login" element={<Login />} />
    </Routes>
  </Router>
);

export default App;
