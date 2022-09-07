import React from "react";

import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import CandidateList from "./Candidate";
import CandidateDetails from "./Candidate/Details";
import ConsultancyList from "./Consultancy";
import Recruitments from "./index";

const RouteConfig = ({ isAdminUser }) => (
  <BrowserRouter>
    <div className="flex justify-center w-auto h-auto p-3 px-1 mt-3 text-xs font-semibold tracking-widest rounded-lg bg-miru-alert-yellow-400 text-miru-alert-green-1000">
      <b><i>Yes! We need your help. Be a part of the <i className="text-xl">AC</i>.</i></b>
    </div>
    <Routes>
      <Route path="/recruitments" element={<Recruitments isAdminUser={isAdminUser} />} >
        <Route path="consultancies" element={<ConsultancyList isAdminUser={isAdminUser} />}>
          <Route path=":consultancyId" element={<div>sdjkhdsjkdhkjashdkjashdkjhaskjdhaksjdh</div>} />
        </Route>
        <Route path="candidates" element={<CandidateList isAdminUser={isAdminUser} />}>
          <Route path=":candidateId" element={<CandidateDetails />} />
          <Route path=":candidateId/timelines" element={<CandidateDetails />} />
        </Route>
      </Route>
    </Routes>
  </BrowserRouter>
);

export default RouteConfig;
