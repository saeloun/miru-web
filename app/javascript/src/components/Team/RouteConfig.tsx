import React from "react";

import { Route, Routes } from "react-router-dom";

import Details from "./Details";
import EmploymentDetails from "./Details/EmploymentDetails";
import EmploymentEdit from "./Details/EmploymentDetails/Edit";
import MobileNav from "./Details/Layout/MobileNav";
import PersonalDetails from "./Details/PersonalDetails";
import PersonalEdit from "./Details/PersonalDetails/Edit";

const RouteConfig = () => (
  <Routes>
    <Route element={<Details />} path=":memberId">
      <Route index element={<PersonalDetails />} />
      <Route element={<PersonalEdit />} path="edit" />
      <Route element={<MobileNav />} path="options" />
      <Route element={<PersonalDetails />} path="details" />
      <Route element={<EmploymentDetails />} path="employment" />
      <Route element={<EmploymentEdit />} path="employment_edit" />
    </Route>
  </Routes>
);

export default RouteConfig;
