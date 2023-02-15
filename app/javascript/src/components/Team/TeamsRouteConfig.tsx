import React from "react";

import { Route, Routes } from "react-router-dom";

import List from "./List";

const TeamsRouteConfig = () => (
  <Routes>
    <Route element={<List />} path="*" />
  </Routes>
);

export default TeamsRouteConfig;
