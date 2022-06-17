import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import UserContext from "context/UserContext";
import Details from "./Details";

import CompensationDetails from "./Details/CompensationDetails";
import DeviceDetails from "./Details/DeviceDetails";
import DocumentDetails from "./Details/DocumentDetails";
import EmploymentDetails from "./Details/EmploymentDetails";
import PersonalDetails from "./Details/PersonalDetails";
import ReimburstmentDetails from "./Details/ReimburstmentDetails";
import List from "./List";

const RouteConfig = ({ isAdminUser }) => {
  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
  }, []);

  return (
    <UserContext.Provider value={{ isAdminUser }}>
      <BrowserRouter>
        <Routes>
          <Route path="team">
            <Route index element={<List />} />
            <Route path=":memberId" element={<Details />}>
              <Route index element={<PersonalDetails />} />
              <Route path="devices" element={<DeviceDetails />} />
              <Route path="employment" element={<EmploymentDetails />} />
              <Route path="compensation" element={<CompensationDetails />} />
              <Route path="documents" element={<DocumentDetails />} />
              <Route path="reimburstment" element={<ReimburstmentDetails />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </UserContext.Provider>
  );
};

export default RouteConfig;
