import React from "react";

import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import CandidateList from "./Candidate";
import ConsultancyList from "./Consultancy";
import Recruitments from "./index";

const RouteConfig = ({ isAdminUser }) => (
  <BrowserRouter>
    <Routes>
      <Route path="/recruitments" element={<Recruitments isAdminUser={isAdminUser} />} >
        <Route path="/recruitments/consultancies" element={<ConsultancyList isAdminUser={isAdminUser} />} />
        <Route path="/recruitments/candidates" element={<CandidateList isAdminUser={isAdminUser} />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default RouteConfig;
