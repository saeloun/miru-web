import React from "react";

import { Route, Routes } from "react-router-dom";

import List from "./List";

const TeamsRouteConfig = () => (
  <Routes>
    <Route element={<List />} path="*">
      {" "}
    </Route>
  </Routes>
);

export default TeamsRouteConfig;
