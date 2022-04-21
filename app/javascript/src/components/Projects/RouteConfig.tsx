import React, { Fragment } from "react";
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import ErrorPage from "common/Error";

import ProjectDetails from "./Details";
import ProjectList from "./List";

const RouteConfig = ({ isAdminUser }) => (
  <Fragment>
    <BrowserRouter>
      <Routes>
        <Route path="projects">
          <Route index element={ <ProjectList isAdminUser={isAdminUser} />} />
          <Route path=":projectId" element={<ProjectDetails />} />
          <Route path="*" element={<ErrorPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </Fragment>
);

export default RouteConfig;
