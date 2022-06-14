import React from "react";

import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import CandidateList from "./Candidate";
import ConsultancyList from "./Consultancy";

const RouteConfig = ({ isAdminUser }) => (
  <BrowserRouter>
    <Routes>
      <Route path="/recruitments/consultancies" element={<ConsultancyList isAdminUser={isAdminUser} />} />
      <Route path="/recruitments/candidates" element={<CandidateList isAdminUser={isAdminUser} />} />
    </Routes>
  </BrowserRouter>
);

export default RouteConfig;
