import React from "react";

import { Route, Routes } from "react-router-dom";

import Details from "./Details";
import PersonalDetails from "./Details/PersonalDetails";
// import CompensationDetails from "./Details/CompensationDetails";
// import DeviceDetails from "./Details/DeviceDetails";
// import DocumentDetails from "./Details/DocumentDetails";
// import EmploymentDetails from "./Details/EmploymentDetails";
// import ReimburstmentDetails from "./Details/ReimburstmentDetails";
import EmploymentEdit from "./Details/PersonalDetails/Edit";

const RouteConfig = () => (
  <Routes>
    {/* TODO: set to index and display personalDetails */}
    <Route element={<Details />} path=":memberId">
      <Route index element={<PersonalDetails />} />
      {/* <Route path="devices" element={<DeviceDetails />} />
      <Route path="employment" element={<EmploymentDetails />} />
      <Route path="compensation" element={<CompensationDetails />} />
      <Route path="documents" element={<DocumentDetails />} />
      <Route path="reimburstment" element={<ReimburstmentDetails />} /> */}
      <Route element={<EmploymentEdit />} path="edit" />
    </Route>
  </Routes>
);

export default RouteConfig;
