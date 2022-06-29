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
    <div className="bg-miru-alert-yellow-400 text-miru-alert-green-1000 px-1 flex justify-center font-semibold tracking-widest rounded-lg w-auto h-auto text-xs mt-3 p-3">
      <b><i>Yes! We need your help. Be a part of the <i className="text-xl">A∝C</i>.</i></b>
    </div>
    <Routes>
      <Route path="/recruitments" element={<Recruitments isAdminUser={isAdminUser} />} >
        <Route path="/recruitments/consultancies" element={<ConsultancyList isAdminUser={isAdminUser} />} />
        <Route path="/recruitments/candidates" element={<CandidateList isAdminUser={isAdminUser} />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default RouteConfig;
