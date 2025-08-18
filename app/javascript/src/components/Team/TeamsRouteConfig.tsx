import React from "react";

import { Route, Routes } from "react-router-dom";

import TeamTable from "./TeamTable";
import Layout from "components/Profile/index";
import { SETTINGS } from "components/Profile/Layout/routes";
import UserDetailsView from "components/Profile/Personal/User";

const TeamsRouteConfig = () => (
  <Routes>
    <Route element={<TeamTable />} path="/" />
    <Route element={<Layout />} path=":memberId">
      <Route index element={<UserDetailsView />} />
      {SETTINGS.filter(({ category }) => category === "personal").map(
        ({ path, Component }) => (
          <Route key={path} path={path} element={<Component />} />
        )
      )}
    </Route>
  </Routes>
);

export default TeamsRouteConfig;
