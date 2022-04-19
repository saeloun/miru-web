import React from "react";

import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Details from "./Details";
import ClientList from "./List";

const RouteConfig = ({ isAdminUser }) => (
  <BrowserRouter>
    <Routes>
      <Route path="clients">
        <Route index element={<ClientList isAdminUser={isAdminUser} />} />
        <Route path=":clientId" element={<Details isAdminUser={isAdminUser}  />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default RouteConfig;
