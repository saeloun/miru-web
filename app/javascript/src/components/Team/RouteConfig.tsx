import React from "react";

import { Route, Routes } from "react-router-dom";

import Details from "./Details";
import PersonalDetails from "./Details/PersonalDetails";
import EmploymentEdit from "./Details/PersonalDetails/Edit";

const RouteConfig = () => (
  <Routes>
    <Route element={<Details />} path=":memberId">
      <Route index element={<PersonalDetails />} />
      <Route element={<EmploymentEdit />} path="edit" />
    </Route>
  </Routes>
);

export default RouteConfig;
